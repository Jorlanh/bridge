import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflow extends Document {
  name: string;
  status: "active" | "paused";
  steps: number;
  completed: number;
  avgTime: string;
  efficiency: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    steps: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgTime: {
      type: String,
      default: "0h",
    },
    efficiency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "workflows",
  }
);

export const Workflow = mongoose.model<IWorkflow>("Workflow", WorkflowSchema);






