import { auth } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface RegisterData {
  name: string;
  email: string;
  company?: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleLoginData {
  idToken: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface FacebookLoginData {
  idToken: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    company?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  companyCNPJ?: string;
  avatar?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("bridgeai_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Função para fazer requisições com tratamento de erro de autenticação
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  
  // Se receber 401 (não autorizado), significa que o token está inválido ou expirado
  if (response.status === 401) {
    auth.logout();
    // Redirecionar para login apenas se estiver no browser
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }
  
  return response;
};

export const api = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar conta");
    }

    return result;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao fazer login");
    }

    return result;
  },

  async loginWithGoogle(data: GoogleLoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao fazer login com Google");
    }

    return result;
  },

  async loginWithFacebook(data: FacebookLoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/facebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao fazer login com Facebook");
    }

    return result;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await fetchWithAuth(`${API_URL}/api/user/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar perfil");
    }

    return result;
  },

  async updateProfile(data: { 
    name?: string; 
    company?: string;
    companyCNPJ?: string;
    avatar?: string;
    cpf?: string;
    birthDate?: string;
    phone?: string;
  }): Promise<ProfileResponse> {
    const response = await fetchWithAuth(`${API_URL}/api/user/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      // Se houver erros específicos de campo, criar um erro customizado
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        const error = new Error(result.message || "Erro ao atualizar perfil");
        (error as any).errors = result.errors;
        throw error;
      }
      throw new Error(result.message || "Erro ao atualizar perfil");
    }

    return result;
  },

  async uploadAvatar(file: File): Promise<{ success: boolean; message?: string; avatar?: string; user?: UserProfile }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = sessionStorage.getItem("bridgeai_token");
    const response = await fetch(`${API_URL}/api/user/avatar`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        auth.logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
      throw new Error(result.message || "Erro ao fazer upload do avatar");
    }

    return result;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao solicitar recuperação de senha");
    }

    return result;
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao redefinir senha");
    }

    return result;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/user/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao alterar senha");
    }

    return result;
  },

  async deleteAccount(): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/user/account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao excluir conta");
    }

    return result;
  },

  async getNotificationPreferences(): Promise<{ success: boolean; preferences: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/user/notification-preferences`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar preferências");
    }

    return result;
  },

  async updateNotificationPreferences(preferences: any): Promise<{ success: boolean; message?: string; preferences: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/user/notification-preferences`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ preferences }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar preferências");
    }

    return result;
  },
};

// Academy API
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  lessons: number;
  thumbnail?: string;
  videoUrl?: string;
  featured: boolean;
  progress: number;
  enrolled: boolean;
  objectives?: string[];
  prerequisites?: string[];
  lessonsData?: Array<{
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    duration: number;
    order: number;
    content?: string;
    resources?: Array<{ title: string; url: string; type: "pdf" | "link" | "video" | "other" }>;
  }>;
}

export interface AcademyStats {
  totalCourses: number;
  averageProgress: number;
  certificates: number;
  studyHours: number;
  studyMinutes: number;
}

export interface Certificate {
  id: string;
  courseId?: string;
  title: string;
  course: string;
  earnedAt: string;
  studyTime: string;
  status: "earned" | "in-progress";
  certificateUrl?: string;
}

export interface LearningPathStep {
  title: string;
  status: "completed" | "current" | "locked";
  courseId?: string;
}

export interface LearningPath {
  title: string;
  description: string;
  progress: number;
  steps: LearningPathStep[];
}

