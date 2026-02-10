import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

import { ReactNode } from "react";

interface AuthIllustrationProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  decorativeIcons?: {
    left?: LucideIcon;
    right?: LucideIcon;
    center?: LucideIcon;
    floating?: LucideIcon[];
  };
}

export function AuthIllustration({
  icon: MainIcon,
  title,
  description,
  decorativeIcons,
}: AuthIllustrationProps) {
  const LeftIcon = decorativeIcons?.left;
  const RightIcon = decorativeIcons?.right;
  const CenterIcon = decorativeIcons?.center;
  const FloatingIcons = decorativeIcons?.floating || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-card via-card/95 to-card/90 items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-secondary blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      <div className="relative z-10 max-w-md space-y-8">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/40"
        >
          <MainIcon className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        {/* Illustration Elements */}
        <div className="relative">
          {/* Main illustration */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {/* Left figure */}
            {LeftIcon && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <LeftIcon className="w-10 h-10 text-primary" />
                </div>
              </motion.div>
            )}

            {/* Center icon */}
            {CenterIcon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center border-4 border-primary/20 shadow-xl">
                  <CenterIcon className="w-16 h-16 text-primary" />
                </div>
                {/* Rotating ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
                />
              </motion.div>
            )}

            {/* Right figure */}
            {RightIcon && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center border-2 border-secondary/30">
                  <RightIcon className="w-10 h-10 text-secondary" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Floating icons */}
          {FloatingIcons.map((Icon, index) => (
            <motion.div
              key={index}
              animate={{ rotate: index % 2 === 0 ? 360 : -360 }}
              transition={{
                duration: 15 + index * 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className={`absolute ${
                index === 0 ? "top-10 left-10" : "bottom-10 right-10"
              } w-${12 + index * 4} h-${12 + index * 4} text-primary/20`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-4"
        >
          <h2 className="font-display text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground text-lg">{description}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

