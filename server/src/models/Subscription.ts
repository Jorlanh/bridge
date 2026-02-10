import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: string; // "essencial" ou "profissional"
  planName: string;
  price: number; // Preço em centavos
  status: "active" | "pending" | "cancelled" | "expired" | "trial";
  asaasSubscriptionId?: string; // ID da assinatura no Asaas
  asaasCustomerId?: string; // ID do cliente no Asaas
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  trialEndsAt?: Date;
  metadata?: {
    billingCycle?: "monthly" | "yearly";
    features?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ["essencial", "profissional"],
    },
    planName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "cancelled", "expired", "trial"],
      default: "pending",
      index: true,
    },
    asaasSubscriptionId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    asaasCustomerId: {
      type: String,
      trim: true,
      sparse: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    trialEndsAt: {
      type: Date,
    },
    metadata: {
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      features: [String],
    },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  }
);

// Índice único para garantir uma assinatura ativa por usuário
SubscriptionSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);

