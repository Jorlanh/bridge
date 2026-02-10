import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Target,
  Users,
  Phone,
  Mail,
  Calendar,
  Plus,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Download,
  X,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { salesApi, Deal, FollowUp } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Sales() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Estados para modais
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedScriptType, setSelectedScriptType] = useState<string>("");

  // Estados para formulários
  const [dealForm, setDealForm] = useState({
    company: "",
    value: "",
    stage: "Prospecção",
    probability: "",
    owner: "",
    nextAction: "",
  });

  const [followUpForm, setFollowUpForm] = useState({
    type: "Ligação",
    contact: "",
    date: "",
    time: "",
  });

  const [scriptContext, setScriptContext] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Estados para filtros avançados
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterMinValue, setFilterMinValue] = useState("");
  const [filterMaxValue, setFilterMaxValue] = useState("");
  const [filterProbability, setFilterProbability] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros quando deals ou filtros mudarem
  useEffect(() => {
    let filtered = [...deals];

    // Filtro de busca por texto
    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estágio
    if (filterStage !== "all") {
      filtered = filtered.filter(deal => deal.stage === filterStage);
    }

    // Filtro por proprietário
    if (filterOwner !== "all") {
      filtered = filtered.filter(deal => deal.owner === filterOwner);
    }

    // Filtro por valor mínimo
    if (filterMinValue) {
      const minValue = parseFloat(filterMinValue);
      filtered = filtered.filter(deal => deal.value >= minValue);
    }

    // Filtro por valor máximo
    if (filterMaxValue) {
      const maxValue = parseFloat(filterMaxValue);
      filtered = filtered.filter(deal => deal.value <= maxValue);
    }

    // Filtro por probabilidade
    if (filterProbability !== "all") {
      const probRanges: { [key: string]: [number, number] } = {
        "low": [0, 30],
        "medium": [31, 70],
        "high": [71, 100]
      };
      const [min, max] = probRanges[filterProbability];
      filtered = filtered.filter(deal => deal.probability >= min && deal.probability <= max);
    }

    setFilteredDeals(filtered);
  }, [deals, searchTerm, filterStage, filterOwner, filterMinValue, filterMaxValue, filterProbability]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dealsResult, followUpsResult, statsResult] = await Promise.all([
        salesApi.getDeals().catch(() => ({ success: false, deals: [] })),
        salesApi.getFollowUps().catch(() => ({ success: false, followUps: [] })),
        salesApi.getStats().catch(() => ({ success: false, stats: null })),
      ]);

      if (dealsResult.success) setDeals(dealsResult.deals);
      if (followUpsResult.success) setFollowUps(followUpsResult.followUps);
      if (statsResult.success) setStats(statsResult.stats);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    try {
      if (!dealForm.company || !dealForm.value || !dealForm.owner) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const result = await salesApi.createDeal({
        company: dealForm.company,
        value: parseFloat(dealForm.value),
        stage: dealForm.stage,
        probability: dealForm.probability ? parseInt(dealForm.probability) : 0,
        owner: dealForm.owner,
        nextAction: dealForm.nextAction || undefined,
      });

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Oportunidade criada com sucesso!",
        });
        setDealModalOpen(false);
        setDealForm({
          company: "",
          value: "",
          stage: "Prospecção",
          probability: "",
          owner: "",
          nextAction: "",
        });
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar oportunidade",
        variant: "destructive",
      });
    }
  };

  const handleCreateFollowUp = async () => {
    try {
      if (!followUpForm.contact || !followUpForm.date || !followUpForm.time) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const result = await salesApi.createFollowUp({
        type: followUpForm.type,
        contact: followUpForm.contact,
        date: followUpForm.date,
        time: followUpForm.time,
      });

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Follow-up agendado com sucesso!",
        });
        setFollowUpModalOpen(false);
        setFollowUpForm({
          type: "Ligação",
          contact: "",
          date: "",
          time: "",
        });
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao agendar follow-up",
        variant: "destructive",
      });
    }
  };

  const handleGenerateScript = async (type: string) => {
    setSelectedScriptType(type);
    setScriptModalOpen(true);
    setGeneratedScript("");
    setScriptContext("");

    // Gerar script automaticamente quando o modal abrir
    try {
      setIsGeneratingScript(true);

      const result = await salesApi.generateScript(
        type as "prospecção" | "apresentação" | "objeções" | "fechamento",
        undefined
      );

      if (result.success && result.script) {
        setGeneratedScript(result.script);
      } else {
        toast({
          title: "Erro ao gerar script",
          description: "Não foi possível gerar o script no momento. Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao gerar script";
      toast({
        title: "Erro ao gerar script",
        description: errorMessage.includes("Limite de requisições") || errorMessage.includes("quota") 
          ? errorMessage 
          : "Não foi possível gerar o script no momento. Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRegenerateScript = async () => {
    if (!selectedScriptType) return;

    try {
      setIsGeneratingScript(true);
      setGeneratedScript("");

      const result = await salesApi.generateScript(
        selectedScriptType as "prospecção" | "apresentação" | "objeções" | "fechamento",
        scriptContext || undefined
      );

      if (result.success && result.script) {
        setGeneratedScript(result.script);
        toast({
          title: "Sucesso",
          description: "Script regenerado com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao gerar script",
          description: "Não foi possível gerar o script no momento. Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao gerar script";
      toast({
        title: "Erro ao gerar script",
        description: errorMessage.includes("Limite de requisições") || errorMessage.includes("quota")
          ? errorMessage
          : "Não foi possível gerar o script no momento. Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Calcular pipeline a partir dos deals reais
  const pipeline = [
    { stage: "Prospecção", count: deals.filter(d => d.stage === "Prospecção").length, value: deals.filter(d => d.stage === "Prospecção").reduce((sum, d) => sum + d.value, 0), color: "bg-blue-500" },
    { stage: "Qualificação", count: deals.filter(d => d.stage === "Qualificação").length, value: deals.filter(d => d.stage === "Qualificação").reduce((sum, d) => sum + d.value, 0), color: "bg-yellow-500" },
    { stage: "Proposta", count: deals.filter(d => d.stage === "Proposta").length, value: deals.filter(d => d.stage === "Proposta").reduce((sum, d) => sum + d.value, 0), color: "bg-orange-500" },
    { stage: "Negociação", count: deals.filter(d => d.stage === "Negociação").length, value: deals.filter(d => d.stage === "Negociação").reduce((sum, d) => sum + d.value, 0), color: "bg-purple-500" },
    { stage: "Fechamento", count: deals.filter(d => d.stage === "Fechamento").length, value: deals.filter(d => d.stage === "Fechamento").reduce((sum, d) => sum + d.value, 0), color: "bg-green-500" },
  ];
  
  // Calcular o máximo de count para evitar divisão por zero
  const maxCount = Math.max(...pipeline.map(s => s.count), 1);

  // Calcular conversão por etapa
  const conversionData = pipeline.map((stage, index) => {
    const previousStage = index > 0 ? pipeline[index - 1] : null;
    const conversionRate = previousStage && previousStage.count > 0 
      ? ((stage.count / previousStage.count) * 100).toFixed(1)
      : "0";
    return {
      stage: stage.stage,
      count: stage.count,
      value: stage.value,
      conversionRate: parseFloat(conversionRate),
      color: stage.color.replace("bg-", "")
    };
  });

  // Calcular previsão de receita (soma dos valores ponderados pela probabilidade)
  const revenueForecast = deals.reduce((sum, deal) => {
    return sum + (deal.value * (deal.probability / 100));
  }, 0);

  // Dados para gráfico de previsão mensal (últimos 6 meses)
  const monthlyForecast = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthDeals = deals.filter(d => {
      const dealDate = new Date(d.createdAt || Date.now());
      return dealDate.getMonth() === date.getMonth() && dealDate.getFullYear() === date.getFullYear();
    });
    const forecast = monthDeals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
    return {
      month: date.toLocaleDateString("pt-BR", { month: "short" }),
      previsão: forecast,
      fechado: monthDeals.filter(d => d.stage === "Fechamento").reduce((sum, d) => sum + d.value, 0)
    };
  });

  // Lista de proprietários únicos para filtro
  const owners = Array.from(new Set(deals.map(d => d.owner)));

  // Função para exportar pipeline
  const handleExportPipeline = () => {
    const csvContent = [
      ["Estágio", "Quantidade", "Valor Total", "Valor Médio", "Taxa de Conversão"],
      ...pipeline.map(stage => [
        stage.stage,
        stage.count.toString(),
        `R$ ${stage.value.toLocaleString("pt-BR")}`,
        stage.count > 0 ? `R$ ${(stage.value / stage.count).toLocaleString("pt-BR")}` : "R$ 0",
        conversionData.find(d => d.stage === stage.stage)?.conversionRate + "%" || "0%"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pipeline_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Pipeline exportado com sucesso!",
    });
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStage("all");
    setFilterOwner("all");
    setFilterMinValue("");
    setFilterMaxValue("");
    setFilterProbability("all");
  };

  const activeFiltersCount = [
    searchTerm,
    filterStage !== "all",
    filterOwner !== "all",
    filterMinValue,
    filterMaxValue,
    filterProbability !== "all"
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Automação de Vendas" 
          subtitle="CRM inteligente com pipeline automatizado"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6 glass-card flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Receita do Mês"
                value={stats?.monthlyRevenue ? `R$ ${(stats.monthlyRevenue / 1000).toFixed(0)}K` : "R$ 0"}
                change={stats?.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}% vs mês anterior` : "Sem dados"}
                changeType={stats?.revenueChange > 0 ? "positive" : "negative"}
                icon={DollarSign}
              />
              <StatCard
                title="Oportunidades"
                value={deals.length.toString()}
                change={stats?.newDeals ? `+${stats.newDeals} novas esta semana` : "Carregando..."}
                changeType="positive"
                icon={Target}
              />
              <StatCard
                title="Taxa de Conversão"
                value={stats?.conversionRate ? `${stats.conversionRate}%` : "0%"}
                change={stats?.conversionChange ? `${stats.conversionChange > 0 ? '+' : ''}${stats.conversionChange}% vs mês anterior` : "Sem dados"}
                changeType={stats?.conversionChange > 0 ? "positive" : "negative"}
                icon={TrendingUp}
              />
              <StatCard
                title="Ticket Médio"
                value={stats?.averageTicket ? `R$ ${(stats.averageTicket / 1000).toFixed(1)}K` : "R$ 0"}
                change={stats?.ticketChange ? `${stats.ticketChange > 0 ? '+' : ''}${stats.ticketChange}% vs mês anterior` : "Sem dados"}
                changeType={stats?.ticketChange > 0 ? "positive" : "negative"}
                icon={ShoppingCart}
              />
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="pipeline" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="deals">Oportunidades</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
              <TabsTrigger value="scripts">Scripts IA</TabsTrigger>
            </TabsList>

            {/* Pipeline */}
            <TabsContent value="pipeline" className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Pipeline de Vendas</h2>
                  <p className="text-muted-foreground">Acompanhe suas oportunidades através do funil de vendas</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExportPipeline}>
                    <Download className="w-4 h-4" />
                    Exportar Pipeline
                  </Button>
                  <Button className="gap-2" onClick={() => setDealModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Nova Oportunidade
                  </Button>
                </div>
              </div>

              {/* Previsão de Receita */}
              <Card className="p-6 glass-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Previsão de Receita</h3>
                    <p className="text-sm text-muted-foreground">Baseada na probabilidade de fechamento</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">R$ {revenueForecast.toLocaleString("pt-BR")}</div>
                    <div className="text-sm text-muted-foreground">Valor total esperado</div>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-5 gap-4">
                {pipeline.map((stage, index) => (
                  <Card key={index} className="p-4 glass-card">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">{stage.stage}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{stage.count}</span>
                        <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        R$ {stage.value.toLocaleString("pt-BR")}
                      </div>
                      {conversionData[index] && conversionData[index].conversionRate > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Conversão: {conversionData[index].conversionRate}%
                        </div>
                      )}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", stage.color)}
                        style={{ width: `${(stage.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              {/* Gráficos de Conversão */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-4">Taxa de Conversão por Etapa</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversionRate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-4">Previsão vs Realizado (6 meses)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                      <Legend />
                      <Line type="monotone" dataKey="previsão" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="fechado" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </TabsContent>

            {/* Oportunidades */}
            <TabsContent value="deals" className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Oportunidades em Andamento</h2>
                  <p className="text-muted-foreground">Gerencie suas negociações e acompanhe o progresso</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..." 
                      className="pl-9 w-64" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filtros
                        {activeFiltersCount > 0 && (
                          <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Filtros Avançados</h4>
                          {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                              <X className="w-3 h-3 mr-1" />
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Estágio</Label>
                          <Select value={filterStage} onValueChange={setFilterStage}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="Prospecção">Prospecção</SelectItem>
                              <SelectItem value="Qualificação">Qualificação</SelectItem>
                              <SelectItem value="Proposta">Proposta</SelectItem>
                              <SelectItem value="Negociação">Negociação</SelectItem>
                              <SelectItem value="Fechamento">Fechamento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Proprietário</Label>
                          <Select value={filterOwner} onValueChange={setFilterOwner}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {owners.map(owner => (
                                <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Valor Mínimo (R$)</Label>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              value={filterMinValue}
                              onChange={(e) => setFilterMinValue(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Valor Máximo (R$)</Label>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              value={filterMaxValue}
                              onChange={(e) => setFilterMaxValue(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Probabilidade</Label>
                          <Select value={filterProbability} onValueChange={setFilterProbability}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="low">Baixa (0-30%)</SelectItem>
                              <SelectItem value="medium">Média (31-70%)</SelectItem>
                              <SelectItem value="high">Alta (71-100%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button className="gap-2" onClick={() => setDealModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Nova Oportunidade
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : filteredDeals.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">
                      {deals.length === 0 ? "Nenhuma oportunidade encontrada" : "Nenhuma oportunidade corresponde aos filtros"}
                    </p>
                  </Card>
                ) : (
                  filteredDeals.map((deal) => (
                    <Card key={deal.id} className="p-6 glass-card-hover">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-semibold text-lg">{deal.company}</h3>
                          <Badge variant="outline">{deal.stage}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Proprietário: {deal.owner}</span>
                          <span>•</span>
                          <span>{deal.daysInStage} dias nesta etapa</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold mb-1">R$ {deal.value.toLocaleString("pt-BR")}</div>
                        <div className="text-sm text-muted-foreground">{deal.probability}% de probabilidade</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {deal.nextAction && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Próxima ação: {new Date(deal.nextAction).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4 mr-2" />
                          Ligar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                    </Card>
                  ))
                )}
              </div>
              {filteredDeals.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  Mostrando {filteredDeals.length} de {deals.length} oportunidades
                </div>
              )}
            </TabsContent>

            {/* Follow-ups */}
            <TabsContent value="followups" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Follow-ups Automáticos</h2>
                  <p className="text-muted-foreground">Acompanhe seus compromissos e ações programadas</p>
                </div>
                <Button className="gap-2" onClick={() => setFollowUpModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Agendar Follow-up
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : followUps.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhum follow-up agendado</p>
                  </Card>
                ) : (
                  followUps.map((followUp) => (
                  <Card key={followUp.id} className="p-6 glass-card-hover">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          {followUp.type === "Ligação" ? (
                            <Phone className="w-6 h-6 text-primary" />
                          ) : followUp.type === "Email" ? (
                            <Mail className="w-6 h-6 text-primary" />
                          ) : (
                            <Calendar className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{followUp.contact}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{followUp.type}</span>
                            <span>•</span>
                            <span>{new Date(followUp.date).toLocaleDateString("pt-BR")} às {followUp.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={followUp.status === "pending" ? "secondary" : "default"}>
                          {followUp.status === "pending" ? "Pendente" : "Concluído"}
                        </Badge>
                        <Button variant="outline" size="sm">Ações</Button>
                      </div>
                    </div>
                  </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Scripts IA */}
            <TabsContent value="scripts" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Scripts de Vendas com IA</h2>
                  <p className="text-muted-foreground">Gere scripts personalizados usando inteligência artificial</p>
                </div>
                <Button className="gap-2" onClick={() => {
                  setScriptModalOpen(true);
                  setSelectedScriptType("");
                  setGeneratedScript("");
                  setScriptContext("");
                }}>
                  <Plus className="w-4 h-4" />
                  Criar Script
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-2">Script de Prospecção</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Script otimizado para primeira abordagem via telefone ou email
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleGenerateScript("prospecção")}>Usar Script</Button>
                </Card>
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-2">Script de Apresentação</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Apresente seu produto de forma convincente e personalizada
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleGenerateScript("apresentação")}>Usar Script</Button>
                </Card>
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-2">Script de Objeções</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Respostas inteligentes para as objeções mais comuns
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleGenerateScript("objeções")}>Usar Script</Button>
                </Card>
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-2">Script de Fechamento</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Técnicas comprovadas para fechar mais negócios
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleGenerateScript("fechamento")}>Usar Script</Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modal para criar nova oportunidade */}
      <Dialog open={dealModalOpen} onOpenChange={setDealModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova oportunidade de venda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={dealForm.company}
                onChange={(e) => setDealForm({ ...dealForm, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$) *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probabilidade (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={dealForm.probability}
                  onChange={(e) => setDealForm({ ...dealForm, probability: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Estágio *</Label>
              <Select value={dealForm.stage} onValueChange={(value) => setDealForm({ ...dealForm, stage: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospecção">Prospecção</SelectItem>
                  <SelectItem value="Qualificação">Qualificação</SelectItem>
                  <SelectItem value="Proposta">Proposta</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Fechamento">Fechamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Responsável *</Label>
              <Input
                id="owner"
                value={dealForm.owner}
                onChange={(e) => setDealForm({ ...dealForm, owner: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextAction">Próxima Ação (Opcional)</Label>
              <Input
                id="nextAction"
                type="date"
                value={dealForm.nextAction}
                onChange={(e) => setDealForm({ ...dealForm, nextAction: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDeal}>
              Criar Oportunidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agendar follow-up */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agendar Follow-up</DialogTitle>
            <DialogDescription>
              Agende um compromisso de acompanhamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="followUpType">Tipo *</Label>
              <Select value={followUpForm.type} onValueChange={(value) => setFollowUpForm({ ...followUpForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ligação">Ligação</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contato *</Label>
              <Input
                id="contact"
                value={followUpForm.contact}
                onChange={(e) => setFollowUpForm({ ...followUpForm, contact: e.target.value })}
                placeholder="Nome do contato ou empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={followUpForm.date}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={followUpForm.time}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFollowUp}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para gerar script com IA */}
      <Dialog open={scriptModalOpen} onOpenChange={setScriptModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {selectedScriptType 
                ? `Gerar Script de ${selectedScriptType.charAt(0).toUpperCase() + selectedScriptType.slice(1)}`
                : "Gerar Script de Vendas com IA"
              }
            </DialogTitle>
            <DialogDescription>
              A IA irá gerar um script personalizado para você
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedScriptType && (
              <div className="space-y-2">
                <Label htmlFor="scriptType">Tipo de Script *</Label>
                <Select 
                  value={selectedScriptType} 
                  onValueChange={(value) => setSelectedScriptType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de script" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecção">Script de Prospecção</SelectItem>
                    <SelectItem value="apresentação">Script de Apresentação</SelectItem>
                    <SelectItem value="objeções">Script de Objeções</SelectItem>
                    <SelectItem value="fechamento">Script de Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="scriptContext">Contexto Adicional (Opcional)</Label>
              <Textarea
                id="scriptContext"
                value={scriptContext}
                onChange={(e) => setScriptContext(e.target.value)}
                placeholder="Adicione informações sobre o produto, cliente ou situação específica..."
                rows={4}
              />
            </div>
            {isGeneratingScript && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Gerando script com IA...</span>
              </div>
            )}
            {generatedScript && (
              <div className="space-y-2">
                <Label>Script Gerado</Label>
                <div className="p-4 bg-muted rounded-lg border max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{generatedScript}</pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedScript);
                      toast({
                        title: "Copiado!",
                        description: "Script copiado para a área de transferência",
                      });
                    }}
                  >
                    Copiar Script
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRegenerateScript}
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      "Regenerar"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setScriptModalOpen(false);
              setGeneratedScript("");
              setScriptContext("");
              setSelectedScriptType("");
            }}>
              Fechar
            </Button>
            {!generatedScript && !isGeneratingScript && (
              <Button onClick={handleRegenerateScript} disabled={!selectedScriptType || isGeneratingScript}>
                {isGeneratingScript ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Script"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





