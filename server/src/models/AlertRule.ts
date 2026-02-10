import mongoose, { Schema, Document } from "mongoose";

export interface IAlertRule extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  module: string; // marketing, sales, support, social, processes, academy
  condition: {
    field: string; // Campo a ser monitorado (ex: "campaign.conversion", "deal.stage")
    operator: "equals" | "greater_than" | "less_than" | "contains" | "changed" | "reached";
    value?: any; // Valor de comparação
  };
  triggerFrequency: "once" | "always" | "daily" | "weekly"; // Frequência de trigger
  enabled: boolean;
  notificationChannels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
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
    module: {
      type: String,
      required: true,
      enum: ["marketing", "sales", "support", "social", "processes", "academy", "dashboard"],
      trim: true,
    },
    condition: {
      field: {
        type: String,
        required: true,
        trim: true,
      },
      operator: {
        type: String,
        required: true,
        enum: ["equals", "greater_than", "less_than", "contains", "changed", "reached"],
      },
      value: {
        type: Schema.Types.Mixed,
      },
    },
    triggerFrequency: {
      type: String,
      required: true,
      enum: ["once", "always", "daily", "weekly"],
      default: "always",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    notificationChannels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
    },
    lastTriggered: {
      type: Date,
    },
    triggerCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "alert_rules",
  }
);

export const AlertRule = mongoose.model<IAlertRule>("AlertRule", AlertRuleSchema);





