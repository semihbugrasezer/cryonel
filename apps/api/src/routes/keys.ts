import { Router, Request, Response } from "express";
import { z } from "zod";
import { encrypt } from "../lib/crypto";
import { authenticate as authMiddleware } from "../middleware/auth";
import { apiRateLimit } from "../middleware/rateLimit";
import { logger } from "../lib/logger";
import { db } from "../lib/db";

const router = Router();

// Request schemas
const CreateApiKeySchema = z.object({
  exchange: z.string().min(1, "Exchange is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

// GET /api/v1/keys - List user's API keys
router.get("/", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await db.query(`
      SELECT id, exchange, created_at, updated_at
      FROM user_api_keys 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    logger.error("Error fetching API keys", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/v1/keys - Create new API key
router.post("/", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const validatedData = CreateApiKeySchema.parse(req.body);
    const userId = (req as any).user.id;

    // Check if user already has a key for this exchange
    const existingKey = await db.query(
      "SELECT id FROM user_api_keys WHERE user_id = $1 AND exchange = $2",
      [userId, validatedData.exchange]
    );

    if (existingKey.rows.length > 0) {
      res.status(409).json({ error: "API key already exists for this exchange" });
      return;
    }

    // Encrypt sensitive data
    const encryptedApiKey = encrypt(validatedData.apiKey);
    const encryptedApiSecret = encrypt(validatedData.apiSecret);

    // Store encrypted API key
    const result = await db.query(`
      INSERT INTO user_api_keys (user_id, exchange, key_encrypted, secret_encrypted, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, exchange, created_at
    `, [userId, validatedData.exchange, encryptedApiKey, encryptedApiSecret]);

    if (result.rows.length === 0) {
      res.status(500).json({ error: "Failed to create API key" });
      return;
    }

    logger.info(`API key created for user ${userId}`, {
      keyId: result.rows[0].id,
      exchange: validatedData.exchange
    });

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
      return;
    }

    logger.error("Error creating API key", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/v1/keys/:id - Get specific API key
router.get("/:id", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const keyId = req.params.id;

    const result = await db.query(`
      SELECT id, exchange, created_at, updated_at
      FROM user_api_keys 
      WHERE id = $1 AND user_id = $2
    `, [keyId, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "API key not found" });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error("Error fetching API key", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/v1/keys/:id - Delete API key
router.delete("/:id", authMiddleware, apiRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const keyId = req.params.id;

    const result = await db.query(`
      DELETE FROM user_api_keys 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [keyId, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "API key not found" });
    }

    res.json({
      success: true,
      message: "API key deleted successfully"
    });

    logger.info(`API key deleted for user ${userId}`, { keyId });

  } catch (error) {
    logger.error("Error deleting API key", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;