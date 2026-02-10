import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { ReportTemplate } from "../models/ReportTemplate.js";
import { generateReport } from "../utils/reportGenerator.js";
import { readFile } from "fs/promises";
import { join } from "path";

// Schemas de validação
const createTemplateSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres").max(100).trim(),
  description: z.string().max(500).trim().optional(),
  module: z.enum(["marketing", "sales", "support", "social", "processes", "academy", "dashboard"]),
  format: z.enum(["pdf", "excel", "csv"]),
  fields: z.array(
    z.object({
      field: z.string(),
      label: z.string(),
      type: z.enum(["text", "number", "date", "currency", "percentage"]),
      format: z.string().optional(),
    })
  ),
  filters: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum(["equals", "range", "contains"]),
        value: z.any().optional(),
      })
    )
    .optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  includeCharts: z.boolean().default(false),
});

const generateReportSchema = z.object({
  module: z.enum(["marketing", "sales", "support", "social", "processes", "academy", "dashboard"]),
  format: z.enum(["pdf", "excel", "csv"]),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  dateRange: z
    .object({
      start: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      end: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    })
    .optional(),
  templateId: z.string().optional(),
});

// Buscar templates de relatório
export const getReportTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { module } = req.query;
    const query: any = { userId: req.userId };

    if (module) {
      query.module = module;
    }

    const templates = await ReportTemplate.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      templates: templates.map((template) => ({
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        module: template.module,
        format: template.format,
        fields: template.fields,
        filters: template.filters,
        groupBy: template.groupBy,
        sortBy: template.sortBy,
        sortOrder: template.sortOrder,
        includeCharts: template.includeCharts,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get report templates error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar templates",
    });
  }
};

// Criar template de relatório
export const createReportTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const data = createTemplateSchema.parse(req.body);

    const template = await ReportTemplate.create({
      ...data,
      userId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Template criado com sucesso",
      template: {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        module: template.module,
        format: template.format,
        fields: template.fields,
        filters: template.filters,
        groupBy: template.groupBy,
        sortBy: template.sortBy,
        sortOrder: template.sortOrder,
        includeCharts: template.includeCharts,
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

    console.error("Create report template error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar template",
    });
  }
};

