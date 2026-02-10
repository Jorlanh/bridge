import { Response } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { createNotification } from "../utils/notifications.js";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras e espaços")
    .trim()
    .transform((val) => val.replace(/\s+/g, " "))
    .optional(),
  company: z
    .string()
    .max(200, "O nome da empresa deve ter no máximo 200 caracteres")
    .trim()
    .transform((val) => (val && val.length > 0 ? val.replace(/\s+/g, " ") : undefined))
    .optional(),
  companyCNPJ: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$|^$/, "CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX")
    .transform((val) => val.replace(/\D/g, ""))
    .optional()
    .or(z.literal("")),
  avatar: z
    .string()
    .url("URL do avatar inválida")
    .optional(),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "CPF inválido. Use o formato XXX.XXX.XXX-XX")
    .transform((val) => val.replace(/\D/g, ""))
    .optional()
    .or(z.literal("")),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, "Telefone inválido")
    .trim()
    .optional()
    .or(z.literal("")),
});

// Buscar perfil do usuário autenticado
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Buscar roles do usuário
    const userWithRoles = await User.findById(req.user._id)
      .select("-password")
      .populate("roles", "name description");

    const roles = (userWithRoles?.roles as any[])?.map((r: any) => r?.name || r) || [];
    const permissions: string[] = [];
    
    // Extrair permissões das roles
    if (userWithRoles?.roles && Array.isArray(userWithRoles.roles)) {
      for (const role of userWithRoles.roles) {
        if (role && typeof role === "object" && "permissions" in role && role.permissions) {
          const rolePerms = Array.isArray(role.permissions) ? role.permissions : [];
          for (const perm of rolePerms) {
            if (perm && typeof perm === "object" && "name" in perm && perm.name && !permissions.includes(perm.name)) {
              permissions.push(perm.name);
            }
          }
        }
      }
    }

    res.json({
      success: true,
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        company: req.user.company,
        avatar: req.user.avatar,
        cpf: req.user.cpf,
        birthDate: req.user.birthDate,
        phone: req.user.phone,
        cep: req.user.cep,
        address: req.user.address,
        city: req.user.city,
        state: req.user.state,
        roles,
        permissions,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar perfil",
    });
  }
};

// Atualizar perfil do usuário autenticado
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Validar dados
    const data = updateProfileSchema.parse(req.body);

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.company !== undefined) {
      updateData.company = data.company?.trim() || undefined;
    }
    if (data.companyCNPJ !== undefined) {
      updateData.companyCNPJ = data.companyCNPJ || undefined;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar.trim() || undefined;
    }
    if (data.cpf !== undefined) {
      const cpfValue = data.cpf || undefined;
      
      // Se está tentando definir um CPF, verificar se já existe
      if (cpfValue) {
        const existingUser = await User.findOne({ 
          cpf: cpfValue,
          _id: { $ne: req.userId } // Excluir o próprio usuário
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Este CPF já está cadastrado por outro usuário",
            errors: [{
              field: "cpf",
              message: "Este CPF já está cadastrado por outro usuário",
            }],
          });
        }
      }
      
      updateData.cpf = cpfValue;
    }
    if (data.birthDate !== undefined && data.birthDate !== "") {
      updateData.birthDate = new Date(data.birthDate);
    } else if (data.birthDate === "") {
      updateData.birthDate = undefined;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone || undefined;
    }

    // Atualizar usuário
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Criar notificação de atualização de perfil
    const updatedFields = [];
    if (data.name !== undefined) updatedFields.push("nome");
    if (data.company !== undefined) updatedFields.push("empresa");
    if (data.companyCNPJ !== undefined) updatedFields.push("CNPJ da empresa");
    if (data.avatar !== undefined) updatedFields.push("avatar");
    if (data.cpf !== undefined) updatedFields.push("CPF");
    if (data.birthDate !== undefined) updatedFields.push("data de nascimento");
    if (data.phone !== undefined) updatedFields.push("telefone");

    if (updatedFields.length > 0) {
      await createNotification({
        userId: req.userId,
        title: "Perfil atualizado",
        message: `Seu ${updatedFields.join(", ")} foi atualizado com sucesso!`,
        type: "success",
        link: "/perfil",
      });
    }

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
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

    // Tratar erro de duplicação de CPF do MongoDB
    if (error.code === 11000 && error.keyPattern?.cpf) {
      return res.status(400).json({
        success: false,
        message: "Este CPF já está cadastrado por outro usuário",
        errors: [{
          field: "cpf",
          message: "Este CPF já está cadastrado por outro usuário",
        }],
      });
    }

    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar perfil",
    });
  }
};

// Schema para mudança de senha
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres"),
});

// Alterar senha
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const data = changePasswordSchema.parse(req.body);

    // Buscar usuário
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Verificar senha atual
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Usuário não possui senha cadastrada",
      });
    }
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Senha atual incorreta",
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    // Atualizar senha
    user.password = hashedPassword;
    await user.save();

    // Criar notificação
    await createNotification({
      userId: req.userId,
      title: "Senha alterada",
      message: "Sua senha foi alterada com sucesso. Se não foi você, entre em contato imediatamente.",
      type: "warning",
      link: "/dashboard/security",
    });

    res.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao alterar senha",
    });
  }
};

