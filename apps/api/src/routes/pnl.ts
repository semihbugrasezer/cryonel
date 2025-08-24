import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { logger } from "../lib/logger";
import { PnLVerifier } from "../lib/pnl-verifier";
import { asyncHandler, NotFoundError, ValidationError } from "../middleware/errorHandler";

const router = Router();

// GET /pnl/snapshots - Get user's PnL snapshots
router.get("/snapshots", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const type = req.query.type as 'daily' | 'weekly' | 'monthly' | 'execution' | undefined;
  const limit = parseInt(req.query.limit as string) || 30;

  const snapshots = await PnLVerifier.getUserSnapshots(userId, type, limit);

  return res.json({
    success: true,
    data: snapshots
  });
}));

// POST /pnl/snapshots/daily - Create daily PnL snapshot
router.post("/snapshots/daily", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { date } = req.body;

  if (!date) {
    throw new ValidationError("Date parameter is required");
  }

  const snapshotDate = new Date(date);
  if (isNaN(snapshotDate.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  const snapshotId = await PnLVerifier.createDailySnapshot(userId, snapshotDate);

  return res.status(201).json({
    success: true,
    data: { snapshot_id: snapshotId }
  });
}));

// POST /pnl/verify/:snapshotId - Verify a PnL snapshot
router.post("/verify/:snapshotId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const snapshotId = req.params.snapshotId;

  const verification = await PnLVerifier.verifySnapshot(snapshotId);

  if (verification.valid) {
    return res.json({
      success: true,
      data: { verified: true, message: "PnL snapshot verification successful" }
    });
  } else {
    throw new ValidationError(verification.error || "PnL snapshot verification failed");
  }
}));

// GET /pnl/report/:period - Generate PnL verification report
router.get("/report/:period", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const period = req.params.period as 'daily' | 'weekly' | 'monthly';
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    throw new ValidationError("Start and end dates are required");
  }

  const startDate = new Date(start_date as string);
  const endDate = new Date(end_date as string);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  const report = await PnLVerifier.generateReport(userId, period, startDate, endDate);

  return res.json({
    success: true,
    data: report
  });
}));

// GET /pnl/audit/:snapshotId - Get audit trail for a snapshot
router.get("/audit/:snapshotId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const snapshotId = req.params.snapshotId;

  const auditTrail = await PnLVerifier.getAuditTrail(snapshotId);

  return res.json({
    success: true,
    data: auditTrail
  });
}));

// GET /pnl/snapshots/:id - Get specific PnL snapshot details
router.get("/snapshots/:id", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const snapshotId = req.params.id;

  const snapshots = await PnLVerifier.getUserSnapshots(userId);
  const snapshot = snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    throw new NotFoundError("PnL snapshot not found");
  }

  return res.json({
    success: true,
    data: snapshot
  });
}));

// POST /pnl/share/:snapshotId - Create shareable PnL verification link
router.post("/share/:snapshotId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const snapshotId = req.params.snapshotId;
  const { expires_in_hours = 24 } = req.body;

  // Verify snapshot ownership
  const snapshots = await PnLVerifier.getUserSnapshots(userId);
  const snapshot = snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    throw new NotFoundError("PnL snapshot not found");
  }

  if (!snapshot.verified) {
    throw new ValidationError("PnL snapshot must be verified before sharing");
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
}));

// GET /pnl/public/:token - Public PnL verification view
router.get("/public/:token", asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;

  let tokenData;
  try {
    tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    throw new ValidationError("Invalid share token");
  }

  // Check if token is expired
  if (new Date() > new Date(tokenData.expires_at)) {
    throw new ValidationError("Share token has expired");
  }

  // Get snapshot data
  const snapshots = await PnLVerifier.getUserSnapshots(tokenData.user_id);
  const snapshot = snapshots.find(s => s.id === tokenData.snapshot_id);

  if (!snapshot) {
    throw new NotFoundError("PnL snapshot not found");
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
}));

export default router;