import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link } from "wouter";
import { getSubjectsForNiveauSection, getNiveauLabel, getSectionLabel, isSectionLevel, subjectToSlug } from "@/lib/educationConfig";
import { BookOpen, ChevronRight, AlertCircle } from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  "Mathématiques":       "bg-blue-500/10 border-blue-200 dark:bg-blue-500/20 dark:border-blue-800",
  "Physique-Chimie":     "bg-purple-500/10 border-purple-200 dark:bg-purple-500/20 dark:border-purple-800",
  "Sciences Naturelles": "bg-green-500/10 border-green-200 dark:bg-green-500/20 dark:border-green-800",
  "Arabe":               "bg-amber-500/10 border-amber-200 dark:bg-amber-500/20 dark:border-amber-800",
  "Français":            "bg-rose-500/10 border-rose-200 dark:bg-rose-500/20 dark:border-rose-800",
  "Anglais":             "bg-sky-500/10 border-sky-200 dark:bg-sky-500/20 dark:border-sky-800",
  "Histoire-Géographie": "bg-orange-500/10 border-orange-200 dark:bg-orange-500/20 dark:border-orange-800",
  "Informatique":        "bg-teal-500/10 border-teal-200 dark:bg-teal-500/20 dark:border-teal-800",
  "Philosophie":         "bg-indigo-500/10 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-800",
  "Économie":            "bg-emerald-500/10 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-800",
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? "bg-muted border-border";
}

const SUBJECT_EMOJIS: Record<string, string> = {
  "Mathématiques": "📐", "Physique-Chimie": "⚗️", "Sciences Naturelles": "🌿",
  "Arabe": "📖", "Français": "🇫🇷", "Anglais": "🇬🇧", "Histoire-Géographie": "🌍",
  "Informatique": "💻", "Philosophie": "🧠", "Économie": "📊", "Gestion": "📋",
  "Comptabilité": "🧾", "Technologie": "⚙️", "Sport": "🏃",
  "Éducation Islamique": "☪️", "Allemand": "🇩🇪", "Italien": "🇮🇹", "Espagnol": "🇪🇸",
  "Éducation Artistique": "🎨", "Éducation Musicale": "🎵", "Éducation Civique": "🏛️",
  "Sciences de l'Ingénieur": "🔧",
};

export function RevisionHub() {
  const { user } = useAuth();
  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const educationSection: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  if (!gradeLevel) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold">Niveau non défini</h2>
          <p className="text-muted-foreground">
            Veuillez définir votre niveau scolaire dans{" "}
            <Link href="/student/settings" className="text-primary underline underline-offset-2">
              les paramètres
            </Link>{" "}
            pour accéder à la Révision Étude+.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const sectionKey = isSectionLevel(gradeLevel) ? educationSection : null;
  const subjects = getSubjectsForNiveauSection(gradeLevel, sectionKey) as readonly string[];
  const gradeLabel = getNiveauLabel(gradeLevel);
  const sectionLabel = sectionKey ? getSectionLabel(gradeLevel, sectionKey) : null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Révision Étude+</span>
          </div>
          <h1 className="text-2xl font-bold">Révision Étude+</h1>
          <p className="text-muted-foreground mt-1">
            {gradeLabel}{sectionLabel ? ` — ${sectionLabel}` : ""} · Choisissez une matière pour commencer.
          </p>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map(subject => (
            <Link
              key={subject}
              href={`/revision/${subjectToSlug(subject)}`}
              className={`group flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${getSubjectColor(subject)}`}
            >
              <span className="text-3xl">{SUBJECT_EMOJIS[subject] ?? "📚"}</span>
              <div>
                <p className="font-semibold text-sm leading-snug text-gray-900">{subject}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700 opacity-60 group-hover:opacity-100 transition-opacity mt-auto">
                <span>Réviser</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
