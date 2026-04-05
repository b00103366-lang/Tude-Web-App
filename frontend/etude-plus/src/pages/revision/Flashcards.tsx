import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, ChevronRight, Construction } from "lucide-react";

export function Flashcards() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Révision Étude+</span>
            <ChevronRight className="w-3 h-3" />
            <span>Flashcards</span>
          </div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">Mémorise les définitions et formules avec la répétition espacée.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold">En cours de préparation</h2>
          <p className="text-muted-foreground max-w-sm">
            Le système de flashcards avec répétition espacée arrive bientôt. Une nouvelle façon d'apprendre !
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
