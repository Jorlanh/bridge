import { Router } from "express";
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from "../controllers/alertController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get("/", getAlertRules);
router.post("/", createAlertRule);
router.put("/:id", updateAlertRule);
router.delete("/:id", deleteAlertRule);
router.patch("/:id/toggle", toggleAlertRule);

export default router;





