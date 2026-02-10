import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Role, Permission } from "../models/Role.js";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  userRoles?: string[];
  userPermissions?: string[];
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };

    // Buscar usuário no banco com roles populadas
    const user = await User.findById(decoded.userId)
      .select("-password")
      .populate({
        path: "roles",
        populate: {
          path: "permissions",
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    if ((user as any).isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Usuário bloqueado. Entre em contato com o suporte.",
      });
    }

    // Extrair nomes de roles e permissões
    const userRoles: string[] = [];
    const userPermissions: string[] = [];

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any) => {
        if (role && role.name) {
          userRoles.push(role.name);
        }
        if (role && role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission: any) => {
            if (permission && permission.name && !userPermissions.includes(permission.name)) {
              userPermissions.push(permission.name);
            }
          });
        }
      });
    }

    // Adicionar dados do usuário à requisição
    req.userId = decoded.userId;
    req.user = user;
    req.userRoles = userRoles;
    req.userPermissions = userPermissions;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao autenticar usuário",
    });
  }
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário possui uma das roles especificadas
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRoles || req.userRoles.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Você não possui permissões suficientes.",
      });
    }

    const hasRole = req.userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Role necessária: " + allowedRoles.join(" ou "),
      });
    }

    next();
  };
};

/**
 * Middleware de autorização por permissão
 * Verifica se o usuário possui a permissão especificada
 * Formato: "module:action" (ex: "marketing:create", "sales:manage")
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userPermissions || req.userPermissions.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Você não possui permissões suficientes.",
      });
    }

    // Verificar se tem a permissão específica ou "manage" no módulo
    const [module, action] = permission.split(":");
    const hasPermission = req.userPermissions.some((perm) => {
      if (perm === permission) return true;
      // Se a ação solicitada não é "manage", mas o usuário tem "manage" no módulo
      if (perm === `${module}:manage`) return true;
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Permissão necessária: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware helper para verificar se o usuário é admin (admin ou master)
 */
export const isAdmin = (req: AuthRequest): boolean => {
  // Considera como "admin" quem tem role admin ou master
  return req.userRoles?.some((role) => role === "admin" || role === "master") || false;
};

/**
 * Middleware helper para verificar se o usuário é master
 */
export const isMaster = (req: AuthRequest): boolean => {
  return req.userRoles?.includes("master") || false;
};

/**
 * Middleware de autorização apenas para admin
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!isAdmin(req)) {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas administradores podem acessar este recurso.",
    });
  }
  next();
};

/**
 * Middleware de autorização por módulo
 * Verifica se o usuário tem qualquer permissão no módulo especificado
 */
export const requireModuleAccess = (module: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userPermissions || req.userPermissions.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Você não possui permissões suficientes.",
      });
    }

    const hasModuleAccess = req.userPermissions.some((perm) => {
      const [permModule] = perm.split(":");
      return permModule === module || perm === `${module}:manage`;
    });

    if (!hasModuleAccess) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Você não tem acesso ao módulo: ${module}`,
      });
    }

    next();
  };
};

/**
 * Middleware de autorização apenas para master
 */
export const requireMaster = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!isMaster(req)) {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas master pode acessar este recurso.",
    });
  }
  next();
};

