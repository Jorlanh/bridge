import { Router } from "express";
import { authenticate, isMaster } from "../middleware/auth.js";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { createMongoBackup, restoreMongoBackup, listBackups } from "../utils/backup.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const backupRoutes = Router();

backupRoutes.use(authenticate);
backupRoutes.use(apiLimiter);

// Apenas master pode acessar backups
backupRoutes.use((req: AuthRequest, res: Response, next) => {
  if (!isMaster(req)) {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas master pode acessar backups.",
    });
  }
  next();
});

// Criar backup
backupRoutes.post("/create", async (req: AuthRequest, res: Response) => {
  try {
    const mongodbUri = process.env.DATABASE_URL;
    if (!mongodbUri) {
      return res.status(500).json({
        success: false,
        message: "DATABASE_URL não configurada",
      });
    }

    const backupDir = process.env.BACKUP_DIR || "./backups";
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || "30");

    const result = await createMongoBackup({
      mongodbUri,
      backupDir,
      retentionDays,
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Backup criado com sucesso",
        filePath: result.filePath,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || "Erro ao criar backup",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar backup",
    });
  }
});

// Listar backups
backupRoutes.get("/list", async (req: AuthRequest, res: Response) => {
  try {
    const backupDir = process.env.BACKUP_DIR || "./backups";
    const backups = await listBackups(backupDir);

    res.json({
      success: true,
      backups: backups.map((b) => ({
        name: b.name,
        size: b.size,
        sizeMB: (b.size / 1024 / 1024).toFixed(2),
        date: b.date,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar backups",
    });
  }
});

// Restaurar backup
backupRoutes.post("/restore", async (req: AuthRequest, res: Response) => {
  try {
    const { backupName } = req.body;

    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: "Nome do backup é obrigatório",
      });
    }

    const mongodbUri = process.env.DATABASE_URL;
    if (!mongodbUri) {
      return res.status(500).json({
        success: false,
        message: "DATABASE_URL não configurada",
      });
    }

    const backupDir = process.env.BACKUP_DIR || "./backups";
    const path = require("path");
    const backupPath = path.join(backupDir, backupName);

    const result = await restoreMongoBackup(backupPath, mongodbUri);

    if (result.success) {
      res.json({
        success: true,
        message: "Backup restaurado com sucesso",
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || "Erro ao restaurar backup",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao restaurar backup",
    });
  }
});

export { backupRoutes };

