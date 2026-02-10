import { Router } from "express";
import { register, login, forgotPassword, resetPassword, loginWithGoogle, loginWithFacebook } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", loginWithGoogle);
authRoutes.post("/facebook", loginWithFacebook);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);


