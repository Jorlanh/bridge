import { Router } from "express";
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  updateUserProfileAdmin,
  getUserOverviewAdmin,
  getSecurityLogs,
} from "../controllers/adminController.js";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  generateCourseWithAI,
  getAllConsultingSessions,
  createConsultingSession,
  updateConsultingSession,
  deleteConsultingSession,
  generateConsultingSessionWithAI,
} from "../controllers/adminAcademyController.js";
import { authenticate, requireAdmin, requireMaster } from "../middleware/auth.js";
import { getFinancialStats } from "../controllers/financialController.js";
import { getSystemInfo } from "../controllers/systemController.js";
import { User } from "../models/User.js";

export const adminRoutes = Router();

// Todas as rotas requerem autenticação e ser admin
adminRoutes.use(authenticate);
adminRoutes.use(requireAdmin);

// Estatísticas e usuários
adminRoutes.get("/stats", getAdminStats);
adminRoutes.get("/users", getAllUsers);
adminRoutes.get("/users/:userId/overview", getUserOverviewAdmin);
adminRoutes.put("/users/:userId", updateUserProfileAdmin);
adminRoutes.put("/users/:userId/roles", updateUserRole);
adminRoutes.delete("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário é obrigatório",
      });
    }
    await User.findByIdAndDelete(userId);
    res.json({
      success: true,
      message: "Usuário excluído com sucesso",
    });
  } catch (error) {
    console.error("Delete user (admin) error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir usuário",
    });
  }
});

// Cursos
adminRoutes.get("/courses", getAllCourses);
adminRoutes.post("/courses", createCourse);
adminRoutes.post("/courses/generate", generateCourseWithAI);
adminRoutes.put("/courses/:id", updateCourse);
adminRoutes.delete("/courses/:id", deleteCourse);

// Sessões de Consultoria
adminRoutes.get("/consulting-sessions", getAllConsultingSessions);
adminRoutes.post("/consulting-sessions/generate", generateConsultingSessionWithAI);
adminRoutes.post("/consulting-sessions", createConsultingSession);
adminRoutes.put("/consulting-sessions/:id", updateConsultingSession);
adminRoutes.delete("/consulting-sessions/:id", deleteConsultingSession);

// Financeiro (apenas master)
adminRoutes.get("/financial/stats", requireMaster, getFinancialStats);

// Segurança (admin e master)
adminRoutes.get("/security/logs", getSecurityLogs);

// Sistema e Hardware (admin e master)
adminRoutes.get("/system/info", getSystemInfo);

