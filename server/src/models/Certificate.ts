import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  title: string;
  courseName: string;
  earnedAt: Date;
  studyTime: number; // em minutos
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    studyTime: {
      type: Number,
      required: true,
      min: 0,
    },
    certificateUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "certificates",
  }
);

// Índice único para evitar duplicatas
CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);






