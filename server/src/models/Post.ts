import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  content: string;
  platform: string;
  scheduledDate?: Date;
  status: "draft" | "scheduled" | "published";
  image?: boolean;
  imageUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "instagram", "linkedin"],
    },
    scheduledDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
    },
    image: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "posts",
  }
);

export const Post = mongoose.model<IPost>("Post", PostSchema);





