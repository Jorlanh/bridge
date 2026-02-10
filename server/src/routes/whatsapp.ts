import { Router } from "express";
import {
  createConnection,
  getQRCode,
  getConnectionStatus,
  getConnections,
  deleteConnection,
  sendMessage,
  sendBulkMessages,
  getMessages,
  getContacts,
  getProfileInfo,
  updateAutomation,
  webhook,
} from "../controllers/whatsappController.js";
import { authenticate } from "../middleware/auth.js";

export const whatsappRoutes = Router();

// Rotas autenticadas
whatsappRoutes.post("/connections", authenticate, createConnection);
whatsappRoutes.get("/connections", authenticate, getConnections);
whatsappRoutes.get("/connections/:id/qrcode", authenticate, getQRCode);
whatsappRoutes.get("/connections/:id/status", authenticate, getConnectionStatus);
whatsappRoutes.patch("/connections/:connectionId/automation", authenticate, updateAutomation);
whatsappRoutes.delete("/connections/:id", authenticate, deleteConnection);
whatsappRoutes.post("/messages/send", authenticate, sendMessage);
whatsappRoutes.post("/messages/bulk", authenticate, sendBulkMessages);
whatsappRoutes.get("/messages", authenticate, getMessages);
whatsappRoutes.get("/contacts", authenticate, getContacts);
whatsappRoutes.get("/profile", authenticate, getProfileInfo);

// Webhook (não requer autenticação, mas deve ter validação de origem)
whatsappRoutes.post("/webhook", webhook);

