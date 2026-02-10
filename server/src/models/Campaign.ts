import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  status: "active" | "paused" | "completed";
  budget: number;
  spent: number;
  leads: number;
  conversion: number;
  startDate: Date;
  endDate: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    leads: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "campaigns",
  }
);

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);
