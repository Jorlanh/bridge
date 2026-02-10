import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

function BridgeLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="faceGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
        </linearGradient>
        <linearGradient id="faceGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--accent) / 0.4)" />
        </linearGradient>
        <linearGradient id="faceGradient3" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.8)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
        </linearGradient>
        <filter id="cubeGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <motion.path
        d="M24 8 L38 16 L24 24 L10 16 Z"
        fill="url(#faceGradient1)"
        filter="url(#cubeGlow)"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />
      
      <motion.path
        d="M10 16 L24 24 L24 40 L10 32 Z"
        fill="url(#faceGradient2)"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      
      <motion.path
        d="M24 24 L38 16 L38 32 L24 40 Z"
        fill="url(#faceGradient3)"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      
      <motion.path
        d="M24 8 L38 16 L38 32 L24 40 L10 32 L10 16 Z"
        className="stroke-primary"
        strokeWidth="1"
        fill="none"
        filter="url(#cubeGlow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      <motion.line
        x1="24" y1="24" x2="24" y2="40"
        className="stroke-primary/60"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      
      <motion.circle
        r="1.5"
        className="fill-primary"
        filter="url(#cubeGlow)"
        animate={{
          cx: [6, 12, 6],
          cy: [24, 18, 24],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        r="1"
        className="fill-accent"
        animate={{
          cx: [42, 36, 42],
          cy: [24, 30, 24],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      
      <motion.circle
        cx="24"
        cy="24"
        r="4"
        className="fill-primary/30"
        filter="url(#cubeGlow)"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "24px 24px" }}
      />
      <motion.circle
        cx="24"
        cy="24"
        r="2"
        className="fill-primary"
        filter="url(#cubeGlow)"
        animate={{ 
          opacity: [1, 0.6, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.ellipse
        cx="24"
        cy="28"
        rx="20"
        ry="5"
        className="stroke-primary/30"
        strokeWidth="1"
        strokeDasharray="4 4"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "24px 28px" }}
      />
      
      <motion.circle
        r="2"
        className="fill-accent"
        filter="url(#cubeGlow)"
        animate={{
          cx: [4, 24, 44, 24, 4],
          cy: [28, 33, 28, 23, 28],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "#pricing", label: "Preços" },
  ];

  return (
    <motion.header 
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl"
      style={{
        top: scrolled
          ? "calc(env(safe-area-inset-top) + 8px)"
          : "calc(env(safe-area-inset-top) + 16px)",
      }}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 p-[1px] opacity-60">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
      </div>
      
      {/* Main container */}
      <div className="relative rounded-2xl bg-background/60 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-primary/5 overflow-hidden">
        {/* Scanning line effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "20px 20px"
        }} />
        
        <div className="relative px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <BridgeLogo className="w-11 h-11" />
                <motion.div 
                  className="absolute inset-0 bg-primary/40 blur-xl rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl leading-none">
                  Bridge<span className="text-primary">AI</span>
                </span>
                <span className="text-[10px] text-muted-foreground/60 tracking-widest uppercase">
                  Intelligence Hub
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Center */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-muted/30 border border-border/50">
                {navItems.map((item, index) => (
                  <motion.a 
                    key={item.href}
                    href={item.href} 
                    className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all rounded-full group"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <motion.div
                      className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="navHover"
                    />
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link 
                    to="/afiliados" 
                    className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all rounded-full group"
                  >
                    <span>Afiliados</span>
                    <motion.div
                      className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </motion.div>
              </div>
            </nav>

            {/* CTA Buttons */}
            <motion.div 
              className="hidden md:flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ThemeToggle />
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  Entrar
                </Button>
              </Link>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity" />
                <Link to="/registro">
                  <Button 
                    size="sm"
                    className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Começar agora
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden relative p-2.5 rounded-xl bg-muted/30 border border-border/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                className="md:hidden py-4 border-t border-border/30 overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <nav className="flex flex-col gap-2">
                  {[...navItems, 
                    { href: "/afiliados", label: "Afiliados", isLink: true }
                  ].map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      {'isLink' in item ? (
                        <Link 
                          to={item.href} 
                          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all rounded-xl"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {item.label}
                        </Link>
                      ) : (
                        <a 
                          href={item.href} 
                          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all rounded-xl"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {item.label}
                        </a>
                      )}
                    </motion.div>
                  ))}
                  <motion.div 
                    className="flex items-center gap-3 pt-4 mt-2 border-t border-border/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <ThemeToggle />
                    <Link to="/login" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/registro" className="flex-1">
                      <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Começar
                      </Button>
                    </Link>
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
