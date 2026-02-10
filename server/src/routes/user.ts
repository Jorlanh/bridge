import { Router } from "express";
import { getProfile, updateProfile, uploadAvatar, changePassword, deleteAccount, getNotificationPreferences, updateNotificationPreferences } from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { uploadAvatar as uploadMiddleware } from "../middleware/upload.js";

export const userRoutes = Router();

// Rotas protegidas - requerem autenticação
userRoutes.get("/profile", authenticate, getProfile);
userRoutes.put("/profile", authenticate, updateProfile);
userRoutes.post("/change-password", authenticate, changePassword);
userRoutes.delete("/account", authenticate, deleteAccount);
userRoutes.post("/avatar", authenticate, uploadMiddleware.single("avatar"), uploadAvatar);
userRoutes.get("/notification-preferences", authenticate, getNotificationPreferences);
userRoutes.put("/notification-preferences", authenticate, updateNotificationPreferences);


