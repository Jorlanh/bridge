import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AutomationCard } from "@/components/dashboard/AutomationCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Zap, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ShoppingCart,
  Mail,
  Share2,
  Settings,
  Shield,
  GraduationCap,
  Calendar,
  Video,
  BookOpen,
  CheckCircle2
} from "lucide-react";

const automations = [
  {
    title: "Automação de Vendas",
    description: "CRM inteligente com pipeline automatizado",
    icon: ShoppingCart,
    items: ["CRM inteligente", "Pipeline de vendas", "Follow-ups automáticos", "Scripts de vendas com IA"],
    status: "active" as const,
    path: "/dashboard/sales",
  },
  {
    title: "Atendimento e Suporte",
    description: "Chatbot IA e WhatsApp automatizado",
    icon: MessageSquare,
    items: ["Chatbot IA", "WhatsApp automatizado", "Central de tickets", "Respostas rápidas inteligentes"],
    status: "active" as const,
    path: "/dashboard/support",
  },
  {
    title: "Marketing & Redes Sociais",
    description: "Automação de marketing digital e gestão de redes sociais",
    icon: Share2,
    items: ["Marketing com IA", "Criação de conteúdo", "Calendário editorial", "Métricas de marketing"],
    status: "active" as const,
    path: "/dashboard/social",
  },
  {
    title: "Otimização de Processos",
    description: "Fluxos e tarefas automatizadas",
    icon: Settings,
    items: ["Fluxos automatizados", "Checklists inteligentes", "Automação de tarefas", "Painel de produtividade"],
    status: "active" as const,
    path: "/dashboard/processes",
  },
  {
    title: "Segurança e Controle",
    description: "Gestão de usuários e proteção de dados",
    icon: Shield,
    items: ["Gestão de usuários", "Permissões", "Logs de atividade", "Proteção de dados"],
    status: "active" as const,
    path: "/dashboard/security",
  },
];

// Mapeamento de ícones para atividades
const iconMap: Record<string, typeof Zap> = {
  Zap,
  MessageSquare,
  Users,
  Mail,
  GraduationCap,
  Calendar,
  Video,
  BookOpen,
  CheckCircle2,
  Share2,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Se for admin, não deve ver o dashboard de usuário: redireciona para o painel admin
    if (!authLoading && isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    loadDashboardData();
  }, [authLoading, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const result = await dashboardApi.getStats();
      
      if (result.success) {
        setStats(result.stats);
        setPerformanceData(result.performanceData || []);
        
        // Converter atividades para o formato esperado pelo ActivityFeed
        const formattedActivities = (result.activities || []).map((activity: any) => ({
          icon: iconMap[activity.icon] || Zap,
          title: activity.title,
          description: activity.description,
          time: activity.time,
          type: activity.type,
        }));
        setActivities(formattedActivities);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Painel de Controle" 
          subtitle="Central de automação empresarial"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Automações Ativas"
                value={stats?.activeAutomations?.toString() || "0"}
                change="Ativas no sistema"
                changeType="positive"
                icon={Zap}
              />
              <StatCard
                title="Leads Capturados"
                value={stats?.totalLeads?.toLocaleString("pt-BR") || "0"}
                change="Total de leads"
                changeType="positive"
                icon={Users}
              />
              <StatCard
                title="Tickets Resolvidos"
                value={stats?.resolvedTickets?.toString() || "0"}
                change={stats?.resolutionRate ? `${stats.resolutionRate}% taxa de resolução` : "Sem dados"}
                changeType="positive"
                icon={MessageSquare}
              />
              <StatCard
                title="ROI Estimado"
                value={stats?.roi ? `${stats.roi}%` : "0%"}
                change="Retorno sobre investimento"
                changeType={stats?.roi > 0 ? "positive" : "negative"}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PerformanceChart data={performanceData} />
            </div>
            <ActivityFeed activities={activities} />
          </div>

          {/* Automations Grid */}
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl mb-2">Módulos de Automação</h2>
            <p className="text-muted-foreground mb-6">Gerencie todas as automações da sua empresa</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automations.map((automation, index) => (
                <AutomationCard
                  key={index}
                  {...automation}
                  onClick={() => navigate(automation.path)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
