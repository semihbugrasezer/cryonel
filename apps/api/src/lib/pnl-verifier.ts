import { db } from "./db";
import { logger } from "./logger";
import { MerkleTree, MerkleProof } from "./merkle-tree";

export interface PnLSnapshot {
  id: string;
  user_id: string;
  snapshot_type: 'daily' | 'weekly' | 'monthly' | 'execution';
  period_start: Date;
  period_end: Date;
  total_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  trade_count: number;
  positions_data: Record<string, any>;
  merkle_root: string;
  merkle_proof: MerkleProof;
  verified: boolean;
  created_at: Date;
}

export interface TradeData {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl: number;
  timestamp: string;
  exchange: string;
  order_id: string;
}

export class PnLVerifier {
  /**
   * Create a daily PnL snapshot for a user
   */
  static async createDailySnapshot(userId: string, date: Date): Promise<string> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all trades for the day
      const tradesResult = await db.query(`
        SELECT 
          o.id,
          o.symbol,
          o.side,
          o.quantity,
          o.price,
          COALESCE(cte.actual_pnl, 0) as pnl,
          o.created_at::text as timestamp,
          o.exchange,
          o.exchange_order_id as order_id
        FROM orders o
        LEFT JOIN copy_trading_executions cte ON o.id = cte.exchange_order_id
        WHERE o.user_id = $1 
          AND o.created_at >= $2 
          AND o.created_at <= $3
          AND o.status = 'filled'
        ORDER BY o.created_at ASC
      `, [userId, startOfDay, endOfDay]);

      const trades: TradeData[] = tradesResult.rows.map((row: any) => ({
        id: row.id,
        symbol: row.symbol,
        side: row.side,
        quantity: parseFloat(row.quantity),
        price: parseFloat(row.price),
        pnl: parseFloat(row.pnl),
        timestamp: row.timestamp,
        exchange: row.exchange,
        order_id: row.order_id
      }));

      // Calculate PnL metrics
      const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
      const realizedPnl = trades.filter(t => t.side === 'sell').reduce((sum, trade) => sum + trade.pnl, 0);
      const unrealizedPnl = totalPnl - realizedPnl;

      // Get current positions for positions_data
      const positionsResult = await db.query(`
        SELECT 
          symbol,
          SUM(CASE WHEN side = 'buy' THEN quantity ELSE -quantity END) as net_position,
          AVG(price) as avg_price
        FROM orders 
        WHERE user_id = $1 
          AND created_at <= $2
          AND status = 'filled'
        GROUP BY symbol
        HAVING SUM(CASE WHEN side = 'buy' THEN quantity ELSE -quantity END) != 0
      `, [userId, endOfDay]);

      const positionsData = {
        positions: positionsResult.rows.map((row: any) => ({
          symbol: row.symbol,
          net_position: parseFloat(row.net_position),
          avg_price: parseFloat(row.avg_price)
        })),
        snapshot_time: endOfDay.toISOString()
      };

      // Create Merkle tree from trades
      let merkleRoot: string;
      let merkleProof: MerkleProof;

      if (trades.length > 0) {
        const merkleTree = MerkleTree.fromPnLData(trades);
        merkleRoot = merkleTree.getRoot();
        // Get proof for the first trade as an example
        merkleProof = merkleTree.getProof(0);
      } else {
        // Handle case with no trades
        merkleRoot = MerkleTree.fromPnLData([{
          id: 'no-trades',
          symbol: 'NONE',
          side: 'buy',
          quantity: 0,
          price: 0,
          pnl: 0,
          timestamp: startOfDay.toISOString()
        }]).getRoot();
        merkleProof = {
          leaf: 'no-trades',
          proof: [],
          position: 0
        };
      }

