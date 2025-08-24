import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { logger } from "../lib/logger";
import { createHash } from "crypto";
import { db } from "../lib/db";
import { asyncHandler, NotFoundError, ValidationError } from "../middleware/errorHandler";

const router = Router();

// Validation schemas
const CreateDCEPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger_type: z.enum(['time', 'price', 'volume', 'custom']),
  trigger_params: z.record(z.any()),
  actions: z.array(z.object({
    type: z.string(),
    params: z.record(z.any())
  })),
  constraints: z.object({
    max_daily_executions: z.number().optional(),
    trading_hours: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string()
    }).optional(),
    min_spread: z.number().optional()
  }).optional()
});

// Helper function to generate deterministic hash
function generateDeterministicHash(data: Record<string, any>): string {
  const sortedKeys = Object.keys(data).sort();
  const content = sortedKeys.map(key => `${key}:${JSON.stringify(data[key])}`).join('|');
  return createHash('sha256').update(content).digest('hex');
}

// GET /dce/plans - List user's DCE plans
router.get("/plans", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const plans = await db.query(
    `SELECT id, name, description, trigger_type, trigger_params, actions, constraints,
            deterministic_hash, status, execution_count, total_pnl, last_executed_at,
            created_at, updated_at
     FROM dce_plans
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return res.json({
    success: true,
    data: plans.rows.map((row: any) => ({
      ...row,
      trigger: {
        type: row.trigger_type,
        params: row.trigger_params
      }
    }))
  });
}));

// POST /dce/plans - Create new DCE plan
router.post("/plans", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const validatedData = CreateDCEPlanSchema.parse(req.body);

  // Generate deterministic hash
  const deterministicHash = generateDeterministicHash({
    userId,
    trigger_type: validatedData.trigger_type,
    trigger_params: validatedData.trigger_params,
    actions: validatedData.actions,
    constraints: validatedData.constraints
  });

  const result = await db.query(
    `INSERT INTO dce_plans (
      user_id, name, description, trigger_type, trigger_params,
      actions, constraints, deterministic_hash, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    RETURNING id`,
    [
      userId,
      validatedData.name,
      validatedData.description,
      validatedData.trigger_type,
      validatedData.trigger_params,
      validatedData.actions,
      validatedData.constraints,
      deterministicHash
    ]
  );

  return res.status(201).json({
    success: true,
    data: { id: result.rows[0].id }
  });
}));

// GET /dce/plans/:id - Get specific DCE plan
router.get("/plans/:id", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const planId = req.params.id;

  const result = await db.query(
    `SELECT * FROM dce_plans WHERE id = $1 AND user_id = $2`,
    [planId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("DCE plan not found");
  }

  const plan = result.rows[0];
  return res.json({
    success: true,
    data: {
      ...plan,
      trigger: {
        type: plan.trigger_type,
        params: plan.trigger_params
      }
    }
  });
}));

// PUT /dce/plans/:id/status - Update DCE plan status
router.put("/plans/:id/status", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const planId = req.params.id;
  const { status } = req.body;

  if (!['active', 'paused', 'stopped'].includes(status)) {
    throw new ValidationError("Invalid status value");
  }

  const result = await db.query(
    `UPDATE dce_plans SET status = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [status, planId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("DCE plan not found");
  }

  return res.json({
    success: true,
    data: result.rows[0]
  });
}));

// GET /dce/executions/:planId - Get executions for a specific plan
router.get("/executions/:planId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const planId = req.params.planId;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Verify plan ownership
  const planCheck = await db.query(
    `SELECT id FROM dce_plans WHERE id = $1 AND user_id = $2`,
    [planId, userId]
  );

  if (planCheck.rows.length === 0) {
    throw new NotFoundError("DCE plan not found");
  }

  const executions = await db.query(
    `SELECT * FROM dce_executions
     WHERE plan_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [planId, limit, offset]
  );

  return res.json({
    success: true,
    data: executions.rows
  });
}));

export default router;