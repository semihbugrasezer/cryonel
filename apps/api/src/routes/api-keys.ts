// apps/api/src/routes/api-keys.ts
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireUserOrAdmin } from "../middleware/auth";
import { encrypt, decrypt } from "../lib/crypto";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { recordError } from "../lib/metrics";
import "../types/express"; // Import type extension

const router = Router();

// Validation schemas
const createApiKeySchema = z.object({
    exchange: z.string().min(1, "Exchange is required").max(50, "Exchange name too long"),
    apiKey: z.string().min(1, "API key is required").max(500, "API key too long"),
    apiSecret: z.string().min(1, "API secret is required").max(500, "API secret too long"),
    passphrase: z.string().optional(), // For exchanges that require it (e.g., Coinbase Pro)
    canWithdraw: z.boolean().default(false), // Must be false for security
});

const updateApiKeySchema = createApiKeySchema.partial().extend({
    id: z.string().uuid("Invalid API key ID"),
});

const testConnectionSchema = z.object({
    exchange: z.string().min(1, "Exchange is required"),
    apiKey: z.string().min(1, "API key is required"),
    apiSecret: z.string().min(1, "API secret is required"),
    passphrase: z.string().optional(),
});

// Get all API keys for the authenticated user
router.get("/", authenticate, async (req, res) => {
    try {
        const userId = req.user!.sub;

        const result = await db.query(
            `SELECT 
        id, 
        exchange, 
        can_withdraw, 
        created_at, 
        updated_at
       FROM user_api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            items: result.rows.map(row => ({
                id: row.id,
                exchange: row.exchange,
                canWithdraw: row.can_withdraw,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })),
        });

    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub
        }, "Failed to get API keys");

        recordError("database", "api-keys", "medium");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to retrieve API keys",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Get specific API key by ID
router.get("/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.sub;

        // Get API key details
        const result = await db.query(
            `SELECT 
        id, 
        exchange, 
        can_withdraw, 
        created_at,
        updated_at
       FROM user_api_keys 
       WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                error: {
                    code: "API_KEY_NOT_FOUND",
                    message: "API key not found",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        const apiKey = result.rows[0];

        res.json({
            id: apiKey.id,
            exchange: apiKey.exchange,
            canWithdraw: apiKey.can_withdraw,
            createdAt: apiKey.created_at,
            updatedAt: apiKey.updated_at,
        });

    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub,
            apiKeyId: req.params.id
        }, "Failed to get API key");

        recordError("database", "api-keys", "medium");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to retrieve API key",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Create new API key
router.post("/", authenticate, async (req, res) => {
    try {
        // Validate input
        const { exchange, apiKey, apiSecret, passphrase, canWithdraw } = createApiKeySchema.parse(req.body);

        // Security check: withdrawals must be disabled
        if (canWithdraw) {
            res.status(400).json({
                error: {
                    code: "WITHDRAWAL_NOT_ALLOWED",
                    message: "Withdrawal permissions are not allowed for security reasons",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        const userId = req.user!.sub;

        // Check if user already has an API key for this exchange
        const existingResult = await db.query(
            "SELECT id FROM user_api_keys WHERE user_id = $1 AND exchange = $2",
            [userId, exchange]
        );

        if (existingResult.rows.length > 0) {
            res.status(409).json({
                error: {
                    code: "EXCHANGE_ALREADY_EXISTS",
                    message: `API key for ${exchange} already exists`,
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        // Encrypt sensitive data
        const encryptedApiKey = encrypt(apiKey);
        const encryptedApiSecret = encrypt(apiSecret);
        const encryptedPassphrase = passphrase ? encrypt(passphrase) : null;

        // Create API key record
        const result = await db.query(
            `INSERT INTO user_api_keys (
        user_id, 
        exchange, 
        key_enc, 
        secret_enc, 
        passphrase_enc, 
        can_withdraw
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, exchange, created_at`,
            [userId, exchange, encryptedApiKey, encryptedApiSecret, encryptedPassphrase, false]
        );

        const newApiKey = result.rows[0];

        logger.info({
            userId,
            exchange,
            apiKeyId: newApiKey.id
        }, "API key created successfully");

        res.status(201).json({
            message: "API key created successfully",
            apiKey: {
                id: newApiKey.id,
                exchange: newApiKey.exchange,
                canWithdraw: false,
                createdAt: newApiKey.created_at,
            },
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid input data",
                    details: error.errors,
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub
        }, "Failed to create API key");

        recordError("validation", "api-keys", "medium");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create API key",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Update existing API key
router.put("/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.sub;

        // Validate input
        const updateData = updateApiKeySchema.parse({ ...req.body, id });

        // Check if API key exists and belongs to user
        const existingResult = await db.query(
            "SELECT id, exchange FROM user_api_keys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (existingResult.rows.length === 0) {
            res.status(404).json({
                error: {
                    code: "API_KEY_NOT_FOUND",
                    message: "API key not found",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        const existingApiKey = existingResult.rows[0];

        // Security check: withdrawals must remain disabled
        if (updateData.canWithdraw) {
            res.status(400).json({
                error: {
                    code: "WITHDRAWAL_NOT_ALLOWED",
                    message: "Withdrawal permissions are not allowed for security reasons",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        // Build update query dynamically
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramCount = 1;

        if (updateData.exchange !== undefined) {
            updateFields.push(`exchange = $${++paramCount}`);
            updateValues.push(updateData.exchange);
        }

        if (updateData.apiKey !== undefined) {
            updateFields.push(`key_enc = $${++paramCount}`);
            updateValues.push(encrypt(updateData.apiKey));
        }

        if (updateData.apiSecret !== undefined) {
            updateFields.push(`secret_enc = $${++paramCount}`);
            updateValues.push(encrypt(updateData.apiSecret));
        }

        if (updateData.passphrase !== undefined) {
            updateFields.push(`passphrase_enc = $${++paramCount}`);
            updateValues.push(updateData.passphrase ? encrypt(updateData.passphrase) : null);
        }

        // Always update timestamp
        updateFields.push(`updated_at = NOW()`);

        if (updateFields.length === 0) {
            res.status(400).json({
                error: {
                    code: "NO_CHANGES",
                    message: "No fields to update",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        // Execute update
        const updateQuery = `
      UPDATE user_api_keys 
      SET ${updateFields.join(", ")} 
      WHERE id = $1 AND user_id = $${++paramCount}
      RETURNING id, exchange, updated_at
    `;

        updateValues.unshift(id, userId);

        const result = await db.query(updateQuery, updateValues);
        const updatedApiKey = result.rows[0];

        logger.info({
            userId,
            apiKeyId: id,
            exchange: updatedApiKey.exchange
        }, "API key updated successfully");

        res.json({
            message: "API key updated successfully",
            apiKey: {
                id: updatedApiKey.id,
                exchange: updatedApiKey.exchange,
                updatedAt: updatedApiKey.updated_at,
            },
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid input data",
                    details: error.errors,
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub,
            apiKeyId: req.params.id
        }, "Failed to update API key");

        recordError("validation", "api-keys", "medium");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to update API key",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Delete API key
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.sub;

        // Check if API key exists and belongs to user
        const existingResult = await db.query(
            "SELECT id, exchange FROM user_api_keys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (existingResult.rows.length === 0) {
            res.status(404).json({
                error: {
                    code: "API_KEY_NOT_FOUND",
                    message: "API key not found",
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        const existingApiKey = existingResult.rows[0];

        // Delete API key
        await db.query(
            "DELETE FROM user_api_keys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        logger.info({
            userId,
            apiKeyId: id,
            exchange: existingApiKey.exchange
        }, "API key deleted successfully");

        res.json({
            message: "API key deleted successfully",
        });

    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub,
            apiKeyId: req.params.id
        }, "Failed to delete API key");

        recordError("database", "api-keys", "medium");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to delete API key",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Test API key connection
router.post("/test", authenticate, async (req, res) => {
    try {
        // Validate input
        const { exchange, apiKey, apiSecret, passphrase } = testConnectionSchema.parse(req.body);

        // Test connection using ccxt (this would be implemented in a separate service)
        // For now, we'll simulate a connection test
        const connectionResult = await testExchangeConnection(exchange, apiKey, apiSecret, passphrase);

        if (connectionResult.success) {
            res.json({
                message: "Connection test successful",
                exchange,
                details: connectionResult.details,
            });
        } else {
            res.status(400).json({
                error: {
                    code: "CONNECTION_FAILED",
                    message: "Connection test failed",
                    details: connectionResult.error,
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid input data",
                    details: error.errors,
                },
                requestId: res.getHeader("X-Request-ID"),
            });
        }

        logger.error({
            error: error instanceof Error ? error.message : String(error),
            userId: req.user!.sub
        }, "API key connection test failed");

        recordError("validation", "api-keys", "low");

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to test API key connection",
            },
            requestId: res.getHeader("X-Request-ID"),
        });
    }
});

// Helper function to test exchange connection
async function testExchangeConnection(
    exchange: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
    try {
        // This would integrate with ccxt or exchange-specific APIs
        // For now, we'll simulate a successful connection

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate connection test
        const isSuccessful = Math.random() > 0.1; // 90% success rate for demo

        if (isSuccessful) {
            return {
                success: true,
                details: {
                    exchange,
                    permissions: ["read", "trade"],
                    accountType: "spot",
                    testMode: false,
                },
            };
        } else {
            return {
                success: false,
                error: "Invalid API credentials or insufficient permissions",
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Connection test failed",
        };
    }
}

export default router;
