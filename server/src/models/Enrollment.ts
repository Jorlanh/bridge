import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  studyTime: number; // em minutos
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
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
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      required: true,
      min: 0,
    },
    studyTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "enrollments",
  }
);

// Índice único para evitar duplicatas
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);






