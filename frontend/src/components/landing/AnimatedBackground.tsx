import { motion } from "framer-motion";

export function AnimatedBackground() {
  // Generate random particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 10 + 15,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            bottom: -20,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, Math.sin(particle.id) * 50],
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* Larger glowing orbs */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full bg-primary/20 blur-xl"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            bottom: -100,
          }}
          animate={{
            y: [0, -window.innerHeight - 200],
            x: [0, Math.cos(i) * 100],
            opacity: [0, 0.3, 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 25,
            repeat: Infinity,
            delay: Math.random() * 15,
            ease: "linear",
          }}
        />
      ))}

      {/* Secondary color particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`secondary-${i}`}
          className="absolute rounded-full bg-secondary"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            bottom: -10,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            y: [0, -window.innerHeight - 50],
            x: [0, Math.sin(i * 0.5) * 30],
            opacity: [0, 0.4, 0.4, 0],
          }}
          transition={{
            duration: Math.random() * 12 + 18,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
