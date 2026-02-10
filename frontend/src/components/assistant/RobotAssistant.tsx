import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantBubble } from "./AssistantBubble";

const tips = [
  "Posso te ajudar a automatizar algum processo hoje?",
  "Você tem fluxos que podem ser otimizados agora.",
  "Que tal começar um módulo na BridgeAI Academy?",
  "Seu painel está pronto para ganhar mais eficiência.",
  "Descubra novas automações para seu negócio.",
  "Precisa de ajuda? Estou aqui para guiar você.",
];

export function RobotAssistant() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);

  const handleRobotClick = () => {
    setIsPanelOpen(true);
    setShowBubble(false);
  };

  const handleCloseBubble = () => {
    setShowBubble(false);
    // Show next tip after some time
    setTimeout(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
      setShowBubble(true);
    }, 30000);
  };

  return (
    <>
      {/* Robot Assistant */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-end gap-3 max-w-full">
        {/* Text Bubble */}
        <AnimatePresence>
          {showBubble && !isPanelOpen && (
            <AssistantBubble 
              message={tips[currentTip]} 
              onClose={handleCloseBubble}
            />
          )}
        </AnimatePresence>

        {/* Robot */}
        <motion.button
          onClick={handleRobotClick}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Abrir assistente virtual"
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Robot body */}
          <motion.div
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 flex items-center justify-center overflow-hidden"
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border border-cyan-400/20" />

            {/* Robot face */}
            <div className="relative flex flex-col items-center gap-1.5">
              {/* Eyes container */}
              <div className="flex gap-2.5">
                {/* Left eye */}
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(34, 211, 238, 0.5)",
                      "0 0 20px 4px rgba(34, 211, 238, 0.7)",
                      "0 0 10px 2px rgba(34, 211, 238, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Right eye */}
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(34, 211, 238, 0.5)",
                      "0 0 20px 4px rgba(34, 211, 238, 0.7)",
                      "0 0 10px 2px rgba(34, 211, 238, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
              </div>

              {/* Subtle mouth/indicator line */}
              <motion.div
                className="w-4 h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scaleX: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Circuit patterns */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-3 w-2 h-px bg-cyan-400" />
              <div className="absolute top-2 right-3 w-2 h-px bg-cyan-400" />
              <div className="absolute bottom-3 left-4 w-1 h-1 rounded-full bg-cyan-400" />
              <div className="absolute bottom-3 right-4 w-1 h-1 rounded-full bg-cyan-400" />
            </div>

            {/* Breathing animation overlay */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/20"
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Status indicator */}
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>
      </div>

      {/* Assistant Panel */}
      <AssistantPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
}
