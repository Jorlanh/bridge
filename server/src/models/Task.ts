import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate: Date;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedTo: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

export const Task = mongoose.model<ITask>("Task", TaskSchema);






