import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { Deal } from "../models/Deal.js";
import { FollowUp } from "../models/FollowUp.js";
import { createNotification } from "../utils/notifications.js";

// Schemas de validação
const createDealSchema = z.object({
  company: z
    .string()
    .min(2, "O nome da empresa deve ter no mínimo 2 caracteres")
    .max(200, "O nome da empresa deve ter no máximo 200 caracteres")
    .trim(),
  value: z
    .number()
    .positive("O valor deve ser um número positivo")
    .min(0.01, "O valor deve ser maior que zero"),
  stage: z
    .enum(["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechamento"], {
      errorMap: () => ({ message: "Estágio inválido" }),
    }),
  probability: z
    .number()
    .min(0, "A probabilidade não pode ser negativa")
    .max(100, "A probabilidade não pode ser maior que 100%")
    .optional()
    .default(0),
  owner: z
    .string()
    .min(2, "O responsável deve ter no mínimo 2 caracteres")
    .max(100, "O responsável deve ter no máximo 100 caracteres")
    .trim(),
  nextAction: z
    .string()
    .datetime("Data da próxima ação inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato YYYY-MM-DD"))
    .optional(),
});

const updateDealSchema = z.object({
  company: z
    .string()
    .min(2, "O nome da empresa deve ter no mínimo 2 caracteres")
    .max(200, "O nome da empresa deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
  value: z
    .number()
    .positive("O valor deve ser um número positivo")
    .optional(),
  stage: z
    .enum(["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechamento"])
    .optional(),
  probability: z
    .number()
    .min(0, "A probabilidade não pode ser negativa")
    .max(100, "A probabilidade não pode ser maior que 100%")
    .optional(),
  owner: z
    .string()
    .min(2, "O responsável deve ter no mínimo 2 caracteres")
    .max(100, "O responsável deve ter no máximo 100 caracteres")
    .trim()
    .optional(),
  nextAction: z
    .string()
    .datetime("Data da próxima ação inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"))
    .optional(),
});

const createFollowUpSchema = z.object({
  type: z
    .string()
    .min(2, "O tipo deve ter no mínimo 2 caracteres")
    .max(50, "O tipo deve ter no máximo 50 caracteres")
    .trim(),
  contact: z
    .string()
    .min(2, "O contato deve ter no mínimo 2 caracteres")
    .max(200, "O contato deve ter no máximo 200 caracteres")
    .trim(),
  date: z
    .string()
    .datetime("Data inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato YYYY-MM-DD")),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:MM"),
});

const generateSalesScriptSchema = z.object({
  type: z
    .string()
    .min(2, "O tipo deve ter no mínimo 2 caracteres")
    .trim(),
  context: z
    .string()
    .max(1000, "O contexto deve ter no máximo 1000 caracteres")
    .trim()
    .optional(),
});

// Buscar todas as oportunidades
export const getDeals = async (req: AuthRequest, res: Response) => {
  try {
    const deals = await Deal.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      deals: deals.map(deal => ({
        id: deal._id.toString(),
        company: deal.company,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        owner: deal.owner,
        nextAction: deal.nextAction,
        daysInStage: deal.daysInStage,
      })),
    });
  } catch (error) {
    console.error("Get deals error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar oportunidades",
    });
  }
};

// Criar nova oportunidade
export const createDeal = async (req: AuthRequest, res: Response) => {
  try {
    const data = createDealSchema.parse(req.body);

    const deal = new Deal({
      company: data.company,
      value: data.value,
      stage: data.stage,
      probability: data.probability || 0,
      owner: data.owner,
      nextAction: data.nextAction ? new Date(data.nextAction) : undefined,
      userId: req.userId,
    });

    await deal.save();

    res.status(201).json({
      success: true,
      deal: {
        id: deal._id.toString(),
        company: deal.company,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        owner: deal.owner,
        nextAction: deal.nextAction,
        daysInStage: deal.daysInStage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Create deal error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar oportunidade",
    });
  }
};

// Atualizar oportunidade
export const updateDeal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateDealSchema.parse(req.body);

    const deal = await Deal.findOne({ _id: id, userId: req.userId });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Oportunidade não encontrada",
      });
    }

    if (data.company !== undefined) deal.company = data.company;
    if (data.value !== undefined) deal.value = data.value;
    if (data.stage !== undefined) deal.stage = data.stage;
    if (data.probability !== undefined) deal.probability = data.probability;
    if (data.owner !== undefined) deal.owner = data.owner;
    if (data.nextAction !== undefined) deal.nextAction = new Date(data.nextAction);

    await deal.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Oportunidade atualizada",
      message: `A oportunidade "${deal.company}" foi atualizada com sucesso!`,
      type: "success",
      link: "/dashboard/sales",
    });

    res.json({
      success: true,
      deal: {
        id: deal._id.toString(),
        company: deal.company,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        owner: deal.owner,
        nextAction: deal.nextAction,
        daysInStage: deal.daysInStage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Update deal error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar oportunidade",
    });
  }
};

