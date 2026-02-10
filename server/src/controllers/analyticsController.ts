import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Deal } from "../models/Deal.js";
import { Campaign } from "../models/Campaign.js";
import { Ticket } from "../models/Ticket.js";
import { Post } from "../models/Post.js";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { ConsultingSession } from "../models/ConsultingSession.js";
import mongoose from "mongoose";

/**
 * Analytics avançados com comparações temporais
 */
export const getAdvancedAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = "30d", module } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Calcular datas
    const now = new Date();
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Analytics por módulo
    let analytics: any = {};

    if (!module || module === "sales") {
      // Vendas
      const currentDeals = await Deal.find({
        userId,
        createdAt: { $gte: startDate },
      }).lean();

      const previousDeals = await Deal.find({
        userId,
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }).lean();

      const currentRevenue = currentDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const previousRevenue = previousDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      analytics.sales = {
        current: {
          revenue: currentRevenue,
          deals: currentDeals.length,
          averageDealValue: currentDeals.length > 0 ? currentRevenue / currentDeals.length : 0,
        },
        previous: {
          revenue: previousRevenue,
          deals: previousDeals.length,
          averageDealValue: previousDeals.length > 0 ? previousRevenue / previousDeals.length : 0,
        },
        change: {
          revenue: revenueChange,
          deals: previousDeals.length > 0 ? ((currentDeals.length - previousDeals.length) / previousDeals.length) * 100 : 0,
        },
        trends: {
          byDay: await getDailyTrends(Deal, userId, startDate, "value"),
          byStage: await getStageDistribution(Deal, userId, startDate),
        },
      };
    }

    if (!module || module === "marketing") {
      // Marketing
      const currentCampaigns = await Campaign.find({
        userId,
        createdAt: { $gte: startDate },
      }).lean();

      const previousCampaigns = await Campaign.find({
        userId,
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }).lean();

      const currentSpent = currentCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      const previousSpent = previousCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);

      analytics.marketing = {
        current: {
          campaigns: currentCampaigns.length,
          spent: currentSpent,
          budget: currentCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        },
        previous: {
          campaigns: previousCampaigns.length,
          spent: previousSpent,
          budget: previousCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        },
        change: {
          campaigns: previousCampaigns.length > 0 ? ((currentCampaigns.length - previousCampaigns.length) / previousCampaigns.length) * 100 : 0,
          spent: previousSpent > 0 ? ((currentSpent - previousSpent) / previousSpent) * 100 : 0,
        },
        trends: {
          byDay: await getDailyTrends(Campaign, userId, startDate, "spent"),
        },
      };
    }

    if (!module || module === "support") {
      // Suporte
      const currentTickets = await Ticket.find({
        userId,
        createdAt: { $gte: startDate },
      }).lean();

      const previousTickets = await Ticket.find({
        userId,
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }).lean();

      // Calcular tempo médio de resolução para tickets resolvidos/fechados
      const calculateAverageResolutionTime = (tickets: any[]): number => {
        const resolvedTickets = tickets.filter(
          (t) => t.status === "resolved" || t.status === "closed"
        );

        if (resolvedTickets.length === 0) {
          return 0;
        }

        // Calcular tempo de resolução para cada ticket (em horas)
        const resolutionTimes = resolvedTickets.map((ticket) => {
          const createdAt = new Date(ticket.createdAt);
          const resolvedAt = new Date(ticket.updatedAt); // Usa updatedAt como momento da resolução
          const diffMs = resolvedAt.getTime() - createdAt.getTime();
          const diffHours = diffMs / (1000 * 60 * 60); // Converter para horas
          return diffHours;
        });

        // Calcular média
        const totalHours = resolutionTimes.reduce((sum, time) => sum + time, 0);
        const averageHours = totalHours / resolutionTimes.length;

        // Retornar em horas (arredondado para 2 casas decimais)
        return Math.round(averageHours * 100) / 100;
      };

      const currentAverageResolutionTime = calculateAverageResolutionTime(currentTickets);
      const previousAverageResolutionTime = calculateAverageResolutionTime(previousTickets);

      analytics.support = {
        current: {
          tickets: currentTickets.length,
          resolved: currentTickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
          averageResolutionTime: currentAverageResolutionTime, // Tempo médio em horas
        },
        previous: {
          tickets: previousTickets.length,
          resolved: previousTickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
          averageResolutionTime: previousAverageResolutionTime,
        },
        change: {
          tickets: previousTickets.length > 0 ? ((currentTickets.length - previousTickets.length) / previousTickets.length) * 100 : 0,
          resolved: previousTickets.filter((t) => t.status === "resolved" || t.status === "closed").length > 0
            ? ((currentTickets.filter((t) => t.status === "resolved" || t.status === "closed").length - previousTickets.filter((t) => t.status === "resolved" || t.status === "closed").length) /
                previousTickets.filter((t) => t.status === "resolved" || t.status === "closed").length) *
              100
            : 0,
          averageResolutionTime: previousAverageResolutionTime > 0
            ? ((currentAverageResolutionTime - previousAverageResolutionTime) / previousAverageResolutionTime) * 100
            : 0,
        },
        trends: {
          byDay: await getDailyTrends(Ticket, userId, startDate),
          byStatus: await getStatusDistribution(Ticket, userId, startDate),
        },
      };
    }

    if (!module || module === "social") {
      // Redes Sociais
      const currentPosts = await Post.find({
        userId,
        createdAt: { $gte: startDate },
      }).lean();

      const previousPosts = await Post.find({
        userId,
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }).lean();

      const currentEngagement = currentPosts.reduce(
        (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
        0
      );
      const previousEngagement = previousPosts.reduce(
        (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
        0
      );

      analytics.social = {
        current: {
          posts: currentPosts.length,
          engagement: currentEngagement,
          averageEngagement: currentPosts.length > 0 ? currentEngagement / currentPosts.length : 0,
        },
        previous: {
          posts: previousPosts.length,
          engagement: previousEngagement,
          averageEngagement: previousPosts.length > 0 ? previousEngagement / previousPosts.length : 0,
        },
        change: {
          posts: previousPosts.length > 0 ? ((currentPosts.length - previousPosts.length) / previousPosts.length) * 100 : 0,
          engagement: previousEngagement > 0 ? ((currentEngagement - previousEngagement) / previousEngagement) * 100 : 0,
        },
        trends: {
          byDay: await getDailyTrends(Post, userId, startDate),
          byPlatform: await getPlatformDistribution(Post, userId, startDate),
        },
      };
    }

    if (!module || module === "academy") {
      // Academy
      const currentEnrollments = await Enrollment.find({
        userId,
        createdAt: { $gte: startDate },
      })
        .populate("courseId")
        .lean();

      const previousEnrollments = await Enrollment.find({
        userId,
        createdAt: { $gte: previousStartDate, $lt: startDate },
      })
        .populate("courseId")
        .lean();

      analytics.academy = {
        current: {
          enrollments: currentEnrollments.length,
          completed: currentEnrollments.filter((e: any) => e.completed).length,
        },
        previous: {
          enrollments: previousEnrollments.length,
          completed: previousEnrollments.filter((e: any) => e.completed).length,
        },
        change: {
          enrollments:
            previousEnrollments.length > 0 ? ((currentEnrollments.length - previousEnrollments.length) / previousEnrollments.length) * 100 : 0,
        },
        trends: {
          byDay: await getDailyTrends(Enrollment, userId, startDate),
        },
      };
    }

    res.json({
      success: true,
      analytics,
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar analytics",
    });
  }
};

// Funções auxiliares
async function getDailyTrends(Model: any, userId: string, startDate: Date, valueField?: string) {
  const trends = await Model.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
        ...(valueField && { total: { $sum: `$${valueField}` } }),
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return trends.map((t: any) => ({
    date: t._id,
    count: t.count,
    ...(valueField && { total: t.total || 0 }),
  }));
}

async function getStageDistribution(Model: any, userId: string, startDate: Date) {
  const distribution = await Model.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$stage",
        count: { $sum: 1 },
        totalValue: { $sum: "$value" },
      },
    },
  ]);

  return distribution.map((d: any) => ({
    stage: d._id,
    count: d.count,
    totalValue: d.totalValue || 0,
  }));
}

async function getStatusDistribution(Model: any, userId: string, startDate: Date) {
  const distribution = await Model.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return distribution.map((d: any) => ({
    status: d._id,
    count: d.count,
  }));
}

async function getPlatformDistribution(Model: any, userId: string, startDate: Date) {
  const distribution = await Model.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$platform",
        count: { $sum: 1 },
      },
    },
  ]);

  return distribution.map((d: any) => ({
    platform: d._id,
    count: d.count,
  }));
}

