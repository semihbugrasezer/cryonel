import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { logger } from "../lib/logger";
import { smartRouter, RoutingConstraints, ExchangeQuote } from "../lib/smart-router";

const router = Router();

// Zod schemas for validation
const RoutingConstraintsSchema = z.object({
  max_exchanges: z.number().min(1).max(10).default(3),
  max_slippage_percentage: z.number().min(0).max(50).default(2),
  min_liquidity_score: z.number().min(0).max(100).default(50),
  preferred_exchanges: z.array(z.string()).default([]),
  blacklisted_exchanges: z.array(z.string()).default([]),
  max_latency_ms: z.number().min(100).max(30000).default(5000),
  require_fills: z.boolean().default(true)
});

const RouteRequestSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  constraints: RoutingConstraintsSchema.optional()
});

const QuoteUpdateSchema = z.object({
  symbol: z.string().min(1),
  quotes: z.array(z.object({
    exchange: z.string(),
    symbol: z.string(),
    side: z.enum(['buy', 'sell']),
    price: z.number().positive(),
    quantity: z.number().positive(),
    fees: z.object({
      maker: z.number().min(0),
      taker: z.number().min(0)
    }),
    latency_ms: z.number().min(0),
    liquidity_score: z.number().min(0).max(100),
    timestamp: z.string().datetime()
  }))
});

// POST /router/route - Find optimal route for a trade
router.post("/route", authenticate, async (req: Request, res: Response) => {
  try {
    const validatedData = RouteRequestSchema.parse(req.body);
    
    const defaultConstraints: RoutingConstraints = {
      max_exchanges: 3,
      max_slippage_percentage: 2,
      min_liquidity_score: 50,
      preferred_exchanges: [],
      blacklisted_exchanges: [],
      max_latency_ms: 5000,
      require_fills: true
    };

    const constraints = { ...defaultConstraints, ...validatedData.constraints };

    const route = smartRouter.findOptimalRoute(
      validatedData.symbol,
      validatedData.side,
      validatedData.quantity,
      constraints
    );

    if (!route) {
      res.status(400).json({
        success: false,
        error: { 
          code: "NO_ROUTE_FOUND", 
          message: "No viable routing found for the requested trade" 
        }
      });
      return;
    }

    // Check slippage constraint
    if (route.estimated_slippage > constraints.max_slippage_percentage) {
      res.status(400).json({
        success: false,
        error: { 
          code: "SLIPPAGE_TOO_HIGH", 
          message: `Estimated slippage ${route.estimated_slippage.toFixed(2)}% exceeds maximum ${constraints.max_slippage_percentage}%` 
        }
      });
      return;
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid route request", details: error.errors }
      });
    } else {
      logger.error("Error finding optimal route:", error);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to find optimal route" }
      });
    }
  }
});

// POST /router/quotes/update - Update exchange quotes
router.post("/quotes/update", authenticate, async (req: Request, res: Response) => {
  try {
    const validatedData = QuoteUpdateSchema.parse(req.body);
    
    // Convert string timestamps to Date objects
    const quotesWithDateTimestamps = validatedData.quotes.map(quote => ({
      ...quote,
      timestamp: new Date(quote.timestamp)
    }));
    
    // Update quotes in the smart router
    smartRouter.updateQuotes(validatedData.symbol, quotesWithDateTimestamps);

    res.json({
      success: true,
      message: "Quotes updated successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid quote update data", details: error.errors }
      });
    } else {
      logger.error("Error updating quotes:", error);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update quotes" }
      });
    }
  }
});

// GET /router/quotes/:symbol - Get current quotes for a symbol
router.get("/quotes/:symbol", authenticate, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const quotes = smartRouter.getCurrentQuotes(symbol);

    res.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    logger.error("Error fetching quotes:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch quotes" }
    });
  }
});

// GET /router/health - Get router health status
router.get("/health", authenticate, async (req: Request, res: Response) => {
  try {
    const health = smartRouter.getHealthStatus();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error("Error fetching router health:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch router health" }
    });
  }
});

export default router;