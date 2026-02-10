import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Deal } from "../models/Deal.js";
import { Campaign } from "../models/Campaign.js";
import { Ticket } from "../models/Ticket.js";
import { Workflow } from "../models/Workflow.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Enrollment } from "../models/Enrollment.js";
import { ConsultingSession } from "../models/ConsultingSession.js";
import { Post } from "../models/Post.js";

/**
 * Busca estatísticas gerais do dashboard
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Buscar dados de todas as áreas
    const [deals, campaigns, tickets, workflows, activityLogs, enrollments, posts, consultingSessions] = await Promise.all([
      Deal.find({ userId: req.userId }),
      Campaign.find({ userId: req.userId }),
      Ticket.find({ userId: req.userId }),
      Workflow.find({ userId: req.userId }),
      ActivityLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10),
      Enrollment.find({ userId: req.userId }).populate("courseId", "title").sort({ updatedAt: -1 }).limit(10),
      Post.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10),
      ConsultingSession.find({ participants: req.userId }).sort({ date: -1, time: -1 }).limit(10),
    ]);

    // Calcular automações ativas
    const activeAutomations = workflows.filter(w => w.status === "active").length;

    // Calcular leads capturados (soma de leads de todas as campanhas)
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);

    // Calcular tickets resolvidos
    const resolvedTickets = tickets.filter(t => t.status === "resolved").length;
    const resolutionRate = tickets.length > 0 
      ? Math.round((resolvedTickets / tickets.length) * 100) 
      : 0;

    // Calcular ROI estimado (baseado em campanhas)
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const roi = totalSpent > 0 
      ? Math.round(((totalBudget - totalSpent) / totalSpent) * 100) 
      : 0;

    // Preparar dados do gráfico de performance (últimos 7 meses)
    const performanceData = [];
    const now = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = monthNames[targetDate.getMonth()];
      
      // Contar automações criadas neste mês
      const monthAutomations = workflows.filter(w => {
        const created = new Date(w.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      // Calcular leads capturados neste mês
      // Opção 1: Leads de campanhas criadas neste mês
      const campaignsCreatedInMonth = campaigns.filter(c => {
        const created = new Date(c.createdAt);
        return created >= monthStart && created <= monthEnd;
      });
      
      let monthLeads = campaignsCreatedInMonth.reduce((sum, c) => sum + (c.leads || 0), 0);
      
      // Opção 2: Se não houver campanhas criadas, buscar campanhas ativas durante o mês
      if (monthLeads === 0) {
        const activeCampaignsInMonth = campaigns.filter(c => {
          if (c.status !== "active") return false;
          
          const campaignStart = new Date(c.startDate);
          const campaignEnd = c.endDate ? new Date(c.endDate) : now;
          
          // Verificar se a campanha estava ativa durante este mês
          return campaignStart <= monthEnd && campaignEnd >= monthStart;
        });
        
        // Distribuir leads proporcionalmente baseado na duração da campanha
        activeCampaignsInMonth.forEach(campaign => {
          const campaignStart = new Date(campaign.startDate);
          const campaignEnd = campaign.endDate ? new Date(campaign.endDate) : now;
          const totalDays = Math.ceil((campaignEnd.getTime() - campaignStart.getTime()) / (24 * 60 * 60 * 1000));
          
          if (totalDays > 0) {
            // Calcular quantos dias da campanha estão neste mês
            const monthStartTime = Math.max(monthStart.getTime(), campaignStart.getTime());
            const monthEndTime = Math.min(monthEnd.getTime(), campaignEnd.getTime());
            const daysInMonth = Math.ceil((monthEndTime - monthStartTime) / (24 * 60 * 60 * 1000));
            
            if (daysInMonth > 0) {
              monthLeads += Math.round((campaign.leads || 0) * (daysInMonth / totalDays));
            }
          }
        });
      }
      
      performanceData.push({
        name: monthName,
        automacoes: monthAutomations,
        leads: monthLeads,
      });
    }

    // Preparar atividades recentes de múltiplas fontes
    const allActivities: any[] = [];

    // 1. Atividades dos logs de atividade
    activityLogs.forEach(log => {
      let icon = "Zap";
      let type: "automation" | "lead" | "support" | "meeting" = "automation";
      
      if (log.action.toLowerCase().includes("ticket") || log.action.toLowerCase().includes("suporte")) {
        icon = "MessageSquare";
        type = "support";
      } else if (log.action.toLowerCase().includes("lead") || log.action.toLowerCase().includes("campanha")) {
        icon = "Users";
        type = "lead";
      } else if (log.action.toLowerCase().includes("reunião") || log.action.toLowerCase().includes("meeting")) {
        icon = "Mail";
        type = "meeting";
      }

      const timeAgo = getTimeAgo(log.createdAt);
      
      allActivities.push({
        icon,
        title: log.action,
        description: log.user || "Sistema",
        time: timeAgo,
        type,
        createdAt: log.createdAt,
      });
    });

    // 2. Atividades de campanhas recentes (últimas 5)
    const recentCampaigns = campaigns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentCampaigns.forEach(campaign => {
      allActivities.push({
        icon: "Users",
        title: `Campanha "${campaign.name}" ${campaign.status === "active" ? "ativada" : "criada"}`,
        description: `${campaign.leads} leads capturados`,
        time: getTimeAgo(campaign.createdAt),
        type: "lead" as const,
        createdAt: campaign.createdAt,
      });
    });

    // 3. Atividades de tickets recentes (últimos 5)
    const recentTickets = tickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentTickets.forEach(ticket => {
      allActivities.push({
        icon: "MessageSquare",
        title: `Ticket #${ticket._id.toString().slice(-6)} ${ticket.status === "resolved" ? "resolvido" : "criado"}`,
        description: ticket.subject || "Sem assunto",
        time: getTimeAgo(ticket.createdAt),
        type: "support" as const,
        createdAt: ticket.createdAt,
      });
    });

    // 4. Atividades de deals recentes (últimos 5)
    const recentDeals = deals
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentDeals.forEach(deal => {
      allActivities.push({
        icon: "Zap",
        title: `Oportunidade "${deal.company}" ${deal.stage === "Fechamento" ? "em fechamento" : "atualizada"}`,
        description: `Valor: R$ ${deal.value?.toLocaleString("pt-BR") || "0"}`,
        time: getTimeAgo(deal.createdAt),
        type: "automation" as const,
        createdAt: deal.createdAt,
      });
    });

    // 5. Atividades de workflows recentes (últimos 5)
    const recentWorkflows = workflows
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentWorkflows.forEach(workflow => {
      allActivities.push({
        icon: "Zap",
        title: `Automação "${workflow.name}" ${workflow.status === "active" ? "ativada" : "criada"}`,
        description: `${workflow.steps || 0} etapas configuradas`,
        time: getTimeAgo(workflow.createdAt),
        type: "automation" as const,
        createdAt: workflow.createdAt,
      });
    });

    // 6. Atividades de matrículas em cursos (últimas 5)
    enrollments.forEach((enrollment: any) => {
      const course = enrollment.courseId;
      const courseTitle = course?.title || "Curso";
      const isCompleted = enrollment.progress === 100;
      
      allActivities.push({
        icon: "GraduationCap",
        title: `${isCompleted ? "Curso concluído" : "Progresso no curso"}: ${courseTitle}`,
        description: isCompleted 
          ? "Parabéns! Você completou este curso"
          : `${enrollment.progress}% concluído`,
        time: getTimeAgo(enrollment.updatedAt || enrollment.createdAt),
        type: "meeting" as const,
        createdAt: enrollment.updatedAt || enrollment.createdAt,
      });
    });

    // 7. Atividades de posts em redes sociais (últimos 5)
    posts.forEach(post => {
      allActivities.push({
        icon: "Share2",
        title: `Post ${post.status === "published" ? "publicado" : post.status === "scheduled" ? "agendado" : "criado"} no ${post.platform}`,
        description: post.content?.substring(0, 50) + (post.content?.length > 50 ? "..." : "") || "Sem conteúdo",
        time: getTimeAgo(post.createdAt),
        type: "lead" as const,
        createdAt: post.createdAt,
      });
    });

    // 8. Atividades de consultorias (últimas 5)
    consultingSessions.forEach((session: any) => {
      const isEnrolled = session.participants?.some((p: any) => p.toString() === req.userId?.toString());
      if (isEnrolled) {
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.time.split(":").map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        
        allActivities.push({
          icon: "Video",
          title: `Consultoria "${session.title}" ${session.status === "completed" ? "concluída" : "agendada"}`,
          description: `${new Date(session.date).toLocaleDateString("pt-BR")} às ${session.time}`,
          time: getTimeAgo(sessionDate),
          type: "meeting" as const,
          createdAt: sessionDate,
        });
      }
    });


    // Ordenar todas as atividades por data (mais recentes primeiro) e pegar as 10 mais recentes
    const activities = allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(({ createdAt, ...rest }) => rest); // Remover createdAt do resultado final

    res.json({
      success: true,
      stats: {
        activeAutomations,
        totalLeads,
        resolvedTickets,
        resolutionRate,
        roi,
      },
      performanceData,
      activities,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas do dashboard",
    });
  }
};

/**
 * Função auxiliar para calcular tempo relativo
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}


