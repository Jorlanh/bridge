import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CourseCard } from "@/components/academy/CourseCard";
import { CategoryTabs } from "@/components/academy/CategoryTabs";
import { LearningPath } from "@/components/academy/LearningPath";
import { Award, TrendingUp, Clock, BookOpen, Inbox } from "lucide-react";
import { academyApi, Course, LearningPath as LearningPathType } from "@/lib/api";
import { toast } from "sonner";
import { openWhatsApp } from "@/lib/utils";

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

export default function Academy() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalCourses: 0,
    averageProgress: 0,
    certificates: 0,
    studyHours: 0,
    studyMinutes: 0,
  });
  const [learningPath, setLearningPath] = useState<LearningPathType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [coursesRes, statsRes, learningPathRes] = await Promise.all([
          academyApi.getCourses(),
          academyApi.getStats(),
          academyApi.getLearningPath(),
        ]);

        if (coursesRes.success) {
          setCourses(coursesRes.courses);
        }
        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (learningPathRes.success) {
          setLearningPath(learningPathRes.learningPath);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar por categoria
  const filteredByCategory = activeCategory === "all" 
    ? courses 
    : courses.filter(course => {
        const categoryMap: Record<string, string> = {
          business: "IA para Negócios",
          automation: "Automação",
          marketing: "Marketing com IA",
          sales: "Vendas Inteligentes",
          support: "Atendimento",
          security: "Segurança Digital",
        };
        return course.category === categoryMap[activeCategory];
      });

  // Filtrar por busca
  const filteredCourses = searchTerm.trim() === ""
    ? filteredByCategory
    : filteredByCategory.filter(course => {
        const searchLower = searchTerm.toLowerCase();
        return (
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          course.category.toLowerCase().includes(searchLower)
        );
      });

  const handleCourseClick = async (course: Course, e: React.MouseEvent) => {
    // Sempre navegar para a página de detalhes
    navigate(`/academy/course/${course.id}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AcademySidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="BridgeAI Academy" 
          subtitle="Capacite-se em inteligência artificial"
          onMenuClick={() => {}}
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar cursos..."
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-12 w-12 rounded-xl bg-muted mb-4" />
                  <div className="h-8 w-16 bg-muted rounded mb-2" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <div className="text-sm text-muted-foreground">Cursos disponíveis</div>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                  <div className="text-sm text-muted-foreground">Progresso geral</div>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.certificates}</div>
                  <div className="text-sm text-muted-foreground">Certificados</div>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatDuration(stats.studyMinutes)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tempo de estudo</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl mb-2">Biblioteca de Cursos</h2>
                <p className="text-muted-foreground">Explore nossa coleção completa de treinamentos em IA</p>
              </div>

              <CategoryTabs 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory} 
              />

              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-5 animate-pulse">
                      <div className="h-40 bg-muted rounded-lg mb-4" />
                      <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                      <div className="h-4 w-full bg-muted rounded mb-4" />
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Inbox className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">Nenhum curso encontrado</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeCategory === "all" 
                      ? "Não há cursos disponíveis no momento." 
                      : "Não há cursos nesta categoria."}
                  </p>
                  {activeCategory !== "all" && (
                    <button
                      onClick={() => setActiveCategory("all")}
                      className="text-primary hover:underline font-medium"
                    >
                      Ver todos os cursos
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} onClick={(e) => handleCourseClick(course, e)}>
                      <CourseCard
                        title={course.title}
                        description={course.description}
                        category={course.category}
                        duration={formatDuration(course.duration)}
                        lessons={course.lessons}
                        progress={course.progress}
                        thumbnail={course.thumbnail}
                        featured={course.featured}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {learningPath && <LearningPath {...learningPath} />}

              {/* Consultoria CTA */}
              <div className="glass-card p-6 bg-gradient-to-br from-secondary/10 to-primary/10">
                <h3 className="font-display font-semibold text-lg mb-2">Consultoria em Grupo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Participe de sessões ao vivo com especialistas e tire suas dúvidas.
                </p>
                <button 
                  onClick={() => openWhatsApp("+5519995555280", "Olá! Gostaria de agendar uma sessão de consultoria em grupo.")}
                  className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 transition-colors"
                >
                  Agendar sessão
                </button>
              </div>

              {/* WhatsApp CTA */}
              <div className="glass-card p-6 border-success/30 bg-success/5">
                <h3 className="font-display font-semibold text-lg mb-2 text-success">Precisa de ajuda?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nossa equipe está disponível via WhatsApp para suporte personalizado.
                </p>
                <button 
                  onClick={() => openWhatsApp("+5519995555280", "Olá! Gostaria de receber suporte personalizado sobre a BridgeAI Academy.")}
                  className="w-full py-3 rounded-xl bg-success text-success-foreground font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
                >
                  Falar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
