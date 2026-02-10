import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CourseCard } from "@/components/academy/CourseCard";
import { CategoryTabs } from "@/components/academy/CategoryTabs";
import { academyApi, Course } from "@/lib/api";
import { toast } from "sonner";
import { BookOpen, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function Courses() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "enrolled">("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      try {
        const result = await academyApi.getCourses();
        if (result.success) {
          setCourses(result.courses);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao carregar cursos";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleEnroll = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await academyApi.enrollInCourse(courseId);
      toast.success("Inscrição realizada com sucesso!");
      // Recarregar cursos
      const result = await academyApi.getCourses();
      if (result.success) {
        setCourses(result.courses);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao se inscrever no curso";
      toast.error(errorMessage);
    }
  };

  const handleCourseClick = (course: Course) => {
    navigate(`/academy/course/${course.id}`);
  };

  // Filtrar cursos por tab
  const filteredByTab = activeTab === "all" 
    ? courses 
    : courses.filter(course => course.enrolled);

  // Filtrar por categoria
  const filteredByCategory = activeCategory === "all" 
    ? filteredByTab 
    : filteredByTab.filter(course => {
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

  const enrolledCourses = courses.filter(c => c.enrolled);
  const allCourses = courses;

  return (
    <div className="flex min-h-screen bg-background">
      <AcademySidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Cursos" 
          subtitle="Explore nossa biblioteca completa de cursos"
          onMenuClick={() => {}}
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar cursos..."
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-6 py-3 font-medium text-sm transition-colors relative",
                  activeTab === "all"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos os Cursos
                <span className="ml-2 text-xs text-muted-foreground">
                  ({allCourses.length})
                </span>
                {activeTab === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("enrolled")}
                className={cn(
                  "px-6 py-3 font-medium text-sm transition-colors relative",
                  activeTab === "enrolled"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Meus Cursos
                <span className="ml-2 text-xs text-muted-foreground">
                  ({enrolledCourses.length})
                </span>
                {activeTab === "enrolled" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Category Tabs - apenas se estiver na tab "Todos os Cursos" */}
          {activeTab === "all" && (
            <div className="mb-6">
              <CategoryTabs 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory} 
              />
            </div>
          )}

          {/* Courses Grid */}
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
              <h3 className="font-display font-semibold text-xl mb-2">
                {activeTab === "all" ? "Nenhum curso encontrado" : "Você ainda não se inscreveu em nenhum curso"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === "all" 
                  ? activeCategory !== "all"
                    ? "Não há cursos nesta categoria."
                    : "Não há cursos disponíveis no momento."
                  : "Explore nossa biblioteca e comece sua jornada de aprendizado!"}
              </p>
              {activeTab === "enrolled" && (
                <Button onClick={() => setActiveTab("all")}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ver Todos os Cursos
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="relative group">
                  <div onClick={() => handleCourseClick(course)}>
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
                  {!course.enrolled && (
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        size="sm"
                        onClick={(e) => handleEnroll(course.id, e)}
                        className="bg-primary hover:bg-primary/90 shadow-lg"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Inscrever-se
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