export const academyApi = {
  async getCourses(): Promise<{ success: boolean; courses: Course[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/courses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar cursos");
    }

    return result;
  },

  async getCourseById(courseId: string): Promise<{ success: boolean; course: Course & { completedLessons?: number; totalLessons?: number; studyTime?: number; completedAt?: string | null; hasCertificate?: boolean } }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/courses/${courseId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar curso");
    }

    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: AcademyStats }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }

    return result;
  },

  async enrollInCourse(courseId: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/enroll`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ courseId }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao se inscrever no curso");
    }

    return result;
  },

  async updateProgress(courseId: string, completedLessons?: number, studyTime?: number): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/progress`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ courseId, completedLessons, studyTime }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar progresso");
    }

    return result;
  },

  async getCertificates(): Promise<{ success: boolean; certificates: { earned: Certificate[]; inProgress: Certificate[] } }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/certificates`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar certificados");
    }

    return result;
  },

  async getLearningPath(): Promise<{ success: boolean; learningPath: LearningPath }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/learning-path`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar trilha de aprendizado");
    }

    return result;
  },

  async getConsultingSessions(type: "upcoming" | "past" = "upcoming"): Promise<{
    success: boolean;
    sessions: Array<{
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
    }>;
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/consulting-sessions?type=${type}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar sessões de consultoria");
    }

    return result;
  },

  async scheduleSession(sessionId: string): Promise<{
    success: boolean;
    message: string;
    session?: {
      id: string;
      title: string;
      date: string;
      time: string;
    };
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/consulting-sessions/schedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao inscrever-se na sessão");
    }

    return result;
  },

  async cancelSession(sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/consulting-sessions/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao cancelar inscrição na sessão");
    }

    return result;
  },

  async downloadCertificate(courseId: string): Promise<Blob> {
    const response = await fetchWithAuth(`${API_URL}/api/academy/certificate/${courseId}/download`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao baixar certificado");
    }

    return await response.blob();
  },
};

// Notifications API
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "course" | "certificate";
  read: boolean;
  link?: string;
  createdAt: string;
}

export const notificationApi = {
  async getNotifications(unreadOnly: boolean = false): Promise<{ success: boolean; notifications: Notification[]; unreadCount: number }> {
    const response = await fetchWithAuth(`${API_URL}/api/notifications?unreadOnly=${unreadOnly}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar notificações");
    }

    return result;
  },

  async getUnreadCount(): Promise<{ success: boolean; unreadCount: number }> {
    const response = await fetchWithAuth(`${API_URL}/api/notifications/unread-count`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar contador");
    }

    return result;
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao marcar notificação como lida");
    }

    return result;
  },

  async markAllAsRead(): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/notifications/read-all`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao marcar todas como lidas");
    }

    return result;
  },

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar notificação");
    }

    return result;
  },
};

// Marketing API
export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  budget: number;
  spent: number;
  leads: number;
  conversion: number;
  startDate: string;
  endDate: string;
}

export const marketingApi = {
  async getCampaigns(): Promise<{ success: boolean; campaigns: Campaign[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/campaigns`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar campanhas");
    }
    return result;
  },

  async createCampaign(data: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/campaigns`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar campanha");
    }
    return result;
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/campaigns/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar campanha");
    }
    return result;
  },

  async deleteCampaign(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/campaigns/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar campanha");
    }
    return result;
  },

  async generateContent(theme: string, platform: string, tone?: string): Promise<{ success: boolean; content?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/generate-content`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ theme, platform, tone }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao gerar conteúdo");
    }
    return result;
  },

  async publishPost(content: string, platform: "facebook" | "instagram" | "linkedin", postId?: string, imageUrl?: string): Promise<{ success: boolean; message?: string; postId?: string; url?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/publish-post`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, platform, postId, imageUrl }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao publicar post");
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },

  async getSocialConnections(): Promise<{ success: boolean; connections: any[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/social-connections`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar conexões");
    }
    return result;
  },

  async connectSocial(data: {
    platform: "facebook" | "instagram" | "linkedin";
    accountName: string;
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }): Promise<{ success: boolean; connection: any; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/social-connections`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao conectar rede social");
    }
    return result;
  },

  async disconnectSocial(platform: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/social-connections/${platform}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao desconectar rede social");
    }
    return result;
  },

  async startOAuthFlow(platform: string): Promise<{ success: boolean; authUrl?: string; state?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/oauth/${platform}/start`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao iniciar conexão OAuth");
    }
    return result;
  },

  async syncProfileInfo(platform: string): Promise<{ success: boolean; connection: any; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/marketing/social-connections/${platform}/sync`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao sincronizar informações do perfil");
    }
    return result;
  },
};

// Sales API
export interface Deal {
  id: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  nextAction?: string;
  daysInStage: number;
}

