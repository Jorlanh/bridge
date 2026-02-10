import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { z } from "zod";
import admin from "../utils/firebaseAdmin.js";

// Função para validar força da senha
const validatePasswordStrength = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

// Schema de registro com validações rigorosas
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras e espaços")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")), // Remove espaços múltiplos
  email: z
    .string()
    .email("Email inválido")
    .max(255, "O email deve ter no máximo 255 caracteres")
    .toLowerCase()
    .trim(),
  company: z
    .string()
    .max(200, "O nome da empresa deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val.replace(/\s+/g, " ") : undefined)),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres")
    .refine(
      (password) => validatePasswordStrength(password),
      "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial"
    ),
});

// Schema de login
const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "A senha é obrigatória"),
});

export const register = async (req: Request, res: Response) => {
  try {
    // Validar e formatar dados de entrada
    const data = registerSchema.parse(req.body);

    // Verificar se email já existe (busca case-insensitive)
    const existingUser = await User.findOne({ 
      email: data.email.toLowerCase().trim() 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Este email já está cadastrado. Tente fazer login ou use outro email.",
      });
    }

    // Hash da senha com salt rounds adequado
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Criar usuário com dados formatados
    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      company: data.company?.trim() || undefined,
      password: hashedPassword,
      authProvider: "email",
    });

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET não está definido no .env");
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Conta criada com sucesso!",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retornar todas as mensagens de erro de validação
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Tratar erros do MongoDB (ex: email duplicado)
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Este email já está cadastrado.",
        });
      }
    }

    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao criar conta. Tente novamente mais tarde.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validar e formatar dados de entrada
    const data = loginSchema.parse(req.body);

    // Normalizar email antes de buscar
    const normalizedEmail = data.email.toLowerCase().trim();

    // Buscar usuário (email já é case-insensitive no schema, mas garantimos aqui)
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Mesma mensagem para não revelar se o email existe ou não (segurança)
      return res.status(401).json({
        success: false,
        message: "Email ou senha inválidos",
      });
    }

    // Verificar se o usuário tem senha (usuários que fazem login apenas com Google não têm senha)
    if (!user.password || user.authProvider === "google") {
      return res.status(401).json({
        success: false,
        message: "Esta conta foi criada com Google. Por favor, faça login com Google.",
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha inválidos",
      });
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET não está definido no .env");
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retornar todas as mensagens de erro de validação
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao fazer login. Tente novamente mais tarde.",
    });
  }
};

// Schema para forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
});

// Schema para reset password
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres")
    .refine(
      (password) => validatePasswordStrength(password),
      "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial"
    ),
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Sempre retornar sucesso para não revelar se o email existe (segurança)
    if (!user) {
      return res.json({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um link de recuperação.",
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Em produção, aqui você enviaria um email com o token
    // Por enquanto, apenas logamos (para desenvolvimento/teste)
    

    res.json({
      success: true,
      message: "Se o email estiver cadastrado, você receberá um link de recuperação.",
      // Em desenvolvimento, retornamos o token (remover em produção)
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }

    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar solicitação de recuperação de senha.",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Hash do token recebido para comparar com o armazenado
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    // Buscar usuário com token válido e não expirado
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado. Solicite um novo link de recuperação.",
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Atualizar senha e remover token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Senha redefinida com sucesso! Você já pode fazer login.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }

    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao redefinir senha. Tente novamente mais tarde.",
    });
  }
};

