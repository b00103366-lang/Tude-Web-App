import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Input } from "@/components/ui/Premium";
import { Search, Users } from "lucide-react";
import { useState } from "react";

export function ProfessorStudents() {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mes Élèves"
          description="Gérez les élèves inscrits à vos cours."
        />

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-9 h-9 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun élève inscrit</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Les élèves qui s'inscrivent à vos cours apparaîtront ici.
          </p>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
