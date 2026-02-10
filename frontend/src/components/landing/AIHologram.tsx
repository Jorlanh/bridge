import { motion } from "framer-motion";
import aiHologramImg from "@/assets/ai-hologram.png";

export function AIHologram() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
      {/* Outer ethereal glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary glow ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-cyan-400/20"
        animate={{
          scale: [1, 1.03, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main hologram container with breathing animation */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        animate={{
          scale: [1, 1.02, 1],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Hologram image with breathing glow */}
        <motion.div
          className="relative w-full h-full"
          animate={{
            filter: [
              "brightness(1) drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))",
              "brightness(1.1) drop-shadow(0 0 40px rgba(34, 211, 238, 0.5))",
              "brightness(1) drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src={aiHologramImg}
            alt="AI Hologram"
            className="w-full h-full object-contain"
          />

          {/* Scan line effect overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent"
            animate={{
              y: [-200, 200],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Breathing light pulse overlay */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-t from-cyan-400/10 via-transparent to-blue-400/10 pointer-events-none"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Outer ring pulse */}
      <motion.div
        className="absolute -inset-2 rounded-full border border-cyan-400/20"
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbiting particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/70"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI * 2) / 6) * 140,
              Math.cos((i * Math.PI * 2) / 6 + Math.PI) * 140,
              Math.cos((i * Math.PI * 2) / 6) * 140,
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 6) * 140,
              Math.sin((i * Math.PI * 2) / 6 + Math.PI) * 140,
              Math.sin((i * Math.PI * 2) / 6) * 140,
            ],
            opacity: [0.4, 0.9, 0.4],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 15 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Status indicator */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2"
        animate={{
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-cyan-400/80 font-mono uppercase tracking-wider">AI Online</span>
      </motion.div>
    </div>
  );
}