// Deletar oportunidade
export const deleteDeal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deal = await Deal.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Oportunidade não encontrada",
      });
    }

    res.json({
      success: true,
      message: "Oportunidade deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar oportunidade",
    });
  }
};

// Buscar follow-ups
export const getFollowUps = async (req: AuthRequest, res: Response) => {
  try {
    const followUps = await FollowUp.find({ userId: req.userId })
      .sort({ date: 1, time: 1 });
    
    res.json({
      success: true,
      followUps: followUps.map(fu => ({
        id: fu._id.toString(),
        type: fu.type,
        contact: fu.contact,
        date: fu.date,
        time: fu.time,
        status: fu.status,
      })),
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar follow-ups",
    });
  }
};

// Criar follow-up
export const createFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const data = createFollowUpSchema.parse(req.body);

    const followUp = new FollowUp({
      type: data.type,
      contact: data.contact,
      date: new Date(data.date),
      time: data.time,
      userId: req.userId,
    });

    await followUp.save();

    res.status(201).json({
      success: true,
      followUp: {
        id: followUp._id.toString(),
        type: followUp.type,
        contact: followUp.contact,
        date: followUp.date,
        time: followUp.time,
        status: followUp.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Create follow-up error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar follow-up",
    });
  }
};

// Gerar script de vendas com IA
export const generateSalesScript = async (req: AuthRequest, res: Response) => {
  try {
    const data = generateSalesScriptSchema.parse(req.body);

    const { generateSalesScript: generateScript } = await import("../utils/gemini.js");
    const scriptType = data.type as "prospecção" | "apresentação" | "objeções" | "fechamento";
    const result = await generateScript(scriptType, data.context);

    if (!result.success) {
      // Se for erro de quota, retornar status 429
      const isQuotaError = result.error?.includes("Limite de requisições") || 
                          result.error?.includes("quota") ||
                          result.error?.includes("rate limit");
      
      return res.status(isQuotaError ? 429 : 500).json({
        success: false,
        message: result.error || "Erro ao gerar script. Tente novamente em alguns instantes.",
      });
    }

    res.json({
      success: true,
      script: result.content,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Generate sales script error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar script",
    });
  }
};

// Estatísticas de vendas
export const getSalesStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Buscar todos os deals do usuário
    const allDeals = await Deal.find({ userId: req.userId });
    
    // Deals do mês atual (fechados)
    const currentMonthDeals = allDeals.filter(d => {
      const dealDate = new Date(d.updatedAt || d.createdAt);
      return dealDate >= startOfMonth && 
             (d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho");
    });
    const monthlyRevenue = currentMonthDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    
    // Deals do mês anterior (fechados)
    const lastMonthDeals = allDeals.filter(d => {
      const dealDate = new Date(d.updatedAt || d.createdAt);
      return dealDate >= startOfLastMonth && 
             dealDate <= endOfLastMonth &&
             (d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho");
    });
    const lastMonthRevenue = lastMonthDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10
      : monthlyRevenue > 0 ? 100 : 0;
    
    // Taxa de conversão (deals fechados / total)
    const closedDeals = allDeals.filter(d => 
      d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho"
    );
    const conversionRate = allDeals.length > 0
      ? Math.round((closedDeals.length / allDeals.length) * 100 * 10) / 10
      : 0;
    
    // Taxa de conversão do mês anterior
    const lastMonthAllDeals = allDeals.filter(d => {
      const dealDate = new Date(d.createdAt);
      return dealDate >= startOfLastMonth && dealDate <= endOfLastMonth;
    });
    const lastMonthClosedDeals = lastMonthAllDeals.filter(d => 
      d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho"
    );
    const lastMonthConversionRate = lastMonthAllDeals.length > 0
      ? (lastMonthClosedDeals.length / lastMonthAllDeals.length) * 100
      : 0;
    const conversionChange = lastMonthConversionRate > 0
      ? Math.round(((conversionRate - lastMonthConversionRate) / lastMonthConversionRate) * 100 * 10) / 10
      : conversionRate > 0 ? 100 : 0;
    
    // Ticket médio
    const averageTicket = allDeals.length > 0
      ? Math.round(allDeals.reduce((sum, d) => sum + (d.value || 0), 0) / allDeals.length)
      : 0;
    
    // Ticket médio do mês anterior
    const lastMonthAverageTicket = lastMonthAllDeals.length > 0
      ? lastMonthAllDeals.reduce((sum, d) => sum + (d.value || 0), 0) / lastMonthAllDeals.length
      : 0;
    const ticketChange = lastMonthAverageTicket > 0
      ? Math.round(((averageTicket - lastMonthAverageTicket) / lastMonthAverageTicket) * 100 * 10) / 10
      : averageTicket > 0 ? 100 : 0;
    
    // Novas oportunidades esta semana
    const newDeals = allDeals.filter(d => {
      const dealDate = new Date(d.createdAt);
      return dealDate >= startOfWeek;
    }).length;

    res.json({
      success: true,
      stats: {
        monthlyRevenue,
        revenueChange,
        conversionRate,
        conversionChange,
        averageTicket,
        ticketChange,
        newDeals,
      },
    });
  } catch (error) {
    console.error("Get sales stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};


