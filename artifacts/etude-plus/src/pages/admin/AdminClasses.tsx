import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input } from "@/components/ui/Premium";
import { Search, BookOpen, Users, DollarSign, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useListClasses } from "@workspace/api-client-react";
import { formatTND } from "@/lib/utils";

export function AdminClasses() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListClasses({ search });
  const classes = data?.classes ?? [];
  const total = data?.total ?? 0;

  const totalEnrolled = classes.reduce((s, c) => s + (c.enrolledCount ?? 0), 0);
  const totalVolume = classes.reduce((sum, c) => sum + (c.price * (c.enrolledCount ?? 0)), 0);

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Catalogue des cours" description="Vision globale de tous les cours publiés sur la plateforme." />

        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Cours publiés", value: total, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
            { label: "Inscriptions totales", value: totalEnrolled, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Volume inscriptions", value: formatTND(totalVolume), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
          ].map((s, i) => (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input className="pl-10" placeholder="Rechercher un cours..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Cours</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Professeur</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Matière</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Élèves</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Prix/s.</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Voir</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold">{cls.title}</p>
                        <p className="text-xs text-muted-foreground">{cls.gradeLevel}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{cls.professor?.fullName ?? "—"}</td>
                      <td className="p-4"><Badge variant="secondary">{cls.subject}</Badge></td>
                      <td className="p-4 text-center font-medium">{cls.enrolledCount ?? 0}</td>
                      <td className="p-4 text-right font-bold">{formatTND(cls.price)}</td>
                      <td className="p-4 text-right">
                        <Link href={`/student/classes/${cls.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {classes.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  <p>{search ? `Aucun résultat pour "${search}".` : "Aucun cours publié."}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
