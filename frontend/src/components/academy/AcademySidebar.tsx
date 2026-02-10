import { 
  Brain, 
  Home, 
  BookOpen, 
  Award, 
  Users, 
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn, openWhatsApp } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

const menuItems = [
  { icon: Home, label: "Início", path: "/academy" },
  { icon: BookOpen, label: "Meus Cursos", path: "/academy/courses" },
  { icon: Award, label: "Certificados", path: "/academy/certificates" },
  { icon: Users, label: "Consultoria em Grupo", path: "/academy/consulting" },
];

export function AcademySidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/academy" className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-8 h-8 text-secondary" />
            <div className="absolute inset-0 bg-secondary/30 blur-xl rounded-full" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display font-bold text-lg block">
                Bridge<span className="text-secondary">AI</span>
              </span>
              <span className="text-xs text-muted-foreground">Academy</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-secondary/10 text-secondary border border-secondary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {/* WhatsApp Support */}
        <div className="pt-4 border-t border-sidebar-border mt-4">
          <button
            onClick={() => openWhatsApp("+5519995555280", "Olá! Preciso de suporte sobre a BridgeAI Academy.")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-all duration-200 w-full"
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Suporte WhatsApp</span>}
          </button>
        </div>

        {/* Dashboard Link */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Painel de Controle</span>}
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
