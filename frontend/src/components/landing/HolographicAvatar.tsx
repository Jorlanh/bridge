import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function HolographicAvatar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate normalized position (-1 to 1) relative to avatar center
      const x = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const y = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));
      
      setMousePosition({ x: x * 0.15, y: y * 0.15 }); // Subtle movement
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
    >
      {/* Outer ethereal glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
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
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbiting particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI * 2) / 8) * 120,
              Math.cos((i * Math.PI * 2) / 8 + Math.PI) * 120,
              Math.cos((i * Math.PI * 2) / 8) * 120,
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 8) * 120,
              Math.sin((i * Math.PI * 2) / 8 + Math.PI) * 120,
              Math.sin((i * Math.PI * 2) / 8) * 120,
            ],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 12 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Inner orbiting particles (slower) */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`inner-${i}`}
          className="absolute w-1 h-1 rounded-full bg-blue-300/50 blur-[1px]"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI * 2) / 5) * 60,
              Math.cos((i * Math.PI * 2) / 5 - Math.PI) * 60,
              Math.cos((i * Math.PI * 2) / 5) * 60,
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 5) * 60,
              Math.sin((i * Math.PI * 2) / 5 - Math.PI) * 60,
              Math.sin((i * Math.PI * 2) / 5) * 60,
            ],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 20 + i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Main avatar container with floating animation */}
      <motion.div
        className="absolute inset-8 rounded-full"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Holographic base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border border-cyan-500/30 overflow-hidden">
          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent"
            animate={{
              y: [-200, 200],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Face structure */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Forehead light */}
            <motion.div
              className="absolute top-[20%] w-16 h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scaleX: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Eyes container */}
            <div className="relative flex items-center gap-8 md:gap-10 mt-4">
              {/* Left eye */}
              <motion.div
                className="relative w-6 h-6 md:w-8 md:h-8"
                animate={{
                  x: mousePosition.x * 6,
                  y: mousePosition.y * 4,
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 15,
                }}
              >
                {/* Eye outer glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md" />
                {/* Eye socket */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-cyan-400/40" />
                {/* Iris */}
                <motion.div
                  className="absolute inset-1.5 md:inset-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(34, 211, 238, 0.4)",
                      "0 0 20px 4px rgba(34, 211, 238, 0.6)",
                      "0 0 10px 2px rgba(34, 211, 238, 0.4)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Pupil */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-slate-900"
                  animate={{
                    x: mousePosition.x * 2,
                    y: mousePosition.y * 2,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                />
                {/* Eye highlight */}
                <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-white/80" />
              </motion.div>

              {/* Right eye */}
              <motion.div
                className="relative w-6 h-6 md:w-8 md:h-8"
                animate={{
                  x: mousePosition.x * 6,
                  y: mousePosition.y * 4,
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 15,
                }}
              >
                {/* Eye outer glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md" />
                {/* Eye socket */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-cyan-400/40" />
                {/* Iris */}
                <motion.div
                  className="absolute inset-1.5 md:inset-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(34, 211, 238, 0.4)",
                      "0 0 20px 4px rgba(34, 211, 238, 0.6)",
                      "0 0 10px 2px rgba(34, 211, 238, 0.4)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
                {/* Pupil */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-slate-900"
                  animate={{
                    x: mousePosition.x * 2,
                    y: mousePosition.y * 2,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                />
                {/* Eye highlight */}
                <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-white/80" />
              </motion.div>
            </div>

            {/* Nose indicator */}
            <motion.div
              className="mt-4 w-px h-6 bg-gradient-to-b from-cyan-400/30 to-transparent"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Mouth/indicator line */}
            <motion.div
              className="mt-3 w-10 md:w-12 h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scaleX: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Chin accent */}
            <motion.div
              className="mt-6 w-6 h-px rounded-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </div>

          {/* Side circuit lines */}
          <div className="absolute left-4 top-1/3 w-4 flex flex-col gap-2 opacity-30">
            <div className="w-full h-px bg-cyan-400" />
            <div className="w-3 h-px bg-cyan-400" />
            <div className="w-2 h-px bg-cyan-400" />
          </div>
          <div className="absolute right-4 top-1/3 w-4 flex flex-col gap-2 opacity-30 items-end">
            <div className="w-full h-px bg-cyan-400" />
            <div className="w-3 h-px bg-cyan-400" />
            <div className="w-2 h-px bg-cyan-400" />
          </div>

          {/* Breathing glow overlay */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-t from-cyan-400/5 via-transparent to-blue-400/5"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Outer ring pulse */}
        <motion.div
          className="absolute -inset-1 rounded-full border border-cyan-400/20"
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary outer ring */}
        <motion.div
          className="absolute -inset-3 rounded-full border border-cyan-400/10"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Status indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-cyan-400/70 font-mono uppercase tracking-wider">Online</span>
      </motion.div>
    </div>
  );
}
