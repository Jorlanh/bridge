import { Response } from "express";
import { z } from "zod";
import { AuthRequest, isAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Enrollment } from "../models/Enrollment.js";
import { Campaign } from "../models/Campaign.js";
import { Deal } from "../models/Deal.js";
import { Ticket } from "../models/Ticket.js";
import { Workflow } from "../models/Workflow.js";
import { Post } from "../models/Post.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Role } from "../models/Role.js";

/**
 * Estatísticas gerais do sistema (apenas admin)
 */
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    // Buscar dados de todas as áreas
    const [
      totalUsers,
      activeUsers,
      campaigns,
      deals,
      tickets,
      workflows,
      posts,
      activityLogs,
      roles,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ roles: { $exists: true, $ne: [] } }),
      Campaign.find().lean(),
      Deal.find().lean(),
      Ticket.find().lean(),
      Workflow.find().lean(),
      Post.find().lean(),
      ActivityLog.find(),
      Role.countDocuments(),
    ]);

    // Calcular estatísticas
    const totalRevenue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    const totalLeads = campaigns.reduce((sum: number, c: any) => sum + (c.leads || 0), 0);
    const activeWorkflows = workflows.filter((w: any) => w.status === "active").length;
    const resolvedTickets = tickets.filter((t: any) => t.status === "resolved").length;
    const publishedPosts = posts.filter((p: any) => p.status === "published").length;

    // Atividades recentes (últimas 24h)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const recentActivities = await ActivityLog.find({
      createdAt: { $gte: dayAgo },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "name email")
      .lean();

    // Usuários por role
    const usersByRole = await User.aggregate([
      { $unwind: { path: "$roles", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "roles",
          localField: "roles",
          foreignField: "_id",
          as: "roleData",
        },
      },
      { $unwind: { path: "$roleData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$roleData.name", "sem role"] },
          count: { $sum: 1 },
        },
      },
    ]);

    // Crescimento de usuários (últimos 6 meses)
    const growthData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });
      growthData.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        users: count,
      });
    }

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole,
        },
        business: {
          totalRevenue,
          totalLeads,
          activeWorkflows,
          resolvedTickets,
          publishedPosts,
        },
        system: {
          totalCampaigns: campaigns.length,
          totalDeals: deals.length,
          totalTickets: tickets.length,
          totalWorkflows: workflows.length,
          totalPosts: posts.length,
          totalRoles: roles,
        },
        growth: growthData,
        recentActivities: recentActivities.map((log: any) => ({
          id: log._id.toString(),
          user: log.userId?.name || log.user || "Sistema",
          email: log.userId?.email,
          action: log.action,
          status: log.status,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas administrativas",
    });
  }
};

/**
 * Listar todos os usuários com detalhes (apenas admin)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const users = await User.find()
      .select("-password")
      .populate("roles", "name description")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        company: user.company,
        companyCNPJ: user.companyCNPJ,
        avatar: user.avatar,
        cpf: user.cpf,
        birthDate: user.birthDate,
        phone: user.phone,
        authProvider: user.authProvider,
        isBlocked: (user as any).isBlocked || false,
        roles: (user.roles as any[])?.map((r: any) => ({
          id: r._id?.toString(),
          name: r.name,
          description: r.description,
        })) || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
};

/**
 * Atualizar role de um usuário (apenas admin)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    // userId pode vir como parâmetro de rota (/users/:userId/roles)
    // ou no corpo da requisição por compatibilidade
    const paramUserId = req.params?.userId;
    const { userId: bodyUserId, roleIds } = req.body;
    const finalUserId = paramUserId || bodyUserId;

    if (!finalUserId || !Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        message: "userId e roleIds são obrigatórios",
      });
    }

    const user = await User.findByIdAndUpdate(
      finalUserId,
      { roles: roleIds },
      { new: true }
    )
      .select("-password")
      .populate("roles", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Role do usuário atualizada com sucesso",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: (user.roles as any[])?.map((r: any) => ({
          id: r._id?.toString(),
          name: r.name,
          description: r.description,
        })) || [],
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar role do usuário",
    });
  }
};

/**
 * Atualizar dados básicos de um usuário (apenas admin)
 */
const adminUpdateUserSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " "))
    .optional(),
  company: z
    .string()
    .max(200, "O nome da empresa deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, "Telefone inválido")
    .trim()
    .optional()
    .or(z.literal("")),
  isBlocked: z.boolean().optional(),
});

