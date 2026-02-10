import mongoose, { Schema, Document } from "mongoose";

export interface IQuickReply extends Document {
  title: string;
  text: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuickReplySchema = new Schema<IQuickReply>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
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
    collection: "quick_replies",
  }
);

export const QuickReply = mongoose.model<IQuickReply>("QuickReply", QuickReplySchema);