// Gerar relatório
export const generateReportFile = async (req: AuthRequest, res: Response) => {
  try {
    const data = generateReportSchema.parse(req.body);

    // Se templateId fornecido, carregar template
    let template = null;
    if (data.templateId) {
      template = await ReportTemplate.findOne({ _id: data.templateId, userId: req.userId });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template não encontrado",
        });
      }
    }

    // Preparar opções do relatório
    const options = {
      module: data.module,
      format: data.format,
      fields: data.fields || (template?.fields.map((f) => f.field) || []),
      filters: data.filters || {},
      dateRange: data.dateRange
        ? {
            start: new Date(data.dateRange.start),
            end: new Date(data.dateRange.end),
          }
        : undefined,
      userId: req.userId!,
    };

    // Gerar relatório
    const filePath = await generateReport(options);

    // Retornar URL do arquivo
    res.json({
      success: true,
      message: "Relatório gerado com sucesso",
      fileUrl: filePath,
      downloadUrl: `/api/reports/download${filePath}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Generate report error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório",
    });
  }
};

// Download de arquivo de relatório
export const downloadReport = async (req: AuthRequest, res: Response) => {
  try {
    // Extrair caminho do query string ou params
    const filepath = req.path.replace("/api/reports/download", "");
    const fullPath = join(process.cwd(), filepath);

    // Verificar se o arquivo existe e está no diretório permitido
    if (!fullPath.startsWith(join(process.cwd(), "uploads", "reports"))) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado",
      });
    }

    const fileBuffer = await readFile(fullPath);
    const filename = fullPath.split("/").pop() || "report.pdf";

    // Determinar content-type baseado na extensão
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Download report error:", error);
    res.status(404).json({
      success: false,
      message: "Arquivo não encontrado",
    });
  }
};

// Deletar template
export const deleteReportTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await ReportTemplate.findOneAndDelete({ _id: id, userId: req.userId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Template deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete report template error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar template",
    });
  }
};

// ========== RELATÓRIOS AGENDADOS ==========

import { ScheduledReport } from "../models/ScheduledReport.js";
import { calculateNextRun } from "../utils/reportScheduler.js";

const createScheduledReportSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  templateId: z.string().optional(),
  module: z.enum(["marketing", "sales", "support", "social", "processes", "academy", "dashboard"]),
  format: z.enum(["pdf", "excel", "csv"]),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "custom"]),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    cronExpression: z.string().optional(),
  }),
  emailRecipients: z.array(z.string().email()).min(1),
});

// Listar relatórios agendados
export const getScheduledReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await ScheduledReport.find({ userId: req.userId })
      .populate("templateId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports: reports.map((report) => ({
        id: report._id.toString(),
        name: report.name,
        description: report.description,
        templateId: report.templateId?.toString(),
        module: report.module,
        format: report.format,
        schedule: report.schedule,
        emailRecipients: report.emailRecipients,
        enabled: report.enabled,
        lastRun: report.lastRun,
        nextRun: report.nextRun,
        runCount: report.runCount,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get scheduled reports error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar relatórios agendados",
    });
  }
};

// Criar relatório agendado
export const createScheduledReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = createScheduledReportSchema.parse(req.body);

    // Verificar template se fornecido
    if (data.templateId) {
      const template = await ReportTemplate.findOne({ _id: data.templateId, userId: req.userId });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template não encontrado",
        });
      }
    }

    // Calcular próxima execução
    const nextRun = calculateNextRun(data.schedule);

    const scheduledReport = await ScheduledReport.create({
      ...data,
      userId: req.userId,
      nextRun,
    });

    res.status(201).json({
      success: true,
      message: "Relatório agendado criado com sucesso",
      report: {
        id: scheduledReport._id.toString(),
        name: scheduledReport.name,
        description: scheduledReport.description,
        templateId: scheduledReport.templateId?.toString(),
        module: scheduledReport.module,
        format: scheduledReport.format,
        schedule: scheduledReport.schedule,
        emailRecipients: scheduledReport.emailRecipients,
        enabled: scheduledReport.enabled,
        nextRun: scheduledReport.nextRun,
        createdAt: scheduledReport.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Create scheduled report error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar relatório agendado",
    });
  }
};

// Atualizar relatório agendado
export const updateScheduledReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createScheduledReportSchema.partial().parse(req.body);

    const scheduledReport = await ScheduledReport.findOne({ _id: id, userId: req.userId });

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: "Relatório agendado não encontrado",
      });
    }

    // Atualizar campos
    Object.assign(scheduledReport, data);

    // Recalcular nextRun se schedule mudou
    if (data.schedule) {
      scheduledReport.nextRun = calculateNextRun(scheduledReport.schedule);
    }

    await scheduledReport.save();

    res.json({
      success: true,
      message: "Relatório agendado atualizado com sucesso",
      report: {
        id: scheduledReport._id.toString(),
        name: scheduledReport.name,
        description: scheduledReport.description,
        templateId: scheduledReport.templateId?.toString(),
        module: scheduledReport.module,
        format: scheduledReport.format,
        schedule: scheduledReport.schedule,
        emailRecipients: scheduledReport.emailRecipients,
        enabled: scheduledReport.enabled,
        nextRun: scheduledReport.nextRun,
        updatedAt: scheduledReport.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Update scheduled report error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar relatório agendado",
    });
  }
};

// Deletar relatório agendado
export const deleteScheduledReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const scheduledReport = await ScheduledReport.findOneAndDelete({ _id: id, userId: req.userId });

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: "Relatório agendado não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Relatório agendado deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete scheduled report error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar relatório agendado",
    });
  }
};

// Executar relatório agendado manualmente
export const executeScheduledReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const scheduledReport = await ScheduledReport.findOne({ _id: id, userId: req.userId });

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: "Relatório agendado não encontrado",
      });
    }

    const { executeScheduledReport: executeReport } = await import("../utils/reportScheduler.js");
    const success = await executeReport(scheduledReport);

    if (success) {
      res.json({
        success: true,
        message: "Relatório executado e enviado com sucesso",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao executar relatório",
      });
    }
  } catch (error) {
    console.error("Execute scheduled report error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao executar relatório",
    });
  }
};

