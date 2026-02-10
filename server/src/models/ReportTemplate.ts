import mongoose, { Schema, Document } from "mongoose";

export interface IReportTemplate extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  module: string; // marketing, sales, support, social, processes, academy
  format: "pdf" | "excel" | "csv";
  fields: {
    field: string;
    label: string;
    type: "text" | "number" | "date" | "currency" | "percentage";
    format?: string;
  }[];
  filters: {
    field: string;
    operator: "equals" | "range" | "contains";
    value?: any;
  }[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeCharts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema = new Schema<IReportTemplate>(
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
    format: {
      type: String,
      required: true,
      enum: ["pdf", "excel", "csv"],
      default: "pdf",
    },
    fields: [
      {
        field: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "number", "date", "currency", "percentage"],
          default: "text",
        },
        format: {
          type: String,
        },
      },
    ],
    filters: [
      {
        field: {
          type: String,
          required: true,
        },
        operator: {
          type: String,
          enum: ["equals", "range", "contains"],
          default: "equals",
        },
        value: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    groupBy: {
      type: String,
      trim: true,
    },
    sortBy: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: String,
      enum: ["asc", "desc"],
      default: "asc",
    },
    includeCharts: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "report_templates",
  }
);

export const ReportTemplate = mongoose.model<IReportTemplate>("ReportTemplate", ReportTemplateSchema);





