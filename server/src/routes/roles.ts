import { Router } from "express";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRolesToUser,
  getUserRoles,
} from "../controllers/roleController.js";
import { authenticate, requirePermission } from "../middleware/auth.js";

const router = Router();

// Todas as rotas requerem autenticação e permissão de gestão de usuários
router.use(authenticate);
router.use(requirePermission("users:manage"));

// Rotas de roles
router.get("/", getRoles);
router.get("/permissions", getPermissions);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

// Rotas de atribuição de roles
router.post("/assign", assignRolesToUser);
router.get("/user/:userId", getUserRoles);

export default router;





