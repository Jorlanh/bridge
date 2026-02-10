import mongoose, { Schema, Document } from "mongoose";

export interface IChecklist extends Document {
  name: string;
  items: number;
  completed: number;
  category: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistSchema = new Schema<IChecklist>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "checklists",
  }
);

export const Checklist = mongoose.model<IChecklist>("Checklist", ChecklistSchema);






