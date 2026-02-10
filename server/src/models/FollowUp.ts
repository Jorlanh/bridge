import mongoose, { Schema, Document } from "mongoose";

export interface IFollowUp extends Document {
  type: "Ligação" | "Email" | "Reunião";
  contact: string;
  date: Date;
  time: string;
  status: "pending" | "completed";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    type: {
      type: String,
      enum: ["Ligação", "Email", "Reunião"],
      required: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
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
    collection: "followups",
  }
);

export const FollowUp = mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);






