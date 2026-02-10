import { Navigate } from "react-router-dom";
import { auth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = auth.isAuthenticated();
  const { isAdmin, isLoading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    // Enquanto carrega as roles, não renderiza nada sensível
    return null;
  }

  if (!isAdmin) {
    // Usuário autenticado mas não é admin: manda para o dashboard padrão
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


