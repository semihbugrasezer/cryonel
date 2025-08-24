// apps/api/src/routes/trades.ts
import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { guard } from "../middleware/auth";
import { authLogger } from "../lib/logger";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Validation schemas
const TradesQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val)).default("50"),
  offset: z.string().transform(val => parseInt(val)).default("0"),
  venue: z.string().optional(),
  symbol: z.string().optional(),
  side: z.enum(["buy", "sell"]).optional(),
  from: z.string().optional(), // ISO date string
  to: z.string().optional(), // ISO date string
});

// GET /api/trades - Get user's trade history
router.get("/", guard, asyncHandler(async (req, res) => {
  const userId = (req as any).auth.sub;
  const query = TradesQuerySchema.parse(req.query);

  // Build WHERE conditions
  const conditions = ["user_id = $1"];
  const params: any[] = [userId];
  let paramCount = 1;

  if (query.venue) {
    paramCount++;
    conditions.push(`venue = $${paramCount}`);
    params.push(query.venue);
  }

  if (query.symbol) {
    paramCount++;
    conditions.push(`(base || '/' || quote) = $${paramCount}`);
    params.push(query.symbol);
  }

  if (query.side) {
    paramCount++;
    conditions.push(`side = $${paramCount}`);
    params.push(query.side);
  }

  if (query.from) {
    paramCount++;
    conditions.push(`created_at >= $${paramCount}`);
    params.push(new Date(query.from));
  }

  if (query.to) {
    paramCount++;
    conditions.push(`created_at <= $${paramCount}`);
    params.push(new Date(query.to));
  }

  // Add pagination
  paramCount++;
  const limitParam = paramCount;
  params.push(query.limit);

  paramCount++;
  const offsetParam = paramCount;
  params.push(query.offset);

  const sql = `
    SELECT
      id,
      venue,
      base,
      quote,
      (base || '/' || quote) as symbol,
      side,
      qty,
      price,
      fees,
      txid,
      created_at
    FROM trades
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const result = await db.query(sql, params);

  // Get total count for pagination
  const countSql = `
    SELECT COUNT(*) as total
    FROM trades
    WHERE ${conditions.slice(0, -2).join(" AND ")}
  `;
  const countResult = await db.query(countSql, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

  authLogger.info({
    userId,
    filters: query,
    count: result.rows.length,
    total
  }, "Trades fetched successfully");

  res.json({
    success: true,
    data: {
      trades: result.rows,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total
      }
    }
  });
}));

// GET /api/trades/summary - Get trading summary stats
router.get("/summary", guard, asyncHandler(async (req, res) => {
  const userId = (req as any).auth.sub;

  const summaryQuery = `
    SELECT
      COUNT(*) as total_trades,
      SUM(CASE WHEN side = 'buy' THEN qty * price ELSE 0 END) as total_bought,
      SUM(CASE WHEN side = 'sell' THEN qty * price ELSE 0 END) as total_sold,
      SUM(fees) as total_fees,
      COUNT(DISTINCT venue) as venues_used,
      COUNT(DISTINCT (base || '/' || quote)) as pairs_traded,
      MIN(created_at) as first_trade,
      MAX(created_at) as last_trade
    FROM trades
    WHERE user_id = $1
  `;

  const result = await db.query(summaryQuery, [userId]);
  const summary = result.rows[0];

  // Calculate basic PnL (simplified)
  const pnl = parseFloat(summary.total_sold || 0) - parseFloat(summary.total_bought || 0) - parseFloat(summary.total_fees || 0);

  res.json({
    success: true,
    data: {
      totalTrades: parseInt(summary.total_trades),
      totalVolume: parseFloat(summary.total_bought || 0) + parseFloat(summary.total_sold || 0),
      totalFees: parseFloat(summary.total_fees || 0),
      pnl: pnl,
      venuesUsed: parseInt(summary.venues_used),
      pairsTraded: parseInt(summary.pairs_traded),
      firstTrade: summary.first_trade,
      lastTrade: summary.last_trade
    }
  });
}));

export default router;
