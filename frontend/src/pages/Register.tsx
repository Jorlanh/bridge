import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  ArrowRight,
  Mail,
  User,
  Building2,
  Rocket,
  Shield,
  Key,
  Users,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  AuthLayout,
  FormFieldWrapper,
  InputWithIcon,
  PasswordInput,
  FormError,
} from "@/components/auth";

const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  company: z.string().optional(),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.register({
        name: data.name,
        email: data.email,
        company: data.company,
        password: data.password,
      });

      if (response.success && response.token && response.user) {
        auth.setToken(response.token);
        auth.setUser(response.user);
        toast.success("Conta criada com sucesso!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      illustration={{
        icon: Rocket,
        title: "Comece agora!",
        description: (
          <>
            Crie sua conta e transforme seu negócio com{" "}
            <span className="text-gradient font-semibold">IA</span>
          </>
        ),
        decorativeIcons: {
          left: Users,
          center: Shield,
          right: Zap,
          floating: [],
        },
      }}
      mobileHeader={{
        icon: Rocket,
        title: "Criar conta",
        description: (
          <>
            Comece sua jornada com{" "}
            <span className="text-gradient font-semibold">BridgeAI</span>
          </>
        ),
      }}
      footerLink={{
        text: "Voltar para a página inicial",
        to: "/",
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <FormFieldWrapper control={form.control} name="name" label="Nome completo">
            {(field) => (
              <InputWithIcon
                icon={User}
                type="text"
                placeholder="Seu nome"
                {...field}
              />
            )}
          </FormFieldWrapper>

          <FormFieldWrapper control={form.control} name="email" label="Email">
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
            name="company"
            label="Empresa (opcional)"
          >
            {(field) => (
              <InputWithIcon
                icon={Building2}
                type="text"
                placeholder="Nome da empresa"
                {...field}
              />
            )}
          </FormFieldWrapper>

          <FormFieldWrapper control={form.control} name="password" label="Senha">
            {(field) => (
              <PasswordInput
                placeholder="••••••••"
                showStrengthIndicator
                {...field}
              />
            )}
          </FormFieldWrapper>

          <FormFieldWrapper
            control={form.control}
            name="confirmPassword"
            label="Confirmar senha"
          >
            {(field) => <PasswordInput placeholder="••••••••" {...field} />}
          </FormFieldWrapper>

          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <input
              type="checkbox"
              id="terms"
              className="mt-0.5 sm:mt-1 rounded border-input w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
              required
            />
            <label htmlFor="terms" className="text-muted-foreground cursor-pointer leading-tight">
              Eu concordo com os{" "}
              <Link to="/termos" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </label>
          </div>

          <FormError message={error || ""} />

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base font-semibold group"
            variant="hero"
            disabled={isLoading}
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
            {!isLoading && (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </form>
      </Form>

      {/* Login Link */}
      <div className="text-center text-xs sm:text-sm pt-2">
        <span className="text-muted-foreground">Já tem uma conta? </span>
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Entrar
        </Link>
      </div>
    </AuthLayout>
  );
}
