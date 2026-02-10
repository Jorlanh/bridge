import { Router } from "express";
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  getTasks,
  createTask,
  updateTask,
  getChecklists,
  createChecklist,
  updateChecklist,
  getProcessesStats,
} from "../controllers/processesController.js";
import { authenticate } from "../middleware/auth.js";

export const processesRoutes = Router();

// Todas as rotas requerem autenticação
processesRoutes.get("/workflows", authenticate, getWorkflows);
processesRoutes.post("/workflows", authenticate, createWorkflow);
processesRoutes.put("/workflows/:id", authenticate, updateWorkflow);
processesRoutes.get("/tasks", authenticate, getTasks);
processesRoutes.post("/tasks", authenticate, createTask);
processesRoutes.put("/tasks/:id", authenticate, updateTask);
processesRoutes.get("/checklists", authenticate, getChecklists);
processesRoutes.post("/checklists", authenticate, createChecklist);
processesRoutes.put("/checklists/:id", authenticate, updateChecklist);
processesRoutes.get("/stats", authenticate, getProcessesStats);






