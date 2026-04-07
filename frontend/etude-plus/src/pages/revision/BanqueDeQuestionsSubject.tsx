import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import { BookOpen, ChevronRight, Construction } from "lucide-react";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

export function BanqueDeQuestionsSubject() {
  const [, params] = useRoute("/revision/:subject/banque-de-questions");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">
              Révision Étude+
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${subjectToSlug(subject)}`} className="hover:text-foreground transition-colors">
              {subject}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>Banque de Questions</span>
          </div>
          <h1 className="text-2xl font-bold">Banque de Questions — {subject}</h1>
          <p className="text-muted-foreground mt-1">Sélectionnez un chapitre pour commencer.</p>
        </div>

        {/* Coming soon */}
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold">Chapitres en cours de préparation</h2>
          <p className="text-muted-foreground max-w-sm">
            Le contenu pour <strong>{subject}</strong> sera disponible très bientôt. Revenez dans quelques jours !
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
