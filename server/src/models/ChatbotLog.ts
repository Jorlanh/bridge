import mongoose, { Schema, Document } from "mongoose";

export interface IChatbotLog extends Document {
  ticketId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  response: string;
  source: "chatbot" | "user";
  confidence?: number;
  resolved: boolean;
  escalated: boolean;
  createdAt: Date;
}

const ChatbotLogSchema = new Schema<IChatbotLog>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["chatbot", "user"],
      default: "user",
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "chatbot_logs",
  }
);

// Índices para busca rápida
ChatbotLogSchema.index({ userId: 1, createdAt: -1 });
ChatbotLogSchema.index({ ticketId: 1 });

export const ChatbotLog = mongoose.model<IChatbotLog>("ChatbotLog", ChatbotLogSchema);

