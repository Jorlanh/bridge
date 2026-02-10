import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Settings, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Zap,
  ListChecks,
  Workflow,
  BarChart3,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { processesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Processes() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [workflowsResult, tasksResult, checklistsResult, statsResult] = await Promise.all([
        processesApi.getWorkflows().catch(() => ({ success: false, workflows: [] })),
        processesApi.getTasks().catch(() => ({ success: false, tasks: [] })),
        processesApi.getChecklists().catch(() => ({ success: false, checklists: [] })),
        processesApi.getStats().catch(() => ({ success: false, stats: null })),
      ]);

      if (workflowsResult.success) setWorkflows(workflowsResult.workflows);
      if (tasksResult.success) setTasks(tasksResult.tasks);
      if (checklistsResult.success) setChecklists(checklistsResult.checklists);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      case "pending": return "bg-gray-500";
      default: return "bg-gray-500";
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
          title="Otimização de Processos" 
          subtitle="Fluxos e tarefas automatizadas"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Fluxos Ativos"
              value={workflows.filter(w => w.status === "active").length.toString()}
              change={stats?.newWorkflows ? `+${stats.newWorkflows} este mês` : "Carregando..."}
              changeType="positive"
              icon={Zap}
            />
            <StatCard
              title="Tarefas Concluídas"
              value={tasks.filter(t => t.status === "completed").length.toString()}
              change={stats?.completedTasks ? `+${stats.completedTasks} esta semana` : "Carregando..."}
              changeType="positive"
              icon={CheckCircle}
            />
            <StatCard
              title="Eficiência Média"
              value={stats?.averageEfficiency ? `${stats.averageEfficiency}%` : "0%"}
              change={stats?.efficiencyChange ? `${stats.efficiencyChange > 0 ? '+' : ''}${stats.efficiencyChange}% vs mês anterior` : "Sem dados"}
              changeType={stats?.efficiencyChange > 0 ? "positive" : "negative"}
              icon={TrendingUp}
            />
            <StatCard
              title="Tempo Economizado"
              value={stats?.timeSaved ? `${stats.timeSaved}h` : "0h"}
              change="Esta semana"
              changeType="positive"
              icon={Clock}
            />
          </div>

          {/* Main Content */}
          <Tabs defaultValue="workflows" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflows">Fluxos</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
              <TabsTrigger value="productivity">Produtividade</TabsTrigger>
            </TabsList>

            {/* Fluxos */}
            <TabsContent value="workflows" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Fluxos Automatizados</h2>
                  <p className="text-muted-foreground">Gerencie seus processos automatizados</p>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Fluxo
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : workflows.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhum fluxo encontrado</p>
                  </Card>
                ) : (
                  workflows.map((workflow) => (
                    <Card key={workflow.id} className="p-6 glass-card-hover">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Workflow className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-lg">{workflow.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{workflow.steps} etapas</span>
                              <span>•</span>
                              <span>{workflow.completed} execuções</span>
                              <span>•</span>
                              <span>Tempo médio: {workflow.avgTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={workflow.status === "active" ? "default" : "secondary"}
                          className={cn(
                            workflow.status === "active" && "bg-success text-success-foreground"
                          )}
                        >
                          {workflow.status === "active" ? "Ativo" : "Pausado"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          {workflow.status === "active" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Eficiência</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${workflow.efficiency}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{workflow.efficiency}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Taxa de Sucesso</div>
                        <div className="text-lg font-bold">94%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Última Execução</div>
                        <div className="text-lg font-bold">Hoje</div>
                      </div>
                    </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tarefas */}
            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Automação de Tarefas</h2>
                  <p className="text-muted-foreground">Gerencie tarefas automatizadas e manuais</p>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : tasks.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                  </Card>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id} className="p-6 glass-card-hover">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))} />
                          <h3 className="font-display font-semibold text-lg">{task.title}</h3>
                          <Badge variant="outline">{task.category}</Badge>
                          <Badge 
                            variant="outline"
                            className={cn(getPriorityColor(task.priority))}
                          >
                            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Atribuído a: {task.assignedTo}</span>
                          <span>•</span>
                          <span>Prazo: {new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={task.status === "completed" ? "default" : task.status === "in_progress" ? "secondary" : "outline"}
                          className={cn(
                            task.status === "completed" && "bg-success text-success-foreground"
                          )}
                        >
                          {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Em Andamento" : "Pendente"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Checklists */}
            <TabsContent value="checklists" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Checklists Inteligentes</h2>
                  <p className="text-muted-foreground">Crie e gerencie checklists para processos recorrentes</p>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Checklist
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : checklists.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhum checklist encontrado</p>
                  </Card>
                ) : (
                  checklists.map((checklist) => {
                    const progress = (checklist.completed / checklist.items) * 100;
                    return (
                      <Card key={checklist.id} className="p-6 glass-card-hover">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{checklist.name}</h3>
                          <Badge variant="outline">{checklist.category}</Badge>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{checklist.completed}/{checklist.items}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              progress === 100 ? "bg-success" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <ListChecks className="w-4 h-4 mr-2" />
                        Ver Itens
                      </Button>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Produtividade */}
            <TabsContent value="productivity" className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-2xl mb-2">Painel de Produtividade</h2>
                <p className="text-muted-foreground">Acompanhe métricas de produtividade e eficiência</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Tarefas por Dia</h3>
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-2">24</div>
                  <div className="text-sm text-muted-foreground">Média dos últimos 7 dias</div>
                  <div className="mt-4 h-32 flex items-center justify-center text-muted-foreground text-sm">
                    Gráfico (em desenvolvimento)
                  </div>
                </Card>

                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Tempo Economizado</h3>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-2">24h</div>
                  <div className="text-sm text-muted-foreground">Esta semana</div>
                  <div className="mt-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Automações</span>
                      <span className="font-semibold">18h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Otimizações</span>
                      <span className="font-semibold">6h</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Eficiência Geral</h3>
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-2">85%</div>
                  <div className="text-sm text-muted-foreground">+5% vs mês anterior</div>
                  <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "85%" }} />
                  </div>
                </Card>
              </div>

              <Card className="p-6 glass-card">
                <h3 className="font-semibold mb-4">Atividades Recentes</h3>
                <div className="space-y-3">
                  {[
                    { action: "Fluxo 'Onboarding' executado", time: "2 horas atrás" },
                    { action: "Tarefa 'Revisar relatório' concluída", time: "4 horas atrás" },
                    { action: "Checklist 'Segurança' completado", time: "1 dia atrás" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}





