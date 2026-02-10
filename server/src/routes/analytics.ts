import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getAdvancedAnalytics } from "../controllers/analyticsController.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);
analyticsRoutes.use(apiLimiter);

analyticsRoutes.get("/", getAdvancedAnalytics);

export { analyticsRoutes };

