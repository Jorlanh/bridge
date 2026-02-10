import { Request, Response, NextFunction } from "express";
import multer from "multer";

// Tipos de arquivo permitidos
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Valida tipo de arquivo
 */
export function validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.mimetype);
}

/**
 * Valida tamanho do arquivo
 */
export function validateFileSize(file: Express.Multer.File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Middleware para validar uploads de imagens
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(); // Se não há arquivo, deixa passar (pode ser opcional)
  }

  if (!validateFileType(req.file, ALLOWED_IMAGE_TYPES)) {
    return res.status(400).json({
      success: false,
      message: "Tipo de arquivo não permitido. Use apenas imagens (JPEG, PNG, GIF, WebP).",
    });
  }

  if (!validateFileSize(req.file)) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. Tamanho máximo: 10MB.",
    });
  }

  next();
};

/**
 * Middleware para validar uploads de documentos
 */
export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  if (!validateFileType(req.file, ALLOWED_DOCUMENT_TYPES)) {
    return res.status(400).json({
      success: false,
      message: "Tipo de arquivo não permitido. Use apenas PDF ou Word.",
    });
  }

  if (!validateFileSize(req.file)) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. Tamanho máximo: 10MB.",
    });
  }

  next();
};

/**
 * Middleware para validar múltiplos arquivos
 */
export const validateMultipleFiles = (allowedTypes: string[], maxFiles: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return next();
    }

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Máximo de ${maxFiles} arquivos permitidos.`,
      });
    }

    for (const file of files) {
      if (!validateFileType(file, allowedTypes)) {
        return res.status(400).json({
          success: false,
          message: `Arquivo ${file.originalname} tem tipo não permitido.`,
        });
      }

      if (!validateFileSize(file)) {
        return res.status(400).json({
          success: false,
          message: `Arquivo ${file.originalname} excede o tamanho máximo de 10MB.`,
        });
      }
    }

    next();
  };
};

