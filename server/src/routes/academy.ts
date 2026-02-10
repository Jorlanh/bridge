import { Router } from "express";
import {
  getCourses,
  getCourseById,
  getAcademyStats,
  enrollInCourse,
  updateProgress,
  getCertificates,
  getLearningPath,
  downloadCertificate,
  getConsultingSessions,
  scheduleSession,
  cancelSession,
} from "../controllers/academyController.js";
import { authenticate } from "../middleware/auth.js";

export const academyRoutes = Router();

// Todas as rotas requerem autenticação
academyRoutes.get("/courses", authenticate, getCourses);
academyRoutes.get("/courses/:courseId", authenticate, getCourseById);
academyRoutes.get("/stats", authenticate, getAcademyStats);
academyRoutes.post("/enroll", authenticate, enrollInCourse);
academyRoutes.post("/progress", authenticate, updateProgress);
academyRoutes.get("/certificates", authenticate, getCertificates);
academyRoutes.get("/learning-path", authenticate, getLearningPath);
academyRoutes.get("/certificate/:courseId/download", authenticate, downloadCertificate);

// Rotas de consultoria
academyRoutes.get("/consulting-sessions", authenticate, getConsultingSessions);
academyRoutes.post("/consulting-sessions/schedule", authenticate, scheduleSession);
academyRoutes.post("/consulting-sessions/cancel", authenticate, cancelSession);

