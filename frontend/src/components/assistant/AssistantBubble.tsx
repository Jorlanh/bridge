import { motion } from "framer-motion";
import { X } from "lucide-react";

interface AssistantBubbleProps {
  message: string;
  onClose: () => void;
}

export function AssistantBubble({ message, onClose }: AssistantBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative max-w-[80vw] sm:max-w-64"
    >
      {/* Bubble */}
      <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl rounded-br-md p-4 pr-8 border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
          aria-label="Fechar mensagem"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>

        {/* Message */}
        <p className="text-sm text-slate-200 leading-relaxed">
          {message}
        </p>

        {/* Subtle glow line */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </div>

      {/* Pointer */}
      <div className="absolute -right-2 bottom-3 w-4 h-4 bg-slate-800/95 border-r border-b border-cyan-500/20 transform rotate-[-45deg]" />
    </motion.div>
  );
}
