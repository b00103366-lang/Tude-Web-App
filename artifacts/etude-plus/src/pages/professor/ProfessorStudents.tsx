import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Input } from "@/components/ui/Premium";
import { Search } from "lucide-react";

export function ProfessorStudents() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Mes Élèves" 
          description="Gérez les élèves inscrits à vos cours."
        />
        
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input className="pl-10" placeholder="Rechercher un élève..." />
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Élève</th>
                <th className="px-6 py-4 font-semibold">Niveau</th>
                <th className="px-6 py-4 font-semibold">Cours inscrit(s)</th>
                <th className="px-6 py-4 font-semibold">Date d'inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: "Amira Ben Ali", grade: "Baccalauréat", class: "Mathématiques 101", date: "01 Sept 2023" },
                { name: "Youssef Trabelsi", grade: "Baccalauréat", class: "Mathématiques 101", date: "05 Sept 2023" },
                { name: "Rym Gharbi", grade: "3ème Année", class: "Physique quantique", date: "10 Sept 2023" },
              ].map((s, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-bold">{s.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.grade}</td>
                  <td className="px-6 py-4">{s.class}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
