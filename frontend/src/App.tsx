import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Academy from "./pages/Academy";
import CourseDetails from "./pages/CourseDetails";
import Courses from "./pages/Courses";
import Certificates from "./pages/Certificates";
import Consulting from "./pages/Consulting";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiesPolicy from "./pages/CookiesPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import QuemSomos from "./pages/QuemSomos";
import SocialLinks from "./pages/SocialLinks";
import Afiliados from "./pages/Afiliados";
import NotFound from "./pages/NotFound";
import Sales from "./pages/Sales";
import Support from "./pages/Support";
import Social from "./pages/Social";
import Processes from "./pages/Processes";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import OAuthCallback from "./pages/OAuthCallback";
import Plans from "./pages/Plans";
import { RobotAssistant } from "./components/assistant/RobotAssistant";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { PublicRoute } from "./components/PublicRoute";
import { useEffect } from "react";
import { firebaseNotificationService } from "./lib/firebaseNotifications";
import { auth } from "./lib/auth";
import { useSocket } from "./hooks/useSocket";

const queryClient = new QueryClient();

const App = () => {
  // Inicializar WebSocket para notificações em tempo real
  useSocket();

  // Inicializar Firebase Notifications quando o app carregar
  useEffect(() => {
    // Só inicializar se o usuário estiver autenticado
    if (auth.isAuthenticated()) {
      firebaseNotificationService.initialize().catch((error) => {
        console.error("Erro ao inicializar notificações Firebase:", error);
        // Não mostrar erro ao usuário, pois notificações push são opcionais
        // O sistema continuará funcionando sem elas
      });
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/recuperar-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/dashboard/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/dashboard/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/dashboard/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
            <Route path="/dashboard/processes" element={<ProtectedRoute><Processes /></ProtectedRoute>} />
            <Route path="/dashboard/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
            <Route path="/academy/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/academy/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/academy/consulting" element={<ProtectedRoute><Consulting /></ProtectedRoute>} />
            <Route path="/academy/course/:courseId" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/academy/*" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiesPolicy />} />
            <Route path="/termos" element={<TermsOfUse />} />
            <Route path="/quem-somos" element={<QuemSomos />} />
            <Route path="/redes-sociais" element={<ProtectedRoute><SocialLinks /></ProtectedRoute>} />
            <Route path="/afiliados" element={<Afiliados />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <RobotAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
