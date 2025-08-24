// apps/api/src/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";

// General API rate limit
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    });
  },
});

// Trading-specific rate limit (more restrictive)
export const tradingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 trading requests per minute
  message: {
    error: "Too many trading requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Trading rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many trading requests",
      message: "Trading rate limit exceeded. Please try again later.",
    });
  },
});

// Authentication rate limit (very restrictive)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: {
    error: "Too many authentication attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Authentication rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "Authentication rate limit exceeded. Please try again later.",
    });
  },
});

export default {
  apiRateLimit,
  tradingRateLimit,
  authRateLimit,
};