export interface FollowUp {
  id: string;
  type: "Ligação" | "Email" | "Reunião";
  contact: string;
  date: string;
  time: string;
  status: "pending" | "completed";
}

export const salesApi = {
  async getDeals(): Promise<{ success: boolean; deals: Deal[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/deals`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar oportunidades");
    }
    return result;
  },

  async createDeal(data: Partial<Deal>): Promise<{ success: boolean; deal: Deal }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/deals`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar oportunidade");
    }
    return result;
  },

  async updateDeal(id: string, data: Partial<Deal>): Promise<{ success: boolean; deal: Deal }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/deals/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar oportunidade");
    }
    return result;
  },

  async deleteDeal(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/deals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar oportunidade");
    }
    return result;
  },

  async getFollowUps(): Promise<{ success: boolean; followUps: FollowUp[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/followups`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar follow-ups");
    }
    return result;
  },

  async createFollowUp(data: Partial<FollowUp>): Promise<{ success: boolean; followUp: FollowUp }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/followups`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar follow-up");
    }
    return result;
  },

  async generateScript(type: "prospecção" | "apresentação" | "objeções" | "fechamento", context?: string): Promise<{ success: boolean; script?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/generate-script`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ type, context }),
    });

    const result = await response.json();
    if (!response.ok) {
      // Passar a mensagem de erro do backend, que já está em português e amigável
      const errorMessage = result.message || "Erro ao gerar script. Tente novamente em alguns instantes.";
      throw new Error(errorMessage);
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/sales/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },
};

// Support API
export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo: string;
  messages: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReply {
  id: string;
  title: string;
  text: string;
}

export const supportApi = {
  async getTickets(): Promise<{ success: boolean; tickets: Ticket[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/tickets`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar tickets");
    }
    return result;
  },

  async createTicket(data: Partial<Ticket>): Promise<{ success: boolean; ticket: Ticket }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/tickets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar ticket");
    }
    return result;
  },

  async updateTicket(id: string, data: Partial<Ticket>): Promise<{ success: boolean; ticket: Ticket }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/tickets/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar ticket");
    }
    return result;
  },

  async deleteTicket(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/tickets/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar ticket");
    }
    return result;
  },

  async getQuickReplies(): Promise<{ success: boolean; quickReplies: QuickReply[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/quick-replies`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar respostas rápidas");
    }
    return result;
  },

  async createQuickReply(data: Partial<QuickReply>): Promise<{ success: boolean; quickReply: QuickReply }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/quick-replies`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar resposta rápida");
    }
    return result;
  },

  async generateReply(situation: string, context?: string): Promise<{ success: boolean; reply?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/generate-reply`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ situation, context }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao gerar resposta");
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },

  async processChatbotMessage(message: string, ticketId?: string): Promise<{ success: boolean; reply: string; ticketId?: string; resolved: boolean; escalated: boolean; ticket?: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/support/chatbot/message`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, ticketId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao processar mensagem do chatbot");
    }
    return result;
  },

  async getChatbotLogs(ticketId?: string, limit?: number): Promise<{ success: boolean; logs: any[] }> {
    const params = new URLSearchParams();
    if (ticketId) params.append("ticketId", ticketId);
    if (limit) params.append("limit", String(limit));
    
    const response = await fetchWithAuth(`${API_URL}/api/support/chatbot/logs?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar logs do chatbot");
    }
    return result;
  },
};

// Social API
export interface Post {
  id: string;
  content: string;
  platform: string;
  scheduledDate?: string;
  status: "draft" | "scheduled" | "published";
  image?: boolean;
  imageUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdAt: string;
}

export const socialApi = {
  async getPosts(status?: string, platform?: string): Promise<{ success: boolean; posts: Post[] }> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (platform) params.append("platform", platform);
    
    const response = await fetchWithAuth(`${API_URL}/api/social/posts?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar posts");
    }
    return result;
  },

  async createPost(data: Partial<Post>, imageFile?: File): Promise<{ success: boolean; post: Post }> {
    const formData = new FormData();
    
    if (data.content) formData.append("content", data.content);
    if (data.platform) formData.append("platform", data.platform);
    if (data.scheduledDate) formData.append("scheduledDate", data.scheduledDate);
    if (data.status) formData.append("status", data.status);
    if (data.image !== undefined) formData.append("image", String(data.image));
    if (imageFile) formData.append("image", imageFile);

    const token = sessionStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/social/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar post");
    }
    return result;
  },

  async updatePost(id: string, data: Partial<Post>, imageFile?: File): Promise<{ success: boolean; post: Post }> {
    const formData = new FormData();
    
    if (data.content) formData.append("content", data.content);
    if (data.platform) formData.append("platform", data.platform);
    if (data.scheduledDate) formData.append("scheduledDate", data.scheduledDate);
    if (data.status) formData.append("status", data.status);
    if (data.image !== undefined) formData.append("image", String(data.image));
    if (imageFile) formData.append("image", imageFile);

    const token = sessionStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/social/posts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar post");
    }
    return result;
  },

  async deletePost(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/social/posts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar post");
    }
    return result;
  },

  async generatePost(theme: string, platform: string, tone?: string): Promise<{ success: boolean; content?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/social/generate-post`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ theme, platform, tone }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao gerar post");
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/social/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },
};

// Processes API
export interface Workflow {
  id: string;
  name: string;
  status: "active" | "paused";
  steps: number;
  completed: number;
  avgTime: string;
  efficiency: number;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed";
}

export interface Checklist {
  id: string;
  name: string;
  items: number;
  completed: number;
  category: string;
}

export const processesApi = {
  async getWorkflows(): Promise<{ success: boolean; workflows: Workflow[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/workflows`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar fluxos");
    }
    return result;
  },

  async createWorkflow(data: Partial<Workflow>): Promise<{ success: boolean; workflow: Workflow }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/workflows`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar fluxo");
    }
    return result;
  },

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<{ success: boolean; workflow: Workflow }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/workflows/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar fluxo");
    }
    return result;
  },

  async getTasks(status?: string, priority?: string): Promise<{ success: boolean; tasks: Task[] }> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    
    const response = await fetchWithAuth(`${API_URL}/api/processes/tasks?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar tarefas");
    }
    return result;
  },

  async createTask(data: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar tarefa");
    }
    return result;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/tasks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar tarefa");
    }
    return result;
  },

  async getChecklists(): Promise<{ success: boolean; checklists: Checklist[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/checklists`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar checklists");
    }
    return result;
  },

  async createChecklist(data: Partial<Checklist>): Promise<{ success: boolean; checklist: Checklist }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/checklists`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar checklist");
    }
    return result;
  },

  async updateChecklist(id: string, completed: number): Promise<{ success: boolean; checklist: Checklist }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/checklists/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar checklist");
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/processes/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },
};

