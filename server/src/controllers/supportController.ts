import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { Ticket } from "../models/Ticket.js";
import { QuickReply } from "../models/QuickReply.js";
import { createNotification } from "../utils/notifications.js";

// Schemas de validação
const createTicketSchema = z.object({
  subject: z
    .string()
    .min(3, "O assunto deve ter no mínimo 3 caracteres")
    .max(200, "O assunto deve ter no máximo 200 caracteres")
    .trim(),
  customer: z
    .string()
    .min(2, "O cliente deve ter no mínimo 2 caracteres")
    .max(200, "O cliente deve ter no máximo 200 caracteres")
    .trim(),
  priority: z
    .enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Prioridade inválida. Use: low, medium ou high" }),
    })
    .optional()
    .default("medium"),
  assignedTo: z
    .string()
    .min(2, "O responsável deve ter no mínimo 2 caracteres")
    .max(100, "O responsável deve ter no máximo 100 caracteres")
    .trim(),
});

const updateTicketSchema = z.object({
  subject: z
    .string()
    .min(3, "O assunto deve ter no mínimo 3 caracteres")
    .max(200, "O assunto deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
  customer: z
    .string()
    .min(2, "O cliente deve ter no mínimo 2 caracteres")
    .max(200, "O cliente deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
  status: z
    .enum(["open", "in_progress", "resolved", "closed"], {
      errorMap: () => ({ message: "Status inválido" }),
    })
    .optional(),
  priority: z
    .enum(["low", "medium", "high"])
    .optional(),
  assignedTo: z
    .string()
    .min(2, "O responsável deve ter no mínimo 2 caracteres")
    .max(100, "O responsável deve ter no máximo 100 caracteres")
    .trim()
    .optional(),
  messages: z
    .number()
    .min(0, "O número de mensagens não pode ser negativo")
    .optional(),
});

const createQuickReplySchema = z.object({
  title: z
    .string()
    .min(2, "O título deve ter no mínimo 2 caracteres")
    .max(100, "O título deve ter no máximo 100 caracteres")
    .trim(),
  text: z
    .string()
    .min(5, "O texto deve ter no mínimo 5 caracteres")
    .max(2000, "O texto deve ter no máximo 2000 caracteres")
    .trim(),
});

const generateQuickReplySchema = z.object({
  situation: z
    .string()
    .min(3, "A situação deve ter no mínimo 3 caracteres")
    .max(500, "A situação deve ter no máximo 500 caracteres")
    .trim(),
  context: z
    .string()
    .max(1000, "O contexto deve ter no máximo 1000 caracteres")
    .trim()
    .optional(),
});

// Buscar todos os tickets
export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await Ticket.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket._id.toString(),
        subject: ticket.subject,
        customer: ticket.customer,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
        messages: ticket.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tickets",
    });
  }
};

// Criar novo ticket
export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const data = createTicketSchema.parse(req.body);

    const ticket = new Ticket({
      subject: data.subject,
      customer: data.customer,
      priority: data.priority || "medium",
      assignedTo: data.assignedTo,
      userId: req.userId,
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id.toString(),
        subject: ticket.subject,
        customer: ticket.customer,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
        messages: ticket.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
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

    console.error("Create ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar ticket",
    });
  }
};

// Atualizar ticket
export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateTicketSchema.parse(req.body);

    const ticket = await Ticket.findOne({ _id: id, userId: req.userId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket não encontrado",
      });
    }

    if (data.subject !== undefined) ticket.subject = data.subject;
    if (data.customer !== undefined) ticket.customer = data.customer;
    if (data.status !== undefined) ticket.status = data.status;
    if (data.priority !== undefined) ticket.priority = data.priority;
    if (data.assignedTo !== undefined) ticket.assignedTo = data.assignedTo;
    if (data.messages !== undefined) ticket.messages = data.messages;

    await ticket.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Ticket atualizado",
      message: `O ticket "${ticket.subject}" foi atualizado com sucesso!`,
      type: "info",
      link: "/dashboard/support",
    });

    res.json({
      success: true,
      ticket: {
        id: ticket._id.toString(),
        subject: ticket.subject,
        customer: ticket.customer,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
        messages: ticket.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
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

    console.error("Update ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar ticket",
    });
  }
};

// Deletar ticket
export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOneAndDelete({ _id: id, userId: req.userId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Ticket deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar ticket",
    });
  }
};

// Buscar respostas rápidas
export const getQuickReplies = async (req: AuthRequest, res: Response) => {
  try {
    const quickReplies = await QuickReply.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      quickReplies: quickReplies.map(qr => ({
        id: qr._id.toString(),
        title: qr.title,
        text: qr.text,
      })),
    });
  } catch (error) {
    console.error("Get quick replies error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar respostas rápidas",
    });
  }
};

