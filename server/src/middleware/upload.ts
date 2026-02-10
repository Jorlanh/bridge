import multer from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";

// Criar diretório de uploads se não existir
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// Filtro de arquivo - apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)"));
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload de imagens para posts
const postsUploadDir = path.join(process.cwd(), "uploads", "posts");
if (!fs.existsSync(postsUploadDir)) {
  fs.mkdirSync(postsUploadDir, { recursive: true });
}

const postsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsUploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

export const uploadPostImage = multer({
  storage: postsStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB para posts
  },
});