// Security API
export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  ip: string;
  status: "success" | "failed";
  createdAt: string;
}

// Admin API
export interface AdminStats {
  users: {
    total: number;
    active: number;
    byRole: Array<{ _id: string; count: number }>;
  };
  business: {
    totalRevenue: number;
    totalLeads: number;
    activeWorkflows: number;
    resolvedTickets: number;
    publishedPosts: number;
  };
  system: {
    totalCampaigns: number;
    totalDeals: number;
    totalTickets: number;
    totalWorkflows: number;
    totalPosts: number;
    totalRoles: number;
  };
  growth: Array<{ month: string; users: number }>;
  recentActivities: Array<{
    id: string;
    user: string;
    email?: string;
    action: string;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  companyCNPJ?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  authProvider?: "email" | "google";
  isBlocked?: boolean;
  roles: Array<{ id: string; name: string; description?: string }>;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  async getStats(): Promise<{ success: boolean; stats: AdminStats }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas administrativas");
    }
    return result;
  },

  async getAllUsers(): Promise<{ success: boolean; users: AdminUser[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar usuários");
    }
    return result;
  },

  async updateUser(
    userId: string,
    data: Partial<Pick<AdminUser, "name" | "company" | "phone">>,
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar usuário");
    }
    return result;
  },

  async getUserOverview(
    userId: string,
  ): Promise<{ success: boolean; overview: { totalEnrollments: number; completedCourses: number; inProgressCourses: number; totalStudyMinutes: number } }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}/overview`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar dados do usuário");
    }
    return result;
  },

  async blockUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isBlocked: true }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao bloquear usuário");
    }
    return result;
  },

  async unblockUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isBlocked: false }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao desbloquear usuário");
    }
    return result;
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao excluir usuário");
    }
    return result;
  },

  async updateUserRole(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; user: AdminUser }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/users/${userId}/roles`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ roleIds }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar role do usuário");
    }
    return result;
  },

  // Cursos
  async getAllCourses(): Promise<{ success: boolean; courses: any[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/courses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar cursos");
    }
    return result;
  },

  async createCourse(data: {
    title: string;
    description: string;
    category: string;
    thumbnail?: string;
    videoUrl?: string;
    featured?: boolean;
    status?: "active" | "draft" | "archived";
    objectives?: string[];
    prerequisites?: string[];
    lessons: Array<{
      title: string;
      description?: string;
      videoUrl: string;
      duration: number;
      order: number;
      content?: string;
      resources?: Array<{ title: string; url: string; type: "pdf" | "link" | "video" | "other" }>;
    }>;
  }): Promise<{ success: boolean; message: string; course: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/courses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar curso");
    }
    return result;
  },

  async updateCourse(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    level?: "iniciante" | "medio" | "avancado";
    thumbnail?: string;
    videoUrl?: string;
    featured?: boolean;
    status?: "active" | "draft" | "archived";
    objectives?: string[];
    prerequisites?: string[];
    lessons?: Array<{
      title: string;
      description?: string;
      videoUrl: string;
      duration: number;
      order: number;
      content?: string;
      resources?: Array<{ title: string; url: string; type: "pdf" | "link" | "video" | "other" }>;
    }>;
  }>): Promise<{ success: boolean; message: string; course: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/courses/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar curso");
    }
    return result;
  },

  async deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/courses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar curso");
    }
    return result;
  },

  // Sessões de Consultoria
  async getAllConsultingSessions(): Promise<{ success: boolean; sessions: any[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/consulting-sessions`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar sessões de consultoria");
    }
    return result;
  },

  async generateConsultingSessionWithAI(topic: string, description?: string): Promise<{
    success: boolean;
    consultingData: {
      title: string;
      description: string;
      duration: number;
      maxParticipants: number;
      instructor: string;
      platform: "zoom" | "meet" | "teams" | "other";
      objectives: string[];
      topics: string[];
      targetAudience: string;
    };
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/consulting-sessions/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic, description }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao gerar consultoria com IA");
    }
    return result;
  },

  async createConsultingSession(data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    duration: number;
    maxParticipants: number;
    instructor: string;
    platform?: "zoom" | "meet" | "teams" | "other";
    meetingLink?: string;
    status?: "scheduled" | "available" | "full" | "completed" | "cancelled";
  }): Promise<{ success: boolean; message: string; session: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/consulting-sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar sessão de consultoria");
    }
    return result;
  },

  async updateConsultingSession(id: string, data: Partial<{
    title: string;
    description?: string;
    date: string;
    time: string;
    duration: number;
    maxParticipants: number;
    instructor: string;
    platform?: "zoom" | "meet" | "teams" | "other";
    meetingLink?: string;
    status?: "scheduled" | "available" | "full" | "completed" | "cancelled";
  }>): Promise<{ success: boolean; message: string; session: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/consulting-sessions/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar sessão de consultoria");
    }
    return result;
  },

  async deleteConsultingSession(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/consulting-sessions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar sessão de consultoria");
    }
    return result;
  },

  // Financeiro (apenas master)
  async getFinancialStats(): Promise<{
    success: boolean;
    stats: {
      revenue: {
        total: number;
        closed: number;
        expected: number;
        fromCourses: number;
      };
      expenses: {
        total: number;
        budget: number;
        remaining: number;
      };
      profit: {
        total: number;
        margin: string;
      };
      monthly: {
        revenue: Array<{ month: string; revenue: number }>;
        expenses: Array<{ month: string; expenses: number }>;
      };
      topDeals: Array<{
        id: string;
        company: string;
        value: number;
        stage: string;
        probability: number;
        owner: string;
      }>;
      campaignsROI: Array<{
        id: string;
        name: string;
        budget: number;
        spent: number;
        leads: number;
        roi: string;
        status: string;
      }>;
    };
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/admin/financial/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas financeiras");
    }
    return result;
  },

  // Segurança (admin e master)
  async getSecurityLogs(params?: {
    limit?: number;
    status?: "success" | "failed";
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    logs: Array<{
      id: string;
      user: string;
      userId?: string;
      userEmail?: string;
      userAvatar?: string;
      action: string;
      ip: string;
      status: "success" | "failed";
      createdAt: string;
    }>;
      stats: {
        total: number;
        failed: number;
        success: number;
        recent24h?: number;
        recentFailed24h?: number;
        actionTypes: Array<{ action: string; count: number }>;
        suspiciousIPs?: Array<{
          ip: string;
          attempts: number;
          lastAttempt: string;
        }>;
        blockedUsers?: Array<{
          id: string;
          name: string;
          email: string;
          avatar?: string;
          blockedAt: string;
        }>;
        topIPs?: Array<{
          ip: string;
          total: number;
          success: number;
          failed: number;
        }>;
        hourlyLogs?: Array<{
          hour: string;
          count: number;
        }>;
      };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const response = await fetchWithAuth(
      `${API_URL}/api/admin/security/logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar logs de segurança");
    }
    return result;
  },
};

