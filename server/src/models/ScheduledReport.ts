import mongoose, { Schema, Document } from "mongoose";

export interface IScheduledReport extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  module: string;
  format: "pdf" | "excel" | "csv";
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    dayOfWeek?: number; // 0-6 (domingo-sábado) para weekly
    dayOfMonth?: number; // 1-31 para monthly
    time: string; // HH:mm format
    cronExpression?: string; // Para custom
  };
  emailRecipients: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReport>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "ReportTemplate",
    },
    module: {
      type: String,
      required: true,
      enum: ["marketing", "sales", "support", "social", "processes", "academy", "dashboard"],
      trim: true,
    },
    format: {
      type: String,
      required: true,
      enum: ["pdf", "excel", "csv"],
      default: "pdf",
    },
    schedule: {
      frequency: {
        type: String,
        required: true,
        enum: ["daily", "weekly", "monthly", "custom"],
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      time: {
        type: String,
        required: true,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
      },
      cronExpression: {
        type: String,
      },
    },
    emailRecipients: [
      {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
    },
    lastRun: {
      type: Date,
    },
    nextRun: {
      type: Date,
    },
    runCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "scheduled_reports",
  }
);

// Índices para performance
ScheduledReportSchema.index({ userId: 1, enabled: 1 });
ScheduledReportSchema.index({ nextRun: 1 });

export const ScheduledReport = mongoose.model<IScheduledReport>("ScheduledReport", ScheduledReportSchema);

