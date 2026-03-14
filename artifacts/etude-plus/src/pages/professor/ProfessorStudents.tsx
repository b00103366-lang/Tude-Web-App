import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input } from "@/components/ui/Premium";
import { Search, Users, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

function useMyClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("etude_auth_token");
    if (!token) { setIsLoading(false); return; }
    fetch("/api/classes/my-classes", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setClasses(d.classes ?? []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);
  return { classes, isLoading };
}

export function ProfessorStudents() {
  const [search, setSearch] = useState("");
  const { classes, isLoading } = useMyClasses();

  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolledCount ?? 0), 0);

  const filtered = classes.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mes Élèves"
          description="Vue d'ensemble des élèves inscrits à vos cours."
        />

        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Élèves au total</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Cours actifs</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Moy. par cours</p>
            </div>
          </Card>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Filtrer par cours..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {classes.length === 0 ? "Aucun cours créé" : "Aucun cours trouvé"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {classes.length === 0
                ? "Créez votre premier cours pour commencer à accueillir des élèves."
                : `Aucun résultat pour "${search}".`}
            </p>
            {classes.length === 0 && (
              <Link href="/professor/create-class">
                <Button>Créer un cours</Button>
              </Link>
            )}
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted border-b border-border">
              <p className="text-sm font-semibold text-muted-foreground">
                Cliquez sur un cours pour voir et gérer ses élèves
              </p>
            </div>
            <div className="divide-y divide-border">
              {filtered.map(cls => (
                <Link key={cls.id} href={`/professor/classes/${cls.id}`}>
                  <div className="p-5 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{cls.title}</h4>
                        <p className="text-sm text-muted-foreground">{cls.subject} • {cls.gradeLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">{cls.enrolledCount}</p>
                        <p className="text-xs text-muted-foreground">élève{cls.enrolledCount !== 1 ? "s" : ""}</p>
                      </div>
                      <Badge variant={cls.isPublished ? "success" : "secondary"} className="hidden sm:flex">
                        {cls.isPublished ? "Publié" : "Brouillon"}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Pour voir la liste détaillée des élèves d'un cours, cliquez sur le cours puis allez dans l'onglet "Élèves".
        </p>
      </FadeIn>
    </DashboardLayout>
  );
}