export const securityApi = {
  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/security/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar usuários");
    }
    return result;
  },

  async getActivityLogs(limit?: number): Promise<{ success: boolean; logs: ActivityLog[] }> {
    const params = limit ? `?limit=${limit}` : "";
    const response = await fetchWithAuth(`${API_URL}/api/security/activity-logs${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar logs");
    }
    return result;
  },

  async createActivityLog(data: Partial<ActivityLog>): Promise<{ success: boolean; log: ActivityLog }> {
    const response = await fetchWithAuth(`${API_URL}/api/security/activity-logs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar log");
    }
    return result;
  },

  async getStats(): Promise<{ success: boolean; stats: any }> {
    const response = await fetchWithAuth(`${API_URL}/api/security/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas");
    }
    return result;
  },
};

// Roles e Permissions API
export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignRolesData {
  userId: string;
  roleIds: string[];
}

export const rolesApi = {
  async getRoles(): Promise<{ success: boolean; roles: Role[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar roles");
    }
    return result;
  },

  async getPermissions(): Promise<{ success: boolean; permissions: Permission[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles/permissions`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar permissões");
    }
    return result;
  },

  async createRole(data: CreateRoleData): Promise<{ success: boolean; role: Role }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar role");
    }
    return result;
  },

  async updateRole(id: string, data: UpdateRoleData): Promise<{ success: boolean; role: Role }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar role");
    }
    return result;
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar role");
    }
    return result;
  },

  async assignRolesToUser(data: AssignRolesData): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles/assign`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atribuir roles");
    }
    return result;
  },

  async getUserRoles(userId: string): Promise<{ success: boolean; roles: Role[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/roles/user/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar roles do usuário");
    }
    return result;
  },
};

// Alerts API
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  module: string;
  condition: {
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "changed" | "reached";
    value?: any;
  };
  triggerFrequency: "once" | "always" | "daily" | "weekly";
  enabled: boolean;
  notificationChannels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  lastTriggered?: string;
  triggerCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAlertRuleData {
  name: string;
  description?: string;
  module: string;
  condition: {
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "changed" | "reached";
    value?: any;
  };
  triggerFrequency?: "once" | "always" | "daily" | "weekly";
  enabled?: boolean;
  notificationChannels?: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
}

export const alertsApi = {
  async getAlertRules(module?: string): Promise<{ success: boolean; alertRules: AlertRule[] }> {
    const params = module ? `?module=${module}` : "";
    const response = await fetchWithAuth(`${API_URL}/api/alerts${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar regras de alerta");
    }
    return result;
  },

  async createAlertRule(data: CreateAlertRuleData): Promise<{ success: boolean; alertRule: AlertRule }> {
    const response = await fetchWithAuth(`${API_URL}/api/alerts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar regra de alerta");
    }
    return result;
  },

  async updateAlertRule(id: string, data: Partial<CreateAlertRuleData>): Promise<{ success: boolean; alertRule: AlertRule }> {
    const response = await fetchWithAuth(`${API_URL}/api/alerts/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar regra de alerta");
    }
    return result;
  },

  async deleteAlertRule(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/alerts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar regra de alerta");
    }
    return result;
  },

  async toggleAlertRule(id: string): Promise<{ success: boolean; alertRule: AlertRule }> {
    const response = await fetchWithAuth(`${API_URL}/api/alerts/${id}/toggle`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao alternar estado da regra");
    }
    return result;
  },
};

