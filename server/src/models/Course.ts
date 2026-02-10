import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  level: "iniciante" | "medio" | "avancado";
  duration: number; // em minutos (soma de todas as aulas)
  lessons: number; // número de aulas (será calculado automaticamente)
  thumbnail?: string;
  featured: boolean;
  status: "active" | "draft" | "archived";
  videoUrl?: string; // URL do vídeo de preview/introdução
  objectives?: string[]; // objetivos de aprendizagem
  prerequisites?: string[]; // pré-requisitos
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      enum: ["iniciante", "medio", "avancado"],
      default: "iniciante",
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    lessons: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    objectives: [
      {
        type: String,
        trim: true,
      },
    ],
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    collection: "courses",
  }
);

export const Course = mongoose.model<ICourse>("Course", CourseSchema);






