import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Plus, Users, Settings, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListClasses } from "@workspace/api-client-react";

export function ProfessorClasses() {
  const { user } = useAuth();
  const professorId = user?.professorProfile?.id;
  const { data, isLoading } = useListClasses(
    { professorId: professorId ? String(professorId) : undefined },
    { query: { enabled: !!professorId } }
  );

  const classes = data?.classes ?? [];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mes Cours"
          description="Gérez votre catalogue de cours."
          action={
            <Link href="/professor/create-class">
              <Button><Plus className="w-5 h-5 mr-2" /> Nouveau Cours</Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun cours pour l'instant</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Créez votre premier cours pour commencer à enseigner sur Étude+.
            </p>
            <Link href="/professor/create-class">
              <Button><Plus className="w-4 h-4 mr-2" /> Créer mon premier cours</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden group">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={cls.isPublished ? "success" : "secondary"}>
                      {cls.isPublished ? "Publié" : "Brouillon"}
                    </Badge>
                    <span className="text-sm font-semibold text-muted-foreground uppercase">{cls.subject}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{cls.title}</h3>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" /> {cls.enrolledCount ?? 0} élèves
                    </div>
                    <div className="font-bold text-foreground">
                      {cls.price} TND / session
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col justify-end gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                  <Link href={`/professor/classes/${cls.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" /> Gérer
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