// Reports API
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  module: string;
  format: "pdf" | "excel" | "csv";
  fields: {
    field: string;
    label: string;
    type: "text" | "number" | "date" | "currency" | "percentage";
    format?: string;
  }[];
  filters?: {
    field: string;
    operator: "equals" | "range" | "contains";
    value?: any;
  }[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeCharts: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateReportData {
  module: string;
  format: "pdf" | "excel" | "csv";
  fields?: string[];
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
  templateId?: string;
}

export const reportsApi = {
  async getTemplates(module?: string): Promise<{ success: boolean; templates: ReportTemplate[] }> {
    const params = module ? `?module=${module}` : "";
    const response = await fetchWithAuth(`${API_URL}/api/reports/templates${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar templates");
    }
    return result;
  },

  async createTemplate(data: Partial<ReportTemplate>): Promise<{ success: boolean; template: ReportTemplate }> {
    const response = await fetchWithAuth(`${API_URL}/api/reports/templates`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar template");
    }
    return result;
  },

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/reports/templates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar template");
    }
    return result;
  },

  async generateReport(data: GenerateReportData): Promise<{ success: boolean; fileUrl: string; downloadUrl: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/reports/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao gerar relatório");
    }
    return result;
  },
};

// API do Assistente BridgeAI
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const assistantApi = {
  async sendMessage(
    message: string,
    conversationHistory?: ChatMessage[]
  ): Promise<{ success: boolean; reply: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/assistant/chat`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory || [],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao enviar mensagem");
    }
    return result;
  },
};

// Dashboard API
export interface DashboardStats {
  activeAutomations: number;
  totalLeads: number;
  resolvedTickets: number;
  resolutionRate: number;
  roi: number;
}

export interface PerformanceData {
  name: string;
  automacoes: number;
  leads: number;
}

export interface DashboardActivity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: "automation" | "lead" | "support" | "meeting";
}

