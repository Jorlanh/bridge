import { Router } from "express";
import {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  getFollowUps,
  createFollowUp,
  generateSalesScript,
  getSalesStats,
} from "../controllers/salesController.js";
import { authenticate } from "../middleware/auth.js";

export const salesRoutes = Router();

// Todas as rotas requerem autenticação
salesRoutes.get("/deals", authenticate, getDeals);
salesRoutes.post("/deals", authenticate, createDeal);
salesRoutes.put("/deals/:id", authenticate, updateDeal);
salesRoutes.delete("/deals/:id", authenticate, deleteDeal);
salesRoutes.get("/followups", authenticate, getFollowUps);
salesRoutes.post("/followups", authenticate, createFollowUp);
salesRoutes.post("/generate-script", authenticate, generateSalesScript);
salesRoutes.get("/stats", authenticate, getSalesStats);






