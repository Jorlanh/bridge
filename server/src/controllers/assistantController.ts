import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

// Schema de validação
const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "A mensagem não pode estar vazia")
    .max(2000, "A mensagem deve ter no máximo 2000 caracteres")
    .trim(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

/**
 * Envia mensagem ao assistente e recebe resposta
 */
export const chatWithAssistant = async (req: AuthRequest, res: Response) => {
  try {
    const data = chatMessageSchema.parse(req.body);

    const { generateAssistantReply } = await import("../utils/gemini.js");
    const result = await generateAssistantReply(
      data.message,
      data.conversationHistory
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao processar mensagem",
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

    console.error("Chat assistant error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar mensagem",
    });
  }
};




