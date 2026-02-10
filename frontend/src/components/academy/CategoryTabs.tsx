import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "Todos" },
  { id: "business", label: "IA para Negócios" },
  { id: "automation", label: "Automação" },
  { id: "marketing", label: "Marketing com IA" },
  { id: "sales", label: "Vendas Inteligentes" },
  { id: "support", label: "Atendimento" },
  { id: "security", label: "Segurança Digital" },
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            activeCategory === category.id
              ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
