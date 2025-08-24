// apps/api/src/routes/metrics.ts
import { Router } from "express";
import { metricsHandler } from "../lib/metrics";

const router = Router();

// Expose Prometheus metrics
router.get("/", metricsHandler);

export default router;
