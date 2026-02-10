import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VideoPlayer } from "@/components/academy/VideoPlayer";
import { academyApi, Course } from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Award,
  TrendingUp,
  Users,
  Target,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { downloadCertificateFromApi } from "@/utils/certificateDownload";

// Função para formatar duração
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}min`;
};

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<(Course & { completedLessons?: number; totalLessons?: number; studyTime?: number; completedAt?: string | null; hasCertificate?: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<{ number: number; title: string; videoUrl?: string } | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // URL do vídeo será obtida do curso via API

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        toast.error("ID do curso não fornecido");
        navigate("/academy");
        return;
      }

      setIsLoading(true);
      try {
        const result = await academyApi.getCourseById(courseId);
        if (result.success) {
          setCourse(result.course);
        } else {
          toast.error("Erro ao carregar curso");
          navigate("/academy");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao carregar curso";
        toast.error(errorMessage);
        navigate("/academy");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    if (!courseId) return;

    try {
      await academyApi.enrollInCourse(courseId);
      toast.success("Inscrição realizada com sucesso!");
      // Recarregar curso
      const result = await academyApi.getCourseById(courseId);
      if (result.success) {
        setCourse(result.course);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao se inscrever no curso";
      toast.error(errorMessage);
    }
  };

  const handleLessonClick = (lessonNumber: number) => {
    if (!course?.enrolled) {
      toast.info("Você precisa se inscrever no curso primeiro!");
      return;
    }

    // Buscar aula real se disponível
    const lesson = course.lessonsData?.find((l: any) => (l.order || 0) === lessonNumber) || course.lessonsData?.[lessonNumber - 1];

    setSelectedLesson({
      number: lessonNumber,
      title: lesson?.title || `Aula ${lessonNumber}`,
      videoUrl: lesson?.videoUrl,
    });
    setIsVideoOpen(true);
  };

  const handleLessonComplete = async () => {
    if (!courseId || !selectedLesson) return;

    try {
      const currentCompleted = course?.completedLessons || 0;
      const newCompleted = Math.max(currentCompleted, selectedLesson.number);
      
      await academyApi.updateProgress(courseId, newCompleted, 10); // Adiciona 10 minutos de estudo
      
      toast.success(`Aula ${selectedLesson.number} marcada como concluída!`);
      
      // Recarregar curso
      const result = await academyApi.getCourseById(courseId);
      if (result.success) {
        setCourse(result.course);
      }
      
      setIsVideoOpen(false);
      setSelectedLesson(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar progresso";
      toast.error(errorMessage);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!courseId) return;

    try {
      toast.loading("Gerando imagem do certificado...", { id: "cert-download" });
      await downloadCertificateFromApi(courseId, course?.title);
      toast.success("Certificado baixado como imagem com sucesso!", { id: "cert-download" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao baixar certificado";
      toast.error(errorMessage, { id: "cert-download" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AcademySidebar />
        <div className="flex-1 flex flex-col w-full md:w-auto">
          <DashboardHeader 
            title="Carregando..." 
            subtitle="Aguarde enquanto carregamos os detalhes do curso"
            onMenuClick={() => {}}
          />
          <main className="flex-1 p-6">
            <div className="glass-card p-12 animate-pulse">
              <div className="h-8 w-3/4 bg-muted rounded mb-4" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AcademySidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title={course.title} 
          subtitle={course.category}
          onMenuClick={() => {}}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/academy")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Biblioteca
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <div className="glass-card p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                      {course.category}
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                      {course.title}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Duração</div>
                      <div className="font-semibold">{formatDuration(course.duration)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Aulas</div>
                      <div className="font-semibold">{course.lessons}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nível</div>
                      <div className="font-semibold">Intermediário</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              {course.enrolled && (
                <div className="glass-card p-6 border-success/30 bg-success/5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      Seu Progresso
                    </h2>
                    {course.hasCertificate && (
                      <div className="flex items-center gap-2 text-success">
                        <Award className="w-5 h-5" />
                        <span className="font-medium">Certificado Conquistado!</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {course.completedLessons || 0} de {course.totalLessons || course.lessons} aulas concluídas
                      </span>
                      <span className="font-semibold text-success">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-3" />
                    {course.studyTime && (
                      <div className="text-sm text-muted-foreground">
                        Tempo de estudo: {formatDuration(course.studyTime)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Course Content */}
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  O que você vai aprender
                </h2>
                <div className="space-y-4">
                  {course.lessonsData && course.lessonsData.length > 0 ? (
                    course.lessonsData.map((lesson: any, index: number) => {
                      const lessonNumber = lesson.order || index + 1;
                      const isCompleted = course.enrolled && (course.completedLessons || 0) >= lessonNumber;
                      
                      return (
                        <div
                          key={lesson.id || index}
                          onClick={() => handleLessonClick(lessonNumber)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer",
                            isCompleted
                              ? "bg-success/10 border-success/30 hover:bg-success/20"
                              : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            isCompleted
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              Aula {lessonNumber}: {lesson.title}
                            </div>
                            {lesson.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {lesson.description}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatDuration(lesson.duration)} de conteúdo
                            </div>
                          </div>
                          {!isCompleted && (
                            <Play className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Fallback para cursos antigos sem lessonsData
                    Array.from({ length: course.lessons }).map((_, index) => {
                    const lessonNumber = index + 1;
                    const isCompleted = course.enrolled && (course.completedLessons || 0) >= lessonNumber;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleLessonClick(lessonNumber)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer",
                          isCompleted
                            ? "bg-success/10 border-success/30 hover:bg-success/20"
                            : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          isCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            Aula {lessonNumber}: Tópico da Aula {lessonNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(Math.floor(course.duration / course.lessons))} de conteúdo
                          </div>
                        </div>
                        {!isCompleted && (
                          <Play className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <div className="glass-card p-6 sticky top-6">
                {course.enrolled ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2">Você está inscrito!</h3>
                      <p className="text-sm text-muted-foreground">
                        Continue aprendendo e complete o curso para ganhar seu certificado.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant="default"
                      size="lg"
                      onClick={() => {
                        // Encontrar primeira aula não concluída
                        const firstIncomplete = course.lessons - (course.completedLessons || 0) > 0 
                          ? (course.completedLessons || 0) + 1 
                          : 1;
                        handleLessonClick(firstIncomplete);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continuar Curso
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2">Comece agora</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Inscreva-se gratuitamente e comece sua jornada de aprendizado.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant="default"
                      size="lg"
                      onClick={handleEnroll}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Inscrever-se no Curso
                    </Button>
                  </>
                )}

                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aulas</span>
                    <span className="font-medium">{course.lessons}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="font-medium">{course.category}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Info */}
              {course.enrolled && (
                <div className="glass-card p-6 border-success/30 bg-success/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-success" />
                    <h3 className="font-display font-semibold text-lg text-success">
                      Certificado
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.hasCertificate
                      ? "Parabéns! Você já conquistou o certificado deste curso."
                      : "Complete 100% do curso para receber seu certificado digital."}
                  </p>
                  {course.hasCertificate && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadCertificate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Certificado
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      {selectedLesson && (
        <VideoPlayer
          isOpen={isVideoOpen}
          onClose={() => {
            setIsVideoOpen(false);
            setSelectedLesson(null);
          }}
          videoUrl={selectedLesson?.videoUrl || course?.videoUrl || ""}
          lessonTitle={selectedLesson.title}
          lessonNumber={selectedLesson.number}
          onComplete={handleLessonComplete}
          isCompleted={course?.enrolled && (course.completedLessons || 0) >= selectedLesson.number}
        />
      )}
    </div>
  );
}

