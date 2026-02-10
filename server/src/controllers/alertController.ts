import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { AlertRule } from "../models/AlertRule.js";

// Schemas de validação
const createAlertRuleSchema = z.object({
  name: z
    .string()
    .min(2, "O nome do alerta deve ter no mínimo 2 caracteres")
    .max(100, "O nome do alerta deve ter no máximo 100 caracteres")
    .trim(),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres")
    .trim()
    .optional(),
  module: z.enum(["marketing", "sales", "support", "social", "processes", "academy", "dashboard"], {
    errorMap: () => ({ message: "Módulo inválido" }),
  }),
  condition: z.object({
    field: z.string().min(1, "O campo é obrigatório"),
    operator: z.enum(["equals", "greater_than", "less_than", "contains", "changed", "reached"]),
    value: z.any().optional(),
  }),
  triggerFrequency: z.enum(["once", "always", "daily", "weekly"]).default("always"),
  enabled: z.boolean().default(true),
  notificationChannels: z.object({
    inApp: z.boolean().default(true),
    push: z.boolean().default(true),
    email: z.boolean().default(false),
  }).default({
    inApp: true,
    push: true,
    email: false,
  }),
});

const updateAlertRuleSchema = createAlertRuleSchema.partial();

// Buscar todas as regras de alerta do usuário
export const getAlertRules = async (req: AuthRequest, res: Response) => {
  try {
    const { module } = req.query;
    const query: any = { userId: req.userId };
    
    if (module) {
      query.module = module;
    }

    const alertRules = await AlertRule.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      alertRules: alertRules.map((rule) => ({
        id: rule._id.toString(),
        name: rule.name,
        description: rule.description,
        module: rule.module,
        condition: rule.condition,
        triggerFrequency: rule.triggerFrequency,
        enabled: rule.enabled,
        notificationChannels: rule.notificationChannels,
        lastTriggered: rule.lastTriggered,
        triggerCount: rule.triggerCount,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get alert rules error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar regras de alerta",
    });
  }
};

// Criar nova regra de alerta
export const createAlertRule = async (req: AuthRequest, res: Response) => {
  try {
    const data = createAlertRuleSchema.parse(req.body);

    const alertRule = await AlertRule.create({
      ...data,
      userId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Regra de alerta criada com sucesso",
      alertRule: {
        id: alertRule._id.toString(),
        name: alertRule.name,
        description: alertRule.description,
        module: alertRule.module,
        condition: alertRule.condition,
        triggerFrequency: alertRule.triggerFrequency,
        enabled: alertRule.enabled,
        notificationChannels: alertRule.notificationChannels,
        lastTriggered: alertRule.lastTriggered,
        triggerCount: alertRule.triggerCount,
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

    console.error("Create alert rule error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar regra de alerta",
    });
  }
};

// Atualizar regra de alerta
export const updateAlertRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateAlertRuleSchema.parse(req.body);

    const alertRule = await AlertRule.findOne({ _id: id, userId: req.userId });

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        message: "Regra de alerta não encontrada",
      });
    }

    Object.assign(alertRule, data);
    await alertRule.save();

    res.json({
      success: true,
      message: "Regra de alerta atualizada com sucesso",
      alertRule: {
        id: alertRule._id.toString(),
        name: alertRule.name,
        description: alertRule.description,
        module: alertRule.module,
        condition: alertRule.condition,
        triggerFrequency: alertRule.triggerFrequency,
        enabled: alertRule.enabled,
        notificationChannels: alertRule.notificationChannels,
        lastTriggered: alertRule.lastTriggered,
        triggerCount: alertRule.triggerCount,
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

    console.error("Update alert rule error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar regra de alerta",
    });
  }
};

// Deletar regra de alerta
export const deleteAlertRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alertRule = await AlertRule.findOneAndDelete({ _id: id, userId: req.userId });

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        message: "Regra de alerta não encontrada",
      });
    }

    res.json({
      success: true,
      message: "Regra de alerta deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete alert rule error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar regra de alerta",
    });
  }
};

// Alternar estado enabled/disabled
export const toggleAlertRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alertRule = await AlertRule.findOne({ _id: id, userId: req.userId });

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        message: "Regra de alerta não encontrada",
      });
    }

    alertRule.enabled = !alertRule.enabled;
    await alertRule.save();

    res.json({
      success: true,
      message: `Regra de alerta ${alertRule.enabled ? "ativada" : "desativada"} com sucesso`,
      alertRule: {
        id: alertRule._id.toString(),
        enabled: alertRule.enabled,
      },
    });
  } catch (error) {
    console.error("Toggle alert rule error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao alternar estado da regra de alerta",
    });
  }
};





