import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/user.js";
import { academyRoutes } from "./routes/academy.js";
import { notificationRoutes } from "./routes/notifications.js";
import { marketingRoutes } from "./routes/marketing.js";
import { salesRoutes } from "./routes/sales.js";
import { supportRoutes } from "./routes/support.js";
import { socialRoutes } from "./routes/social.js";
import { whatsappRoutes } from "./routes/whatsapp.js";
import { processesRoutes } from "./routes/processes.js";
import { securityRoutes } from "./routes/security.js";
import rolesRoutes from "./routes/roles.js";
import alertsRoutes from "./routes/alerts.js";
import reportsRoutes from "./routes/reports.js";
import { assistantRoutes } from "./routes/assistant.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { adminRoutes } from "./routes/admin.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { backupRoutes } from "./routes/backup.js";
import { paymentRoutes } from "./routes/payments.js";
import { connectDatabase } from "./config/database.js";
import { initializeSocket } from "./utils/socket.js";
import { initializePermissions } from "./utils/initializePermissions.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { initializeQueues } from "./utils/queue.js";
import { initializeAutoBackup } from "./utils/backup.js";

dotenv.config();

// Conectar ao MongoDB
connectDatabase().then(() => {
  // Inicializar permissões padrão após conexão com o banco
  initializePermissions().catch(() => {});
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware CORS - configuração para desenvolvimento
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Em desenvolvimento, sempre permitir qualquer origem
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas para produção
    const allowedOrigins = [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:3000",
      "http://192.168.1.207:8080", // IP local da rede
      process.env.FRONTEND_URL || "http://localhost:8080"
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Rate limiting global (desativado em desenvolvimento)
if (process.env.NODE_ENV === "production") {
  app.use("/api/", apiLimiter);
  console.log("🔒 Rate limiting ativado (produção)");
} else {
  console.log("🔓 Rate limiting desativado (desenvolvimento)");
}

// Sanitização de inputs
app.use(sanitizeInput);

// Log de requisições para debug (desativado em produção)
app.use((req, res, next) => {
  next();
});

// Middleware de requisições
app.use((req, res, next) => {
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Criar diretório de relatórios se não existir
const fs = await import("fs");
const reportsDir = path.join(process.cwd(), "uploads", "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/processes", processesRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "BridgeAI Hub API is running",
    database: "MongoDB"
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor"
  });
});

// Inicializar Socket.io
initializeSocket(server);

// Inicializar filas (Bull)
try {
  initializeQueues();
} catch (error) {
  // Redis não disponível - sistema continua funcionando
}

// Inicializar backup automático
if (process.env.DATABASE_URL) {
  try {
    initializeAutoBackup(
      {
        mongodbUri: process.env.DATABASE_URL,
        backupDir: process.env.BACKUP_DIR || "./backups",
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),
      },
      process.env.BACKUP_SCHEDULE || "0 2 * * *" // Diário às 2h por padrão
    );
  } catch (error) {
    // Backup automático não configurado
  }
}

// Inicializar job de refresh de tokens OAuth (executa a cada 24 horas)
import { refreshExpiringTokens } from "./utils/tokenRefresh.js";
import { initializeReportScheduler } from "./utils/reportScheduler.js";

// Aguardar conexão com MongoDB antes de iniciar os jobs
connectDatabase().then(() => {
  // Executar imediatamente após conexão
  refreshExpiringTokens().catch(() => {});
  
  // Configurar intervalo para executar a cada 24 horas
  setInterval(async () => {
    await refreshExpiringTokens();
  }, 24 * 60 * 60 * 1000); // 24 horas

  // Inicializar scheduler de relatórios
  initializeReportScheduler();
}).catch(() => {
  console.log("⚠️ Jobs não iniciados (MongoDB não conectado)");
});

server.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});

