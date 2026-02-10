import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Armazenar tokens CSRF em memória (em produção, usar Redis)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Limpar tokens expirados a cada hora
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Gera token CSRF
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  });
  return token;
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

/**
 * Middleware para validar CSRF token em requisições mutáveis
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Apenas validar métodos mutáveis
  const mutableMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!mutableMethods.includes(req.method)) {
    return next();
  }

  // Obter sessionId do header ou cookie
  const sessionId = req.headers["x-session-id"] as string || req.cookies?.sessionId;
  const csrfToken = req.headers["x-csrf-token"] as string || req.body?.csrfToken;

  if (!sessionId || !csrfToken) {
    return res.status(403).json({
      success: false,
      message: "Token CSRF não fornecido.",
    });
  }

  if (!validateCSRFToken(sessionId, csrfToken)) {
    return res.status(403).json({
      success: false,
      message: "Token CSRF inválido ou expirado.",
    });
  }

  next();
};

/**
 * Endpoint para obter token CSRF
 */
export const getCSRFToken = (req: Request, res: Response) => {
  const sessionId = req.headers["x-session-id"] as string || req.cookies?.sessionId || crypto.randomUUID();
  const token = generateCSRFToken(sessionId);
  
  res.json({
    success: true,
    csrfToken: token,
    sessionId,
  });
};