      // Insert snapshot into database
      const result = await db.query(`
        INSERT INTO pnl_snapshots (
          user_id, snapshot_type, period_start, period_end,
          total_pnl, realized_pnl, unrealized_pnl, trade_count,
          positions_data, merkle_root, merkle_proof
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        userId,
        'daily',
        startOfDay,
        endOfDay,
        totalPnl,
        realizedPnl,
        unrealizedPnl,
        trades.length,
        JSON.stringify(positionsData),
        merkleRoot,
        JSON.stringify(merkleProof)
      ]);

      const snapshotId = result.rows[0].id;

      logger.info('Daily PnL snapshot created', {
        userId,
        snapshotId,
        date: date.toISOString().split('T')[0],
        totalPnl,
        tradeCount: trades.length,
        merkleRoot
      });

      return snapshotId;

    } catch (error) {
      logger.error('Error creating daily PnL snapshot:', error);
      throw error;
    }
  }

  /**
   * Verify a PnL snapshot's Merkle proof
   */
  static async verifySnapshot(snapshotId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const result = await db.query(
        'SELECT * FROM pnl_snapshots WHERE id = $1',
        [snapshotId]
      );

      if (result.rows.length === 0) {
        return { valid: false, error: 'Snapshot not found' };
      }

      const snapshot = result.rows[0];
      const merkleProof: MerkleProof = JSON.parse(snapshot.merkle_proof);

      // Verify the Merkle proof
      const isValid = MerkleTree.verifyProof(merkleProof, snapshot.merkle_root);

      if (isValid) {
        // Update verified status
        await db.query(
          'UPDATE pnl_snapshots SET verified = true WHERE id = $1',
          [snapshotId]
        );
      }

      return { valid: isValid };

    } catch (error) {
      logger.error('Error verifying PnL snapshot:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Get PnL snapshots for a user
   */
  static async getUserSnapshots(
    userId: string,
    type?: 'daily' | 'weekly' | 'monthly' | 'execution',
    limit: number = 30
  ): Promise<PnLSnapshot[]> {
    let query = `
      SELECT * FROM pnl_snapshots 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (type) {
      query += ` AND snapshot_type = $2`;
      params.push(type);
      query += ` ORDER BY period_start DESC LIMIT $3`;
      params.push(limit);
    } else {
      query += ` ORDER BY period_start DESC LIMIT $2`;
      params.push(limit);
    }

    const result = await db.query(query, params);

    return result.rows.map((row: any) => ({
      ...row,
      period_start: new Date(row.period_start),
      period_end: new Date(row.period_end),
      created_at: new Date(row.created_at),
      merkle_proof: JSON.parse(row.merkle_proof)
    }));
  }

  /**
   * Generate PnL verification report
   */
  static async generateVerificationReport(userId: string, period: 'week' | 'month'): Promise<{
    total_snapshots: number;
    verified_snapshots: number;
    verification_rate: number;
    total_pnl: number;
    merkle_roots: string[];
    period_start: Date;
    period_end: Date;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_snapshots,
        SUM(CASE WHEN verified THEN 1 ELSE 0 END) as verified_snapshots,
        SUM(total_pnl) as total_pnl,
        ARRAY_AGG(merkle_root ORDER BY created_at) as merkle_roots
      FROM pnl_snapshots 
      WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        AND snapshot_type = 'daily'
    `, [userId, startDate, endDate]);

    const data = result.rows[0];
    const totalSnapshots = parseInt(data.total_snapshots);
    const verifiedSnapshots = parseInt(data.verified_snapshots);

    return {
      total_snapshots: totalSnapshots,
      verified_snapshots: verifiedSnapshots,
      verification_rate: totalSnapshots > 0 ? verifiedSnapshots / totalSnapshots : 0,
      total_pnl: parseFloat(data.total_pnl) || 0,
      merkle_roots: data.merkle_roots || [],
      period_start: startDate,
      period_end: endDate
    };
  }

  /**
   * Create execution snapshot (for DCE executions)
   */
  static async createExecutionSnapshot(
    userId: string,
    executionId: string,
    trades: TradeData[]
  ): Promise<string> {
    try {
      const now = new Date();

      // Calculate PnL metrics
      const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
      const realizedPnl = trades.filter(t => t.side === 'sell').reduce((sum, trade) => sum + trade.pnl, 0);
      const unrealizedPnl = totalPnl - realizedPnl;

      // Create Merkle tree from trades
      const merkleTree = MerkleTree.fromPnLData(trades);
      const merkleRoot = merkleTree.getRoot();
      const merkleProof = trades.length > 0 ? merkleTree.getProof(0) : {
        leaf: 'no-trades',
        proof: [],
        position: 0
      };

      // Insert snapshot
      const result = await db.query(`
        INSERT INTO pnl_snapshots (
          user_id, snapshot_type, period_start, period_end,
          total_pnl, realized_pnl, unrealized_pnl, trade_count,
          positions_data, merkle_root, merkle_proof
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        userId,
        'execution',
        now,
        now,
        totalPnl,
        realizedPnl,
        unrealizedPnl,
        trades.length,
        JSON.stringify({ execution_id: executionId, trades }),
        merkleRoot,
        JSON.stringify(merkleProof)
      ]);

