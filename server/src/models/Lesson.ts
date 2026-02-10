import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number; // em minutos
  order: number; // ordem da aula no curso
  content?: string; // conteúdo em markdown ou HTML
  resources?: Array<{
    title: string;
    url: string;
    type: "pdf" | "link" | "video" | "other";
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    content: {
      type: String,
      trim: true,
    },
    resources: [
      {
        title: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["pdf", "link", "video", "other"],
          default: "link",
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "lessons",
  }
);

// Índice composto para garantir ordem única por curso
LessonSchema.index({ courseId: 1, order: 1 }, { unique: true });

export const Lesson = mongoose.model<ILesson>("Lesson", LessonSchema);

