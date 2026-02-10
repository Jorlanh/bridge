import { Router } from "express";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  generatePost,
  getSocialStats,
} from "../controllers/socialController.js";
import { authenticate } from "../middleware/auth.js";
import { uploadPostImage } from "../middleware/upload.js";

export const socialRoutes = Router();

// Todas as rotas requerem autenticação
socialRoutes.get("/posts", authenticate, getPosts);
socialRoutes.post("/posts", authenticate, uploadPostImage.single("image"), createPost);
socialRoutes.put("/posts/:id", authenticate, uploadPostImage.single("image"), updatePost);
socialRoutes.delete("/posts/:id", authenticate, deletePost);
socialRoutes.post("/generate-post", authenticate, generatePost);
socialRoutes.get("/stats", authenticate, getSocialStats);






