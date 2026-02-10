import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user: string;
  action: string;
  ip: string;
  status: "success" | "failed";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "activity_logs",
  }
);

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);






