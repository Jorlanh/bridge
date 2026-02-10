import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  iconPosition?: "left" | "right";
}

export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon: Icon, iconPosition = "left", className, ...props }, ref) => {
    return (
      <div className="relative">
        {iconPosition === "left" && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        )}
        <Input
          ref={ref}
          className={cn(
            iconPosition === "left" ? "pl-9 sm:pl-10" : "pr-9 sm:pr-10",
            "h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-background/50 backdrop-blur-sm",
            className
          )}
          {...props}
        />
        {iconPosition === "right" && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        )}
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";

