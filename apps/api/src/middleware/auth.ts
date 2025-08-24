// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JWTPayload } from "../lib/auth";
import { authLogger } from "../lib/logger";
import { recordError } from "../lib/metrics";
import { db } from "../lib/db";

// Express types are extended in types/express.d.ts

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        error: {
          code: "MISSING_TOKEN",
          message: "Authorization token required",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }

    // Verify token format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN_FORMAT",
          message: "Token must be in format: Bearer <token>",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Add user info to request
    req.user = payload;
    req.auth = payload;

    authLogger.debug({ userId: payload.sub, email: payload.email }, "User authenticated");

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Token verification failed";

    authLogger.warn({ error: errorMessage }, "Authentication failed");
    recordError("authentication", "middleware", "low");

    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: errorMessage,
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is valid, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      req.user = payload;
      req.auth = payload;

      authLogger.debug({ userId: payload.sub }, "Optional authentication successful");
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    authLogger.debug("Optional authentication failed, continuing without user");
    next();
  }
};

/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles that can access the route
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      authLogger.warn({
        userId: req.user.sub,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      }, "Access denied due to insufficient permissions");

      recordError("authorization", "middleware", "medium");

      res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions to access this resource",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * User or admin middleware
 */
export const requireUserOrAdmin = requireRole(["user", "admin"]);

/**
 * Middleware to check if user has required subscription tier
 * @param requiredTier - Minimum subscription tier required
 */
export const requireSubscriptionTier = (requiredTier: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user's subscription details
      if (!req.user) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          requestId: res.getHeader("X-Request-ID"),
        });
        return;
      }

      const result = await db.query(
        "SELECT subscription_tier, subscription_status FROM users WHERE id = $1",
        [req.user.sub]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          requestId: res.getHeader("X-Request-ID"),
        });
        return;
      }

      const user = result.rows[0];

      // Check subscription status
      if (user.subscription_status !== "active") {
        res.status(403).json({
          error: {
            code: "SUBSCRIPTION_INACTIVE",
            message: "Active subscription required",
          },
          requestId: res.getHeader("X-Request-ID"),
        });
        return;
      }

      // Check subscription tier
      const tierOrder = { standard: 1, pro: 2, elite: 3 };
      const userTier = tierOrder[user.subscription_tier as keyof typeof tierOrder] || 0;
      const requiredTierLevel = tierOrder[requiredTier as keyof typeof tierOrder] || 0;

      if (userTier < requiredTierLevel) {
        authLogger.warn({
          userId: req.user!.sub,
          userTier: user.subscription_tier,
          requiredTier
        }, "Access denied due to insufficient subscription tier");

        recordError("authorization", "middleware", "low");

        res.status(403).json({
          error: {
            code: "INSUFFICIENT_SUBSCRIPTION",
            message: `Subscription tier '${requiredTier}' or higher required`,
          },
          requestId: res.getHeader("X-Request-ID"),
        });
        return;
      }

      next();
    } catch (error) {
      authLogger.error({
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.sub
      }, "Failed to check subscription");

      recordError("authorization", "middleware", "medium");

      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to verify subscription",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }
  };
};

/**
 * Rate limiting middleware
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    // Get or create request record
    let record = requests.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requests.set(key, record);
    }

    // Check rate limit
    if (record.count >= maxRequests) {
      authLogger.warn({ ip: req.ip, path: req.path }, "Rate limit exceeded");

      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        requestId: res.getHeader("X-Request-ID"),
      });
      return;
    }

    // Increment request count
    record.count++;
    next();
  };
};

// Export middleware functions
export { authenticate as auth };
export { authenticate as guard };