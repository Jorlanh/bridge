import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppConnection extends Document {
  userId: mongoose.Types.ObjectId;
  phoneNumber: string; // Número no formato internacional (ex: +5519995555280)
  instanceName: string; // Nome da instância (ex: "Principal", "Suporte")
  apiKey?: string; // Chave da API (para Evolution API ou similar - não usado com Baileys)
  apiUrl?: string; // URL da API (ex: https://api.evolution-api.com - não usado com Baileys)
  provider: "evolution" | "meta" | "baileys" | "other"; // Provedor da API
  qrCode?: string; // QR Code para autenticação
  status: "disconnected" | "connecting" | "connected" | "error";
  isActive: boolean;
  // Informações da conta
  profileName?: string;
  profilePicture?: string;
  lastSeen?: Date;
  // Estatísticas
  messagesSent?: number;
  messagesReceived?: number;
  lastMessageAt?: Date;
  // Automação
  automationEnabled?: boolean; // Controla se a automação está ativa
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConnectionSchema = new Schema<IWhatsAppConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false, // Opcional até a conexão ser estabelecida
      trim: true,
      default: "",
    },
    instanceName: {
      type: String,
      required: true,
      trim: true,
      default: "Principal",
    },
    apiKey: {
      type: String,
    },
    apiUrl: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["evolution", "meta", "baileys", "other"],
      default: "evolution",
    },
    qrCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ["disconnected", "connecting", "connected", "error"],
      default: "disconnected",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileName: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    lastSeen: {
      type: Date,
    },
    messagesSent: {
      type: Number,
      default: 0,
    },
    messagesReceived: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
    },
    automationEnabled: {
      type: Boolean,
      default: true, // Automação habilitada por padrão
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_connections",
  }
);

// Índice único para evitar múltiplas conexões do mesmo número por usuário
// Apenas quando phoneNumber estiver preenchido
WhatsAppConnectionSchema.index(
  { userId: 1, phoneNumber: 1 },
  { 
    unique: true,
    partialFilterExpression: { phoneNumber: { $exists: true, $ne: "" } }
  }
);

export const WhatsAppConnection = mongoose.model<IWhatsAppConnection>("WhatsAppConnection", WhatsAppConnectionSchema);