// Criar resposta rápida
export const createQuickReply = async (req: AuthRequest, res: Response) => {
  try {
    const data = createQuickReplySchema.parse(req.body);

    const quickReply = new QuickReply({
      title: data.title,
      text: data.text,
      userId: req.userId,
    });

    await quickReply.save();

    res.status(201).json({
      success: true,
      quickReply: {
        id: quickReply._id.toString(),
        title: quickReply.title,
        text: quickReply.text,
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

    console.error("Create quick reply error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar resposta rápida",
    });
  }
};

// Gerar resposta rápida com IA
export const generateQuickReply = async (req: AuthRequest, res: Response) => {
  try {
    const data = generateQuickReplySchema.parse(req.body);

    const { generateQuickReply: generateReply } = await import("../utils/gemini.js");
    const result = await generateReply(data.situation, data.context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao gerar resposta",
      });
    }

    res.json({
      success: true,
      reply: result.content,
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

    console.error("Generate quick reply error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar resposta",
    });
  }
};

// Processar mensagem do chatbot
export const processChatbotMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, ticketId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Mensagem é obrigatória",
      });
    }

    // Buscar ticket se fornecido
    let ticket = null;
    if (ticketId) {
      ticket = await Ticket.findOne({ _id: ticketId, userId: req.userId });
    }

    // Gerar resposta usando IA
    const { generateQuickReply } = await import("../utils/gemini.js");
    const context = ticket 
      ? `Ticket: ${ticket.subject}\nCliente: ${ticket.customer}\nStatus: ${ticket.status}\nMensagens anteriores: ${ticket.messages}`
      : undefined;
    
    const result = await generateQuickReply(message, context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao processar mensagem",
      });
    }

    // Criar ou atualizar ticket se necessário
    if (!ticket) {
      ticket = new Ticket({
        subject: message.substring(0, 100),
        customer: "Cliente via Chatbot",
        priority: "medium",
        assignedTo: "Chatbot",
        userId: req.userId,
        source: "chatbot",
        chatbotHandled: true,
        messages: 1,
      });
      await ticket.save();
    } else {
      ticket.messages += 1;
      await ticket.save();
    }

    // Verificar se a resposta resolve o problema (heurística simples)
    const resolvedKeywords = ["resolvido", "entendi", "obrigado", "perfeito", "ok", "tudo certo"];
    const resolved = resolvedKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // Verificar se precisa escalar (palavras-chave de problemas complexos)
    const escalateKeywords = ["reembolso", "cancelar", "problema crítico", "urgente", "não funciona"];
    const escalated = escalateKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (escalated && ticket) {
      ticket.status = "in_progress";
      ticket.chatbotHandled = false;
      ticket.assignedTo = "Suporte Humano";
      await ticket.save();
    }

    if (resolved && ticket) {
      ticket.status = "resolved";
      ticket.chatbotHandled = true;
      await ticket.save();
    }

    // Salvar log da conversação
    const { ChatbotLog } = await import("../models/ChatbotLog.js");
    await ChatbotLog.create({
      ticketId: ticket._id,
      userId: req.userId,
      message: message.trim(),
      response: result.content,
      source: "user",
      resolved,
      escalated,
    });

    res.json({
      success: true,
      reply: result.content,
      ticketId: ticket._id.toString(),
      resolved,
      escalated,
      ticket: {
        id: ticket._id.toString(),
        subject: ticket.subject,
        status: ticket.status,
        messages: ticket.messages,
      },
    });
  } catch (error) {
    console.error("Process chatbot message error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar mensagem do chatbot",
    });
  }
};

// Buscar logs de conversação do chatbot
export const getChatbotLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, limit = 50 } = req.query;
    
    const filter: any = { userId: req.userId };
    if (ticketId) filter.ticketId = ticketId;

    const logs = await (await import("../models/ChatbotLog.js")).ChatbotLog.find(filter)
      .populate("ticketId", "subject status")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log._id.toString(),
        ticketId: log.ticketId?.toString(),
        message: log.message,
        response: log.response,
        source: log.source,
        resolved: log.resolved,
        escalated: log.escalated,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get chatbot logs error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar logs do chatbot",
    });
  }
};

// Estatísticas de suporte
export const getSupportStats = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await Ticket.find({ userId: req.userId });
    const { ChatbotLog } = await import("../models/ChatbotLog.js");
    
    const openTickets = tickets.filter(t => t.status === "open").length;
    const resolvedTickets = tickets.filter(t => t.status === "resolved").length;
    const totalTickets = tickets.length;
    const resolutionRate = totalTickets > 0
      ? (resolvedTickets / totalTickets) * 100
      : 0;

    // Estatísticas do Chatbot
    const chatbotTickets = tickets.filter(t => t.source === "chatbot");
    const chatbotLogs = await ChatbotLog.find({ userId: req.userId });
    
    const chatbotTotalConversations = chatbotLogs.length;
    const chatbotResolved = chatbotLogs.filter(l => l.resolved).length;
    const chatbotEscalated = chatbotLogs.filter(l => l.escalated).length;
    
    // Calcular satisfação média (baseado em resoluções)
    const chatbotSatisfaction = chatbotTotalConversations > 0
      ? Math.round((chatbotResolved / chatbotTotalConversations) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        openTickets,
        resolvedTickets,
        totalTickets,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        chatbot: {
          totalConversations: chatbotTotalConversations,
          resolved: chatbotResolved,
          escalated: chatbotEscalated,
          satisfaction: chatbotSatisfaction,
        },
      },
    });
  } catch (error) {
    console.error("Get support stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};