export const dashboardApi = {
  async getStats(): Promise<{ 
    success: boolean; 
    stats: DashboardStats;
    performanceData: PerformanceData[];
    activities: DashboardActivity[];
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/dashboard/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar estatísticas do dashboard");
    }
    return result;
  },
};

// WhatsApp API
export interface WhatsAppConnection {
  id: string;
  phoneNumber: string;
  instanceName: string;
  provider: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  isActive: boolean;
  automationEnabled?: boolean;
  messagesSent?: number;
  messagesReceived?: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  messageId: string;
  from: string;
  to: string;
  type: string;
  content: string;
  mediaUrl?: string;
  direction: "inbound" | "outbound";
  status: string;
  timestamp: string;
  contactName?: string;
  connection?: {
    instanceName: string;
    phoneNumber: string;
  };
}

export const whatsappApi = {
  async getConnections(): Promise<{ success: boolean; connections: WhatsAppConnection[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar conexões");
    }
    return result;
  },

  async createConnection(data: { instanceName: string; phoneNumber?: string }): Promise<{ success: boolean; connection: WhatsAppConnection }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar conexão");
    }
    return result;
  },

  async getQRCode(connectionId: string): Promise<{ success: boolean; qrCode: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections/${connectionId}/qrcode`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao obter QR Code");
    }
    return result;
  },

  async getConnectionStatus(connectionId: string): Promise<{ success: boolean; status: string; phoneNumber?: string; profileName?: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections/${connectionId}/status`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao verificar status");
    }
    return result;
  },

  async deleteConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections/${connectionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao deletar conexão");
    }
    return result;
  },

  async updateAutomation(connectionId: string, automationEnabled: boolean): Promise<{ success: boolean; connection: { id: string; automationEnabled: boolean } }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/connections/${connectionId}/automation`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ automationEnabled }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao atualizar automação");
    }
    return result;
  },

  async sendMessage(data: {
    connectionId: string;
    to: string;
    message: string;
    mediaUrl?: string;
    mediaType?: string;
  }): Promise<{ success: boolean; message: WhatsAppMessage }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/messages/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao enviar mensagem");
    }
    return result;
  },

  async sendBulkMessages(data: {
    connectionId: string;
    contacts: Array<{ jid: string; name?: string; contactName?: string } | string>;
    message: string;
    mediaUrl?: string;
    mediaType?: string;
    delay?: number; // Delay em ms entre cada envio (padrão: 2000ms)
  }): Promise<{
    success: boolean;
    total: number;
    sent: number;
    failed: number;
    results: Array<{
      contact: string;
      contactName?: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/messages/bulk`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao enviar mensagens em massa");
    }
    return result;
  },

  async getMessages(params?: {
    connectionId?: string;
    from?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    success: boolean;
    messages: WhatsAppMessage[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.connectionId) queryParams.append("connectionId", params.connectionId);
    if (params?.from) queryParams.append("from", params.from);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.page) queryParams.append("page", params.page.toString());

    const url = `${API_URL}/api/whatsapp/messages${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchWithAuth(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar mensagens");
    }
    return result;
  },

  async getContacts(connectionId: string): Promise<{ success: boolean; contacts: Array<{ jid: string; exists: boolean; profilePicture?: string }> }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/contacts?connectionId=${connectionId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar contatos");
    }
    return result;
  },

  async getProfileInfo(connectionId: string): Promise<{ success: boolean; profile: { id?: string; name?: string; phoneNumber?: string; profilePicture?: string } }> {
    const response = await fetchWithAuth(`${API_URL}/api/whatsapp/profile?connectionId=${connectionId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar informações do perfil");
    }
    return result;
  },
};

