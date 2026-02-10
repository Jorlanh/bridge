import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { signInWithGoogle, signInWithFacebook } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowRight, Mail, Zap, Shield, Key, Users, Sparkles } from "lucide-react";
import {
  AuthLayout,
  FormFieldWrapper,
  InputWithIcon,
  PasswordInput,
  FormError,
} from "@/components/auth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const REMEMBER_ME_KEY = "bridgeai_remember_email";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Carregar email salvo quando o componente montar
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      form.setValue("email", savedEmail);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login({
        email: data.email,
        password: data.password,
      });

      if (response.success && response.token && response.user) {
        // Salvar ou remover email baseado no checkbox "lembre-me"
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, data.email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        auth.setToken(response.token);
        auth.setUser(response.user);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);

    try {
      // Fazer login com Google via Firebase
      const firebaseUser = await signInWithGoogle();
      
      // Obter o token ID do Firebase
      const idToken = await firebaseUser.getIdToken();

      // Enviar para o backend
      const response = await api.loginWithGoogle({
        idToken,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        photoURL: firebaseUser.photoURL || undefined,
      });

      if (response.success && response.token && response.user) {
        auth.setToken(response.token);
        auth.setUser(response.user);
        navigate("/dashboard");
      }
    } catch (err: any) {
      let errorMessage = "Erro ao fazer login com Google";
      
      if (err?.code === "auth/popup-closed-by-user") {
        errorMessage = "Login cancelado. Tente novamente.";
      } else if (err?.code === "auth/popup-blocked") {
        errorMessage = "Popup bloqueado. Permita popups para este site.";
      } else if (err?.code === "auth/network-request-failed") {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Erro no login com Google:", err);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoadingFacebook(true);
    setError(null);

    try {
      // Fazer login com Facebook via Firebase
      const firebaseUser = await signInWithFacebook();
      
      // Obter o token ID do Firebase
      const idToken = await firebaseUser.getIdToken();

      // Enviar para o backend
      const response = await api.loginWithFacebook({
        idToken,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        photoURL: firebaseUser.photoURL || undefined,
      });

      if (response.success && response.token && response.user) {
        auth.setToken(response.token);
        auth.setUser(response.user);
        navigate("/dashboard");
      }
    } catch (err: any) {
      let errorMessage = "Erro ao fazer login com Facebook";
      
      if (err?.code === "auth/popup-closed-by-user") {
        errorMessage = "Login cancelado. Tente novamente.";
      } else if (err?.code === "auth/popup-blocked") {
        errorMessage = "Popup bloqueado. Permita popups para este site.";
      } else if (err?.code === "auth/network-request-failed") {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      } else if (err?.code === "auth/account-exists-with-different-credential") {
        errorMessage = "Esta conta já está cadastrada com outro método de login.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Erro no login com Facebook:", err);
    } finally {
      setIsLoadingFacebook(false);
    }
  };

  return (
    <AuthLayout
      illustration={{
        icon: Zap,
        title: "Bem-vindo de volta!",
        description: (
          <>
            Entre na sua conta e continue transformando seu negócio com{" "}
            <span className="text-gradient font-semibold">IA</span>
          </>
        ),
        decorativeIcons: {
          left: Users,
          center: Shield,
          right: Sparkles,
          floating: [],
        },
      }}
      mobileHeader={{
        icon: Zap,
        title: "Bem-vindo de volta",
        description: (
          <>
            Entre na sua conta <span className="text-gradient font-semibold">BridgeAI</span>
          </>
        ),
      }}
      footerLink={{
        text: "Voltar para a página inicial",
        to: "/",
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormFieldWrapper
            control={form.control}
            name="email"
            label="Email"
          >
            {(field) => (
              <InputWithIcon
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                {...field}
              />
            )}
          </FormFieldWrapper>

          <FormFieldWrapper
            control={form.control}
            name="password"
            label="Senha"
          >
            {(field) => <PasswordInput placeholder="••••••••" {...field} />}
          </FormFieldWrapper>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-input w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="text-muted-foreground">Lembrar-me</span>
            </label>
            <Link
              to="/recuperar-senha"
              className="text-primary hover:underline font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <FormError message={error || ""} />

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base font-semibold group"
            variant="hero"
            disabled={isLoading || isLoadingGoogle || isLoadingFacebook}
          >
            {isLoading ? "Entrando..." : "Entrar"}
            {!isLoading && (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </form>
      </Form>

      {/* Divisor */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
        </div>
      </div>

      {/* Botão de Login com Google */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm transition-colors"
        disabled={isLoading || isLoadingGoogle || isLoadingFacebook}
      >
        {isLoadingGoogle ? (
          "Entrando com Google..."
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </>
        )}
      </Button>

      {/* Botão de Login com Facebook */}
      <Button
        type="button"
        onClick={handleFacebookLogin}
        className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base font-medium bg-[#1877F2] hover:bg-[#166FE5] text-white border-0 shadow-sm transition-colors"
        disabled={isLoading || isLoadingGoogle || isLoadingFacebook}
      >
        {isLoadingFacebook ? (
          "Entrando com Facebook..."
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Entrar com Facebook
          </>
        )}
      </Button>

      {/* Sign Up Link */}
      <div className="text-center text-xs sm:text-sm pt-2">
        <span className="text-muted-foreground">Não tem uma conta? </span>
        <Link to="/registro" className="text-primary hover:underline font-semibold">
          Criar conta
        </Link>
      </div>
    </AuthLayout>
  );
}
