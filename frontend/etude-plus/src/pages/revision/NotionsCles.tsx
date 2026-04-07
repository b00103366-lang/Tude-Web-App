import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import { BookOpen, ChevronRight, Construction } from "lucide-react";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

export function NotionsCles() {
  const [, params] = useRoute("/revision/:subject/notions-cles");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
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
            <span>Notions Clés</span>
          </div>
          <h1 className="text-2xl font-bold">Notions Clés — {subject}</h1>
          <p className="text-muted-foreground mt-1">Résumés et définitions essentielles par chapitre.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold">En cours de préparation</h2>
          <p className="text-muted-foreground max-w-sm">
            Les notions clés pour <strong>{subject}</strong> seront disponibles très bientôt. Revenez dans quelques jours !
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
