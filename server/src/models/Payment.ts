import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  asaasPaymentId?: string; // ID do pagamento no Asaas
  amount: number; // Valor em centavos
  status: "pending" | "confirmed" | "received" | "overdue" | "refunded" | "cancelled";
  paymentMethod: "credit_card" | "debit_card" | "pix" | "boleto" | "bank_transfer";
  description?: string;
  dueDate?: Date;
  paymentDate?: Date;
  invoiceUrl?: string; // URL do boleto ou comprovante
  pixQrCode?: string; // QR Code do PIX
  pixQrCodeUrl?: string; // URL do QR Code do PIX
  metadata?: {
    installments?: number;
    installmentNumber?: number;
    transactionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
    },
    asaasPaymentId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "received", "overdue", "refunded", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "pix", "boleto", "bank_transfer"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },
    invoiceUrl: {
      type: String,
      trim: true,
    },
    pixQrCode: {
      type: String,
      trim: true,
    },
    pixQrCodeUrl: {
      type: String,
      trim: true,
    },
    metadata: {
      installments: Number,
      installmentNumber: Number,
      transactionId: String,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

