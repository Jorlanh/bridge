import { Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.js";
import { Role, Permission } from "../models/Role.js";
import { User } from "../models/User.js";

// Schemas de validação
const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da role deve ter no mínimo 2 caracteres")
    .max(50, "O nome da role deve ter no máximo 50 caracteres")
    .trim()
    .regex(/^[a-zA-Z0-9_\s]+$/, "O nome da role pode conter apenas letras, números, espaços e underscore"),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres")
    .trim()
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "A role deve ter pelo menos uma permissão"),
});

const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da role deve ter no mínimo 2 caracteres")
    .max(50, "O nome da role deve ter no máximo 50 caracteres")
    .trim()
    .regex(/^[a-zA-Z0-9_\s]+$/, "O nome da role pode conter apenas letras, números, espaços e underscore")
    .optional(),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres")
    .trim()
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "A role deve ter pelo menos uma permissão")
    .optional(),
});

const assignRoleSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  roleIds: z.array(z.string()).min(1, "Deve atribuir pelo menos uma role"),
});

// Buscar todas as roles
export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.find().populate("permissions").sort({ name: 1 });

    res.json({
      success: true,
      roles: roles.map((role) => ({
        id: role._id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((perm: any) => ({
          id: perm._id.toString(),
          name: perm.name,
          module: perm.module,
          action: perm.action,
          description: perm.description,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar roles",
    });
  }
};

// Buscar todas as permissões
export const getPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, action: 1 });

    res.json({
      success: true,
      permissions: permissions.map((perm) => ({
        id: perm._id.toString(),
        name: perm.name,
        module: perm.module,
        action: perm.action,
        description: perm.description,
      })),
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar permissões",
    });
  }
};

// Criar nova role
export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const data = createRoleSchema.parse(req.body);

    // Verificar se a role já existe
    const existingRole = await Role.findOne({ name: data.name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Já existe uma role com este nome",
      });
    }

    // Verificar se as permissões existem
    const permissions = await Permission.find({ _id: { $in: data.permissions } });
    if (permissions.length !== data.permissions.length) {
      return res.status(400).json({
        success: false,
        message: "Uma ou mais permissões não foram encontradas",
      });
    }

    const role = await Role.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
    });

    await role.populate("permissions");

    res.status(201).json({
      success: true,
      message: "Role criada com sucesso",
      role: {
        id: role._id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((perm: any) => ({
          id: perm._id.toString(),
          name: perm.name,
          module: perm.module,
          action: perm.action,
        })),
      },
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

    console.error("Create role error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar role",
    });
  }
};

// Atualizar role
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateRoleSchema.parse(req.body);

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role não encontrada",
      });
    }

    // Não permitir atualizar roles do sistema
    if (role.isSystem && data.name && data.name !== role.name) {
      return res.status(403).json({
        success: false,
        message: "Não é possível alterar o nome de uma role do sistema",
      });
    }

    // Se atualizando nome, verificar se já existe outra role com esse nome
    if (data.name && data.name !== role.name) {
      const existingRole = await Role.findOne({ name: data.name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: "Já existe uma role com este nome",
        });
      }
      role.name = data.name;
    }

    if (data.description !== undefined) {
      role.description = data.description;
    }

    if (data.permissions) {
      // Verificar se as permissões existem
      const permissions = await Permission.find({ _id: { $in: data.permissions } });
      if (permissions.length !== data.permissions.length) {
        return res.status(400).json({
          success: false,
          message: "Uma ou mais permissões não foram encontradas",
        });
      }
      role.permissions = data.permissions.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    await role.save();
    await role.populate("permissions");

    res.json({
      success: true,
      message: "Role atualizada com sucesso",
      role: {
        id: role._id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((perm: any) => ({
          id: perm._id.toString(),
          name: perm.name,
          module: perm.module,
          action: perm.action,
        })),
      },
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

    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar role",
    });
  }
};

// Deletar role
export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role não encontrada",
      });
    }

    // Não permitir deletar roles do sistema
    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: "Não é possível deletar uma role do sistema",
      });
    }

    // Verificar se há usuários com esta role
    const usersWithRole = await User.countDocuments({ roles: id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível deletar esta role. Ela está atribuída a ${usersWithRole} usuário(s)`,
      });
    }

    await Role.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Role deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar role",
    });
  }
};

// Atribuir roles a um usuário
export const assignRolesToUser = async (req: AuthRequest, res: Response) => {
  try {
    const data = assignRoleSchema.parse(req.body);

    const user = await User.findById(data.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Verificar se as roles existem
    const roles = await Role.find({ _id: { $in: data.roleIds } });
    if (roles.length !== data.roleIds.length) {
      return res.status(400).json({
        success: false,
        message: "Uma ou mais roles não foram encontradas",
      });
    }

    user.roles = data.roleIds.map((id: string) => new mongoose.Types.ObjectId(id));
    await user.save();

    res.json({
      success: true,
      message: "Roles atribuídas com sucesso",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: data.roleIds,
      },
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

    console.error("Assign roles error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atribuir roles",
    });
  }
};

// Buscar roles de um usuário
export const getUserRoles = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: "roles",
      populate: {
        path: "permissions",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      roles: user.roles
        ? user.roles.map((role: any) => ({
            id: role._id.toString(),
            name: role.name,
            description: role.description,
            permissions: role.permissions.map((perm: any) => ({
              id: perm._id.toString(),
              name: perm.name,
              module: perm.module,
              action: perm.action,
            })),
          }))
        : [],
    });
  } catch (error) {
    console.error("Get user roles error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar roles do usuário",
    });
  }
};





