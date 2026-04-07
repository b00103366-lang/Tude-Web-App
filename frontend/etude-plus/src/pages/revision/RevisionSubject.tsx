import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import { BookOpen, ChevronRight, Library, FileText, Lightbulb, Archive, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

const SECTIONS = [
  {
    icon: Library,
    key: "banque-de-questions",
    title: "Banque de Questions",
    description: "Questions classées par chapitre avec correction immédiate.",
    color: "bg-blue-500/10 border-blue-200 dark:bg-blue-500/20 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "Recommandé",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    icon: FileText,
    key: "examens-blancs",
    title: "Examens Blancs",
    description: "Simule les conditions du vrai examen avec notation automatique.",
    color: "bg-amber-500/10 border-amber-200 dark:bg-amber-500/20 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge: "Populaire",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    icon: Lightbulb,
    key: "notions-cles",
    title: "Notions Clés",
    description: "Résumés et définitions essentielles pour maîtriser la matière.",
    color: "bg-purple-500/10 border-purple-200 dark:bg-purple-500/20 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Archive,
    key: "annales",
    title: "Annales",
    description: "Sujets d'examens des années précédentes avec corrigés détaillés.",
    color: "bg-green-500/10 border-green-200 dark:bg-green-500/20 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Layers,
    key: "flashcards",
    title: "Flashcards",
    description: "Mémorise les définitions et formules avec la répétition espacée.",
    color: "bg-rose-500/10 border-rose-200 dark:bg-rose-500/20 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
    badge: null,
    badgeColor: "",
  },
];

export function RevisionSubject() {
  const [, params] = useRoute("/revision/:subject");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb + header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">
              Révision Étude+
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>{subject}</span>
          </div>
          <h1 className="text-2xl font-bold">{subject}</h1>
          <p className="text-muted-foreground mt-1">Choisissez comment réviser cette matière.</p>
        </div>

        {/* Section cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTIONS.map(section => (
            <Link
              key={section.key}
              href={`/revision/${subjectToSlug(subject)}/${section.key}`}
              className={cn(
                "group flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                section.color
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-11 h-11 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center",
                  section.iconColor
                )}>
                  <section.icon className="w-6 h-6" />
                </div>
                {section.badge && (
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", section.badgeColor)}>
                    {section.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">{section.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{section.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mt-auto">
                <span>Commencer</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
