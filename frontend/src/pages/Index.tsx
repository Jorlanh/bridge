import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Benefits } from "@/components/landing/Benefits";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { Features } from "@/components/landing/Features";
import { AutomationToolsPanel } from "@/components/landing/AutomationToolsPanel";
import { AcademySection } from "@/components/landing/AcademySection";
import { Pricing } from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <About />
      <Benefits />
      <ComparisonSection />
      <Features />
      <AutomationToolsPanel />
      <AcademySection />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
