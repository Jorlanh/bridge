import { Response } from "express";
import { AuthRequest, isAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";

// Buscar todos os usuários (apenas admin)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Verificar se usuário é admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem visualizar todos os usuários.",
      });
    }

    const users = await User.find().select("-password").populate("roles", "name").sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users.map(user => {
        const roles = (user.roles as any[])?.map((r: any) => r?.name || r) || [];
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          company: user.company,
          avatar: user.avatar,
          roles,
          createdAt: user.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
};

// Buscar logs de atividade
export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log._id.toString(),
        user: log.user,
        action: log.action,
        ip: log.ip,
        status: log.status,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar logs",
    });
  }
};

// Criar log de atividade
export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { action, ip, status } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    const log = new ActivityLog({
      user: user.name,
      action: action || "Ação realizada",
      ip: ip || req.ip || "unknown",
      status: status || "success",
      userId: req.userId,
    });

    await log.save();

    res.status(201).json({
      success: true,
      log: {
        id: log._id.toString(),
        user: log.user,
        action: log.action,
        ip: log.ip,
        status: log.status,
        createdAt: log.createdAt,
      },
    });
  } catch (error) {
    console.error("Create activity log error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar log",
    });
  }
};

// Estatísticas de segurança
export const getSecurityStats = async (req: AuthRequest, res: Response) => {
  try {
    // Se for admin, buscar todas as estatísticas; senão, apenas do usuário
    const isUserAdmin = isAdmin(req);
    
    const users = isUserAdmin ? await User.find() : [req.user];
    const logs = isUserAdmin 
      ? await ActivityLog.find().sort({ createdAt: -1 }).limit(1000)
      : await ActivityLog.find({ userId: req.userId });
    
    const activeUsers = users.length;
    const failedLogins = logs.filter(l => l.status === "failed").length;
    const totalLogins = logs.length;
    const recentLogins = logs.filter(l => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return l.createdAt >= dayAgo;
    }).length;

    // Alertas de segurança (apenas para admin)
    const alerts = isUserAdmin ? logs.filter(l => l.status === "failed").slice(0, 10).map(l => ({
      id: l._id.toString(),
      type: "failed_login",
      message: `Tentativa de login falhada de ${l.user}`,
      severity: "high",
      resolved: false,
      createdAt: l.createdAt,
    })) : [];

    res.json({
      success: true,
      stats: {
        activeUsers,
        failedLogins,
        totalLogins,
        recentLogins,
        loginsToday: recentLogins,
        loginsChange: 0, // Pode ser calculado depois
        securityLevel: failedLogins > 10 ? "Baixo" : failedLogins > 5 ? "Médio" : "Alto",
        alerts,
      },
    });
  } catch (error) {
    console.error("Get security stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};






