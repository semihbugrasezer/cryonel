import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { logger } from "../lib/logger";
import { PnLVerifier } from "../lib/pnl-verifier";

const router = Router();

// GET /pnl/snapshots - Get user's PnL snapshots
router.get("/snapshots", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const type = req.query.type as 'daily' | 'weekly' | 'monthly' | 'execution' | undefined;
    const limit = parseInt(req.query.limit as string) || 30;

    const snapshots = await PnLVerifier.getUserSnapshots(userId, type, limit);

    return res.json({
      success: true,
      data: snapshots
    });
  } catch (error) {
    logger.error("Error fetching PnL snapshots:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch PnL snapshots" }
    });
  }
});

// POST /pnl/snapshots/daily - Create daily PnL snapshot
router.post("/snapshots/daily", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_DATE", message: "Date parameter is required" }
      });
    }

    const snapshotDate = new Date(date);
    if (isNaN(snapshotDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATE", message: "Invalid date format" }
      });
    }

    const snapshotId = await PnLVerifier.createDailySnapshot(userId, snapshotDate);

    return res.status(201).json({
      success: true,
      data: { snapshot_id: snapshotId }
    });
  } catch (error) {
    logger.error("Error creating daily PnL snapshot:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create daily PnL snapshot" }
    });
  }
});

// POST /pnl/verify/:snapshotId - Verify a PnL snapshot
router.post("/verify/:snapshotId", authenticate, async (req: Request, res: Response) => {
  try {
    const snapshotId = req.params.snapshotId;

    const verification = await PnLVerifier.verifySnapshot(snapshotId);

    if (verification.valid) {
      return res.json({
        success: true,
        data: { verified: true, message: "PnL snapshot verification successful" }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: "VERIFICATION_FAILED",
          message: verification.error || "PnL snapshot verification failed"
        }
      });
    }
  } catch (error) {
    logger.error("Error verifying PnL snapshot:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to verify PnL snapshot" }
    });
  }
});

// GET /pnl/report/:period - Generate PnL verification report
router.get("/report/:period", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const period = req.params.period as 'daily' | 'weekly' | 'monthly';
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_DATES", message: "Start and end dates are required" }
      });
    }

    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATES", message: "Invalid date format" }
      });
    }

    const report = await PnLVerifier.generateReport(userId, period, startDate, endDate);

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error("Error generating PnL report:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to generate PnL report" }
    });
  }
});

// GET /pnl/audit/:snapshotId - Get audit trail for a snapshot
router.get("/audit/:snapshotId", authenticate, async (req: Request, res: Response) => {
  try {
    const snapshotId = req.params.snapshotId;

    const auditTrail = await PnLVerifier.getAuditTrail(snapshotId);

    return res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    logger.error("Error fetching audit trail:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch audit trail" }
    });
  }
});

// GET /pnl/snapshots/:id - Get specific PnL snapshot details
router.get("/snapshots/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const snapshotId = req.params.id;

    const snapshots = await PnLVerifier.getUserSnapshots(userId);
    const snapshot = snapshots.find(s => s.id === snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "PnL snapshot not found" }
      });
    }

    return res.json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    logger.error("Error fetching PnL snapshot:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch PnL snapshot" }
    });
  }
});

// POST /pnl/share/:snapshotId - Create shareable PnL verification link
router.post("/share/:snapshotId", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const snapshotId = req.params.snapshotId;
    const { expires_in_hours = 24 } = req.body;

    // Verify snapshot ownership
    const snapshots = await PnLVerifier.getUserSnapshots(userId);
    const snapshot = snapshots.find(s => s.id === snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "PnL snapshot not found" }
      });
    }

    if (!snapshot.verified) {
      return res.status(400).json({
        success: false,
        error: { code: "NOT_VERIFIED", message: "PnL snapshot must be verified before sharing" }
      });
    }

    // Generate shareable token (simplified - in production would use JWT or similar)
    const shareToken = Buffer.from(JSON.stringify({
      snapshot_id: snapshotId,
      user_id: userId,
      expires_at: new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    })).toString('base64');

    const shareUrl = `${req.protocol}://${req.get('host')}/api/pnl/public/${shareToken}`;

    return res.json({
      success: true,
      data: {
        share_url: shareUrl,
        share_token: shareToken,
        expires_at: new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    logger.error("Error creating shareable PnL link:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create shareable link" }
    });
  }
});

// GET /pnl/public/:token - Public PnL verification view
router.get("/public/:token", async (req: Request, res: Response) => {
  try {
    const token = req.params.token;

    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid share token" }
      });
    }

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "Share token has expired" }
      });
    }

    // Get snapshot data
    const snapshots = await PnLVerifier.getUserSnapshots(tokenData.user_id);
    const snapshot = snapshots.find(s => s.id === tokenData.snapshot_id);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "PnL snapshot not found" }
      });
    }

    // Return sanitized snapshot data (remove sensitive information)
    const publicSnapshot = {
      id: snapshot.id,
      snapshot_type: snapshot.snapshot_type,
      period_start: snapshot.period_start,
      period_end: snapshot.period_end,
      total_pnl: snapshot.total_pnl,
      realized_pnl: snapshot.realized_pnl,
      unrealized_pnl: snapshot.unrealized_pnl,
      trade_count: snapshot.trade_count,
      merkle_root: snapshot.merkle_root,
      verified: snapshot.verified,
      created_at: snapshot.created_at
    };

    return res.json({
      success: true,
      data: publicSnapshot
    });
  } catch (error) {
    logger.error("Error fetching public PnL snapshot:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch public PnL snapshot" }
    });
  }
});

export default router;