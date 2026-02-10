import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowRight, Mail, Key, Shield, Users, Sparkles } from "lucide-react";
import {
  AuthLayout,
  FormFieldWrapper,
  InputWithIcon,
  FormError,
} from "@/components/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success("Email de recuperação enviado!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao solicitar recuperação de senha";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        illustration={{
          icon: Key,
          title: "Email enviado!",
          description: (
            <>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </>
          ),
          decorativeIcons: {
            left: Shield,
            center: Key,
            right: Sparkles,
            floating: [],
          },
        }}
        mobileHeader={{
          icon: Key,
          title: "Email enviado",
          description: "Verifique sua caixa de entrada",
        }}
        footerLink={{
          text: "Voltar para o login",
          to: "/login",
        }}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Verifique seu email</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de recuperação para <strong>{form.getValues("email")}</strong>
            </p>
          </div>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Voltar para o login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      illustration={{
        icon: Key,
        title: "Recuperar senha",
        description: (
          <>
            Digite seu email e enviaremos um link para redefinir sua senha
          </>
        ),
        decorativeIcons: {
          left: Shield,
          center: Key,
          right: Sparkles,
          floating: [],
        },
      }}
      mobileHeader={{
        icon: Key,
        title: "Recuperar senha",
        description: "Digite seu email para continuar",
      }}
      footerLink={{
        text: "Voltar para o login",
        to: "/login",
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

          <FormError message={error || ""} />

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base font-semibold group"
            variant="hero"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            {!isLoading && (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-xs sm:text-sm pt-2">
        <span className="text-muted-foreground">Lembrou sua senha? </span>
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Fazer login
        </Link>
      </div>
    </AuthLayout>
  );
}






