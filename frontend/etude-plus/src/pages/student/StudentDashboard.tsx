import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, FadeIn } from "@/components/ui/Premium";
import {
  Library, FileText, ClipboardList, Layers,
  ChevronRight, AlertCircle, Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { AnnouncementsWidget } from "@/components/shared/AnnouncementsWidget";

/**
 * LEARNING MODULES — single source of truth for the student dashboard.
 * Each entry maps to a real backend route and DB table.
 * Clicking a card takes the student to /revision where they pick a subject,
 * then land on the matching module (via RevisionSubject.tsx SECTIONS config).
 *
 * key         → matches the URL segment in /revision/:subject/<key>
 * backendRoute → GET /api/revision/content/<resource>
 * dbTable     → DB table powering the content
 */
const LEARNING_MODULES = [
  {
    icon: Library,
    key: "banque-de-questions",
    title: "Questions",
    description: "Entraîne-toi sur des questions classées par chapitre, avec correction immédiate et auto-évaluation.",
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
    title: "Past Papers",
    description: "Passe de vraies annales d'examens des années précédentes et reçois ta note sur 20.",
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
    title: "Practice Exams",
    description: "Tirage aléatoire de 15 questions, tous chapitres confondus. Conditions d'examen, note finale sur 20.",
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
    description: "Mémorise les définitions et formules clés avec la méthode de répétition espacée.",
    color: "hover:border-rose-300 dark:hover:border-rose-700",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    backendRoute: "/api/revision/content/flashcards",
    dbTable: "flashcards",
  },
] as const;

export function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Élève";
  const gradeLevel = (user as any)?.studentProfile?.gradeLevel;

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Révision Étude+</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bonjour, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Choisissez un mode de révision pour commencer.
            </p>
          </div>

          <AnnouncementsWidget />

          {/* ── Grade level warning ───────────────────────────────────────────── */}
          {!gradeLevel && (
            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Niveau scolaire non défini</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    <Link href="/student/settings" className="underline">Configure ton niveau</Link>{" "}
                    pour accéder au contenu adapté à ta classe.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── 4 Learning module cards ───────────────────────────────────────── */}
          {/*
           * Each card links to /revision (the subject picker).
           * After selecting a subject the student lands on RevisionSubject.tsx
           * which shows the same 4 modules — clicking the matching one loads
           * real content from the backend route listed in backendRoute above.
           */}
          <div>
            <h2 className="text-lg font-bold mb-4">Modules d'apprentissage</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {LEARNING_MODULES.map((mod) => (
                <Link key={mod.key} href="/revision">
                  <div
                    className={`group flex flex-col gap-5 p-6 rounded-2xl border-2 border-border bg-card transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${mod.color}`}
                  >
                    {/* Icon + badge row */}
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mod.iconBg} ${mod.iconColor}`}>
                        <mod.icon className="w-6 h-6" />
                      </div>
                      {"badge" in mod && mod.badge && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${"badgeColor" in mod ? mod.badgeColor : ""}`}>
                          {mod.badge}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Choisir une matière</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
