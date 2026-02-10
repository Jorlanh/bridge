import { Router } from "express";
import {
  getReportTemplates,
  createReportTemplate,
  generateReportFile,
  downloadReport,
  deleteReportTemplate,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  executeScheduledReport,
} from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Templates
router.get("/templates", getReportTemplates);
router.post("/templates", createReportTemplate);
router.delete("/templates/:id", deleteReportTemplate);

// Geração de relatórios
router.post("/generate", generateReportFile);
router.get("/download*", downloadReport);

// Relatórios agendados
router.get("/scheduled", getScheduledReports);
router.post("/scheduled", createScheduledReport);
router.put("/scheduled/:id", updateScheduledReport);
router.delete("/scheduled/:id", deleteScheduledReport);
router.post("/scheduled/:id/execute", executeScheduledReport);

export default router;

