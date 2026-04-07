import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import { BookOpen, ChevronRight, Construction } from "lucide-react";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";

export function Annales() {
  const [, params] = useRoute("/revision/:subject/annales");
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
            <span>Annales</span>
          </div>
          <h1 className="text-2xl font-bold">Annales — {subject}</h1>
          <p className="text-muted-foreground mt-1">Sujets d'examens des années précédentes avec corrigés.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold">En cours de préparation</h2>
          <p className="text-muted-foreground max-w-sm">
            Les annales d'examens pour <strong>{subject}</strong> seront disponibles très bientôt, classées par année.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
