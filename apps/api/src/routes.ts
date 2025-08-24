import { Router } from "express";
import authRoutes from "./routes/auth";
import keysRoutes from "./routes/keys";
import ordersRoutes from "./routes/orders";
import signalsRoutes from "./routes/signals";
import billingRoutes from "./routes/billing";
import healthRoutes from "./routes/health";
import metricsRoutes from "./routes/metrics";
import tradesRoutes from "./routes/trades";
import performanceRoutes from "./routes/performance";

const router = Router();

// Health check route
router.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API version info
router.get("/", (req, res) => {
    res.json({
        name: "CRYONEL API",
        version: "1.0.0",
        description: "AI-Powered Crypto Trading & Development Automation Platform",
        endpoints: {
            auth: "/auth",
            keys: "/keys",
            orders: "/orders",
            signals: "/signals",
            billing: "/billing",
            health: "/health",
            metrics: "/metrics",
            trades: "/trades",
            performance: "/performance",
        },
        documentation: "https://docs.cryonel.com",
    });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/keys", keysRoutes);
router.use("/orders", ordersRoutes);
router.use("/signals", signalsRoutes);
router.use("/billing", billingRoutes);
router.use("/health", healthRoutes);
router.use("/metrics", metricsRoutes);
router.use("/trades", tradesRoutes);
router.use("/performance", performanceRoutes);

export default router;