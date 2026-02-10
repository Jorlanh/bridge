import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  company?: string;
  roles?: string[];
  permissions?: string[];
}

export function useAuth() {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const authUser = auth.getUser();
    
    try {
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Buscar perfil completo com roles
      const profileResult = await api.getProfile();
      if (profileResult.success && profileResult.user) {
        const userData = profileResult.user as any;
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          company: userData.company,
          roles: userData.roles || [],
          permissions: userData.permissions || [],
        });
        
        // Verificar roles
        const rolesNames = (userData.roles || []).map((r: string | { name: string }) =>
          typeof r === "string" ? r : r.name,
        );
        const hasMasterRole = rolesNames.includes("master");
        const hasAdminRole = rolesNames.includes("admin") || hasMasterRole;

        setIsAdmin(hasAdminRole);
        setIsMaster(hasMasterRole);
      }
    } catch (error: any) {
      // Erro de CORS ou rede - não quebrar a aplicação
      if (error.message?.includes("CORS") || error.message?.includes("NetworkError") || error.message?.includes("Failed to fetch")) {
        console.warn("⚠️  Erro de conexão com o servidor. Verifique se o servidor está rodando.");
        // Usar dados básicos do usuário do localStorage
        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            company: authUser.company,
            roles: [],
            permissions: [],
          });
          setIsAdmin(false);
          setIsMaster(false);
        }
      } else {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAdmin,
    isMaster,
    isLoading,
    refresh: loadUserData,
  };
}

