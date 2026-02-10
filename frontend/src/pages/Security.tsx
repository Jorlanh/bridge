import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { 
  Shield, 
  Lock, 
  CheckCircle,
  Key,
  Database,
  Globe,
  FileLock,
  Link2,
  Info,
  Filter,
  Search,
  X,
  AlertTriangle,
  Eye,
  Download,
  Activity,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { securityApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Security() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Estados para filtros e visualização
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [alertDetailOpen, setAlertDetailOpen] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsResult, logsResult] = await Promise.all([
        securityApi.getStats().catch(() => ({ success: false, stats: null })),
        securityApi.getActivityLogs(100).catch(() => ({ success: false, logs: [] }))
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
        if (statsResult.stats?.alerts) setSecurityAlerts(statsResult.stats.alerts);
      }

      if (logsResult.success && logsResult.logs) {
        setActivityLogs(logsResult.logs);
      }
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

  // Filtrar alertas
  const filteredAlerts = securityAlerts.filter(alert => {
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus !== "all" && ((filterStatus === "resolved") !== alert.resolved)) {
      return false;
    }
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) {
      return false;
    }
    return true;
  });

  const handleResolveAlert = async (alertId: string) => {
    try {
      // Aqui você chamaria a API para resolver o alerta
      // await securityApi.resolveAlert(alertId);
      
      // Atualizar localmente
      setSecurityAlerts(alerts => alerts.map(a => 
        a.id === alertId ? { ...a, resolved: true } : a
      ));
      
      toast({
        title: "Sucesso",
        description: "Alerta marcado como resolvido",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao resolver alerta",
        variant: "destructive",
      });
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      ["Data", "Usuário", "Ação", "IP", "Status"],
      ...activityLogs.map(log => [
        new Date(log.createdAt).toLocaleString("pt-BR"),
        log.user || "N/A",
        log.action || "N/A",
        log.ip || "N/A",
        log.status || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `security_logs_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Logs exportados com sucesso!",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterSeverity("all");
  };

  const activeFiltersCount = [
    searchTerm,
    filterStatus !== "all",
    filterSeverity !== "all"
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Segurança e Controle" 
          subtitle="Gestão de usuários e proteção de dados"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Main Content */}
          <Tabs defaultValue="protection" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="protection">Proteção de Dados</TabsTrigger>
              <TabsTrigger value="alerts">Alertas de Segurança</TabsTrigger>
              <TabsTrigger value="activity">Histórico de Atividades</TabsTrigger>
            </TabsList>

            {/* Proteção de Dados */}
            <TabsContent value="protection" className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-2xl mb-2">Proteção de Dados e Segurança</h2>
                <p className="text-muted-foreground">Entenda como seus dados estão sendo protegidos e criptografados</p>
              </div>

              {/* Criptografia de Senhas */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Criptografia de Senhas</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Suas senhas são protegidas com tecnologia de criptografia avançada, garantindo que nunca sejam armazenadas de forma legível.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Sua senha é transformada em código seguro antes de ser salva</li>
                              <li>Cada senha gera um código único, mesmo que seja igual à de outra pessoa</li>
                              <li>Nunca salvamos sua senha em texto simples - apenas versões criptografadas</li>
                              <li>Mesmo em caso de acesso não autorizado, sua senha não pode ser recuperada</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Autenticação Segura */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Key className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Autenticação Segura</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Utilizamos um sistema de autenticação seguro que verifica sua identidade sem armazenar informações sensíveis.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Após fazer login, você recebe uma credencial digital segura</li>
                              <li>Esta credencial é verificada a cada ação que você realiza no sistema</li>
                              <li>Por segurança, você precisará fazer login novamente periodicamente</li>
                              <li>Não armazenamos suas informações de login no servidor</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dados em Trânsito */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Proteção de Dados em Trânsito (HTTPS/TLS)</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Todas as comunicações entre seu navegador e nossos servidores são protegidas com criptografia.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Todas as conexões são seguras e verificadas por certificados válidos</li>
                              <li>Seus dados são transformados em código antes de viajar pela internet</li>
                              <li>Mesmo que alguém tente interceptar, não conseguirá ler suas informações</li>
                              <li>Você pode identificar conexões seguras pelo cadeado no navegador</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dados em Repouso */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Proteção de Dados em Repouso</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Seus dados armazenados são protegidos com criptografia de alto nível e controle rigoroso de acesso.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Informações sensíveis são criptografadas antes de serem salvas</li>
                              <li>Usamos padrões de segurança de nível empresarial</li>
                              <li>Apenas pessoas autorizadas podem acessar seus dados</li>
                              <li>O sistema verifica a integridade dos dados constantemente</li>
                              <li>Os servidores estão protegidos por múltiplas camadas de segurança</li>
                              <li>Backups também são protegidos da mesma forma</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Proteção de Integrações */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Proteção de Integrações e APIs</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Todas as integrações com serviços externos (WhatsApp, Redes Sociais, etc.) são protegidas com credenciais seguras.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>As credenciais de acesso são armazenadas de forma criptografada</li>
                              <li>Usamos os mesmos padrões de segurança das maiores empresas de tecnologia</li>
                              <li>As conexões são renovadas automaticamente para manter a segurança</li>
                              <li>Você pode desconectar qualquer integração quando quiser</li>
                              <li>Suas credenciais nunca aparecem em logs ou códigos do sistema</li>
                              <li>Todas as comunicações com serviços externos são criptografadas</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Backups */}
              <Card className="p-6 glass-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <FileLock className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">Backups Automáticos e Seguros</h3>
                      <Badge className="bg-success text-success-foreground">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Seus dados são copiados automaticamente e armazenados de forma segura para proteção contra perda.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">O que isso significa para você:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Backups automáticos são realizados diariamente</li>
                              <li>Todos os backups são protegidos com criptografia</li>
                              <li>Mantemos cópias em locais diferentes para maior segurança</li>
                              <li>Os backups são verificados regularmente para garantir que funcionam</li>
                              <li>Você pode solicitar restauração de dados quando necessário</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

            </TabsContent>

            {/* Alertas de Segurança */}
            <TabsContent value="alerts" className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Alertas de Segurança</h2>
                  <p className="text-muted-foreground">Gerencie e monitore alertas de segurança do sistema</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar alertas..." 
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
                          <h4 className="font-semibold">Filtros</h4>
                          {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                              <X className="w-3 h-3 mr-1" />
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="resolved">Resolvidos</SelectItem>
                              <SelectItem value="pending">Pendentes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Severidade</Label>
                          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="critical">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Card className="p-6 glass-card">
                <div className="space-y-3">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                      <p className="text-sm text-muted-foreground">
                        {securityAlerts.length === 0 
                          ? "Nenhum alerta de segurança. Sistema protegido!" 
                          : "Nenhum alerta corresponde aos filtros"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {(showAllAlerts ? filteredAlerts : filteredAlerts.slice(0, 10)).map((alert) => (
                        <div 
                          key={alert.id} 
                          className="p-4 rounded-xl bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setAlertDetailOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <AlertTriangle className={cn(
                                "w-5 h-5 mt-0.5 flex-shrink-0",
                                alert.severity === "critical" ? "text-destructive" :
                                alert.severity === "high" ? "text-orange-500" :
                                alert.severity === "medium" ? "text-yellow-500" : "text-blue-500"
                              )} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{alert.title}</span>
                                  {alert.severity && (
                                    <Badge variant="outline" className={cn(
                                      alert.severity === "critical" ? "border-destructive text-destructive" :
                                      alert.severity === "high" ? "border-orange-500 text-orange-500" :
                                      alert.severity === "medium" ? "border-yellow-500 text-yellow-500" : 
                                      "border-blue-500 text-blue-500"
                                    )}>
                                      {alert.severity}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(alert.timestamp).toLocaleString("pt-BR")}
                                  </span>
                                  {alert.resolved ? (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                      Resolvido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(alert);
                                setAlertDetailOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredAlerts.length > 10 && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowAllAlerts(!showAllAlerts)}
                        >
                          {showAllAlerts ? "Mostrar menos" : `Mostrar todos (${filteredAlerts.length})`}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Histórico de Atividades */}
            <TabsContent value="activity" className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-2">Histórico de Atividades</h2>
                  <p className="text-muted-foreground">Registro de todas as atividades de segurança</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExportLogs}>
                  <Download className="w-4 h-4" />
                  Exportar Logs
                </Button>
              </div>

              <Card className="p-6 glass-card">
                <div className="space-y-3">
                  {activityLogs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    activityLogs.slice(0, 50).map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{log.action || "Ação realizada"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{log.user || "Sistema"}</span>
                                <span>•</span>
                                <span>{log.ip || "N/A"}</span>
                                <span>•</span>
                                <span>{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={log.status === "success" ? "default" : "destructive"}>
                            {log.status || "success"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Dialog de Detalhes do Alerta */}
        <Dialog open={alertDetailOpen} onOpenChange={setAlertDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  selectedAlert?.severity === "critical" ? "text-destructive" :
                  selectedAlert?.severity === "high" ? "text-orange-500" :
                  selectedAlert?.severity === "medium" ? "text-yellow-500" : "text-blue-500"
                )} />
                {selectedAlert?.title}
              </DialogTitle>
              <DialogDescription>
                Detalhes completos do alerta de segurança
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Descrição</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAlert.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="mt-1">
                      {selectedAlert.resolved ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Severidade</Label>
                    <div className="mt-1">
                      {selectedAlert.severity && (
                        <Badge variant="outline">
                          {selectedAlert.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Data</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedAlert.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {selectedAlert.resolvedAt && (
                    <div>
                      <Label className="text-sm font-semibold">Resolvido em</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedAlert.resolvedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedAlert && !selectedAlert.resolved && (
                <Button onClick={() => handleResolveAlert(selectedAlert.id)}>
                  Marcar como Resolvido
                </Button>
              )}
              <Button variant="outline" onClick={() => setAlertDetailOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


