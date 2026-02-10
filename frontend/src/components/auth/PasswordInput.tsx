import { useState, forwardRef, useEffect } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthIndicator?: boolean;
  onStrengthChange?: (strength: number) => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, onStrengthChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const password = props.value as string;

    // Calcular força da senha
    const getPasswordStrength = (pwd: string): number => {
      if (!pwd) return 0;
      let strength = 0;
      if (pwd.length >= 6) strength++;
      if (/[A-Z]/.test(pwd)) strength++;
      if (/[a-z]/.test(pwd)) strength++;
      if (/[0-9]/.test(pwd)) strength++;
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++;
      return strength;
    };

    const passwordStrength = getPasswordStrength(password || "");

    // Notificar mudança de força
    useEffect(() => {
      if (onStrengthChange && password) {
        onStrengthChange(passwordStrength);
      }
    }, [password, passwordStrength, onStrengthChange]);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn(
              "pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-background/50 backdrop-blur-sm",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
        {showStrengthIndicator && password && (
          <PasswordStrengthIndicator strength={passwordStrength} />
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

interface PasswordStrengthIndicatorProps {
  strength: number;
}

function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const getStrengthLabel = () => {
    if (strength === 0) return "Muito fraca";
    if (strength === 1) return "Fraca";
    if (strength === 2) return "Média";
    if (strength === 3) return "Forte";
    if (strength >= 4) return "Muito forte";
    return "";
  };

  const getStrengthColor = () => {
    if (strength <= 1) return "bg-destructive";
    if (strength <= 2) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Força da senha</span>
        <span className="text-xs">{getStrengthLabel()}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength ? getStrengthColor() : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

