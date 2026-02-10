import { 
  Brain, 
  LayoutDashboard, 
  ShoppingCart, 
  MessageSquare, 
  Share2, 
  Settings as SettingsIcon, 
  Shield, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  Menu,
  X,
  Cog,
  Crown,
  Activity,
  DollarSign,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { auth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/dashboard" },
  { icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales" },
  { icon: MessageSquare, label: "WhatsApp", path: "/dashboard/support" },
  { icon: Share2, label: "Marketing & Redes", path: "/dashboard/social" },
  { icon: SettingsIcon, label: "Processos", path: "/dashboard/processes" },
  { icon: Shield, label: "Segurança", path: "/dashboard/security" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Admin - Visão Geral", path: "/admin" },
  { icon: UserCircle, label: "Usuários", path: "/admin/usuarios" },
  { icon: GraduationCap, label: "Cursos", path: "/admin/cursos" },
  { icon: MessageSquare, label: "Consultorias", path: "/admin/consultorias" },
  { icon: Activity, label: "Atividades", path: "/admin/atividades" },
  { icon: Shield, label: "Segurança", path: "/admin/seguranca" },
];

const masterMenuItems = [
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

function DashboardSidebar({ mobileOpen, onMobileOpenChange }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAdmin, isMaster } = useAuth();

  const handleLogoutClick = () => {
    if (isMobile && onMobileOpenChange) {
      onMobileOpenChange(false);
    }
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    auth.logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link 
          to="/" 
          className="flex items-center gap-3"
          onClick={() => {
            if (isMobile && onMobileOpenChange) {
              onMobileOpenChange(false);
            }
          }}
        >
          <div className="relative">
            <Brain className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-display font-bold text-lg">
              Bridge<span className="text-primary">AI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Menu padrão apenas para usuários comuns */}
        {!isAdmin && (
          <>
            {/* Seção: Operações */}
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Operações
                </p>
              )}
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobile && onMobileOpenChange) {
                        onMobileOpenChange(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Seção: BridgeAI Hub */}
            <div className="pt-4 border-t border-sidebar-border mt-4 space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  BridgeAI Hub
                </p>
              )}
              <Link
                to="/redes-sociais"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/10 border border-primary/40 shadow-sm hover:shadow-primary/30 hover:from-primary/30 hover:via-secondary/30 hover:to-primary/20",
                  location.pathname === "/redes-sociais" && "ring-2 ring-primary/60"
                )}
              >
                <Sparkles className="w-5 h-5 flex-shrink-0 text-primary" />
                {(!collapsed || isMobile) && (
                  <span className="font-semibold text-primary">
                    Redes da BridgeAI
                  </span>
                )}
              </Link>
              <Link
                to="/academy"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/academy"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <GraduationCap className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Academy</span>}
              </Link>
              <Link
                to="/afiliados"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/afiliados"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Afiliados</span>}
              </Link>
            </div>

            {/* Seção: Conta (para usuários comuns) */}
            <div className="pt-4 border-t border-sidebar-border mt-4 space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conta
                </p>
              )}
              <Link
                to="/dashboard/settings"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/dashboard/settings"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Cog className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Configurações</span>}
              </Link>
              <Link
                to="/perfil"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/perfil"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <UserCircle className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Meu Perfil</span>}
              </Link>
            </div>

          </>
        )}

        {/* Menu de Admin - apenas para admins, com seções separadas */}
        {isAdmin && (
          <div className="pt-4 border-t border-sidebar-border mt-4 space-y-2">
            <div className="flex items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Crown className="w-4 h-4 text-warning" />
              {!collapsed && <span>Administração</span>}
            </div>
            {/* Grupo: Visão Geral */}
            <div className="space-y-1 mt-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Visão geral
                </p>
              )}
              {adminMenuItems
                .filter((item) => item.path === "/admin" || item.path === "/admin/usuarios")
                .map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onMobileOpenChange) {
                          onMobileOpenChange(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
            </div>

            {/* Grupo: Academy & Consultorias */}
            <div className="pt-3 space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Academy & Consultorias
                </p>
              )}
              {adminMenuItems
                .filter(
                  (item) =>
                    item.path === "/admin/cursos" || item.path === "/admin/consultorias"
                )
                .map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onMobileOpenChange) {
                          onMobileOpenChange(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
            </div>

            {/* Grupo: Monitoramento & Segurança */}
            <div className="pt-3 space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Monitoramento
                </p>
              )}
              {adminMenuItems
                .filter(
                  (item) =>
                    item.path === "/admin/atividades" || item.path === "/admin/seguranca"
                )
                .map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onMobileOpenChange) {
                          onMobileOpenChange(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
            </div>
            {/* Menu de Master - apenas para master, mesmo estilo das demais seções */}
            {isMaster && (
              <div className="pt-3 space-y-1">
                {!collapsed && (
                  <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Financeiro
                  </p>
                )}
                {masterMenuItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onMobileOpenChange) {
                          onMobileOpenChange(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Seção: Conta (visível para todos, incluindo admin/master) */}
            <div className="pt-4 border-t border-sidebar-border mt-4 space-y-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conta
                </p>
              )}
              <Link
                to="/dashboard/settings"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/dashboard/settings"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Cog className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Configurações</span>}
              </Link>
              <Link
                to="/perfil"
                onClick={() => {
                  if (isMobile && onMobileOpenChange) {
                    onMobileOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === "/perfil"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <UserCircle className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span className="font-medium">Meu Perfil</span>}
              </Link>
            </div>
          </div>
        )}

      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 w-full"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Recolher</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 w-full text-left"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <div className="flex h-full flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          className={cn(
            "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Dialog de Confirmação de Logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Confirmar saída
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, sair da conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DashboardSidebar;
