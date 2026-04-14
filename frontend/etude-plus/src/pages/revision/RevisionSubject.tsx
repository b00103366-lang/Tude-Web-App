import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import {
  BookOpen, ChevronRight, Library, FileText, Layers, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

/**
 * ACTIVE MODULES — source of truth.
 * Each entry maps 1-to-1 with a real backend route and DB table.
 *
 * key         → URL segment after /revision/:subject/
 * backendRoute → GET /api/revision/content/<resource>
 * dbTable     → DB table powering the content
 */
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
  backendRoute: string;
  dbTable: string;
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
    backendRoute: "/api/revision/content/questions",
    dbTable: "questions",
  },
  {
    icon: FileText,
    key: "examens-blancs",
    title: "Examens Blancs",
    description: "Sujets d'examens des années précédentes avec corrigés. Reçois ta note sur 20.",
    color: "hover:border-amber-300 dark:hover:border-amber-700",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge: "Populaire",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    backendRoute: "/api/revision/content/annales",
    dbTable: "annales",
  },
  {
    icon: ClipboardList,
    key: "examens-pratiques",
    title: "Examens Pratiques",
    description: "Entraîne-toi sur un ensemble de questions en conditions d'examen. Note finale sur 20.",
    color: "hover:border-green-300 dark:hover:border-green-700",
    iconBg: "bg-green-500/10 dark:bg-green-500/20",
    iconColor: "text-green-600 dark:text-green-400",
    backendRoute: "/api/revision/content/questions",
    dbTable: "questions",
  },
  {
    icon: Layers,
    key: "flashcards",
    title: "Flashcards",
    description: "Mémorise les définitions et formules clés avec la répétition espacée.",
    color: "hover:border-rose-300 dark:hover:border-rose-700",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    backendRoute: "/api/revision/content/flashcards",
    dbTable: "flashcards",
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

        {/* Resource card grid — exactly 4 active modules */}
        <div className="grid sm:grid-cols-2 gap-5">
          {SECTIONS.map((section) => (
            <Link key={section.key} href={`/revision/${slug}/${section.key}`}>
              <div
                className={cn(
                  "group flex flex-col gap-5 p-6 rounded-2xl border-2 border-border bg-card transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
                  section.color
                )}
              >
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
                <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Commencer</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
