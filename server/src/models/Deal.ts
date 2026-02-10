import mongoose, { Schema, Document } from "mongoose";

export interface IDeal extends Document {
  company: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  nextAction?: Date;
  daysInStage: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    stage: {
      type: String,
      required: true,
      enum: ["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechamento"],
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    nextAction: {
      type: Date,
    },
    daysInStage: {
      type: Number,
      default: 0,
      min: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "deals",
  }
);

export const Deal = mongoose.model<IDeal>("Deal", DealSchema);






