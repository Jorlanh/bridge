import { Response } from "express";
import { AuthRequest, isMaster } from "../middleware/auth.js";
import { Deal } from "../models/Deal.js";
import { Campaign } from "../models/Campaign.js";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";

/**
 * Estatísticas financeiras completas (apenas master)
 */
export const getFinancialStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!isMaster(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas master pode acessar dados financeiros.",
      });
    }

    // Buscar todos os deals (oportunidades de vendas)
    const deals = await Deal.find().lean();
    
    // Buscar todas as campanhas
    const campaigns = await Campaign.find().lean();
    
    // Buscar matrículas (para referência, mas não calculamos receita de cursos sem campo de preço)
    const enrollments = await Enrollment.find()
      .populate("courseId", "title category")
      .lean();

    // Calcular receitas REAIS dos deals
    const totalRevenue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    
    // Receita fechada: deals em estágios de fechamento
    const closedDeals = deals.filter((d: any) => 
      d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho"
    );
    const closedRevenue = closedDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    
    // Receita esperada: baseada em probabilidades reais
    const expectedRevenue = deals.reduce((sum: number, d: any) => {
      const probability = (d.probability || 0) / 100;
      return sum + (d.value || 0) * probability;
    }, 0);

    // Calcular despesas REAIS (gastos com campanhas)
    const totalSpent = campaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0);
    const totalBudget = campaigns.reduce((sum: number, c: any) => sum + (c.budget || 0), 0);
    const remainingBudget = totalBudget - totalSpent;

    // Receita de cursos: 0 por enquanto (não há campo de preço no modelo Course)
    // Se no futuro adicionar campo 'price' no Course, calcular aqui
    const courseRevenue = 0;

    // Lucro REAL
    const profit = closedRevenue + courseRevenue - totalSpent;
    const profitMargin = closedRevenue > 0 ? ((profit / closedRevenue) * 100) : 0;

    // Receita por mês (últimos 6 meses) - baseado em datas REAIS
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthDeals = deals.filter((d: any) => {
        const dealDate = new Date(d.createdAt || d.updatedAt);
        return dealDate >= monthStart && dealDate <= monthEnd && 
               (d.stage === "Fechamento" || d.stage === "Concluído" || d.stage === "Ganho");
      });
      
      const monthRevenue = monthDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        revenue: monthRevenue,
      });
    }

    // Despesas por mês (últimos 6 meses) - baseado em datas REAIS
    const monthlyExpenses = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthCampaigns = campaigns.filter((c: any) => {
        const campaignDate = new Date(c.createdAt || c.updatedAt);
        return campaignDate >= monthStart && campaignDate <= monthEnd;
      });
      
      const monthSpent = monthCampaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0);
      
      monthlyExpenses.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        expenses: monthSpent,
      });
    }

    // Top deals (maiores oportunidades) - valores REAIS
    const topDeals = deals
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
      .slice(0, 10)
      .map((d: any) => ({
        id: d._id.toString(),
        company: d.company,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        owner: d.owner,
      }));

    // Campanhas por ROI REAL (eficiencia de leads por real gasto)
    const campaignsROI = campaigns.map((c: any) => {
      // ROI = (leads gerados / valor gasto) * 100
      // Quanto maior, melhor: mais leads por real investido
      const roi = c.spent > 0 ? ((c.leads || 0) / c.spent) * 100 : 0;
      return {
        id: c._id.toString(),
        name: c.name,
        budget: c.budget,
        spent: c.spent,
        leads: c.leads,
        roi: roi.toFixed(2),
        status: c.status,
      };
    }).sort((a: any, b: any) => parseFloat(b.roi) - parseFloat(a.roi));

    res.json({
      success: true,
      stats: {
        revenue: {
          total: totalRevenue,
          closed: closedRevenue,
          expected: expectedRevenue,
          fromCourses: courseRevenue,
        },
        expenses: {
          total: totalSpent,
          Sbudget: totalBudget,
          remaining: remainingBudget,
        },
        profit: {
          total: profit,
          margin: profitMargin.toFixed(2),
        },
        monthly: {
          revenue: monthlyRevenue,
          expenses: monthlyExpenses,
        },
        topDeals,
        campaignsROI,
      },
    });
  } catch (error) {
    console.error("Get financial stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas financeiras",
    });
  }
};
