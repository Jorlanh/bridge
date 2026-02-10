import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  subject: string;
  customer: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo: string;
  messages: number;
  source?: "chatbot" | "manual" | "email";
  chatbotHandled?: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: {
      type: String,
      required: true,
      trim: true,
    },
    messages: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ["chatbot", "manual", "email"],
      default: "manual",
    },
    chatbotHandled: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "tickets",
  }
);

export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);






