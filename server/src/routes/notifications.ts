import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  saveFCMToken,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

export const notificationRoutes = Router();

// Todas as rotas requerem autenticação
notificationRoutes.get("/", authenticate, getNotifications);
notificationRoutes.get("/unread-count", authenticate, getUnreadCount);
notificationRoutes.put("/:notificationId/read", authenticate, markAsRead);
notificationRoutes.put("/read-all", authenticate, markAllAsRead);
notificationRoutes.delete("/:notificationId", authenticate, deleteNotification);
notificationRoutes.post("/fcm-token", authenticate, saveFCMToken);