      return result.rows[0].id;

    } catch (error) {
      logger.error('Error creating execution PnL snapshot:', error);
      throw error;
    }
  }

  /**
   * Generate a PnL report for a user within a specific period
   */
  static async generateReport(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const end = endDate || new Date();

      const snapshots = await this.getUserSnapshots(userId, period, 100);
      const filteredSnapshots = snapshots.filter(snapshot => {
        const snapshotDate = new Date(snapshot.period_start);
        return snapshotDate >= start && snapshotDate <= end;
      });

      const totalPnl = filteredSnapshots.reduce((sum, snapshot) => sum + snapshot.total_pnl, 0);
      const totalTrades = filteredSnapshots.reduce((sum, snapshot) => sum + snapshot.trade_count, 0);
      const avgDailyPnl = filteredSnapshots.length > 0 ? totalPnl / filteredSnapshots.length : 0;

      return {
        period,
        startDate: start,
        endDate: end,
        totalPnl,
        totalTrades,
        avgDailyPnl,
        snapshotCount: filteredSnapshots.length,
        snapshots: filteredSnapshots
      };

    } catch (error) {
      logger.error('Error generating PnL report:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific snapshot
   */
  static async getAuditTrail(snapshotId: string): Promise<any> {
    try {
      // Get the snapshot details
      const snapshotResult = await db.query(`
        SELECT * FROM pnl_snapshots WHERE id = $1
      `, [snapshotId]);

      if (snapshotResult.rows.length === 0) {
        throw new Error('Snapshot not found');
      }

      const snapshot = snapshotResult.rows[0];

      // Get related trades/positions from the snapshot data
      const positionsData = typeof snapshot.positions_data === 'string' 
        ? JSON.parse(snapshot.positions_data) 
        : snapshot.positions_data;

      // Create audit trail
      const auditTrail = {
        snapshotId,
        createdAt: snapshot.created_at,
        verified: snapshot.verified,
        merkleRoot: snapshot.merkle_root,
        merkleProof: JSON.parse(snapshot.merkle_proof),
        period: {
          start: snapshot.period_start,
          end: snapshot.period_end,
          type: snapshot.snapshot_type
        },
        metrics: {
          totalPnl: snapshot.total_pnl,
          realizedPnl: snapshot.realized_pnl,
          unrealizedPnl: snapshot.unrealized_pnl,
          tradeCount: snapshot.trade_count
        },
        positionsData,
        verificationHistory: [
          {
            timestamp: snapshot.created_at,
            action: 'created',
            verified: false
          }
        ]
      };

      // Add verification events if verified
      if (snapshot.verified) {
        auditTrail.verificationHistory.push({
          timestamp: snapshot.updated_at || snapshot.created_at,
          action: 'verified',
          verified: true
        });
      }

      return auditTrail;

    } catch (error) {
      logger.error('Error getting audit trail:', error);
      throw error;
    }
  }
}