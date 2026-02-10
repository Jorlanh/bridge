import { Router } from "express";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getQuickReplies,
  createQuickReply,
  generateQuickReply,
  getSupportStats,
  processChatbotMessage,
  getChatbotLogs,
} from "../controllers/supportController.js";
import { authenticate } from "../middleware/auth.js";

export const supportRoutes = Router();

// Todas as rotas requerem autenticação
supportRoutes.get("/tickets", authenticate, getTickets);
supportRoutes.post("/tickets", authenticate, createTicket);
supportRoutes.put("/tickets/:id", authenticate, updateTicket);
supportRoutes.delete("/tickets/:id", authenticate, deleteTicket);
supportRoutes.get("/quick-replies", authenticate, getQuickReplies);
supportRoutes.post("/quick-replies", authenticate, createQuickReply);
supportRoutes.post("/generate-reply", authenticate, generateQuickReply);
supportRoutes.get("/stats", authenticate, getSupportStats);
supportRoutes.post("/chatbot/message", authenticate, processChatbotMessage);
supportRoutes.get("/chatbot/logs", authenticate, getChatbotLogs);






