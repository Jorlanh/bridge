import mongoose, { Schema, Document } from "mongoose";

export interface IConsultingSession extends Document {
  title: string;
  description: string;
  date: Date;
  time: string;
  duration: number; // em minutos
  maxParticipants: number;
  currentParticipants: number;
  status: "scheduled" | "available" | "full" | "completed" | "cancelled";
  instructor: string;
  platform: "zoom" | "meet" | "teams" | "other";
  meetingLink?: string;
  userId?: mongoose.Types.ObjectId; // Para sessões personalizadas
  participants: mongoose.Types.ObjectId[]; // IDs dos usuários inscritos
  createdAt: Date;
  updatedAt: Date;
}

const ConsultingSessionSchema = new Schema<IConsultingSession>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 240,
      default: 60,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
      default: 20,
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "available", "full", "completed", "cancelled"],
      default: "available",
    },
    instructor: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["zoom", "meet", "teams", "other"],
      default: "zoom",
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    collection: "consulting_sessions",
  }
);

// Índices para melhor performance
ConsultingSessionSchema.index({ date: 1, status: 1 });
ConsultingSessionSchema.index({ userId: 1 });

export const ConsultingSession = mongoose.model<IConsultingSession>(
  "ConsultingSession",
  ConsultingSessionSchema
);

