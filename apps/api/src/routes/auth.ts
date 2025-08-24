// apps/api/src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { generateTokenPair, verifyRefreshToken, hashTokenForStorage } from "../lib/auth";
import { db } from "../lib/db";
import { authLogger } from "../lib/logger";
import { recordError } from "../lib/metrics";
import passport, { OAuthUser } from "../lib/passport";
import { env } from "../lib/env";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    // Validate input
    const { email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: "EMAIL_TAKEN",
          message: "User with this email already exists",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await db.query(
      "INSERT INTO users (email, pw_hash) VALUES ($1, $2) RETURNING id, email, role, subscription_tier, created_at",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    authLogger.info({ userId: user.id, email }, "User registered successfully");

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "User registration failed");
    recordError("validation", "auth", "medium");

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to register user",
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const userResult = await db.query(
      "SELECT id, email, pw_hash, role, subscription_tier, twofa_enabled FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.pw_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    // Generate tokens
    const tokenVersion = Date.now();
    const tokens = generateTokenPair(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      tokenVersion
    );

    // Store refresh token hash
    const refreshTokenHash = hashTokenForStorage(tokens.refreshToken);
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshTokenHash]
    );

    authLogger.info({ userId: user.id, email }, "User logged in successfully");

    return res.json({
      message: "Login successful",
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        twofaEnabled: user.twofa_enabled,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "User login failed");
    recordError("authentication", "auth", "medium");

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to authenticate user",
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
});

// Refresh access token
router.post("/refresh", async (req, res) => {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenHash = hashTokenForStorage(refreshToken);
    const tokenResult = await db.query(
      "SELECT id, user_id, expires_at, is_revoked FROM refresh_tokens WHERE token_hash = $1",
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid refresh token",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    const tokenRecord = tokenResult.rows[0];

    // Check if token is revoked or expired
    if (tokenRecord.is_revoked || new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Refresh token expired or revoked",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    // Get user information
    const userResult = await db.query(
      "SELECT id, email, role, subscription_tier FROM users WHERE id = $1",
      [payload.sub]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    const user = userResult.rows[0];

    // Generate new token pair
    const newTokenVersion = Date.now();
    const newTokens = generateTokenPair(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      newTokenVersion
    );

    // Revoke old token and store new one
    await db.query(
      "UPDATE refresh_tokens SET is_revoked = true WHERE id = $1",
      [tokenRecord.id]
    );

    const newTokenHash = hashTokenForStorage(newTokens.refreshToken);
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, newTokenHash]
    );

    authLogger.info({ userId: user.id }, "Access token refreshed successfully");

    return res.json({
      message: "Token refreshed successfully",
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    if (error instanceof Error && error.message.includes("token")) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: error.message,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Token refresh failed");
    recordError("authentication", "auth", "medium");

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to refresh token",
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
});

// Logout user
router.post("/logout", async (req, res) => {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body);

    // Hash the token and revoke it
    const tokenHash = hashTokenForStorage(refreshToken);
    await db.query(
      "UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1",
      [tokenHash]
    );

    authLogger.info("User logged out successfully");

    return res.json({
      message: "Logout successful",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "User logout failed");
    recordError("authentication", "auth", "medium");

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to logout user",
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
});

// Get current user info
router.get("/me", async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: "MISSING_TOKEN",
          message: "Authorization token required",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    // Verify token and get user info
    const { verifyAccessToken } = await import("../lib/auth");
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyAccessToken(token);

    // Get user details
    const userResult = await db.query(
      "SELECT id, email, role, subscription_tier, subscription_status, twofa_enabled, created_at FROM users WHERE id = $1",
      [payload.sub]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    const user = userResult.rows[0];

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
        twofaEnabled: user.twofa_enabled,
        createdAt: user.created_at,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: error.message,
        },
        requestId: res.getHeader("X-Request-ID"),
      });
    }

    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to get user info");
    recordError("authentication", "auth", "low");

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get user information",
      },
      requestId: res.getHeader("X-Request-ID"),
    });
  }
});

// OAuth Routes

// Google OAuth
router.get("/oauth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/oauth/google/callback",
  (req, res, next) => {
    // Debug OAuth callback
    authLogger.info({
      query: req.query,
      headers: req.headers,
      userAgent: req.get("User-Agent"),
      ip: req.ip
    }, "OAuth callback received");

    passport.authenticate("google", {
      session: false,
      failureRedirect: `${env.APP_URL}/auth?error=oauth_failed`
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user as unknown as OAuthUser;
      if (!user) {
        authLogger.error({ query: req.query }, "OAuth callback failed: no user returned");
        return res.redirect(`${env.APP_URL}/auth?error=oauth_failed&reason=no_user`);
      }

      authLogger.info({ userId: user.id, email: user.email, provider: user.provider }, "OAuth user authenticated successfully");

      // Generate tokens
      const tokenVersion = Date.now();
      const tokens = generateTokenPair(
        {
          sub: user.id,
          email: user.email,
          role: "user",
        },
        tokenVersion
      );

      // Store refresh token hash
      const refreshTokenHash = hashTokenForStorage(tokens.refreshToken);
      await db.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [user.id, refreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      // Set cookies and redirect
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with access token
      const redirectUrl = `${env.APP_URL}/auth/callback?accessToken=${tokens.accessToken}&provider=${user.provider}`;
      authLogger.info({ userId: user.id, redirectUrl }, "OAuth callback successful, redirecting user");

      return res.redirect(redirectUrl);

    } catch (error) {
      authLogger.error({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: req.user
      }, "OAuth callback error");

      recordError("authentication", "oauth_callback", "high");

      return res.redirect(`${env.APP_URL}/auth?error=oauth_failed&reason=internal_error`);
    }
  }
);

// GitHub OAuth
router.get("/oauth/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/oauth/github/callback",
  passport.authenticate("github", { session: false }),
  async (req, res) => {
    try {
      const user = req.user as unknown as OAuthUser;
      if (!user) {
        return res.redirect(`${env.APP_URL}/auth?error=oauth_failed`);
      }

      // Generate tokens
      const tokenVersion = Date.now();
      const tokens = generateTokenPair(
        {
          sub: user.id,
          email: user.email,
          role: "user",
        },
        tokenVersion
      );

      // Store refresh token hash
      const refreshTokenHash = hashTokenForStorage(tokens.refreshToken);
      await db.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
        [user.id, refreshTokenHash]
      );

      authLogger.info({ userId: user.id, email: user.email, provider: "github" }, "OAuth login successful");

      // Redirect to frontend with tokens
      const redirectUrl = `${env.APP_URL}/auth/callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}&provider=github`;
      return res.redirect(redirectUrl);

    } catch (error) {
      authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "GitHub OAuth callback failed");
      return res.redirect(`${env.APP_URL}/auth?error=oauth_failed`);
    }
  }
);

export default router;