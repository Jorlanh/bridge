import { Router } from "express";
import {
  getPlans,
  createSubscription,
  getCurrentSubscription,
  cancelSubscription,
  getPayments,
  handleAsaasWebhook,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

export const paymentRoutes = Router();

// Rotas públicas
paymentRoutes.get("/plans", getPlans);
paymentRoutes.post("/webhooks/asaas", handleAsaasWebhook); // Webhook do Asaas (sem autenticação)

// Rotas autenticadas
paymentRoutes.use(authenticate);
paymentRoutes.post("/subscriptions", createSubscription);
paymentRoutes.get("/subscriptions/current", getCurrentSubscription);
paymentRoutes.post("/subscriptions/cancel", cancelSubscription);
paymentRoutes.get("/payments", getPayments);

