import rateLimit from "express-rate-limit";

// Função para verificar se está em desenvolvimento
const isDevelopment = process.env.NODE_ENV !== "production";

// Rate limiter geral para API (desativado em desenvolvimento)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 10000 : 100, // Em desenvolvimento: 10000, em produção: 100
  message: {
    success: false,
    message: "Muitas requisições deste IP, tente novamente em alguns minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Pular rate limiting em desenvolvimento
});

// Rate limiter para autenticação (mais restritivo, desativado em desenvolvimento)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 10000 : 5, // Em desenvolvimento: 10000, em produção: 5
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  skipSuccessfulRequests: true,
  skip: () => isDevelopment, // Pular rate limiting em desenvolvimento
});

// Rate limiter para criação de recursos (desativado em desenvolvimento)
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 10000 : 50, // Em desenvolvimento: 10000, em produção: 50
  message: {
    success: false,
    message: "Limite de criação excedido. Tente novamente mais tarde.",
  },
  skip: () => isDevelopment, // Pular rate limiting em desenvolvimento
});

// Rate limiter para uploads (desativado em desenvolvimento)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 10000 : 20, // Em desenvolvimento: 10000, em produção: 20
  message: {
    success: false,
    message: "Limite de uploads excedido. Tente novamente mais tarde.",
  },
  skip: () => isDevelopment, // Pular rate limiting em desenvolvimento
});

