import { Router } from "express";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  generateContent,
  getMarketingStats,
  getSocialConnections,
  connectSocial,
  disconnectSocial,
  startOAuthFlow,
  handleOAuthCallback,
  syncProfileInfo,
  publishPost,
} from "../controllers/marketingController.js";
import { authenticate } from "../middleware/auth.js";

export const marketingRoutes = Router();

// Todas as rotas requerem autenticação
marketingRoutes.get("/campaigns", authenticate, getCampaigns);
marketingRoutes.post("/campaigns", authenticate, createCampaign);
marketingRoutes.put("/campaigns/:id", authenticate, updateCampaign);
marketingRoutes.delete("/campaigns/:id", authenticate, deleteCampaign);
marketingRoutes.post("/generate-content", authenticate, generateContent);
marketingRoutes.post("/publish-post", authenticate, publishPost);
marketingRoutes.get("/stats", authenticate, getMarketingStats);

// Rotas de conexão com redes sociais
marketingRoutes.get("/social-connections", authenticate, getSocialConnections);
marketingRoutes.post("/social-connections", authenticate, connectSocial);
marketingRoutes.delete("/social-connections/:platform", authenticate, disconnectSocial);
marketingRoutes.post("/social-connections/:platform/sync", authenticate, syncProfileInfo);

// Rotas OAuth (fluxo automático)
marketingRoutes.get("/oauth/:platform/start", authenticate, startOAuthFlow);
// Callback não requer autenticação inicial (vem da plataforma externa)
marketingRoutes.get("/oauth/callback", handleOAuthCallback);