// Excluir conta
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Buscar usuário
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Importar modelos para deletar dados relacionados
    const { Campaign } = await import("../models/Campaign.js");
    const { Deal } = await import("../models/Deal.js");
    const { Ticket } = await import("../models/Ticket.js");
    const { Post } = await import("../models/Post.js");
    const { Workflow } = await import("../models/Workflow.js");
    const { Enrollment } = await import("../models/Enrollment.js");
    const { Certificate } = await import("../models/Certificate.js");
    const { Notification } = await import("../models/Notification.js");
    const { AlertRule } = await import("../models/AlertRule.js");
    const { ReportTemplate } = await import("../models/ReportTemplate.js");

    // Deletar todos os dados relacionados
    await Promise.all([
      Campaign.deleteMany({ userId: req.userId }),
      Deal.deleteMany({ userId: req.userId }),
      Ticket.deleteMany({ userId: req.userId }),
      Post.deleteMany({ userId: req.userId }),
      Workflow.deleteMany({ userId: req.userId }),
      Enrollment.deleteMany({ userId: req.userId }),
      Certificate.deleteMany({ userId: req.userId }),
      Notification.deleteMany({ userId: req.userId }),
      AlertRule.deleteMany({ userId: req.userId }),
      ReportTemplate.deleteMany({ userId: req.userId }),
    ]);

    // Deletar usuário
    await User.findByIdAndDelete(req.userId);

    res.json({
      success: true,
      message: "Conta excluída com sucesso",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir conta",
    });
  }
};

// Obter preferências de notificações
export const getNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        enabled: true,
        channels: { inApp: true, push: true, email: false },
        types: {
          marketing: true,
          sales: true,
          support: true,
          social: true,
          processes: true,
          academy: true,
          system: true,
        },
        quietHours: { enabled: false, start: "22:00", end: "08:00" },
      },
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar preferências de notificações",
    });
  }
};

// Atualizar preferências de notificações
export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    const preferences = req.body.preferences;

    user.notificationPreferences = {
      enabled: preferences.enabled !== undefined ? preferences.enabled : user.notificationPreferences?.enabled ?? true,
      channels: {
        inApp: preferences.channels?.inApp !== undefined ? preferences.channels.inApp : user.notificationPreferences?.channels?.inApp ?? true,
        push: preferences.channels?.push !== undefined ? preferences.channels.push : user.notificationPreferences?.channels?.push ?? true,
        email: preferences.channels?.email !== undefined ? preferences.channels.email : user.notificationPreferences?.channels?.email ?? false,
      },
      types: {
        marketing: preferences.types?.marketing !== undefined ? preferences.types.marketing : user.notificationPreferences?.types?.marketing ?? true,
        sales: preferences.types?.sales !== undefined ? preferences.types.sales : user.notificationPreferences?.types?.sales ?? true,
        support: preferences.types?.support !== undefined ? preferences.types.support : user.notificationPreferences?.types?.support ?? true,
        social: preferences.types?.social !== undefined ? preferences.types.social : user.notificationPreferences?.types?.social ?? true,
        processes: preferences.types?.processes !== undefined ? preferences.types.processes : user.notificationPreferences?.types?.processes ?? true,
        academy: preferences.types?.academy !== undefined ? preferences.types.academy : user.notificationPreferences?.types?.academy ?? true,
        system: preferences.types?.system !== undefined ? preferences.types.system : user.notificationPreferences?.types?.system ?? true,
      },
      quietHours: {
        enabled: preferences.quietHours?.enabled !== undefined ? preferences.quietHours.enabled : user.notificationPreferences?.quietHours?.enabled ?? false,
        start: preferences.quietHours?.start || user.notificationPreferences?.quietHours?.start || "22:00",
        end: preferences.quietHours?.end || user.notificationPreferences?.quietHours?.end || "08:00",
      },
    };

    await user.save();

    res.json({
      success: true,
      message: "Preferências de notificações atualizadas com sucesso",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar preferências de notificações",
    });
  }
};

// Upload de avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Arquivo não enviado",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      // Se o usuário não existir, deletar o arquivo enviado
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Deletar avatar antigo se existir
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Salvar caminho relativo do avatar
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    // Criar notificação de atualização de avatar
    await createNotification({
      userId: req.userId,
      title: "Avatar atualizado",
      message: "Seu avatar foi atualizado com sucesso!",
      type: "success",
      link: "/perfil",
    });

    res.json({
      success: true,
      message: "Avatar atualizado com sucesso!",
      avatar: avatarPath,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company,
        companyCNPJ: user.companyCNPJ,
        avatar: user.avatar,
        cpf: user.cpf,
        birthDate: user.birthDate,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    // Deletar arquivo em caso de erro
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload do avatar",
    });
  }
};