// Schema para login com Google
const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Token ID é obrigatório"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  name: z.string().min(1, "Nome é obrigatório").trim(),
  photoURL: z.string().url("URL da foto inválida").optional(),
});

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const data = googleLoginSchema.parse(req.body);

    // Verificar se o Firebase Admin está inicializado
    if (!admin.apps.length) {
      console.error("❌ Firebase Admin não está inicializado");
      return res.status(500).json({
        success: false,
        message: "Firebase Admin não está configurado. Configure FIREBASE_SERVICE_ACCOUNT no .env do servidor.",
      });
    }

    // Verificar o token do Firebase
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(data.idToken);
      
    } catch (error: any) {
      console.error("❌ Erro ao verificar token do Firebase:", error);
      console.error("Código do erro:", error.code);
      console.error("Mensagem do erro:", error.message);
      
      // Mensagens de erro mais específicas
      if (error.code === "auth/argument-error") {
        return res.status(401).json({
          success: false,
          message: "Token inválido. Verifique se o Firebase Admin está configurado corretamente.",
        });
      }
      
      return res.status(401).json({
        success: false,
        message: `Token inválido ou expirado: ${error.message || "Erro desconhecido"}. Tente fazer login novamente.`,
      });
    }

    // Verificar se o email do token corresponde ao email enviado
    if (decodedToken.email !== data.email) {
      return res.status(400).json({
        success: false,
        message: "Email do token não corresponde ao email fornecido.",
      });
    }

    // Normalizar email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Buscar ou criar usuário
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Criar novo usuário
      user = await User.create({
        name: data.name.trim(),
        email: normalizedEmail,
        authProvider: "google",
        firebaseId: decodedToken.uid,
        avatar: data.photoURL || undefined,
      });
    } else {
      // Atualizar informações do usuário existente se necessário
      if (!user.firebaseId) {
        user.firebaseId = decodedToken.uid;
      }
      if (!user.authProvider) {
        user.authProvider = "google";
      }
      if (data.photoURL && !user.avatar) {
        user.avatar = data.photoURL;
      }
      if (user.name !== data.name.trim()) {
        user.name = data.name.trim();
      }
      await user.save();
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET não está definido no .env");
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao fazer login com Google. Tente novamente mais tarde.",
    });
  }
};

// Schema para login com Facebook
const facebookLoginSchema = z.object({
  idToken: z.string().min(1, "Token ID é obrigatório"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  name: z.string().min(1, "Nome é obrigatório").trim(),
  photoURL: z.string().url("URL da foto inválida").optional(),
});

export const loginWithFacebook = async (req: Request, res: Response) => {
  try {
    const data = facebookLoginSchema.parse(req.body);

    // Verificar se o Firebase Admin está inicializado
    if (!admin.apps.length) {
      console.error("❌ Firebase Admin não está inicializado");
      return res.status(500).json({
        success: false,
        message: "Firebase Admin não está configurado. Configure FIREBASE_SERVICE_ACCOUNT no .env do servidor.",
      });
    }

    // Verificar o token do Firebase
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(data.idToken);
      
    } catch (error: any) {
      console.error("❌ Erro ao verificar token do Firebase:", error);
      console.error("Código do erro:", error.code);
      console.error("Mensagem do erro:", error.message);
      
      // Mensagens de erro mais específicas
      if (error.code === "auth/argument-error") {
        return res.status(401).json({
          success: false,
          message: "Token inválido. Verifique se o Firebase Admin está configurado corretamente.",
        });
      }
      
      return res.status(401).json({
        success: false,
        message: `Token inválido ou expirado: ${error.message || "Erro desconhecido"}. Tente fazer login novamente.`,
      });
    }

    // Verificar se o email do token corresponde ao email enviado
    if (decodedToken.email !== data.email) {
      return res.status(400).json({
        success: false,
        message: "Email do token não corresponde ao email fornecido.",
      });
    }

    // Normalizar email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Buscar ou criar usuário
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Criar novo usuário
      user = await User.create({
        name: data.name.trim(),
        email: normalizedEmail,
        authProvider: "facebook",
        firebaseId: decodedToken.uid,
        avatar: data.photoURL || undefined,
      });
    } else {
      // Atualizar informações do usuário existente se necessário
      if (!user.firebaseId) {
        user.firebaseId = decodedToken.uid;
      }
      if (!user.authProvider) {
        (user as any).authProvider = "facebook";
      }
      if (data.photoURL && !user.avatar) {
        user.avatar = data.photoURL;
      }
      if (user.name !== data.name.trim()) {
        user.name = data.name.trim();
      }
      await user.save();
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET não está definido no .env");
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Facebook login error:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao fazer login com Facebook. Tente novamente mais tarde.",
    });
  }
};

