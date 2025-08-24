import { Router } from "express";
import authRoutes from "./auth";
import keysRoutes from "./keys";
import ordersRoutes from "./orders";
import signalsRoutes from "./signals";
import billingRoutes from "./billing";
import healthRoutes from "./health";
import dceRoutes from "./dce";
import pnlRoutes from "./pnl";
import routerRoutes from "./router";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/keys", keysRoutes);
router.use("/orders", ordersRoutes);
router.use("/signals", signalsRoutes);
router.use("/billing", billingRoutes);
router.use("/dce", dceRoutes);
router.use("/pnl", pnlRoutes);
router.use("/router", routerRoutes);

export default router;