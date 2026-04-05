import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link } from "wouter";
import { BookOpen, ChevronRight, Construction } from "lucide-react";
import { useRoute } from "wouter";

export function BanqueDeQuestionsSubject() {
  const [, params] = useRoute("/revision/banque-de-questions/:subject");
  const subject = params?.subject ? decodeURIComponent(params.subject) : "";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision/banque-de-questions" className="hover:text-foreground transition-colors">
              Banque de Questions
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>{subject}</span>
          </div>
          <h1 className="text-2xl font-bold">{subject}</h1>
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
