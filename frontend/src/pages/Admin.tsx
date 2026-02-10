import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { adminApi, rolesApi, AdminStats, AdminUser, Role } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Shield,
  Activity,
  BarChart3,
  Settings,
  Loader2,
  Edit,
  CheckCircle2,
  X,
  AlertTriangle,
  Plus,
  Trash2,
  GraduationCap,
  Video,
  Calendar,
  UserCircle2,
  HelpCircle,
  Lock,
  Globe,
  Clock,
  Zap,
  Server,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin: userIsAdmin, isMaster, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [consultingSessions, setConsultingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [userOverview, setUserOverview] = useState<{
    totalEnrollments: number;
    completedCourses: number;
    inProgressCourses: number;
    totalStudyMinutes: number;
  } | null>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);
  const [showFinancialGuide, setShowFinancialGuide] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const [securityFilters, setSecurityFilters] = useState({
    status: "" as "" | "success" | "failed",
    limit: 200,
  });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
  const [activeSecurityTab, setActiveSecurityTab] = useState("security");
  const [consultingTab, setConsultingTab] = useState<"active" | "completed" | "cancelled" | "all">("all");
  
  // Estados para cursos
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState("IA para Negócios");
  const [aiNumberOfLessons, setAiNumberOfLessons] = useState(5);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "IA para Negócios",
    thumbnail: "",
    videoUrl: "",
    featured: false,
    status: "active" as "active" | "draft" | "archived",
    objectives: [] as string[],
    prerequisites: [] as string[],
    lessons: [
      {
        title: "",
        description: "",
        videoUrl: "",
        duration: 0,
        order: 1,
        content: "",
        resources: [] as Array<{ title: string; url: string; type: "pdf" | "link" | "video" | "other" }>,
      },
    ] as Array<{
      title: string;
      description: string;
      videoUrl: string;
      duration: number;
      order: number;
      content: string;
      resources: Array<{ title: string; url: string; type: "pdf" | "link" | "video" | "other" }>;
    }>,
  });
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Estados para sessões de consultoria
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    duration: 60,
    maxParticipants: 20,
    instructor: "",
    platform: "zoom" as "zoom" | "meet" | "teams" | "other",
    meetingLink: "",
    status: "available" as "scheduled" | "available" | "full" | "completed" | "cancelled",
  });
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [aiSessionDialogOpen, setAiSessionDialogOpen] = useState(false);
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);
  const [aiSessionTopic, setAiSessionTopic] = useState("");
  const [aiSessionDescription, setAiSessionDescription] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!userIsAdmin) {
        toast({
          title: "Acesso Negado",
          description: "Apenas administradores podem acessar esta página.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      loadData();
    }
  }, [userIsAdmin, authLoading, navigate, toast]);

  const currentSection: "overview" | "users" | "courses" | "consulting" | "activities" | "financial" | "security" = (() => {
    if (location.pathname.startsWith("/admin/usuarios")) return "users";
    if (location.pathname.startsWith("/admin/cursos")) return "courses";
    if (location.pathname.startsWith("/admin/consultorias")) return "consulting";
    if (location.pathname.startsWith("/admin/atividades")) return "activities";
    if (location.pathname.startsWith("/admin/financeiro")) return "financial";
    if (location.pathname.startsWith("/admin/seguranca")) return "security";
    return "overview";
  })();

  useEffect(() => {
    if (currentSection === "financial" && isMaster) {
      loadFinancialData();
    }
    if (currentSection === "security" && userIsAdmin) {
      loadSecurityLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, isMaster, userIsAdmin]);

  const loadFinancialData = async () => {
    if (!isMaster) return;
    try {
      setIsLoadingFinancial(true);
      const result = await adminApi.getFinancialStats();
      if (result.success) {
        setFinancialStats(result.stats);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados financeiros",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  const loadSecurityLogs = async () => {
    if (!userIsAdmin) return;
    try {
      setIsLoadingSecurity(true);
      const params: any = { limit: securityFilters.limit };
      if (securityFilters.status) params.status = securityFilters.status;
      
      const result = await adminApi.getSecurityLogs(params);
      if (result.success) {
        setSecurityLogs(result.logs || []);
        setSecurityStats(result.stats || null);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar logs de segurança",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  const loadSystemInfo = async () => {
    if (!userIsAdmin) return;
    try {
      setIsLoadingSystem(true);
      const token = sessionStorage.getItem("bridgeai_token") || localStorage.getItem("bridgeai_token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      
      const response = await fetch(`${apiUrl}/api/admin/system/info`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSystemInfo(result);
      } else {
        throw new Error(result.message || "Erro ao buscar informações do sistema");
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar informações do sistema:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar informações do sistema",
        variant: "destructive",
      });
      setSystemInfo(null);
    } finally {
      setIsLoadingSystem(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsResult, usersResult, rolesResult, coursesResult, sessionsResult] = await Promise.all([
        adminApi.getStats().catch(() => ({ success: false, stats: null })),
        adminApi.getAllUsers().catch(() => ({ success: false, users: [] })),
        rolesApi.getRoles().catch(() => ({ success: false, roles: [] })),
        adminApi.getAllCourses().catch(() => ({ success: false, courses: [] })),
        adminApi.getAllConsultingSessions().catch(() => ({ success: false, sessions: [] })),
      ]);

      if (statsResult.success) setStats(statsResult.stats);
      if (usersResult.success) setUsers(usersResult.users);
      if (rolesResult.success) setRoles(rolesResult.roles);
      if (coursesResult.success) setCourses(coursesResult.courses);
      if (sessionsResult.success) setConsultingSessions(sessionsResult.sessions);
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

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map(r => r.id));
    setProfileForm({
      name: user.name || "",
      email: user.email || "",
      company: user.company || "",
      phone: (user as any).phone || "",
    });
    // Buscar dados adicionais (courses, estudo) de forma assíncrona
    adminApi.getUserOverview(user.id)
      .then((result) => {
        if (result.success) {
          setUserOverview(result.overview);
        }
      })
      .catch(() => {
        setUserOverview(null);
      });
    setEditUserDialogOpen(true);
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;

    try {
      // Atualizar dados básicos do usuário
      await adminApi.updateUser(selectedUser.id, {
        name: profileForm.name,
        company: profileForm.company || undefined,
        phone: profileForm.phone || undefined,
      });

      // Atualizar roles
      const result = await adminApi.updateUserRole(selectedUser.id, selectedRoleIds);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message || "Perfil do usuário atualizado com sucesso!",
        });
        setEditUserDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar role do usuário",
        variant: "destructive",
      });
    }
  };

  // Funções para cursos
  const handleOpenCourseForm = (course?: any) => {
    if (course) {
      setSelectedCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level || "iniciante",
        thumbnail: course.thumbnail || "",
        videoUrl: course.videoUrl || "",
        featured: course.featured,
        status: course.status,
        objectives: course.objectives || [],
        prerequisites: course.prerequisites || [],
        lessons: course.lessonsData || [
          {
            title: "",
            description: "",
            videoUrl: "",
            duration: 0,
            order: 1,
            content: "",
            resources: [],
          },
        ],
      });
    } else {
      setSelectedCourse(null);
      setCourseForm({
        title: "",
        description: "",
        category: "IA para Negócios",
        level: "iniciante",
        thumbnail: "",
        videoUrl: "",
        featured: false,
        status: "active",
        objectives: [],
        prerequisites: [],
        lessons: [
          {
            title: "",
            description: "",
            videoUrl: "",
            duration: 0,
            order: 1,
            content: "",
            resources: [],
          },
        ],
      });
    }
    setShowCourseForm(true);
  };

  const handleAddLesson = () => {
    setCourseForm({
      ...courseForm,
      lessons: [
        ...courseForm.lessons,
        {
          title: "",
          description: "",
          videoUrl: "",
          duration: 0,
          order: courseForm.lessons.length + 1,
          content: "",
          resources: [],
        },
      ],
    });
  };

  const handleRemoveLesson = (index: number) => {
    const newLessons = courseForm.lessons.filter((_, i) => i !== index);
    // Reordenar
    newLessons.forEach((lesson, i) => {
      lesson.order = i + 1;
    });
    setCourseForm({
      ...courseForm,
      lessons: newLessons,
    });
  };

  const handleUpdateLesson = (index: number, field: string, value: any) => {
    const newLessons = [...courseForm.lessons];
    newLessons[index] = {
      ...newLessons[index],
      [field]: value,
    };
    setCourseForm({
      ...courseForm,
      lessons: newLessons,
    });
  };

  const handleAddObjective = () => {
    setCourseForm({
      ...courseForm,
      objectives: [...courseForm.objectives, ""],
    });
  };

  const handleRemoveObjective = (index: number) => {
    setCourseForm({
      ...courseForm,
      objectives: courseForm.objectives.filter((_, i) => i !== index),
    });
  };

  const handleAddPrerequisite = () => {
    setCourseForm({
      ...courseForm,
      prerequisites: [...courseForm.prerequisites, ""],
    });
  };

  const handleRemovePrerequisite = (index: number) => {
    setCourseForm({
      ...courseForm,
      prerequisites: courseForm.prerequisites.filter((_, i) => i !== index),
    });
  };

  const handleGenerateCourseWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: "Erro",
        description: "Digite o tópico do curso",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingCourse(true);
      
      // Usar a mesma função de autenticação que as outras APIs
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem("bridgeai_token");
      
      const response = await fetch(`${API_URL}/api/admin/courses/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          numberOfLessons: aiNumberOfLessons,
        }),
      });

      if (response.status === 401) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erro ao gerar curso");
      }

      // Preencher formulário com dados gerados
      const courseData = result.courseData;
      setCourseForm({
        title: courseData.title || "",
        description: courseData.description || "",
        category: aiCategory,
        level: courseData.level || "iniciante",
        thumbnail: "",
        videoUrl: "",
        featured: false,
        status: "draft",
        objectives: courseData.objectives || [],
        prerequisites: courseData.prerequisites || [],
        lessons: courseData.lessons?.map((lesson: any, index: number) => ({
          title: lesson.title || "",
          description: lesson.description || "",
          videoUrl: lesson.videoUrl || "",
          duration: lesson.duration || 15,
          order: lesson.order || index + 1,
          content: lesson.content || "",
          resources: [],
        })) || [],
      });

      setShowCourseForm(true);
      toast({
        title: "Sucesso",
        description: "Curso gerado com IA! Revise e ajuste os dados antes de salvar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar curso com IA",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (selectedCourse) {
        await adminApi.updateCourse(selectedCourse.id, courseForm);
        toast({
          title: "Sucesso",
          description: "Curso atualizado com sucesso!",
        });
      } else {
        await adminApi.createCourse(courseForm);
        toast({
          title: "Sucesso",
          description: "Curso criado com sucesso!",
        });
      }
      setShowCourseForm(false);
      setSelectedCourse(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar curso",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await adminApi.deleteCourse(courseToDelete);
      toast({
        title: "Sucesso",
        description: "Curso deletado com sucesso!",
      });
      setDeleteCourseDialogOpen(false);
      setCourseToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar curso",
        variant: "destructive",
      });
    }
  };

  // Funções para sessões de consultoria
  const handleGenerateSessionWithAI = async () => {
    if (!aiSessionTopic.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o tópico da consultoria",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingSession(true);
      const result = await adminApi.generateConsultingSessionWithAI(
        aiSessionTopic,
        aiSessionDescription || undefined
      );

      if (result.success && result.consultingData) {
        // Preencher o formulário com os dados gerados
        setSessionForm({
          title: result.consultingData.title,
          description: result.consultingData.description,
          date: new Date().toISOString().split("T")[0],
          time: "19:00",
          duration: result.consultingData.duration,
          maxParticipants: result.consultingData.maxParticipants,
          instructor: result.consultingData.instructor,
          platform: result.consultingData.platform,
          meetingLink: "", // Link será preenchido manualmente depois
          status: "available",
        });

        setSelectedSession(null);
        setAiSessionDialogOpen(false);
        setSessionDialogOpen(true);
        
        toast({
          title: "Sucesso",
          description: "Consultoria gerada com IA! Revise os dados e adicione o link da plataforma.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar consultoria com IA",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSession(false);
    }
  };

  const handleOpenSessionDialog = (session?: any) => {
    if (session) {
      setSelectedSession(session);
      setSessionForm({
        title: session.title,
        description: session.description || "",
        date: new Date(session.date).toISOString().split("T")[0],
        time: session.time,
        duration: session.duration,
        maxParticipants: session.maxParticipants,
        instructor: session.instructor,
        platform: session.platform,
        meetingLink: session.meetingLink || "",
        status: session.status,
      });
    } else {
      setSelectedSession(null);
      setSessionForm({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        time: "19:00",
        duration: 60,
        maxParticipants: 20,
        instructor: "",
        platform: "zoom",
        meetingLink: "",
        status: "available",
      });
    }
    setSessionDialogOpen(true);
  };

  const handleSaveSession = async () => {
    try {
      if (selectedSession) {
        await adminApi.updateConsultingSession(selectedSession.id, sessionForm);
        toast({
          title: "Sucesso",
          description: "Sessão de consultoria atualizada com sucesso!",
        });
      } else {
        await adminApi.createConsultingSession(sessionForm);
        toast({
          title: "Sucesso",
          description: "Sessão de consultoria criada com sucesso!",
        });
      }
      setSessionDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar sessão",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await adminApi.deleteConsultingSession(sessionToDelete);
      toast({
        title: "Sucesso",
        description: "Sessão deletada com sucesso!",
      });
      setDeleteSessionDialogOpen(false);
      setSessionToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar sessão",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar 
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!userIsAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Painel Administrativo" 
          subtitle="Gerenciamento completo do sistema"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Conteúdo por seção (cada URL mostra só uma tela) */}
          {currentSection === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid (apenas na visão geral do admin) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Usuários"
              value={stats?.users.total.toString() || "0"}
              change={`${stats?.users.active || 0} ativos`}
              changeType="positive"
              icon={Users}
            />
                {isMaster && (
            <StatCard
              title="Receita Total"
              value={stats?.business.totalRevenue ? `R$ ${(stats.business.totalRevenue / 1000).toFixed(1)}k` : "R$ 0"}
              change="Total de oportunidades"
              changeType="positive"
              icon={DollarSign}
            />
                )}
            <StatCard
              title="Leads Capturados"
              value={stats?.business.totalLeads.toLocaleString("pt-BR") || "0"}
              change="Total de leads"
              changeType="positive"
              icon={TrendingUp}
            />
            <StatCard
              title="Sistema"
              value={`${stats?.system.totalRoles || 0} roles`}
              change={`${stats?.system.totalWorkflows || 0} workflows ativos`}
              changeType="positive"
              icon={Shield}
            />
          </div>
              {/* Cards de estatísticas rápidas */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Business Stats */}
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold text-lg mb-4">Estatísticas de Negócio</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Workflows Ativos</span>
                      <span className="font-semibold">{stats?.business.activeWorkflows || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tickets Resolvidos</span>
                      <span className="font-semibold">{stats?.business.resolvedTickets || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posts Publicados</span>
                      <span className="font-semibold">{stats?.business.publishedPosts || 0}</span>
                    </div>
                  </div>
                </Card>

                {/* System Stats */}
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold text-lg mb-4">Estatísticas do Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Campanhas</span>
                      <span className="font-semibold">{stats?.system.totalCampaigns || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Oportunidades</span>
                      <span className="font-semibold">{stats?.system.totalDeals || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tickets</span>
                      <span className="font-semibold">{stats?.system.totalTickets || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posts</span>
                      <span className="font-semibold">{stats?.system.totalPosts || 0}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Gráficos de visão geral */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Receita x Leads */}
              <Card className="p-6 glass-card">
                  <h3 className="font-semibold text-lg mb-4">Receita x Leads</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Negócios",
                            receita: (stats?.business.totalRevenue || 0) / 1000,
                            leads: stats?.business.totalLeads || 0,
                          },
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                        <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                        <Tooltip
                          formatter={(value: any, name: string) => {
                            if (name === "receita") {
                              return [`R$ ${(value as number).toFixed(1)}k`, "Receita"];
                            }
                            if (name === "leads") {
                              return [value, "Leads"];
                            }
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: "hsl(222, 47%, 8%)",
                            border: "1px solid hsl(222, 30%, 18%)",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="receita" name="Receita (k)" fill="hsl(190, 100%, 50%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="leads" name="Leads" fill="hsl(270, 100%, 70%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                </Card>

                {/* Tickets e Posts */}
                <Card className="p-6 glass-card">
                  <h3 className="font-semibold text-lg mb-4">Atendimento e Conteúdo</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Atendimento",
                            tickets: stats?.system.totalTickets || 0,
                            resolvidos: stats?.business.resolvedTickets || 0,
                            posts: stats?.system.totalPosts || 0,
                          },
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                        <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(222, 47%, 8%)",
                            border: "1px solid hsl(222, 30%, 18%)",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="tickets" name="Tickets Totais" fill="hsl(15, 90%, 60%)" radius={[4, 4, 0, 0]} />
                        <Bar
                          dataKey="resolvidos"
                          name="Tickets Resolvidos"
                          fill="hsl(142, 70%, 50%)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar dataKey="posts" name="Posts Publicados" fill="hsl(220, 90%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

            </div>
          )}

          {currentSection === "users" && (
            <div className="space-y-6">
              {/* Resumo de quantidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Usuários do Sistema
                      </p>
                      <p className="text-2xl font-bold">
                        {users.filter((u) => u.roles.length > 0).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Administradores
                      </p>
                      <p className="text-2xl font-bold">
                        {users.filter((u) =>
                          u.roles.some((r) => r.name?.toLowerCase() === "admin")
                        ).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Abas: Admins x Usuários do Sistema */}
              <Tabs defaultValue="admins" className="space-y-6">
                <TabsList className="flex w-full gap-2">
                  <TabsTrigger value="admins" className="flex-1">
                    Administradores
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex-1">
                    Usuários do Sistema
                  </TabsTrigger>
                </TabsList>

                {/* Admins */}
                <TabsContent value="admins" className="space-y-6">
                  <Card className="p-6 glass-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg">Administradores</h3>
                      <Badge variant="outline">
                        {users.filter((u) =>
                          u.roles.some((r) => r.name?.toLowerCase() === "admin")
                        ).length}{" "}
                        admins
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {users
                        .filter((user) =>
                          user.roles.some((r) => r.name?.toLowerCase() === "admin")
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                                {user.company && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.company}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2 flex-wrap">
                                {user.roles.map((role) => (
                                  <Badge key={role.id} variant="outline">
                                    {role.name}
                                  </Badge>
                                ))}
                              </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <UserCircle2 className="w-4 h-4 mr-2" />
                            Abrir Perfil
                          </Button>
                            </div>
                          </div>
                        ))}
                      {users.filter((u) =>
                        u.roles.some((r) => r.name?.toLowerCase() === "admin")
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum administrador cadastrado.
                        </p>
                      )}
                </div>
              </Card>
            </TabsContent>

                {/* Usuários do Sistema (não-admins) */}
            <TabsContent value="users" className="space-y-6">
              <Card className="p-6 glass-card">
                <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg">Usuários do Sistema</h3>
                      <Badge variant="outline">
                        {users.filter(
                          (u) =>
                            u.roles.length > 0 &&
                            !u.roles.some(
                              (r) => r.name?.toLowerCase() === "admin"
                            )
                        ).length}{" "}
                        usuários
                      </Badge>
                </div>
                <div className="space-y-4">
                      {users
                        .filter(
                          (user) =>
                            user.roles.length > 0 &&
                            !user.roles.some(
                              (r) => r.name?.toLowerCase() === "admin"
                            )
                        )
                        .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                          ) : (
                            <Users className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                          {user.company && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.company}
                                  </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                              <div className="flex gap-2 flex-wrap">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                                <UserCircle2 className="w-4 h-4 mr-2" />
                                Abrir Perfil
                        </Button>
                      </div>
                    </div>
                  ))}
                      {users.filter(
                        (u) =>
                          u.roles.length > 0 &&
                          !u.roles.some(
                            (r) => r.name?.toLowerCase() === "admin"
                          )
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum usuário de sistema (não-admin) cadastrado.
                        </p>
                      )}
                </div>
              </Card>
            </TabsContent>
              </Tabs>
            </div>
          )}

          {currentSection === "courses" && (
            <div className="space-y-6">
              {!showCourseForm ? (
                <>
                  {/* Gerar Curso com IA */}
                  <Card className="p-6 glass-card border-primary/30 bg-primary/5">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      Gerar Curso com IA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Tópico do Curso *</Label>
                        <Input
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="Ex: Introdução à IA para Marketing"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <div className="relative">
                          <Input
                            value={aiCategory}
                            onChange={(e) => setAiCategory(e.target.value)}
                            placeholder="Digite ou selecione uma categoria"
                            list="ai-category-suggestions"
                            className="w-full"
                          />
                          <datalist id="ai-category-suggestions">
                            <option value="IA para Negócios" />
                            <option value="Automação" />
                            <option value="Marketing com IA" />
                            <option value="Vendas Inteligentes" />
                            <option value="Atendimento" />
                            <option value="Segurança Digital" />
                            <option value="Desenvolvimento de Software" />
                            <option value="Gestão de Projetos" />
                            <option value="Design e UX/UI" />
                            <option value="Análise de Dados" />
                            <option value="Business Intelligence" />
                            <option value="E-commerce" />
                            <option value="Redes Sociais" />
                            <option value="Content Marketing" />
                            <option value="SEO e SEM" />
                            <option value="Gestão de Pessoas" />
                            <option value="Liderança" />
                            <option value="Finanças e Contabilidade" />
                            <option value="Empreendedorismo" />
                            <option value="Idiomas" />
                            <option value="Comunicação" />
                            <option value="Vendas e Negociação" />
                            <option value="Customer Success" />
                            <option value="Operações" />
                            <option value="Logística" />
                            <option value="Recursos Humanos" />
                            <option value="Compliance" />
                            <option value="Qualidade" />
                            <option value="Inovação" />
                            <option value="Transformação Digital" />
                          </datalist>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number-of-lessons" className="font-semibold">
                          Quantidade de Aulas *
                        </Label>
                        <Input
                          id="number-of-lessons"
                          type="text"
                          inputMode="numeric"
                          value={aiNumberOfLessons === 0 ? '' : aiNumberOfLessons.toString()}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Permitir campo vazio para poder apagar tudo
                            if (inputValue === '') {
                              setAiNumberOfLessons(0);
                              return;
                            }
                            // Permitir apenas números
                            const numValue = parseInt(inputValue.replace(/\D/g, ''));
                            if (!isNaN(numValue) && numValue > 0) {
                              setAiNumberOfLessons(numValue);
                            }
                          }}
                          onBlur={(e) => {
                            // Validar apenas quando sair do campo
                            const value = parseInt(e.target.value) || 1;
                            setAiNumberOfLessons(Math.max(1, Math.min(100, value)));
                          }}
                          className="font-semibold text-lg"
                          placeholder="Ex: 5"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite quantas aulas o curso terá (1-100)
                        </p>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleGenerateCourseWithAI}
                          disabled={isGeneratingCourse || !aiTopic.trim() || aiNumberOfLessons < 1}
                          className="w-full"
                        >
                          {isGeneratingCourse ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando {aiNumberOfLessons} aulas...
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-4 h-4 mr-2" />
                              Gerar {aiNumberOfLessons} {aiNumberOfLessons === 1 ? 'Aula' : 'Aulas'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Lista de Cursos */}
                  <Card className="p-6 glass-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg">Gerenciar Cursos</h3>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{courses.length} cursos</Badge>
                        <Button onClick={() => handleOpenCourseForm()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Curso Manual
                        </Button>
                      </div>
                    </div>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                            <GraduationCap className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{course.title}</p>
                            {course.featured && (
                              <Badge variant="secondary" className="text-xs">Destaque</Badge>
                            )}
                            <Badge variant={course.status === "active" ? "default" : "outline"}>
                              {course.status === "active" ? "Ativo" : course.status === "draft" ? "Rascunho" : "Arquivado"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{course.category}</span>
                            <span>•</span>
                            <span>{course.duration}min</span>
                            <span>•</span>
                            <span>{course.lessons} aulas</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCourseForm(course)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCourseToDelete(course.id);
                            setDeleteCourseDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum curso cadastrado</p>
                    </div>
                  )}
                </div>
              </Card>
                </>
              ) : (
                /* Formulário de Curso */
                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">
                      {selectedCourse ? "Editar Curso" : "Novo Curso"}
                    </h3>
                    <Button variant="outline" onClick={() => {
                      setShowCourseForm(false);
                      setSelectedCourse(null);
                    }}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Informações Básicas</h4>
                      <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                          placeholder="Ex: Introdução à IA para Negócios"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição *</Label>
                        <Textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                          placeholder="Descreva o conteúdo do curso..."
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Categoria *</Label>
                          <div className="relative">
                            <Input
                              value={courseForm.category}
                              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                              placeholder="Digite ou selecione uma categoria"
                              list="category-suggestions"
                              className="w-full"
                            />
                            <datalist id="category-suggestions">
                              <option value="IA para Negócios" />
                              <option value="Automação" />
                              <option value="Marketing com IA" />
                              <option value="Vendas Inteligentes" />
                              <option value="Atendimento" />
                              <option value="Segurança Digital" />
                              <option value="Desenvolvimento de Software" />
                              <option value="Gestão de Projetos" />
                              <option value="Design e UX/UI" />
                              <option value="Análise de Dados" />
                              <option value="Business Intelligence" />
                              <option value="E-commerce" />
                              <option value="Redes Sociais" />
                              <option value="Content Marketing" />
                              <option value="SEO e SEM" />
                              <option value="Gestão de Pessoas" />
                              <option value="Liderança" />
                              <option value="Finanças e Contabilidade" />
                              <option value="Empreendedorismo" />
                              <option value="Idiomas" />
                              <option value="Comunicação" />
                              <option value="Vendas e Negociação" />
                              <option value="Customer Success" />
                              <option value="Operações" />
                              <option value="Logística" />
                              <option value="Recursos Humanos" />
                              <option value="Compliance" />
                              <option value="Qualidade" />
                              <option value="Inovação" />
                              <option value="Transformação Digital" />
                            </datalist>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Digite livremente ou selecione uma sugestão
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Nível *</Label>
                          <Select
                            value={courseForm.level}
                            onValueChange={(value: any) => setCourseForm({ ...courseForm, level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iniciante">Iniciante (Básico/Fundamental)</SelectItem>
                              <SelectItem value="medio">Médio (Intermediário)</SelectItem>
                              <SelectItem value="avancado">Avançado (Especialização)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={courseForm.status}
                            onValueChange={(value: any) => setCourseForm({ ...courseForm, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="archived">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>URL da Thumbnail</Label>
                          <Input
                            value={courseForm.thumbnail}
                            onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                            placeholder="https://exemplo.com/imagem.jpg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL do Vídeo de Preview</Label>
                          <Input
                            value={courseForm.videoUrl}
                            onChange={(e) => setCourseForm({ ...courseForm, videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="featured"
                          checked={courseForm.featured}
                          onCheckedChange={(checked) => setCourseForm({ ...courseForm, featured: checked })}
                        />
                        <Label htmlFor="featured">Curso em destaque</Label>
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Objetivos de Aprendizagem</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddObjective}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                      {courseForm.objectives.map((objective, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={objective}
                            onChange={(e) => {
                              const newObjectives = [...courseForm.objectives];
                              newObjectives[index] = e.target.value;
                              setCourseForm({ ...courseForm, objectives: newObjectives });
                            }}
                            placeholder="Ex: Aprender a usar IA para automação"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveObjective(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Pré-requisitos */}
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Pré-requisitos</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddPrerequisite}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                      {courseForm.prerequisites.map((prerequisite, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={prerequisite}
                            onChange={(e) => {
                              const newPrerequisites = [...courseForm.prerequisites];
                              newPrerequisites[index] = e.target.value;
                              setCourseForm({ ...courseForm, prerequisites: newPrerequisites });
                            }}
                            placeholder="Ex: Conhecimento básico de programação"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemovePrerequisite(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Aulas */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Aulas do Curso *</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddLesson}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Aula
                        </Button>
                      </div>
                      {courseForm.lessons.map((lesson, index) => (
                        <Card key={index} className="p-4 border-2">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold">Aula {index + 1}</h5>
                            {courseForm.lessons.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveLesson(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Título da Aula *</Label>
                              <Input
                                value={lesson.title}
                                onChange={(e) => handleUpdateLesson(index, "title", e.target.value)}
                                placeholder="Ex: Introdução à IA"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descrição</Label>
                              <Textarea
                                value={lesson.description}
                                onChange={(e) => handleUpdateLesson(index, "description", e.target.value)}
                                placeholder="Descreva o conteúdo desta aula..."
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>URL do Vídeo *</Label>
                                <Input
                                  value={lesson.videoUrl}
                                  onChange={(e) => handleUpdateLesson(index, "videoUrl", e.target.value)}
                                  placeholder="https://youtube.com/watch?v=..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Duração (minutos) *</Label>
                                <Input
                                  type="number"
                                  value={lesson.duration}
                                  onChange={(e) => handleUpdateLesson(index, "duration", parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Conteúdo (Markdown ou HTML)</Label>
                              <Textarea
                                value={lesson.content}
                                onChange={(e) => handleUpdateLesson(index, "content", e.target.value)}
                                placeholder="Conteúdo adicional da aula..."
                                rows={4}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-3 border-t pt-4">
                      <Button variant="outline" onClick={() => {
                        setShowCourseForm(false);
                        setSelectedCourse(null);
                      }}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveCourse}
                        disabled={courseForm.lessons.length === 0 || courseForm.lessons.some(l => !l.title || !l.videoUrl || l.duration === 0)}
                      >
                        {selectedCourse ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {currentSection === "consulting" && (() => {
            const activeSessions = consultingSessions.filter((s) =>
              ["scheduled", "available", "full"].includes(s.status)
            );
            const completedSessions = consultingSessions.filter((s) => s.status === "completed");
            const cancelledSessions = consultingSessions.filter((s) => s.status === "cancelled");

            const filteredSessions =
              consultingTab === "active"
                ? activeSessions
                : consultingTab === "completed"
                ? completedSessions
                : consultingTab === "cancelled"
                ? cancelledSessions
                : consultingSessions;

            const statusLabel = (status: string) => {
              switch (status) {
                case "available":
                  return "Disponível";
                case "scheduled":
                  return "Agendada";
                case "full":
                  return "Lotada";
                case "completed":
                  return "Concluída";
                case "cancelled":
                  return "Cancelada";
                default:
                  return status;
              }
            };

            const statusVariant = (status: string): "default" | "outline" | "destructive" => {
              if (status === "available" || status === "scheduled") return "default";
              if (status === "full" || status === "cancelled") return "destructive";
              return "outline";
            };

            return (
            <div className="space-y-6">
              <Card className="p-6 glass-card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                  <h3 className="font-semibold text-lg">Gerenciar Sessões de Consultoria</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualize, organize e edite todas as sessões de consultoria em grupo da BridgeAI.
                      </p>
                    </div>
                  <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAiSessionTopic("");
                          setAiSessionDescription("");
                          setAiSessionDialogOpen(true);
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Criar com IA
                      </Button>
                    <Button onClick={() => handleOpenSessionDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Sessão
                    </Button>
                  </div>
                </div>

                  <Tabs value={consultingTab} onValueChange={(v) => setConsultingTab(v as any)}>
                    <div className="flex flex-col gap-4">
                      <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted/40 p-0.5">
                        <TabsTrigger value="all">
                          Todas
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({consultingSessions.length})
                          </span>
                        </TabsTrigger>
                        <TabsTrigger value="active">
                          Ativas
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({activeSessions.length})
                          </span>
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                          Concluídas
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({completedSessions.length})
                          </span>
                        </TabsTrigger>
                        <TabsTrigger value="cancelled">
                          Canceladas
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({cancelledSessions.length})
                          </span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value={consultingTab} className="mt-0">
                        {filteredSessions.length === 0 ? (
                          <div className="py-12 text-center text-muted-foreground">
                            <Video className="w-12 h-12 mx-auto mb-4 opacity-40" />
                            <p className="font-medium mb-1">
                              Nenhuma sessão encontrada para este filtro
                            </p>
                            <p className="text-sm">
                              Altere o filtro acima ou crie uma nova sessão de consultoria.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredSessions.map((session) => (
                              <Card
                      key={session.id}
                                className="glass-card h-full p-5 flex flex-col justify-between border-border/60 bg-gradient-to-b from-background/70 to-background"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Video className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                                        <p className="font-semibold text-sm line-clamp-2">
                                          {session.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {session.platform === "meet"
                                            ? "Google Meet"
                                            : session.platform === "zoom"
                                            ? "Zoom"
                                            : session.platform === "teams"
                                            ? "Microsoft Teams"
                                            : "Online"}{" "}
                                          • {session.duration}min
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={statusVariant(session.status)} className="text-[11px]">
                                      {statusLabel(session.status)}
                            </Badge>
                          </div>

                                  <p className="text-xs text-muted-foreground line-clamp-3">
                                    {session.description || "Sem descrição cadastrada para esta sessão."}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                                      {new Date(session.date).toLocaleDateString("pt-BR")} às{" "}
                                      {session.time}
                            </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Users className="w-3 h-3" />
                                      {session.currentParticipants}/{session.maxParticipants}{" "}
                                      participantes
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <UserCircle2 className="w-3 h-3" />
                                      {session.instructor}
                                    </span>
                          </div>
                        </div>

                                <div className="mt-4 flex items-center justify-between gap-2">
                                  <div className="text-[11px] text-muted-foreground max-w-[60%]">
                                    {session.status === "completed"
                                      ? "Sessão já concluída. Use o botão Editar para ajustar informações."
                                      : session.status === "cancelled"
                                      ? "Sessão cancelada. Você pode reativá-la editando o status."
                                      : "Edite detalhes da sessão ou gerencie vagas e participante."}
                      </div>
                                  <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                                      className="text-xs"
                          onClick={() => handleOpenSessionDialog(session)}
                        >
                                      <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                                      className="text-xs"
                          onClick={() => {
                            setSessionToDelete(session.id);
                            setDeleteSessionDialogOpen(true);
                          }}
                        >
                                      <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                              </Card>
                  ))}
                    </div>
                  )}
                      </TabsContent>
                </div>
                  </Tabs>
              </Card>
            </div>
            );
          })()}

          {currentSection === "activities" && (
            <div className="space-y-6">
              <Card className="p-6 glass-card">
                <h3 className="font-semibold text-lg mb-4">Atividades Recentes</h3>
                <div className="space-y-3">
                  {stats?.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          activity.status === "success" ? "bg-success/20" : "bg-destructive/20"
                        )}>
                          {activity.status === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <X className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {currentSection === "financial" && isMaster && (
            <div className="space-y-6">
              {/* Botão Guia */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowFinancialGuide(true)}
                  className="gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Guia do Painel Financeiro
                </Button>
              </div>

              {isLoadingFinancial ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : financialStats ? (
                <>
                  {/* Cards de Resumo Financeiro */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Receita Fechada"
                      value={financialStats.revenue.closed ? `R$ ${(financialStats.revenue.closed / 1000).toFixed(1)}k` : "R$ 0"}
                      change="Deals fechados"
                      changeType="positive"
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Receita Esperada"
                      value={financialStats.revenue.expected ? `R$ ${(financialStats.revenue.expected / 1000).toFixed(1)}k` : "R$ 0"}
                      change="Baseado em probabilidades"
                      changeType="positive"
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Despesas Totais"
                      value={financialStats.expenses.total ? `R$ ${(financialStats.expenses.total / 1000).toFixed(1)}k` : "R$ 0"}
                      change={`R$ ${((financialStats.expenses.budget - financialStats.expenses.total) / 1000).toFixed(1)}k restantes`}
                      changeType="negative"
                      icon={BarChart3}
                    />
                    <StatCard
                      title="Lucro"
                      value={financialStats.profit.total ? `R$ ${(financialStats.profit.total / 1000).toFixed(1)}k` : "R$ 0"}
                      change={`${financialStats.profit.margin}% margem`}
                      changeType={financialStats.profit.total > 0 ? "positive" : "negative"}
                      icon={Shield}
                    />
                  </div>

                  {/* Gráficos */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Receita vs Despesas Mensais */}
                    <Card className="p-6 glass-card">
                      <h3 className="font-semibold text-lg mb-4">Receita vs Despesas (6 meses)</h3>
                      <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={financialStats.monthly.revenue.map((r: any, i: number) => ({
                              month: r.month,
                              receita: r.revenue,
                              despesas: financialStats.monthly.expenses[i]?.expenses || 0,
                            }))}
                            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                          >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                            <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                            <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(222, 47%, 8%)",
                                border: "1px solid hsl(222, 30%, 18%)",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar dataKey="receita" name="Receita" fill="hsl(142, 70%, 50%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesas" name="Despesas" fill="hsl(15, 90%, 60%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Evolução de Receita */}
                    <Card className="p-6 glass-card">
                      <h3 className="font-semibold text-lg mb-4">Evolução de Receita</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financialStats.monthly.revenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                            <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                            <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                                backgroundColor: "hsl(222, 47%, 8%)",
                                border: "1px solid hsl(222, 30%, 18%)",
                                borderRadius: "12px",
                        }}
                      />
                      <Line 
                        type="monotone" 
                              dataKey="revenue"
                        stroke="hsl(190, 100%, 50%)" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(190, 100%, 50%)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
                  </div>

                  {/* Top Deals */}
              <Card className="p-6 glass-card">
                    <h3 className="font-semibold text-lg mb-4">Top Oportunidades</h3>
                <div className="space-y-3">
                      {financialStats.topDeals.length > 0 ? (
                        financialStats.topDeals.map((deal: any) => (
                          <div
                            key={deal.id}
                            className="flex items-center justify-between p-4 rounded-xl border bg-muted/30"
                          >
                            <div>
                              <p className="font-medium">{deal.company}</p>
                              <p className="text-sm text-muted-foreground">
                                {deal.stage} • {deal.probability}% probabilidade • {deal.owner}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">R$ {(deal.value / 1000).toFixed(1)}k</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma oportunidade encontrada</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Campanhas por ROI */}
                  <Card className="p-6 glass-card">
                    <h3 className="font-semibold text-lg mb-4">Campanhas por ROI</h3>
                    <div className="space-y-3">
                      {financialStats.campaignsROI.length > 0 ? (
                        financialStats.campaignsROI.slice(0, 10).map((campaign: any) => (
                          <div
                            key={campaign.id}
                            className="flex items-center justify-between p-4 rounded-xl border bg-muted/30"
                          >
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {campaign.leads} leads • {campaign.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-bold text-lg",
                                parseFloat(campaign.roi) > 0 ? "text-success" : "text-destructive"
                              )}>
                                {parseFloat(campaign.roi) > 0 ? "+" : ""}{campaign.roi}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                R$ {(campaign.spent / 1000).toFixed(1)}k gastos
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma campanha encontrada</p>
                        </div>
                          )}
                        </div>
                  </Card>
                </>
              ) : (
                <Card className="p-6 glass-card">
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum dado financeiro disponível</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {currentSection === "security" && userIsAdmin && (
            <div className="space-y-6">
              {isLoadingSecurity ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Cabeçalho da Página */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-border/50">
                        <div>
                      <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        Segurança e Desempenho
                      </h2>
                      <p className="text-sm text-muted-foreground ml-16">
                        Monitoramento completo de segurança, logs de acesso, atividades e desempenho do sistema
                      </p>
                      </div>
                    <Badge variant="outline" className="text-xs px-3 py-1.5">
                      <Shield className="w-3 h-3 mr-1.5" />
                      Sistema Protegido
                    </Badge>
                  </div>

                  {/* Tabs para Segurança e Desempenho */}
                  <Tabs
                    value={activeSecurityTab}
                    onValueChange={(value) => {
                    setActiveSecurityTab(value);
                      if (value === "performance" && !systemInfo && !isLoadingSystem) {
                        loadSystemInfo();
                      }
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                      <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Segurança
                      </TabsTrigger>
                      <TabsTrigger value="performance" className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Desempenho
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba de Segurança */}
                    <TabsContent value="security" className="space-y-6 mt-6">

                  {/* Alertas e Avisos Críticos */}
                  {(securityStats?.suspiciousIPs?.length > 0 || securityStats?.blockedUsers?.length > 0 || (securityStats?.recentFailed24h && securityStats.recentFailed24h > 5)) && (
                    <Card className="p-5 glass-card border-2 border-destructive/50 bg-destructive/10">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-destructive mb-3">Alertas de Segurança</h3>
                          <div className="space-y-2 text-sm">
                            {securityStats?.suspiciousIPs?.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-destructive">⚠️</span>
                                <span className="text-foreground">
                                  <strong>{securityStats.suspiciousIPs.length}</strong> IP(s) suspeito(s) detectado(s)
                                </span>
                              </div>
                            )}
                            {securityStats?.recentFailed24h && securityStats.recentFailed24h > 5 && (
                              <div className="flex items-center gap-2">
                                <span className="text-destructive">⚠️</span>
                                <span className="text-foreground">
                                  <strong>{securityStats.recentFailed24h}</strong> tentativas falhadas nas últimas 24h
                                </span>
                              </div>
                            )}
                            {securityStats?.blockedUsers?.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-destructive">🔒</span>
                                <span className="text-foreground">
                                  <strong>{securityStats.blockedUsers.length}</strong> usuário(s) bloqueado(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Estatísticas Principais */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <Activity className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold">Visão Geral</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Total de Logs"
                      value={securityStats?.total?.toString() || "0"}
                      change="Registros de segurança"
                      changeType="positive"
                      icon={Shield}
                    />
                    <StatCard
                      title="Logins Bem-sucedidos"
                      value={securityStats?.success?.toString() || "0"}
                      change="Acessos autorizados"
                      changeType="positive"
                      icon={CheckCircle2}
                    />
                    <StatCard
                      title="Tentativas Falhadas"
                      value={securityStats?.failed?.toString() || "0"}
                      change="Acessos negados"
                      changeType="negative"
                      icon={AlertTriangle}
                    />
                    <StatCard
                      title="Taxa de Sucesso"
                      value={
                        securityStats?.total
                          ? `${((securityStats.success / securityStats.total) * 100).toFixed(1)}%`
                          : "0%"
                      }
                      change="Proporção de sucessos"
                      changeType="positive"
                      icon={TrendingUp}
                    />
                    </div>
                  </div>

                  {/* Estatísticas Recentes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <Clock className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold">Últimas 24 Horas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Atividade (24h)"
                      value={securityStats?.recent24h?.toString() || "0"}
                      change="Últimas 24 horas"
                      changeType="positive"
                      icon={Clock}
                    />
                    <StatCard
                      title="Falhas (24h)"
                      value={securityStats?.recentFailed24h?.toString() || "0"}
                      change="Tentativas falhadas"
                      changeType="negative"
                      icon={AlertTriangle}
                    />
                    <StatCard
                      title="IPs Suspeitos"
                      value={securityStats?.suspiciousIPs?.length?.toString() || "0"}
                      change="3+ tentativas falhadas"
                      changeType="negative"
                      icon={Globe}
                    />
                    <StatCard
                      title="Usuários Bloqueados"
                      value={securityStats?.blockedUsers?.length?.toString() || "0"}
                      change="Contas bloqueadas"
                      changeType="negative"
                      icon={Lock}
                    />
                    </div>
                  </div>

                  {/* Análises e Gráficos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold">Análises e Gráficos</h3>
                    </div>
                    
                    {/* Gráfico de Atividade por Hora - Ocupa largura total */}
                    {securityStats?.hourlyLogs && securityStats.hourlyLogs.length > 0 && (
                      <Card className="p-6 glass-card border-primary/20">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg">Atividade por Hora</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Distribuição de acessos nas últimas 24 horas
                        </p>
                        <div className="w-full h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={securityStats.hourlyLogs} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                              <XAxis 
                                dataKey="hour" 
                                stroke="hsl(215, 20%, 55%)" 
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(222, 47%, 8%)",
                                  border: "1px solid hsl(222, 30%, 18%)",
                                  borderRadius: "12px",
                                }}
                              />
                              <Bar dataKey="count" name="Acessos" fill="hsl(190, 100%, 50%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}

                    {/* Tipos de Ação Mais Comuns */}
                    {securityStats?.actionTypes && securityStats.actionTypes.length > 0 && (
                      <Card className="p-6 glass-card border-primary/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg">Tipos de Ação</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ações mais frequentes no sistema
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {securityStats.actionTypes.map((actionType: any, index: number) => (
                            <div
                              key={actionType.action}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>
                                <span className="text-sm font-medium">{actionType.action}</span>
                              </div>
                              <Badge variant="secondary">{actionType.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Seção de Ameaças e Bloqueios */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <h3 className="text-xl font-bold">Ameaças e Bloqueios</h3>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                    {/* IPs Suspeitos */}
                    {securityStats?.suspiciousIPs && securityStats.suspiciousIPs.length > 0 && (
                      <Card className="p-6 glass-card border-destructive/50 bg-destructive/5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">IPs Suspeitos</h3>
                              <p className="text-xs text-muted-foreground">
                                3+ tentativas falhadas
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {securityStats.suspiciousIPs.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {securityStats.suspiciousIPs.map((suspicious: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-destructive flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  {suspicious.ip}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {suspicious.attempts} tentativas falhadas
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(suspicious.lastAttempt).toLocaleString("pt-BR", {
                          day: "2-digit",
                                    month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                                </p>
                              </div>
                    </div>
                  ))}
                </div>
              </Card>
                    )}

                    {/* Usuários Bloqueados */}
                    {securityStats?.blockedUsers && securityStats.blockedUsers.length > 0 && (
                      <Card className="p-6 glass-card border-destructive/50 bg-destructive/5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Usuários Bloqueados</h3>
                              <p className="text-xs text-muted-foreground">
                                Contas desativadas
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {securityStats.blockedUsers.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {securityStats.blockedUsers.map((user: any) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Lock className="w-5 h-5 text-destructive" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(user.blockedAt).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    </div>
                  </div>

                  {/* Top IPs por Atividade */}
                  {securityStats?.topIPs && securityStats.topIPs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                        <Globe className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold">Top 10 IPs por Atividade</h3>
                      </div>
                      <Card className="p-6 glass-card border-primary/20">
                        <p className="text-sm text-muted-foreground mb-4">
                          IPs com maior volume de acessos ao sistema
                        </p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {securityStats.topIPs.map((ip: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">#{index + 1}</span>
                              </div>
                              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{ip.ip}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="text-success">{ip.success} sucessos</span>
                                  <span>•</span>
                                  <span className="text-destructive">{ip.failed} falhas</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">
                              {ip.total} total
                            </Badge>
                          </div>
                        ))}
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Lista Completa de Logs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold">Logs de Segurança</h3>
                        {securityLogs.length > 0 && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {securityLogs.length} registros
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Card className="p-6 glass-card border-primary/20">
                      <p className="text-sm text-muted-foreground mb-4">
                        Histórico completo de atividades e tentativas de acesso ao sistema
                      </p>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <div
                            key={log.id}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-md",
                              log.status === "failed"
                                ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/15"
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                log.status === "failed"
                                  ? "bg-destructive/20 ring-2 ring-destructive/30"
                                  : "bg-success/20 ring-2 ring-success/30"
                              )}
                            >
                              {log.status === "failed" ? (
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold truncate">{log.user}</p>
                                    {log.userEmail && (
                                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                                        ({log.userEmail})
                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground font-medium">{log.action}</p>
                                </div>
                                <Badge
                                  variant={log.status === "failed" ? "destructive" : "default"}
                                  className="flex-shrink-0"
                                >
                                  {log.status === "failed" ? "Falhado" : "Sucesso"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5" />
                                  <span className="font-mono">{log.ip}</span>
                                </span>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(log.createdAt).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum log de segurança encontrado</p>
                        </div>
                      )}
                      </div>
                    </Card>
                  </div>
                    </TabsContent>

                    {/* Aba de Desempenho */}
                    <TabsContent value="performance" className="space-y-6 mt-6">
                      {isLoadingSystem ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="ml-3 text-muted-foreground">Carregando informações do sistema...</span>
                        </div>
                      ) : systemInfo && (systemInfo.cpu || systemInfo.memory || systemInfo.system) ? (
                        <Card className="p-6 glass-card border-primary/20">
                          {/* Status de Saúde do Sistema */}
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full",
                                systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 80
                                  ? "bg-destructive animate-pulse"
                                  : systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 60
                                  ? "bg-warning"
                                  : "bg-success"
                              )} />
                              <h3 className="text-xl font-bold">Status do Sistema</h3>
                            </div>
                            <Badge
                              variant={systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 80 ? "destructive" : systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 60 ? "secondary" : "default"}
                              className="text-sm px-4 py-1.5"
                            >
                              {systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 80
                                ? "⚠️ Atenção"
                                : systemInfo.memory && parseFloat(systemInfo.memory.usagePercent) > 60
                                ? "⚡ Moderado"
                                : "✅ Saudável"}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Informações Básicas do Dispositivo */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Informações do Dispositivo
                              </h4>
                              <div className="space-y-3">
                                {systemInfo.system && (
                                  <>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                      <span className="text-sm font-medium">Sistema Operacional</span>
                                      <span className="text-sm text-muted-foreground capitalize">
                                        {systemInfo.system.platform} {systemInfo.system.arch}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                      <span className="text-sm font-medium">Hostname</span>
                                      <span className="text-sm text-muted-foreground font-mono">
                                        {systemInfo.system.hostname}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                      <span className="text-sm font-medium">Tempo Ativo</span>
                                      <span className="text-sm text-muted-foreground">
                                        {systemInfo.system.uptime}h
                                      </span>
                                    </div>
                                  </>
                                )}
                                {systemInfo.cpu && (
                                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <span className="text-sm font-medium">Processador</span>
                                    <span className="text-sm text-muted-foreground">
                                      {systemInfo.cpu.cores} cores
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Saúde do Sistema */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Saúde do Sistema
                              </h4>
                              <div className="space-y-3">
                                {systemInfo.memory && (
                                  <div className="p-4 rounded-lg border bg-muted/30">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-medium">Uso de Memória</span>
                                      <span className={cn(
                                        "text-sm font-bold",
                                        parseFloat(systemInfo.memory.usagePercent) > 80
                                          ? "text-destructive"
                                          : parseFloat(systemInfo.memory.usagePercent) > 60
                                          ? "text-warning"
                                          : "text-success"
                                      )}>
                                        {systemInfo.memory.usagePercent}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-4 mb-3">
                                      <div
                                        className={cn(
                                          "h-4 rounded-full transition-all",
                                          parseFloat(systemInfo.memory.usagePercent) > 80
                                            ? "bg-destructive"
                                            : parseFloat(systemInfo.memory.usagePercent) > 60
                                            ? "bg-warning"
                                            : "bg-success"
                                        )}
                                        style={{ width: `${systemInfo.memory.usagePercent}%` }}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-semibold">{systemInfo.memory.totalGB} GB</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Usado</p>
                                        <p className={cn(
                                          "font-semibold",
                                          parseFloat(systemInfo.memory.usagePercent) > 80
                                            ? "text-destructive"
                                            : "text-foreground"
                                        )}>
                                          {systemInfo.memory.usedGB} GB
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Livre</p>
                                        <p className="font-semibold text-success">{systemInfo.memory.freeGB} GB</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {systemInfo.cpu && systemInfo.cpu.loadAverage && (
                                  <div className="p-3 rounded-lg border bg-muted/30">
                                    <span className="text-sm font-medium block mb-2">Carga do CPU</span>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Últimos 15 min:</span>
                                        <span className={cn(
                                          "font-semibold",
                                          systemInfo.cpu.loadAverage[2] > systemInfo.cpu.cores * 0.8
                                            ? "text-destructive"
                                            : systemInfo.cpu.loadAverage[2] > systemInfo.cpu.cores * 0.6
                                            ? "text-warning"
                                            : "text-success"
                                        )}>
                                          {systemInfo.cpu.loadAverage[2].toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card className="p-6 glass-card border-primary/20">
                          <div className="text-center py-12 text-muted-foreground">
                            <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-2">Não foi possível carregar informações do sistema</p>
                            <p className="text-sm">Verifique se o servidor está rodando e tente novamente.</p>
                            <Button
                              onClick={loadSystemInfo}
                              className="mt-4"
                              variant="outline"
                            >
                              <Loader2 className="w-4 h-4 mr-2" />
                              Tentar Novamente
                            </Button>
                          </div>
                        </Card>
                      )}
            </TabsContent>
          </Tabs>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Perfil do Usuário (inclui edição de roles) */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserCircle2 className="w-6 h-6 text-primary" />
              Perfil de {selectedUser?.name || "usuário"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Visualize os dados do usuário e gerencie suas permissões (roles).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 px-6 max-h-[calc(95vh-180px)] overflow-y-auto">
            {/* Dados básicos do usuário */}
            {selectedUser && (
              <Card className="p-4 md:p-6 glass-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-semibold text-base sm:text-lg truncate">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Telefone:{" "}
                      <span className="font-medium text-foreground">
                        {selectedUser.phone || profileForm.phone || "não informado"}
                      </span>
                      </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Membro desde:{" "}
                      <span className="font-medium text-foreground">
                        {selectedUser.createdAt &&
                          new Date(selectedUser.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Tipo de acesso:{" "}
                      <span className="font-medium text-foreground">
                        {selectedUser.roles && selectedUser.roles.length > 0
                          ? selectedUser.roles.map((r: any) => r.name).join(", ")
                          : "Usuário"}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Resumo de uso / cursos - visível apenas para master */}
            {userOverview && isMaster && (
              <Card className="p-4 md:p-6 glass-card">
                <h4 className="font-semibold mb-3 text-base">Resumo de Atividade na Academy</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Cursos Matriculados</p>
                    <p className="text-lg font-bold">{userOverview.totalEnrollments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cursos Concluídos</p>
                    <p className="text-lg font-bold">{userOverview.completedCourses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Em Progresso</p>
                    <p className="text-lg font-bold">{userOverview.inProgressCourses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo de Estudo</p>
                    <p className="text-lg font-bold">
                      {Math.round((userOverview.totalStudyMinutes || 0) / 60)}h
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Form de dados básicos - apenas informações essenciais */}
            <Card className="p-4 md:p-6 glass-card">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nome completo do usuário"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={profileForm.email}
                    disabled
                    className="bg-muted/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>
              </div>
            </Card>

            {/* Seção de roles / permissões */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Roles do Usuário</p>
                  <p className="text-xs text-muted-foreground">
                    Defina os perfis de acesso que esse usuário possui no sistema.
                  </p>
                </div>
                <Badge variant="outline">
                  {selectedRoleIds.length} roles
                </Badge>
              </div>

            <Select
              value={selectedRoleIds.join(",")}
                onValueChange={(value) =>
                  setSelectedRoleIds(value ? value.split(",") : [])
                }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione as roles" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-wrap">
              {selectedRoleIds.map((roleId) => {
                  const role = roles.find((r) => r.id === roleId);
                return role ? (
                  <Badge key={roleId} variant="secondary">
                    {role.name}
                    <button
                        onClick={() =>
                          setSelectedRoleIds((prev) =>
                            prev.filter((id) => id !== roleId)
                          )
                        }
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {selectedUser && (
                <>
                  <Button
                    type="button"
                    variant={selectedUser.isBlocked ? "outline" : "destructive"}
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={async () => {
                      if (!selectedUser) return;
                      try {
                        if (selectedUser.isBlocked) {
                          await adminApi.unblockUser(selectedUser.id);
                          toast({
                            title: "Usuário desbloqueado",
                          });
                        } else {
                          await adminApi.blockUser(selectedUser.id);
                          toast({
                            title: "Usuário bloqueado",
                            description: "Ele não poderá mais acessar o sistema.",
                          });
                        }
                        setEditUserDialogOpen(false);
                        loadData();
                      } catch (error: any) {
                        toast({
                          title: "Erro",
                          description: error.message || "Erro ao atualizar status do usuário",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {selectedUser.isBlocked ? "Desbloquear" : "Bloquear Usuário"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={async () => {
                      if (!selectedUser) return;
                      const confirmDelete = window.confirm(
                        "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
                      );
                      if (!confirmDelete) return;
                      try {
                        await adminApi.deleteUser(selectedUser.id);
                        toast({
                          title: "Usuário excluído",
                          description: "O usuário foi removido do sistema.",
                        });
                        setEditUserDialogOpen(false);
                        loadData();
                      } catch (error: any) {
                        toast({
                          title: "Erro",
                          description: error.message || "Erro ao excluir usuário",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Excluir Usuário
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setEditUserDialogOpen(false)}
                className="flex-1 sm:flex-initial"
              >
              Cancelar
            </Button>
              <Button 
                onClick={handleSaveUserRoles}
                className="flex-1 sm:flex-initial"
              >
              Salvar
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSession ? "Editar Sessão" : "Nova Sessão de Consultoria"}</DialogTitle>
            <DialogDescription>
              {selectedSession ? "Atualize as informações da sessão" : "Preencha os dados para criar uma nova sessão"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={sessionForm.title}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                placeholder="Ex: IA para Marketing Digital"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={sessionForm.description}
                onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                placeholder="Descreva o conteúdo da sessão..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={sessionForm.time}
                  onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração (minutos) *</Label>
                <Input
                  type="number"
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  max="240"
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo de Participantes *</Label>
                <Input
                  type="number"
                  value={sessionForm.maxParticipants}
                  onChange={(e) => setSessionForm({ ...sessionForm, maxParticipants: parseInt(e.target.value) || 20 })}
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instrutor *</Label>
                <Input
                  value={sessionForm.instructor}
                  onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })}
                  placeholder="Nome do instrutor"
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={sessionForm.platform}
                  onValueChange={(value: any) => setSessionForm({ ...sessionForm, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link da Reunião</Label>
              <Input
                value={sessionForm.meetingLink}
                onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={sessionForm.status}
                onValueChange={(value: any) => setSessionForm({ ...sessionForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="full">Lotada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSession}>
              {selectedSession ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerar consultoria com IA */}
      <Dialog open={aiSessionDialogOpen} onOpenChange={setAiSessionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Criar Consultoria com IA
            </DialogTitle>
            <DialogDescription>
              Descreva o tópico da consultoria e a IA irá gerar uma proposta completa. Você poderá revisar e adicionar o link da plataforma depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tópico da Consultoria *</Label>
              <Input
                value={aiSessionTopic}
                onChange={(e) => setAiSessionTopic(e.target.value)}
                placeholder="Ex: IA para Marketing Digital, Automação de Processos, Chatbots para Atendimento..."
                disabled={isGeneratingSession}
              />
              <p className="text-xs text-muted-foreground">
                Seja específico sobre o tema que será abordado na consultoria
              </p>
            </div>
            <div className="space-y-2">
              <Label>Descrição Adicional (Opcional)</Label>
              <Textarea
                value={aiSessionDescription}
                onChange={(e) => setAiSessionDescription(e.target.value)}
                placeholder="Adicione mais detalhes sobre o que você gostaria que fosse abordado na consultoria..."
                rows={4}
                disabled={isGeneratingSession}
              />
              <p className="text-xs text-muted-foreground">
                Informações adicionais ajudam a IA a criar uma proposta mais personalizada
              </p>
            </div>
            {isGeneratingSession && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando consultoria com IA...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAiSessionDialogOpen(false);
                setAiSessionTopic("");
                setAiSessionDescription("");
              }}
              disabled={isGeneratingSession}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerateSessionWithAI} disabled={isGeneratingSession || !aiSessionTopic.trim()}>
              {isGeneratingSession ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar com IA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <AlertDialog open={deleteCourseDialogOpen} onOpenChange={setDeleteCourseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este curso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCourseToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Dialog */}
      <AlertDialog open={deleteSessionDialogOpen} onOpenChange={setDeleteSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta sessão de consultoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Guia do Painel Financeiro */}
      <Dialog open={showFinancialGuide} onOpenChange={setShowFinancialGuide}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Guia do Painel Financeiro
            </DialogTitle>
            <DialogDescription>
              Entenda o que cada métrica e gráfico representa no painel financeiro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Esta visão mostra apenas dados reais registrados no sistema de vendas e campanhas.
                Todos os valores são calculados a partir das informações cadastradas nos negócios (deals) e campanhas de marketing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Cards de Resumo
                </h4>
                <div className="space-y-3 text-sm text-muted-foreground pl-6">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Receita Fechada</p>
                    <p>Soma de todos os negócios (deals) que foram marcados como concluídos, ganhos ou fechados. Representa o dinheiro que realmente entrou no caixa.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Receita Esperada</p>
                    <p>Valor projetado calculado com base na probabilidade de fechamento de cada negócio. Por exemplo: um deal de R$ 10.000 com 50% de probabilidade contribui com R$ 5.000 para a receita esperada.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Despesas Totais</p>
                    <p>Total já gasto em todas as campanhas de marketing registradas no sistema. Mostra também quanto ainda resta do orçamento total.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Lucro</p>
                    <p>Receita fechada menos despesas totais. A margem de lucro mostra a porcentagem de lucro em relação à receita fechada.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Gráficos
                </h4>
                <div className="space-y-3 text-sm text-muted-foreground pl-6">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Receita vs Despesas (6 meses)</p>
                    <p>Compara mês a mês quanto foi fechado em negócios (receita) versus quanto foi gasto em campanhas (despesas). Ajuda a identificar períodos de maior ou menor eficiência financeira.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Evolução de Receita</p>
                    <p>Mostra a curva de receita fechada ao longo dos últimos 6 meses. Permite visualizar tendências de crescimento ou queda nas vendas.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Listas Detalhadas
                </h4>
                <div className="space-y-3 text-sm text-muted-foreground pl-6">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Top Oportunidades</p>
                    <p>Lista das 10 maiores oportunidades (deals) em valor. Mostra empresa, estágio atual do negócio, probabilidade de fechamento, responsável e valor total.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Campanhas por ROI</p>
                    <p>Ranking das campanhas ordenadas por eficiência. O ROI (Return on Investment) é calculado como: (número de leads gerados / valor gasto) × 100. Quanto maior o ROI, mais eficiente a campanha em gerar leads por real investido.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Todos os cálculos são baseados em dados reais do banco de dados. 
                Não há valores fictícios ou estimativas não fundamentadas nos registros do sistema.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFinancialGuide(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