export const updateUserProfileAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário é obrigatório",
      });
    }

    const data = adminUpdateUserSchema.parse(req.body);
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.company !== undefined) {
      updateData.company = data.company?.trim() || undefined;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone || undefined;
    }
    if (data.isBlocked !== undefined) {
      updateData.isBlocked = data.isBlocked;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("roles", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Perfil do usuário atualizado com sucesso",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        avatar: user.avatar,
        roles: (user.roles as any[])?.map((r: any) => ({
          id: r._id?.toString(),
          name: r.name,
          description: r.description,
        })) || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update user profile (admin) error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar perfil do usuário",
    });
  }
};

/**
 * Visão geral de um usuário (cursos, uso da academy)
 */
export const getUserOverviewAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário é obrigatório",
      });
    }

    const [totalEnrollments, completedEnrollments, totalStudy] = await Promise.all([
      Enrollment.countDocuments({ userId }),
      Enrollment.countDocuments({ userId, progress: 100 }),
      Enrollment.aggregate([
        { $match: { userId: new (Enrollment as any).db.base.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$studyTime" } } },
      ]),
    ]);

    const totalStudyMinutes = totalStudy[0]?.total || 0;

    res.json({
      success: true,
      overview: {
        totalEnrollments,
        completedCourses: completedEnrollments,
        inProgressCourses: Math.max(totalEnrollments - completedEnrollments, 0),
        totalStudyMinutes,
      },
    });
  } catch (error) {
    console.error("Get user overview (admin) error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar visão geral do usuário",
    });
  }
};

/**
 * Buscar todos os logs de segurança do sistema (apenas admin/master)
 */
export const getSecurityLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { limit = 200, status, userId, startDate, endDate } = req.query;

    // Construir filtro
    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    // Filtro de data
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const logs = await ActivityLog.find(filter)
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Estatísticas
    const totalLogs = await ActivityLog.countDocuments(filter);
    const failedLogs = await ActivityLog.countDocuments({ ...filter, status: "failed" });
    const successLogs = await ActivityLog.countDocuments({ ...filter, status: "success" });

    // Logs por tipo de ação
    const actionTypes = await ActivityLog.aggregate([
      { $match: filter },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Análise de IPs suspeitos (múltiplas tentativas falhadas)
    const suspiciousIPs = await ActivityLog.aggregate([
      { $match: { ...filter, status: "failed" } },
      { $group: { _id: "$ip", count: { $sum: 1 }, lastAttempt: { $max: "$createdAt" } } },
      { $match: { count: { $gte: 3 } } }, // IPs com 3+ tentativas falhadas
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Usuários bloqueados
    const blockedUsers = await User.find({ isBlocked: true })
      .select("name email avatar createdAt")
      .limit(20);

    // Logs das últimas 24 horas
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const recentLogs = await ActivityLog.countDocuments({
      ...filter,
      createdAt: { $gte: last24Hours },
    });
    const recentFailed = await ActivityLog.countDocuments({
      ...filter,
      status: "failed",
      createdAt: { $gte: last24Hours },
    });

    // Logs por IP (top 10)
    const topIPs = await ActivityLog.aggregate([
      { $match: filter },
      { $group: { _id: "$ip", count: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Logs por hora (últimas 24 horas)
    const hourlyLogs = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourCount = await ActivityLog.countDocuments({
        ...filter,
        createdAt: { $gte: hourStart, $lt: hourEnd },
      });

      hourlyLogs.push({
        hour: hourStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        count: hourCount,
      });
    }

    res.json({
      success: true,
      logs: logs.map((log: any) => ({
        id: log._id.toString(),
        user: log.user,
        userId: log.userId?._id?.toString() || log.userId?.toString(),
        userEmail: (log.userId as any)?.email || null,
        userAvatar: (log.userId as any)?.avatar || null,
        action: log.action,
        ip: log.ip,
        status: log.status,
        createdAt: log.createdAt,
      })),
      stats: {
        total: totalLogs,
        failed: failedLogs,
        success: successLogs,
        recent24h: recentLogs,
        recentFailed24h: recentFailed,
        actionTypes: actionTypes.map((a: any) => ({
          action: a._id,
          count: a.count,
        })),
        suspiciousIPs: suspiciousIPs.map((ip: any) => ({
          ip: ip._id,
          attempts: ip.count,
          lastAttempt: ip.lastAttempt,
        })),
        blockedUsers: blockedUsers.map((user: any) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          blockedAt: user.updatedAt,
        })),
        topIPs: topIPs.map((ip: any) => ({
          ip: ip._id,
          total: ip.count,
          success: ip.success,
          failed: ip.failed,
        })),
        hourlyLogs,
      },
    });
  } catch (error) {
    console.error("Get security logs error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar logs de segurança",
    });
  }
};



