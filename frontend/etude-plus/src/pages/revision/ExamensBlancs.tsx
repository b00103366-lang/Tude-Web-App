import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, ChevronRight, FileText, Trophy, BarChart3, Construction } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const OPTIONS = [
  {
    icon: FileText,
    title: "Quiz par Thème",
    description: "Entraîne-toi sur un chapitre ou une notion précise. Questions courtes, correction immédiate.",
    color: "bg-blue-500/10 border-blue-200 dark:bg-blue-500/20 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "Recommandé",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    icon: Trophy,
    title: "Examen Blanc Complet",
    description: "Simule les conditions du vrai examen. Durée limitée, toutes les matières, notation automatique.",
    color: "bg-amber-500/10 border-amber-200 dark:bg-amber-500/20 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge: "Populaire",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    icon: BarChart3,
    title: "Échelle de Révision",
    description: "Identifie tes points faibles et génère un plan de révision personnalisé basé sur tes résultats.",
    color: "bg-green-500/10 border-green-200 dark:bg-green-500/20 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badge: null,
    badgeColor: "",
  },
];

export function ExamensBlancs() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Révision Étude+</span>
            <ChevronRight className="w-3 h-3" />
            <span>Examens Blancs</span>
          </div>
          <h1 className="text-2xl font-bold">Examens Blancs</h1>
          <p className="text-muted-foreground mt-1">Prépare-toi efficacement avec nos outils de simulation.</p>
        </div>

        {/* Option cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.title}
              onClick={() => setSelected(i)}
              className={cn(
                "group flex flex-col gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                opt.color,
                selected === i && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("w-11 h-11 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center", opt.iconColor)}>
                  <opt.icon className="w-6 h-6" />
                </div>
                {opt.badge && (
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", opt.badgeColor)}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-base">{opt.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Coming soon notice */}
        {selected !== null && (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <Construction className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {OPTIONS[selected].title} — Bientôt disponible
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                Cette fonctionnalité est en cours de développement. Elle sera disponible très prochainement !
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
