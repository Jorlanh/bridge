import mongoose, { Schema, Document } from "mongoose";

export interface ISocialConnection extends Document {
  userId: mongoose.Types.ObjectId;
  platform: "facebook" | "instagram" | "linkedin";
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  // Informações do perfil
  profilePicture?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  username?: string;
  verified?: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialConnectionSchema = new Schema<ISocialConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin"],
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountId: {
      type: String,
      required: true,
      trim: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Informações do perfil
    profilePicture: {
      type: String,
    },
    followersCount: {
      type: Number,
    },
    followingCount: {
      type: Number,
    },
    postsCount: {
      type: Number,
    },
    username: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    lastSyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "social_connections",
  }
);

// Índice único para evitar múltiplas conexões da mesma plataforma por usuário
SocialConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const SocialConnection = mongoose.model<ISocialConnection>("SocialConnection", SocialConnectionSchema);

