import { Router } from "express";
import {
  getUsers,
  getActivityLogs,
  createActivityLog,
  getSecurityStats,
} from "../controllers/securityController.js";
import { authenticate } from "../middleware/auth.js";

export const securityRoutes = Router();

// Todas as rotas requerem autenticação
securityRoutes.get("/users", authenticate, getUsers);
securityRoutes.get("/activity-logs", authenticate, getActivityLogs);
securityRoutes.post("/activity-logs", authenticate, createActivityLog);
securityRoutes.get("/stats", authenticate, getSecurityStats);