// Payment API
export interface Plan {
  id: string;
  name: string;
  price: number;
  priceInCents: number;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  price: number;
  status: "active" | "pending" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  status: "pending" | "confirmed" | "received" | "overdue" | "refunded" | "cancelled";
  paymentMethod: "credit_card" | "debit_card" | "pix" | "boleto" | "bank_transfer";
  description?: string;
  dueDate?: string;
  paymentDate?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixQrCodeUrl?: string;
  createdAt: string;
}

export interface CreateSubscriptionData {
  planId: "essencial" | "profissional";
  paymentMethod: "credit_card" | "debit_card" | "pix" | "boleto";
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  billingAddress?: {
    postalCode: string;
    address: string;
    addressNumber: string;
    addressComplement?: string;
    province?: string;
    city: string;
    state: string;
  };
}

export const paymentApi = {
  async getPlans(): Promise<{ success: boolean; plans: Plan[] }> {
    const response = await fetch(`${API_URL}/api/payments/plans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar planos");
    }
    return result;
  },

  async createSubscription(data: CreateSubscriptionData): Promise<{
    success: boolean;
    subscription: Subscription;
    payment?: Payment;
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/payments/subscriptions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar assinatura");
    }
    return result;
  },

  async getCurrentSubscription(): Promise<{
    success: boolean;
    subscription: Subscription | null;
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/payments/subscriptions/current`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar assinatura");
    }
    return result;
  },

  async cancelSubscription(reason?: string): Promise<{
    success: boolean;
    message: string;
    subscription: { id: string; status: string; cancelledAt: string };
  }> {
    const response = await fetchWithAuth(`${API_URL}/api/payments/subscriptions/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao cancelar assinatura");
    }
    return result;
  },

  async getPayments(): Promise<{ success: boolean; payments: Payment[] }> {
    const response = await fetchWithAuth(`${API_URL}/api/payments/payments`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erro ao buscar pagamentos");
    }
    return result;
  },
};

