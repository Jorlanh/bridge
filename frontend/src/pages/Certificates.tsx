import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { academyApi, Certificate } from "@/lib/api";
import { toast } from "sonner";
import { Award, Download, Clock, CheckCircle, Inbox, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadCertificateFromApi } from "@/utils/certificateDownload";

type FilterType = "all" | "earned" | "in-progress";

export default function Certificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<{ earned: Certificate[]; inProgress: Certificate[] }>({
    earned: [],
    inProgress: [],
  });
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCertificates = async () => {
      setIsLoading(true);
      try {
        const result = await academyApi.getCertificates();
        if (result.success) {
          setCertificates(result.certificates);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao carregar certificados";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleDownload = async (courseId: string, courseTitle?: string) => {
    try {
      toast.loading("Gerando imagem do certificado...", { id: "cert-download" });
      await downloadCertificateFromApi(courseId, courseTitle);
      toast.success("Certificado baixado como imagem com sucesso!", { id: "cert-download" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao baixar certificado";
      toast.error(errorMessage, { id: "cert-download" });
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar certificados
  const getFilteredCertificates = () => {
    let filtered: Certificate[] = [];
    if (filter === "earned") {
      filtered = certificates.earned;
    } else if (filter === "in-progress") {
      filtered = certificates.inProgress;
    } else {
      filtered = [...certificates.earned, ...certificates.inProgress];
    }

    // Aplicar busca
    if (searchTerm.trim() === "") {
      return filtered;
    }

    const searchLower = searchTerm.toLowerCase();
    return filtered.filter(cert => 
      cert.title.toLowerCase().includes(searchLower) ||
      cert.course.toLowerCase().includes(searchLower)
    );
  };

  const filteredCertificates = getFilteredCertificates();
  const totalEarned = certificates.earned.length;
  const totalInProgress = certificates.inProgress.length;
  const totalAll = totalEarned + totalInProgress;

  return (
    <div className="flex min-h-screen bg-background">
      <AcademySidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Certificados" 
          subtitle="Seus certificados conquistados"
          onMenuClick={() => {}}
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar certificados..."
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalAll}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
            <div className="glass-card p-5 border-success/30 bg-success/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalEarned}</div>
                  <div className="text-sm text-muted-foreground">Conquistados</div>
                </div>
              </div>
            </div>
            <div className="glass-card p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalInProgress}</div>
                  <div className="text-sm text-muted-foreground">Em Progresso</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                Todos ({totalAll})
              </button>
              <button
                onClick={() => setFilter("earned")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filter === "earned"
                    ? "bg-success text-success-foreground"
                    : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                Conquistados ({totalEarned})
              </button>
              <button
                onClick={() => setFilter("in-progress")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filter === "in-progress"
                    ? "bg-warning text-warning-foreground"
                    : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                Em Progresso ({totalInProgress})
              </button>
            </div>
          </div>

          {/* Certificates List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Inbox className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">
                {filter === "all" 
                  ? "Nenhum certificado disponível"
                  : filter === "earned"
                  ? "Nenhum certificado conquistado"
                  : "Nenhum certificado em progresso"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {filter === "all" || filter === "earned"
                  ? "Complete os cursos para receber seus certificados!"
                  : "Continue estudando para conquistar seus certificados!"}
              </p>
              {filter !== "all" && (
                <Button onClick={() => setFilter("all")} variant="outline">
                  Ver Todos
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => {
                const isEarned = cert.status === "earned";
                
                return (
                  <div
                    key={cert.id}
                    className={cn(
                      "glass-card p-5 transition-colors",
                      isEarned
                        ? "border-success/30 bg-success/5 hover:bg-success/10"
                        : "border-warning/30 bg-warning/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                          isEarned
                            ? "bg-success/20"
                            : "bg-warning/20"
                        )}>
                          <Award className={cn(
                            "w-7 h-7",
                            isEarned ? "text-success" : "text-warning"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{cert.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{cert.course}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cert.studyTime}
                            </span>
                            {isEarned && (
                              <span>Conquistado em {cert.earnedAt}</span>
                            )}
                            {!isEarned && (
                              <span className="text-warning">Em progresso</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isEarned && cert.courseId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(cert.courseId!, cert.course)}
                          className="shrink-0"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar como Imagem
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

