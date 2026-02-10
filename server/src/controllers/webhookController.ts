import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import crypto from "crypto";
import mongoose from "mongoose";

// Schema de Webhook
const WebhookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secret: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastTriggered: Date,
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "webhooks",
  }
);

export const Webhook = mongoose.models.Webhook || mongoose.model("Webhook", WebhookSchema);

// Schemas de validação
const createWebhookSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url("URL inválida"),
  events: z.array(z.string()).min(1, "Selecione pelo menos um evento"),
});

const updateWebhookSchema = createWebhookSchema.partial();

// Criar webhook
export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const data = createWebhookSchema.parse(req.body);
    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = new Webhook({
      ...data,
      userId: req.userId,
      secret,
    });

    await webhook.save();

    res.status(201).json({
      success: true,
      webhook: {
        id: webhook._id.toString(),
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        secret, // Retornar secret apenas na criação
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao criar webhook",
    });
  }
};

// Listar webhooks
export const getWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const webhooks = await Webhook.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      webhooks: webhooks.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        url: w.url,
        events: w.events,
        active: w.active,
        lastTriggered: w.lastTriggered,
        successCount: w.successCount,
        failureCount: w.failureCount,
        createdAt: w.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar webhooks",
    });
  }
};

// Atualizar webhook
export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateWebhookSchema.parse(req.body);

    const webhook = await Webhook.findOne({ _id: id, userId: req.userId });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook não encontrado",
      });
    }

    Object.assign(webhook, data);
    await webhook.save();

    res.json({
      success: true,
      webhook: {
        id: webhook._id.toString(),
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar webhook",
    });
  }
};

// Deletar webhook
export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findOneAndDelete({ _id: id, userId: req.userId });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Webhook deletado com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao deletar webhook",
    });
  }
};

// Testar webhook
export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findOne({ _id: id, userId: req.userId });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook não encontrado",
      });
    }

    // Disparar webhook de teste
    await triggerWebhook(webhook, {
      event: "webhook.test",
      data: { message: "Teste de webhook" },
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Webhook testado com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao testar webhook",
    });
  }
};

// Função para disparar webhook
export async function triggerWebhook(webhook: any, payload: any): Promise<boolean> {
  try {
    if (!webhook.active) return false;

    // Criar assinatura HMAC
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    // Fazer requisição HTTP
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // Timeout de 10s
    });

    const success = response.ok;
    
    // Atualizar estatísticas
    if (success) {
      webhook.successCount += 1;
    } else {
      webhook.failureCount += 1;
    }
    webhook.lastTriggered = new Date();
    await webhook.save();

    return success;
  } catch (error) {
    webhook.failureCount += 1;
    webhook.lastTriggered = new Date();
    await webhook.save();
    return false;
  }
}

// Disparar webhooks para um evento
export async function triggerWebhooksForEvent(userId: string, event: string, data: any): Promise<void> {
  try {
    const webhooks = await Webhook.find({
      userId,
      active: true,
      events: event,
    });

    for (const webhook of webhooks) {
      await triggerWebhook(webhook, {
        event,
        data,
        timestamp: new Date(),
      });
    }
  } catch (error) {
  }
}

