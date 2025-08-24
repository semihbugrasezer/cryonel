// apps/api/src/lib/auth.ts
import jwt from "jsonwebtoken";
import { env } from "./env";
import { authLogger } from "./logger";
import { generateSecureToken, hashRefreshToken } from "./crypto";

// JWT payload interface
export interface JWTPayload {
    sub: string; // User ID
    email: string;
    role: string;
    iat?: number; // Issued at
    exp?: number; // Expires at
}

// Refresh token payload interface
export interface RefreshTokenPayload {
    sub: string; // User ID
    version: number; // Token version for rotation
    iat?: number;
    exp?: number;
}

// Token response interface
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Generate an access token
 * @param payload - JWT payload
 * @returns Access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_ACCESS_TTL,
            issuer: "cryonel-api",
            audience: "cryonel-users",
        });
    } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to generate access token");
        throw new Error("Failed to generate access token");
    }
}

/**
 * Generate a refresh token
 * @param userId - User ID
 * @param version - Token version
 * @returns Refresh token
 */
export function generateRefreshToken(userId: string, version: number): string {
    try {
        return jwt.sign(
            { sub: userId, version },
            env.JWT_REFRESH_SECRET,
            {
                expiresIn: env.JWT_REFRESH_TTL,
                issuer: "cryonel-api",
                audience: "cryonel-users",
            }
        );
    } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to generate refresh token");
        throw new Error("Failed to generate refresh token");
    }
}

/**
 * Verify an access token
 * @param token - Access token to verify
 * @returns Decoded payload
 */
export function verifyAccessToken(token: string): JWTPayload {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET, {
            issuer: "cryonel-api",
            audience: "cryonel-users",
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            authLogger.warn("Access token expired");
            throw new Error("Token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            authLogger.warn("Invalid access token");
            throw new Error("Invalid token");
        } else {
            authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Token verification failed");
            throw new Error("Token verification failed");
        }
    }
}

/**
 * Verify a refresh token
 * @param token - Refresh token to verify
 * @returns Decoded payload
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
            issuer: "cryonel-api",
            audience: "cryonel-users",
        }) as RefreshTokenPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            authLogger.warn("Refresh token expired");
            throw new Error("Refresh token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            authLogger.warn("Invalid refresh token");
            throw new Error("Invalid refresh token");
        } else {
            authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Refresh token verification failed");
            throw new Error("Refresh token verification failed");
        }
    }
}

/**
 * Generate both access and refresh tokens
 * @param payload - User data for JWT payload
 * @param tokenVersion - Version for refresh token rotation
 * @returns Token response
 */
export function generateTokenPair(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
    tokenVersion: number
): TokenResponse {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload.sub, tokenVersion);

    return {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_ACCESS_TTL,
    };
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }

    return parts[1];
}

/**
 * Generate a new token version for rotation
 * @returns New token version
 */
export function generateTokenVersion(): number {
    return Date.now();
}

/**
 * Hash a refresh token for secure storage
 * @param token - Plain refresh token
 * @returns Hashed token
 */
export function hashTokenForStorage(token: string): string {
    return hashRefreshToken(token);
}

/**
 * Check if a token is expired
 * @param token - JWT token
 * @returns True if expired
 */
export function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (!decoded.exp) return true;

        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    } catch {
        return true;
    }
}

/**
 * Get token expiration time
 * @param token - JWT token
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(token: string): number | null {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        return decoded.exp || null;
    } catch {
        return null;
    }
}

// Types are already exported above
