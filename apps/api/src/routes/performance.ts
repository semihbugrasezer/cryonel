// apps/api/src/routes/performance.ts
import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { guard } from "../middleware/auth";
import { authLogger } from "../lib/logger";

const router = Router();

// Validation schemas
const PerformanceQuerySchema = z.object({
  period: z.enum(["1d", "7d", "30d", "90d", "1y"]).default("30d"),
  venue: z.string().optional(),
});

// GET /api/performance - Get user's trading performance metrics
router.get("/", guard, async (req, res) => {
  try {
    const userId = (req as any).auth.sub;
    const query = PerformanceQuerySchema.parse(req.query);

    // Calculate date range based on period
    const periodDays = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    };

    const days = periodDays[query.period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build WHERE conditions
    const conditions = ["user_id = $1", "created_at >= $2"];
    const params: any[] = [userId, startDate];
    let paramCount = 2;

    if (query.venue) {
      paramCount++;
      conditions.push(`venue = $${paramCount}`);
      params.push(query.venue);
    }

    // Get performance metrics
    const performanceQuery = `
      WITH daily_pnl AS (
        SELECT 
          DATE(created_at) as trade_date,
          SUM(CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END) as daily_pnl,
          SUM(fees) as daily_fees,
          COUNT(*) as daily_trades
        FROM trades 
        WHERE ${conditions.join(" AND ")}
        GROUP BY DATE(created_at)
        ORDER BY trade_date
      ),
      cumulative_pnl AS (
        SELECT 
          trade_date,
          daily_pnl,
          daily_fees,
          daily_trades,
          SUM(daily_pnl - daily_fees) OVER (ORDER BY trade_date) as cumulative_pnl
        FROM daily_pnl
      )
      SELECT 
        trade_date,
        daily_pnl,
        daily_fees,
        daily_trades,
        cumulative_pnl,
        LAG(cumulative_pnl) OVER (ORDER BY trade_date) as prev_cumulative_pnl
      FROM cumulative_pnl
      ORDER BY trade_date
    `;

    const performanceResult = await db.query(performanceQuery, params);

    // Calculate overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT DATE(created_at)) as trading_days,
        SUM(CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END) as total_pnl,
        SUM(fees) as total_fees,
        AVG(CASE WHEN side = 'sell' THEN qty * price ELSE qty * price END) as avg_trade_size,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            COUNT(CASE WHEN (
              CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END
            ) > 0 THEN 1 END)::float / COUNT(*)::float 
          ELSE 0.0 
        END as win_rate,
        STDDEV(CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END) as volatility
      FROM trades 
      WHERE ${conditions.join(" AND ")}
    `;

    const statsResult = await db.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Calculate additional metrics
    const netPnL = parseFloat(stats.total_pnl || 0) - parseFloat(stats.total_fees || 0);
    const tradingDays = parseInt(stats.trading_days || 1);
    const totalTrades = parseInt(stats.total_trades || 0);

    // Calculate Sharpe ratio (simplified)
    const dailyReturns = performanceResult.rows.map(row => {
      const prevPnL = parseFloat(row.prev_cumulative_pnl || 0);
      const currentPnL = parseFloat(row.cumulative_pnl || 0);
      return currentPnL - prevPnL;
    }).filter(ret => ret !== 0);

    const avgDailyReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length
      : 0;

    const dailyReturnStdDev = dailyReturns.length > 1
      ? Math.sqrt(dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgDailyReturn, 2), 0) / (dailyReturns.length - 1))
      : 0;

    const sharpeRatio = dailyReturnStdDev > 0 ? (avgDailyReturn / dailyReturnStdDev) * Math.sqrt(365) : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    for (const row of performanceResult.rows) {
      const pnl = parseFloat(row.cumulative_pnl || 0);
      if (pnl > peak) peak = pnl;
      const drawdown = peak - pnl;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const performance = {
      period: query.period,
      venue: query.venue,
      overview: {
        totalTrades,
        tradingDays,
        netPnL: Math.round(netPnL * 100) / 100,
        totalFees: Math.round(parseFloat(stats.total_fees || 0) * 100) / 100,
        winRate: Math.round((parseFloat(stats.win_rate || 0) * 100) * 100) / 100,
        avgTradeSize: Math.round(parseFloat(stats.avg_trade_size || 0) * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        profitFactor: stats.total_pnl > 0 && stats.total_fees > 0
          ? Math.round((parseFloat(stats.total_pnl) / parseFloat(stats.total_fees)) * 100) / 100
          : 0
      },
      chartData: performanceResult.rows.map(row => ({
        date: row.trade_date,
        dailyPnL: Math.round(parseFloat(row.daily_pnl || 0) * 100) / 100,
        dailyFees: Math.round(parseFloat(row.daily_fees || 0) * 100) / 100,
        dailyTrades: parseInt(row.daily_trades || 0),
        cumulativePnL: Math.round(parseFloat(row.cumulative_pnl || 0) * 100) / 100
      }))
    };

    authLogger.info({
      userId,
      period: query.period,
      venue: query.venue,
      netPnL: performance.overview.netPnL,
      totalTrades: performance.overview.totalTrades
    }, "Performance metrics fetched successfully");

    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    authLogger.error({
      error: error instanceof Error ? error.message : String(error),
      userId: (req as any).auth?.sub
    }, "Failed to fetch performance metrics");

    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_PERFORMANCE_ERROR",
        message: "Failed to fetch performance metrics"
      }
    });
  }
});

// GET /api/performance/venues - Get performance breakdown by venue
router.get("/venues", guard, async (req, res) => {
  try {
    const userId = (req as any).auth.sub;
    const query = PerformanceQuerySchema.parse(req.query);

    const days = {
      "1d": 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365
    }[query.period];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const venueQuery = `
      SELECT 
        venue,
        COUNT(*) as total_trades,
        SUM(CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END) as pnl,
        SUM(fees) as fees,
        SUM(qty * price) as volume,
        AVG(qty * price) as avg_trade_size,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            COUNT(CASE WHEN (
              CASE WHEN side = 'sell' THEN qty * price ELSE -qty * price END
            ) > 0 THEN 1 END)::float / COUNT(*)::float 
          ELSE 0.0 
        END as win_rate
      FROM trades 
      WHERE user_id = $1 AND created_at >= $2
      GROUP BY venue
      ORDER BY pnl DESC
    `;

    const result = await db.query(venueQuery, [userId, startDate]);

    const venuePerformance = result.rows.map(row => ({
      venue: row.venue,
      totalTrades: parseInt(row.total_trades),
      netPnL: Math.round((parseFloat(row.pnl || 0) - parseFloat(row.fees || 0)) * 100) / 100,
      fees: Math.round(parseFloat(row.fees || 0) * 100) / 100,
      volume: Math.round(parseFloat(row.volume || 0) * 100) / 100,
      avgTradeSize: Math.round(parseFloat(row.avg_trade_size || 0) * 100) / 100,
      winRate: Math.round((parseFloat(row.win_rate || 0) * 100) * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        period: query.period,
        venues: venuePerformance
      }
    });

  } catch (error) {
    authLogger.error({
      error: error instanceof Error ? error.message : String(error),
      userId: (req as any).auth?.sub
    }, "Failed to fetch venue performance");

    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_VENUE_PERFORMANCE_ERROR",
        message: "Failed to fetch venue performance"
      }
    });
  }
});

export default router;
