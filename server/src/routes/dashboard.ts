import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/stats", authenticate, getDashboardStats);


