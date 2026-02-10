import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppMessage extends Document {
  userId: mongoose.Types.ObjectId;
  connectionId: mongoose.Types.ObjectId; // Referência ao WhatsAppConnection
  messageId: string; // ID único da mensagem no WhatsApp
  from: string; // Número de quem enviou (formato internacional)
  to: string; // Número de destino (formato internacional)
  type: "text" | "image" | "video" | "audio" | "document" | "location" | "contact" | "template";
  content: string; // Conteúdo da mensagem
  mediaUrl?: string; // URL da mídia (se houver)
  mediaType?: string; // Tipo de mídia (mime type)
  direction: "inbound" | "outbound"; // Entrada ou saída
  status: "sent" | "delivered" | "read" | "failed" | "pending";
  timestamp: Date; // Timestamp da mensagem no WhatsApp
  // Metadados
  contactName?: string; // Nome do contato (se disponível)
  isGroup?: boolean; // Se é mensagem de grupo
  groupId?: string; // ID do grupo (se aplicável)
  // Respostas automáticas
  autoReplied?: boolean; // Se foi respondida automaticamente
  replyMessageId?: string; // ID da mensagem de resposta automática
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppConnection",
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "location", "contact", "template"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed", "pending"],
      default: "pending",
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    contactName: {
      type: String,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupId: {
      type: String,
    },
    autoReplied: {
      type: Boolean,
      default: false,
    },
    replyMessageId: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_messages",
  }
);

// Índices para buscas rápidas
WhatsAppMessageSchema.index({ userId: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ connectionId: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ from: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ messageId: 1 }, { unique: true });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>("WhatsAppMessage", WhatsAppMessageSchema);
