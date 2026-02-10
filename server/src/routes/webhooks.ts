import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} from "../controllers/webhookController.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const webhookRoutes = Router();

webhookRoutes.use(authenticate);
webhookRoutes.use(apiLimiter);

webhookRoutes.post("/", createWebhook);
webhookRoutes.get("/", getWebhooks);
webhookRoutes.put("/:id", updateWebhook);
webhookRoutes.delete("/:id", deleteWebhook);
webhookRoutes.post("/:id/test", testWebhook);

export { webhookRoutes };

