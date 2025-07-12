import { Router } from "express";
import seasonsRoutes from "./seasons.routes";

const router = Router();

// Mount route modules
router.use("/seasons", seasonsRoutes);

export default router;
