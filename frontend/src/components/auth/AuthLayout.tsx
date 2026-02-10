import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthIllustration } from "./AuthIllustration";

interface AuthLayoutProps {
  children: ReactNode;
  illustration: {
    icon: LucideIcon;
    title: string;
    description: ReactNode;
    decorativeIcons?: {
      left?: LucideIcon;
      right?: LucideIcon;
      center?: LucideIcon;
      floating?: LucideIcon[];
    };
  };
  mobileHeader: {
    icon: LucideIcon;
    title: string;
    description: ReactNode;
  };
  footerLink?: {
    text: string;
    to: string;
  };
}

export function AuthLayout({
  children,
  illustration,
  mobileHeader,
  footerLink,
}: AuthLayoutProps) {
  const MobileIcon = mobileHeader.icon;

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-20 md:opacity-30" />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Left Panel - Illustration */}
      <AuthIllustration {...illustration} />

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5" />

        <div className="w-full max-w-md relative z-10 overflow-y-auto max-h-[calc(100vh-2rem)]">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4"
            >
              <MobileIcon className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold mb-2">{mobileHeader.title}</h1>
            <p className="text-sm text-muted-foreground">{mobileHeader.description}</p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-6 sm:p-8 space-y-4 sm:space-y-5">{children}</div>

          {/* Footer Link */}
          {footerLink && (
            <div className="text-center mt-4">
              <Link
                to={footerLink.to}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                {footerLink.text}
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

