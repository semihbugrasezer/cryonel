// apps/api/src/routes/signals.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { authenticate as authMiddleware } from "../middleware/auth";
import { apiRateLimit } from "../middleware/rateLimit";

const router = Router();

// Request schemas
const CreateMasterSignalSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  action: z.enum(["open", "close"], { message: "Action must be 'open' or 'close'" }),
  entry: z.number().positive("Entry price must be positive").optional(),
  stop: z.number().positive("Stop loss must be positive").optional(),
  take_profit: z.array(z.number().positive()).optional(),
});

const FollowMasterSchema = z.object({
  masterId: z.string().uuid("Invalid master ID"),
  riskPercentage: z.number().min(0.1).max(100, "Risk percentage must be between 0.1 and 100"),
});

// POST /api/v1/signals/master - Create master signal
router.post("/master", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const signalData = CreateMasterSignalSchema.parse(req.body);

    // Create master signal
    const result = await db.query(
      `INSERT INTO master_signals (master_id, symbol, action, entry, stop, take_profit, meta) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        req.auth?.sub,
        signalData.symbol.toUpperCase(),
        signalData.action,
        signalData.entry,
        signalData.stop,
        signalData.take_profit || [],
        JSON.stringify({ created_at: new Date().toISOString() }),
      ]
    );

    const signalId = result.rows[0].id;

    logger.info({
      signalId,
      userId: req.auth?.sub,
      symbol: signalData.symbol,
      action: signalData.action,
    }, "Master signal created");

    res.status(201).json({
      id: signalId,
      symbol: signalData.symbol,
      action: signalData.action,
      entry: signalData.entry,
      stop: signalData.stop,
      take_profit: signalData.take_profit,
      status: "active",
      message: "Master signal created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    logger.error({ error, userId: req.auth?.sub }, "Failed to create master signal");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create master signal",
      },
    });
  }
});

// GET /api/v1/signals/master - List master signals
router.get("/master", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT ms.*, u.email as master_email 
       FROM master_signals ms 
       JOIN users u ON ms.master_id = u.id 
       WHERE ms.status = 'active' 
       ORDER BY ms.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [Number(limit), Number(offset)]
    );

    res.json({
      signals: result.rows,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.rows.length,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch master signals");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch master signals",
      },
    });
  }
});

// GET /api/v1/signals/master/:id - Get specific master signal
router.get("/master/:id", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT ms.*, u.email as master_email 
       FROM master_signals ms 
       JOIN users u ON ms.master_id = u.id 
       WHERE ms.id = $1 AND ms.status = 'active'`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: "SIGNAL_NOT_FOUND",
          message: "Master signal not found",
        },
      });
      return;
    }

    const signal = result.rows[0];
    res.json({
      id: signal.id,
      symbol: signal.symbol,
      action: signal.action,
      entry: signal.entry,
      stop: signal.stop,
      take_profit: signal.take_profit,
      masterEmail: signal.master_email,
      createdAt: signal.created_at,
    });
  } catch (error) {
    logger.error({ error, userId: req.auth?.sub, signalId: req.params.id }, "Failed to fetch master signal");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch master signal",
      },
    });
  }
});

// POST /api/v1/signals/follow - Follow a master
router.post("/follow", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { masterId, riskPercentage } = FollowMasterSchema.parse(req.body);

    // Check if master exists and is active
    const masterCheck = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [masterId]
    );

    if (masterCheck.rows.length === 0) {
      res.status(404).json({
        error: {
          code: "MASTER_NOT_FOUND",
          message: "Master user not found",
        },
      });
      return;
    }

    // Check if already following
    const followCheck = await db.query(
      "SELECT id FROM master_followers WHERE follower_id = $1 AND master_id = $2",
      [req.auth?.sub, masterId]
    );

    if (followCheck.rows.length > 0) {
      res.status(409).json({
        error: {
          code: "ALREADY_FOLLOWING",
          message: "Already following this master",
        },
      });
      return;
    }

    // Create follow relationship
    const result = await db.query(
      `INSERT INTO master_followers (follower_id, master_id, risk_percentage, status) 
       VALUES ($1, $2, $3, 'active') 
       RETURNING id`,
      [req.auth?.sub, masterId, riskPercentage]
    );

    const followId = result.rows[0].id;

    logger.info({
      followId,
      followerId: req.auth?.sub,
      masterId,
      riskPercentage,
    }, "Master follow relationship created");

    res.status(201).json({
      id: followId,
      masterId,
      riskPercentage,
      status: "active",
      message: "Successfully following master",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    logger.error({ error, userId: req.auth?.sub }, "Failed to follow master");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to follow master",
      },
    });
  }
});

// GET /api/v1/signals/following - List masters being followed
router.get("/following", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT mf.*, u.email as master_email 
       FROM master_followers mf 
       JOIN users u ON mf.master_id = u.id 
       WHERE mf.follower_id = $1 AND mf.status = 'active' 
       ORDER BY mf.created_at DESC`,
      [req.auth?.sub]
    );

    res.json({
      following: result.rows.map((row) => ({
        id: row.id,
        masterId: row.master_id,
        masterEmail: row.master_email,
        riskPercentage: row.risk_percentage,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    logger.error({ error, userId: req.auth?.sub }, "Failed to fetch following list");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch following list",
      },
    });
  }
});

// DELETE /api/v1/signals/follow/:masterId - Unfollow a master
router.delete("/follow/:masterId", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { masterId } = req.params;

    const result = await db.query(
      `UPDATE master_followers 
       SET status = 'inactive', updated_at = NOW() 
       WHERE follower_id = $1 AND master_id = $2 AND status = 'active' 
       RETURNING id`,
      [req.auth?.sub, masterId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: "FOLLOW_NOT_FOUND",
          message: "Follow relationship not found",
        },
      });
    }

    logger.info({
      followerId: req.auth?.sub,
      masterId,
    }, "Master unfollowed");

    res.json({
      message: "Successfully unfollowed master",
    });
  } catch (error) {
    logger.error({ error, userId: req.auth?.sub, masterId: req.params.masterId }, "Failed to unfollow master");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unfollow master",
      },
    });
  }
});

export default router;