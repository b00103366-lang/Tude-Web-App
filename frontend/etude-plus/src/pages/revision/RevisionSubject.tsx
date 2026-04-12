import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import {
  BookOpen, ChevronRight, Library, FileText, Lightbulb, Archive,
  Layers, Database, GraduationCap, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

type Section = {
  icon: any;
  key: string;
  title: string;
  description: string;
  color: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
};

const SECTIONS: Section[] = [
  {
    icon: Library,
    key: "banque-de-questions",
    title: "Banque de Questions",
    description: "Questions classées par chapitre avec correction immédiate et auto-évaluation.",
    color: "hover:border-blue-300 dark:hover:border-blue-700",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "Recommandé",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    icon: Database,
    key: "banque-de-questions",
    title: "Questions de données",
    description: "Exercices basés sur des données, tableaux et graphiques — format IB et national.",
    color: "hover:border-cyan-300 dark:hover:border-cyan-700",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badge: "Populaire",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  },
  {
    icon: FileText,
    key: "examens-blancs",
    title: "Examens Blancs",
    description: "Simule les conditions du vrai examen avec notation automatique.",
    color: "hover:border-amber-300 dark:hover:border-amber-700",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Lightbulb,
    key: "notions-cles",
    title: "Notions Clés",
    description: "Résumés et définitions essentielles pour maîtriser la matière rapidement.",
    color: "hover:border-purple-300 dark:hover:border-purple-700",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Archive,
    key: "annales",
    title: "Annales",
    description: "Sujets d'examens des années précédentes avec corrigés détaillés.",
    color: "hover:border-green-300 dark:hover:border-green-700",
    iconBg: "bg-green-500/10 dark:bg-green-500/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    icon: GraduationCap,
    key: "internal-assessment",
    title: "Internal Assessment (IA)",
    description: "Ressources dédiées à l'IA : critères, exemples et conseils de rédaction.",
    color: "hover:border-indigo-300 dark:hover:border-indigo-700",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badge: "Bientôt",
    badgeColor: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
    comingSoon: true,
  },
  {
    icon: Layers,
    key: "flashcards",
    title: "Flashcards",
    description: "Mémorise les définitions et formules avec la répétition espacée.",
    color: "hover:border-rose-300 dark:hover:border-rose-700",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

export function RevisionSubject() {
  const [, params] = useRoute("/revision/:subject");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";
  const slug = subjectToSlug(subject);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb + header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">
              Révision Étude+
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{subject}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{subject}</h1>
          <p className="text-muted-foreground mt-1.5">
            Choisissez une ressource pour commencer à réviser.
          </p>
        </div>

        {/* Resource card grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTIONS.map((section, i) => {
            const href = `/revision/${slug}/${section.key}`;
            const cardContent = (
              <div
                className={cn(
                  "group relative flex flex-col gap-5 p-6 rounded-2xl border-2 border-border bg-card transition-all duration-200",
                  section.comingSoon
                    ? "opacity-60 cursor-not-allowed select-none"
                    : cn("cursor-pointer hover:shadow-lg hover:-translate-y-0.5", section.color)
                )}
              >
                {/* Coming-soon lock overlay */}
                {section.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}

                {/* Icon + badge row */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    section.iconBg,
                    section.iconColor
                  )}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  {section.badge && (
                    <span className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full",
                      section.badgeColor
                    )}>
                      {section.badge}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 space-y-1.5">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* CTA row */}
                {!section.comingSoon && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>Commencer</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </div>
            );

            if (section.comingSoon) {
              return <div key={`${section.key}-${i}`}>{cardContent}</div>;
            }

            return (
              <Link key={`${section.key}-${i}`} href={href}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
