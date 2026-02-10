import { useState, useEffect } from "react";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { academyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn, openWhatsApp } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface ConsultingSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  maxParticipants: number;
  status: "scheduled" | "available" | "full" | "completed" | "cancelled";
  instructor: string;
  platform: "zoom" | "meet" | "teams" | "other";
  meetingLink?: string;
  isEnrolled: boolean;
}

export default function Consulting() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "live" | "past">("upcoming");
  const [upcomingSessions, setUpcomingSessions] = useState<ConsultingSession[]>([]);
  const [pastSessions, setPastSessions] = useState<ConsultingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<ConsultingSession | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  // Atualiza o horário atual periodicamente para controlar o botão "Entrar"
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000); // a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const [upcomingResult, pastResult] = await Promise.all([
        academyApi.getConsultingSessions("upcoming").catch(() => ({ success: false, sessions: [] })),
        academyApi.getConsultingSessions("past").catch(() => ({ success: false, sessions: [] })),
      ]);

      if (upcomingResult.success) {
        setUpcomingSessions(upcomingResult.sessions);
      }
      if (pastResult.success) {
        setPastSessions(pastResult.sessions);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar sessões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const canJoinSession = (session: ConsultingSession) => {
    if (!session.isEnrolled || !session.meetingLink) return false;

    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.time.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const startTime = sessionDate.getTime();
    const endTime = startTime + session.duration * 60 * 1000;
    const joinStart = startTime - 5 * 60 * 1000; // 5 minutos antes
    const joinEnd = endTime; // até o final da sessão

    const nowTime = now.getTime();

    return nowTime >= joinStart && nowTime <= joinEnd;
  };

  const isSessionFinished = (session: ConsultingSession) => {
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.time.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const startTime = sessionDate.getTime();
    const endTime = startTime + session.duration * 60 * 1000;
    const nowTime = now.getTime();

    return nowTime > endTime;
  };

  const isSessionLive = (session: ConsultingSession) => {
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.time.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const startTime = sessionDate.getTime();
    const endTime = startTime + session.duration * 60 * 1000;
    const liveStart = startTime - 5 * 60 * 1000; // consideramos em andamento 5min antes
    const liveEnd = endTime; // até o final da sessão

    const nowTime = now.getTime();
    return nowTime >= liveStart && nowTime <= liveEnd;
  };

  const liveSessions: ConsultingSession[] = [...upcomingSessions, ...pastSessions].filter(
    (session, index, self) =>
      isSessionLive(session) &&
      // evitar duplicados caso a mesma sessão esteja nas duas listas por algum motivo
      self.findIndex((s) => s.id === session.id) === index
  );

  const handleSchedule = async (session: ConsultingSession) => {
    try {
      const result = await academyApi.scheduleSession(session.id);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message || "Inscrição realizada com sucesso!",
        });
        loadSessions(); // Recarregar sessões
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao inscrever-se na sessão",
        variant: "destructive",
      });
    }
  };

  const handleCancelEnrollment = async (session: ConsultingSession) => {
    try {
      setIsCancelling(true);
      const result = await academyApi.cancelSession(session.id);
      if (result.success) {
        toast({
          title: "Inscrição cancelada",
          description: result.message || "Sua inscrição foi cancelada com sucesso.",
        });
        setDetailsOpen(false);
        setSelectedSession(null);
        setCancelDialogOpen(false);
        loadSessions();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar inscrição na sessão",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AcademySidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Consultoria em Grupo" 
          subtitle="Sessões ao vivo com especialistas"
          onMenuClick={() => {}}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="glass-card p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-3xl font-bold mb-3">
                  Consultoria em Grupo
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Participe de sessões semanais ao vivo com especialistas em IA e automação. 
                  Tire suas dúvidas, aprenda estratégias avançadas e troque experiências com outros empresários.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Video className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Ao Vivo</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold">Sessões Semanais</div>
                  <div className="text-sm text-muted-foreground">Toda quinta-feira às 19h</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Clock className="w-6 h-6 text-secondary" />
                <div>
                  <div className="font-semibold">60 minutos</div>
                  <div className="text-sm text-muted-foreground">Duração de cada sessão</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Users className="w-6 h-6 text-success" />
                <div>
                  <div className="font-semibold">Até 20 participantes</div>
                  <div className="text-sm text-muted-foreground">Grupos pequenos e focados</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "px-6 py-3 font-medium text-sm transition-colors relative",
                  activeTab === "upcoming"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Próximas Sessões
                <span className="ml-2 text-xs text-muted-foreground">
                  ({upcomingSessions.length})
                </span>
                {activeTab === "upcoming" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("live")}
                className={cn(
                  "px-6 py-3 font-medium text-sm transition-colors relative",
                  activeTab === "live"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sessão em andamento
                <span className="ml-2 text-xs text-muted-foreground">
                  ({liveSessions.length})
                </span>
                {activeTab === "live" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={cn(
                  "px-6 py-3 font-medium text-sm transition-colors relative",
                  activeTab === "past"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sessões Anteriores
                <span className="ml-2 text-xs text-muted-foreground">
                  ({pastSessions.length})
                </span>
                {activeTab === "past" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <div className="glass-card p-12 text-center col-span-full">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando sessões...</p>
              </div>
            ) : activeTab === "live" ? (
              liveSessions.length === 0 ? (
                <div className="glass-card p-12 text-center col-span-full">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold text-xl mb-2">
                    Nenhuma sessão em andamento
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Assim que uma sessão estiver em andamento, ela aparecerá aqui para você entrar.
                  </p>
                </div>
              ) : (
                liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "glass-card h-full p-5 rounded-2xl border border-border/60 bg-gradient-to-b from-background/60 to-background/90 shadow-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex flex-col justify-between cursor-pointer",
                      session.status === "full" && "opacity-75"
                    )}
                    onClick={() => {
                      setSelectedSession(session);
                      setDetailsOpen(true);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-semibold text-lg leading-snug">
                            {session.title}
                          </h3>
                          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Consultoria em Grupo • {session.platform === "meet" ? "Google Meet" : session.platform === "zoom" ? "Zoom" : "Online"}
                          </p>
                        </div>
                        {session.status === "full" && (
                          <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-medium border border-warning/20">
                            Esgotado
                          </span>
                        )}
                        {(session.status === "available" || session.status === "scheduled") && !session.isEnrolled && (
                          <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[11px] font-medium border border-success/20">
                            Disponível
                          </span>
                        )}
                        {session.isEnrolled && (
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/30">
                            Inscrito
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {session.time} • {session.duration}min
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {session.participants}/{session.maxParticipants} participantes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-muted-foreground">
                        {session.isEnrolled
                          ? canJoinSession(session)
                            ? "Sua sessão está prestes a começar. Clique em Entrar para participar agora."
                            : "Você já está inscrito nesta sessão. O botão de entrada aparecerá 5 minutos antes do horário."
                          : "Garanta sua vaga para participar ao vivo da próxima sessão."}
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isEnrolled ? (
                          canJoinSession(session) ? (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (session.meetingLink) {
                                  window.open(session.meetingLink, "_blank", "noopener,noreferrer");
                                }
                              }}
                              className="whitespace-nowrap text-xs px-4"
                            >
                              <Video className="w-3.5 h-3.5 mr-1.5" />
                              Entrar
                            </Button>
                          ) : null
                        ) : session.status === "available" || session.status === "scheduled" ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchedule(session);
                            }}
                            className="whitespace-nowrap text-xs px-4"
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Agendar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            disabled
                            className="whitespace-nowrap text-xs"
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            Esgotado
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === "upcoming" ? (
              upcomingSessions.length === 0 ? (
                <div className="glass-card p-12 text-center col-span-full">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold text-xl mb-2">
                    Nenhuma sessão agendada
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Novas sessões serão anunciadas em breve!
                  </p>
                  <Button
                    onClick={() =>
                      openWhatsApp(
                        "+5519995555280",
                        "Olá! Gostaria de saber mais sobre as sessões de consultoria em grupo."
                      )
                    }
                  >
                    Entrar em contato
                  </Button>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "glass-card h-full p-5 rounded-2xl border border-border/60 bg-gradient-to-b from-background/60 to-background/90 shadow-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex flex-col justify-between cursor-pointer",
                      session.status === "full" && "opacity-75"
                    )}
                    onClick={() => {
                      setSelectedSession(session);
                      setDetailsOpen(true);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-semibold text-lg leading-snug">
                            {session.title}
                          </h3>
                          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Consultoria em Grupo •{" "}
                            {session.platform === "meet"
                              ? "Google Meet"
                              : session.platform === "zoom"
                              ? "Zoom"
                              : "Online"}
                          </p>
                        </div>
                          {session.status === "full" && (
                          <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-medium border border-warning/20">
                              Esgotado
                            </span>
                          )}
                        {(session.status === "available" ||
                          session.status === "scheduled") &&
                          !session.isEnrolled && (
                            <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[11px] font-medium border border-success/20">
                              Disponível
                            </span>
                          )}
                        {session.isEnrolled && (
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/30">
                            Inscrito
                            </span>
                          )}
                        </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {session.time} • {session.duration}min
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {session.participants}/{session.maxParticipants} participantes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-muted-foreground">
                        {session.isEnrolled
                          ? canJoinSession(session)
                            ? "Sua sessão está prestes a começar. Clique em Entrar para participar agora."
                            : "Você já está inscrito nesta sessão. O botão de entrada aparecerá 5 minutos antes do horário."
                          : "Garanta sua vaga para participar ao vivo da próxima sessão."}
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isEnrolled && canJoinSession(session) ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (session.meetingLink) {
                                window.open(
                                  session.meetingLink,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                            className="whitespace-nowrap text-xs px-4"
                          >
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            Entrar
                          </Button>
                        ) : !session.isEnrolled &&
                          (session.status === "available" ||
                            session.status === "scheduled") ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchedule(session);
                            }}
                            className="whitespace-nowrap text-xs px-4"
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Agendar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            disabled
                            className="whitespace-nowrap text-xs"
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            Esgotado
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="glass-card h-full p-5 rounded-2xl border border-border/40 bg-background/80 opacity-80 flex flex-col justify-between cursor-pointer"
                  onClick={() => {
                    setSelectedSession(session);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-lg leading-snug">
                          {session.title}
                        </h3>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                          Concluída
                        </span>
                      </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                          {formatDate(session.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                          {session.time} • {session.duration}min
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info Card */}
          <div className="glass-card p-6 mt-6 border-primary/30 bg-primary/5">
            <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Como funciona?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>As sessões acontecem toda quinta-feira às 19h via videoconferência</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Você receberá o link de acesso após confirmar sua participação</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Pode fazer perguntas em tempo real e interagir com outros participantes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Gravação disponível para participantes após a sessão</span>
              </li>
            </ul>
          </div>
        </main>
      </div>

      {/* Detalhes da sessão */}
      <Dialog
        open={detailsOpen && !!selectedSession}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedSession(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {selectedSession.title}
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(selectedSession.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedSession.time} • {selectedSession.duration}min
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {selectedSession.participants}/{selectedSession.maxParticipants} participantes
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedSession.description}
                </p>

                <div className="text-xs text-muted-foreground">
                  Instrutor:{" "}
                  <span className="font-medium text-foreground">
                    {selectedSession.instructor}
                  </span>
                  {selectedSession.platform && (
                    <>
                      {" • Plataforma: "}
                      <span className="font-medium text-foreground">
                        {selectedSession.platform === "meet"
                          ? "Google Meet"
                          : selectedSession.platform === "zoom"
                          ? "Zoom"
                          : selectedSession.platform === "teams"
                          ? "Microsoft Teams"
                          : "Online"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {selectedSession.isEnrolled ? (
                    isSessionFinished(selectedSession)
                      ? "Esta sessão já foi concluída. Não é mais possível cancelar a inscrição."
                      : "Se não puder participar, você pode cancelar sua inscrição abaixo."
                  ) : (
                    "Para se inscrever, use o botão Agendar nos cards de Próximas Sessões."
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                  >
                    Fechar
                  </Button>
                  {selectedSession.isEnrolled && !isSessionFinished(selectedSession) && (
                    <Button
                      variant="destructive"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isCancelling}
                    >
                      Cancelar inscrição
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmação de cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar inscrição na consultoria?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block text-sm text-muted-foreground mb-1">
                {selectedSession?.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                Você perderá sua vaga nesta sessão de consultoria em grupo. 
                Se mudar de ideia depois, poderá se inscrever novamente enquanto houver vagas disponíveis.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Manter inscrição
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSession && handleCancelEnrollment(selectedSession)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Sim, cancelar inscrição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}