import { Router } from "express";
import { chatWithAssistant } from "../controllers/assistantController.js";
import { authenticate } from "../middleware/auth.js";

export const assistantRoutes = Router();

// Todas as rotas requerem autenticação
assistantRoutes.post("/chat", authenticate, chatWithAssistant);




