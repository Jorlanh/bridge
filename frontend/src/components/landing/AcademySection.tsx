import { 
  GraduationCap, 
  Play, 
  Award, 
  Users, 
  BookOpen, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const courses = [
  {
    title: "IA para Negócios",
    lessons: 24,
    duration: "8h",
    level: "Iniciante",
    image: "🤖",
  },
  {
    title: "Automação Avançada",
    lessons: 32,
    duration: "12h",
    level: "Intermediário",
    image: "⚡",
  },
  {
    title: "Marketing com IA",
    lessons: 28,
    duration: "10h",
    level: "Iniciante",
    image: "📈",
  },
  {
    title: "Vendas Inteligentes",
    lessons: 20,
    duration: "6h",
    level: "Avançado",
    image: "💼",
  },
];

const benefits = [
  "Aprenda no seu ritmo com aulas gravadas",
  "Certificados reconhecidos pelo mercado",
  "Projetos práticos em cada módulo",
  "Acesso a comunidade exclusiva",
  "Consultoria em grupo mensal",
  "Suporte direto via WhatsApp",
];

export function AcademySection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 mb-6">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-secondary font-medium">BridgeAI Academy</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Domine a <span className="text-gradient">Inteligência Artificial</span> aplicada aos negócios
          </h2>
          <p className="text-lg text-muted-foreground">
            A BridgeAI Academy é uma academia de capacitação contínua para empresas se tornarem AI-First. 
            Cursos práticos para transformar você e sua equipe em especialistas em IA e automação empresarial.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left - Course cards */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              Cursos em Destaque
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="glass-card p-5 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="text-4xl mb-4">{course.image}</div>
                  <h4 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" />
                      {course.lessons} aulas
                    </span>
                    <span>•</span>
                    <span>{course.duration}</span>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    {course.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Benefits and stats */}
          <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-bold text-gradient mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Cursos</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-bold text-gradient mb-1">200h</div>
                <div className="text-sm text-muted-foreground">Conteúdo</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-bold text-gradient mb-1">5k+</div>
                <div className="text-sm text-muted-foreground">Alunos</div>
              </div>
            </div>

            {/* Benefits list */}
            <div className="glass-card p-6">
              <h3 className="font-display text-xl font-bold mb-5 flex items-center gap-3">
                <Award className="w-5 h-5 text-secondary" />
                O que você recebe
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-display text-2xl font-bold mb-6 text-center">
            Trilhas de Aprendizado
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: BookOpen, name: "IA para Negócios" },
              { icon: TrendingUp, name: "Marketing Digital" },
              { icon: Users, name: "Vendas & CRM" },
              { icon: GraduationCap, name: "Automação" },
              { icon: Award, name: "Liderança Tech" },
            ].map((category, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-muted/50 border border-border hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
              >
                <category.icon className="w-4 h-4 text-primary" />
                <span className="font-medium">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <Link to="/academy">
            <Button variant="hero" size="xl" className="group">
              Acessar BridgeAI Academy
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            ✓ Atualização constante &nbsp; ✓ Certificado incluso &nbsp; ✓ Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
}
