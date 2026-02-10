import { Permission, Role } from "../models/Role.js";
import { User } from "../models/User.js";

/**
 * Inicializa permissões e roles padrão do sistema
 */
export async function initializePermissions() {
  try {

    // Definir todas as permissões padrão
    const defaultPermissions = [
      // Marketing
      { name: "marketing:create", module: "marketing", action: "create", description: "Criar campanhas de marketing" },
      { name: "marketing:read", module: "marketing", action: "read", description: "Visualizar campanhas de marketing" },
      { name: "marketing:update", module: "marketing", action: "update", description: "Editar campanhas de marketing" },
      { name: "marketing:delete", module: "marketing", action: "delete", description: "Deletar campanhas de marketing" },
      { name: "marketing:manage", module: "marketing", action: "manage", description: "Gerenciar todas as campanhas de marketing" },

      // Sales
      { name: "sales:create", module: "sales", action: "create", description: "Criar oportunidades de vendas" },
      { name: "sales:read", module: "sales", action: "read", description: "Visualizar oportunidades de vendas" },
      { name: "sales:update", module: "sales", action: "update", description: "Editar oportunidades de vendas" },
      { name: "sales:delete", module: "sales", action: "delete", description: "Deletar oportunidades de vendas" },
      { name: "sales:manage", module: "sales", action: "manage", description: "Gerenciar todas as oportunidades de vendas" },

      // Support
      { name: "support:create", module: "support", action: "create", description: "Criar tickets de suporte" },
      { name: "support:read", module: "support", action: "read", description: "Visualizar tickets de suporte" },
      { name: "support:update", module: "support", action: "update", description: "Editar tickets de suporte" },
      { name: "support:delete", module: "support", action: "delete", description: "Deletar tickets de suporte" },
      { name: "support:manage", module: "support", action: "manage", description: "Gerenciar todos os tickets de suporte" },

      // Social
      { name: "social:create", module: "social", action: "create", description: "Criar posts em redes sociais" },
      { name: "social:read", module: "social", action: "read", description: "Visualizar posts em redes sociais" },
      { name: "social:update", module: "social", action: "update", description: "Editar posts em redes sociais" },
      { name: "social:delete", module: "social", action: "delete", description: "Deletar posts em redes sociais" },
      { name: "social:manage", module: "social", action: "manage", description: "Gerenciar todos os posts em redes sociais" },

      // Processes
      { name: "processes:create", module: "processes", action: "create", description: "Criar processos e workflows" },
      { name: "processes:read", module: "processes", action: "read", description: "Visualizar processos e workflows" },
      { name: "processes:update", module: "processes", action: "update", description: "Editar processos e workflows" },
      { name: "processes:delete", module: "processes", action: "delete", description: "Deletar processos e workflows" },
      { name: "processes:manage", module: "processes", action: "manage", description: "Gerenciar todos os processos e workflows" },

      // Security
      { name: "security:create", module: "security", action: "create", description: "Criar configurações de segurança" },
      { name: "security:read", module: "security", action: "read", description: "Visualizar configurações de segurança" },
      { name: "security:update", module: "security", action: "update", description: "Editar configurações de segurança" },
      { name: "security:delete", module: "security", action: "delete", description: "Deletar configurações de segurança" },
      { name: "security:manage", module: "security", action: "manage", description: "Gerenciar todas as configurações de segurança" },

      // Academy
      { name: "academy:create", module: "academy", action: "create", description: "Criar cursos e conteúdos" },
      { name: "academy:read", module: "academy", action: "read", description: "Visualizar cursos e conteúdos" },
      { name: "academy:update", module: "academy", action: "update", description: "Editar cursos e conteúdos" },
      { name: "academy:delete", module: "academy", action: "delete", description: "Deletar cursos e conteúdos" },
      { name: "academy:manage", module: "academy", action: "manage", description: "Gerenciar todos os cursos e conteúdos" },

      // Dashboard
      { name: "dashboard:read", module: "dashboard", action: "read", description: "Visualizar dashboard" },
      { name: "dashboard:manage", module: "dashboard", action: "manage", description: "Gerenciar dashboard" },

      // Users
      { name: "users:read", module: "users", action: "read", description: "Visualizar usuários" },
      { name: "users:update", module: "users", action: "update", description: "Editar usuários" },
      { name: "users:delete", module: "users", action: "delete", description: "Deletar usuários" },
      { name: "users:manage", module: "users", action: "manage", description: "Gerenciar usuários, roles e permissões" },
    ];

    // Criar permissões que não existem
    for (const perm of defaultPermissions) {
      await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
    }


    // Buscar todas as permissões criadas
    const allPermissions = await Permission.find();

    // Criar roles padrão
    const masterPermissions = allPermissions.map((p) => p._id);
    const adminPermissions = allPermissions
      // Admin não vê nada de financeiro (módulo de vendas)
      .filter((p) => p.module !== "sales")
      .map((p) => p._id);
    const userPermissions = allPermissions
      .filter((p) => p.action === "read" || p.action === "create" || (p.module === "support" && p.action === "update"))
      .map((p) => p._id);

    // Role: Master (acesso total + financeiro)
    await Role.findOneAndUpdate(
      { name: "master" },
      {
        name: "master",
        description: "Master com acesso total ao sistema e área financeira",
        permissions: masterPermissions,
        isSystem: true,
      },
      { upsert: true, new: true }
    );

    // Role: Admin (gerência sem financeiro)
    await Role.findOneAndUpdate(
      { name: "admin" },
      {
        name: "admin",
        description: "Administrador com acesso ao painel e operações, sem financeiro completo",
        permissions: adminPermissions,
        isSystem: true,
      },
      { upsert: true, new: true }
    );

    // Role: User (acesso básico)
    await Role.findOneAndUpdate(
      { name: "user" },
      {
        name: "user",
        description: "Usuário com acesso básico ao sistema",
        permissions: userPermissions,
        isSystem: true,
      },
      { upsert: true, new: true }
    );


    // Remover role "manager" se existir (não é mais usada)
    const managerRole = await Role.findOne({ name: "manager" });
    if (managerRole) {
      // Remover role "manager" de todos os usuários que a possuem
      await User.updateMany(
        { roles: managerRole._id },
        { $pull: { roles: managerRole._id } }
      );
      // Deletar a role
      await Role.deleteOne({ name: "manager" });
    }

    // Atribuir role "user" padrão a todos os usuários sem role
    const usersWithoutRoles = await User.find({ $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] });
    if (usersWithoutRoles.length > 0) {
      const defaultRole = await Role.findOne({ name: "user" });
      if (defaultRole) {
        await User.updateMany(
          { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] },
          { $set: { roles: [defaultRole._id] } }
        );
      }
    }

  } catch (error) {
    console.error("❌ Erro ao inicializar permissões:", error);
    throw error;
  }
}





