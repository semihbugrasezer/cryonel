// apps/api/src/routes/orders.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { authenticate as authMiddleware } from "../middleware/auth";
import { tradingRateLimit } from "../middleware/rateLimit";
import { asyncHandler, NotFoundError, ConflictError } from "../middleware/errorHandler";

const router = Router();

// Request schemas
const CreateOrderSchema = z.object({
  venue: z.string().min(1, "Venue is required"),
  base: z.string().min(1, "Base currency is required"),
  quote: z.string().min(1, "Quote currency is required"),
  side: z.enum(["buy", "sell"], { message: "Side must be 'buy' or 'sell'" }),
  qty: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
});

// POST /api/v1/orders - Create new order
router.post("/", authMiddleware, tradingRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = CreateOrderSchema.parse(req.body);
  const userId = (req as any).user.id;

  const result = await db.query(`
    INSERT INTO trades (user_id, venue, base, quote, side, qty, price, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
    RETURNING id, venue, base, quote, side, qty, price, status, created_at
  `, [userId, validatedData.venue, validatedData.base, validatedData.quote, validatedData.side, validatedData.qty, validatedData.price]);

  if (result.rows.length === 0) {
    throw new Error("Failed to create order");
  }

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });

  logger.info(`Order created for user ${userId}`, {
    orderId: result.rows[0].id,
    venue: validatedData.venue,
    base: validatedData.base,
    quote: validatedData.quote,
    side: validatedData.side,
    qty: validatedData.qty,
    price: validatedData.price
  });
}));

// GET /api/v1/orders - List user's orders
router.get("/", authMiddleware, tradingRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { status, venue, base, quote, side } = req.query;

  let query = `
    SELECT id, venue, base, quote, side, qty, price, status, created_at, updated_at
    FROM trades
    WHERE user_id = $1
  `;
  const params: any[] = [userId];
  let paramIndex = 2;

  if (status && typeof status === 'string') {
    query += ` AND status = $${paramIndex}`;
    params.push(status.toUpperCase());
    paramIndex++;
  }

  if (venue && typeof venue === 'string') {
    query += ` AND venue = $${paramIndex}`;
    params.push(venue.toUpperCase());
    paramIndex++;
  }

  if (base && typeof base === 'string') {
    query += ` AND base = $${paramIndex}`;
    params.push(base.toUpperCase());
    paramIndex++;
  }

  if (quote && typeof quote === 'string') {
    query += ` AND quote = $${paramIndex}`;
    params.push(quote.toUpperCase());
    paramIndex++;
  }

  if (side && typeof side === 'string') {
    query += ` AND side = $${paramIndex}`;
    params.push(side.toLowerCase());
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length
  });
}));

// GET /api/v1/orders/:id - Get specific order
router.get("/:id", authMiddleware, tradingRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orderId = req.params.id;

  const result = await db.query(`
    SELECT id, venue, base, quote, side, qty, price, status, created_at, updated_at
    FROM trades
    WHERE id = $1 AND user_id = $2
  `, [orderId, userId]);

  if (result.rows.length === 0) {
    throw new NotFoundError("Order not found");
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// PUT /api/v1/orders/:id - Update order
router.put("/:id", authMiddleware, tradingRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orderId = req.params.id;
  const { qty, price } = req.body;

  // Only allow updates if order is pending
  const currentOrder = await db.query(`
    SELECT status FROM trades WHERE id = $1 AND user_id = $2
  `, [orderId, userId]);

  if (currentOrder.rows.length === 0) {
    throw new NotFoundError("Order not found");
  }

  if (currentOrder.rows[0].status !== 'pending') {
    throw new ConflictError("Can only update pending orders");
  }

  const result = await db.query(`
    UPDATE trades
    SET qty = $1, price = $2, updated_at = NOW()
    WHERE id = $3 AND user_id = $4
    RETURNING id, venue, base, quote, side, qty, price, status, created_at, updated_at
  `, [qty, price, orderId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Failed to update order");
  }

  res.json({
    success: true,
    data: result.rows[0]
  });

  logger.info(`Order updated for user ${userId}`, {
    orderId,
    qty,
    price
  });
}));

// DELETE /api/v1/orders/:id - Cancel order
router.delete("/:id", authMiddleware, tradingRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orderId = req.params.id;

  // Only allow cancellation if order is pending
  const currentOrder = await db.query(`
    SELECT status FROM trades WHERE id = $1 AND user_id = $2
  `, [orderId, userId]);

  if (currentOrder.rows.length === 0) {
    throw new NotFoundError("Order not found");
  }

  if (currentOrder.rows[0].status !== 'pending') {
    throw new ConflictError("Can only cancel pending orders");
  }

  const result = await db.query(`
    UPDATE trades
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING id, status
  `, [orderId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Failed to cancel order");
  }

  res.json({
    success: true,
    message: "Order cancelled successfully"
  });

  logger.info(`Order cancelled for user ${userId}`, { orderId });
}));

export default router;