import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Plus, Users, Settings, Edit3 } from "lucide-react";
import { Link } from "wouter";

export function ProfessorClasses() {
  const classes = [
    { id: 101, title: "Mathématiques 101: Analyse et Algèbre", subject: "Mathématiques", enrolled: 120, status: "published", price: 45 },
    { id: 102, title: "Géométrie dans l'espace", subject: "Mathématiques", enrolled: 45, status: "published", price: 30 },
    { id: 103, title: "Préparation intensive Bac Blanc", subject: "Mathématiques", enrolled: 0, status: "draft", price: 60 }
  ];

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

        <div className="grid lg:grid-cols-2 gap-6">
          {classes.map((cls, i) => (
            <Card key={cls.id} className="p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden group">
              {cls.status === 'draft' && <div className="absolute top-0 right-0 w-16 h-16 bg-muted -z-10 rounded-bl-full" />}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={cls.status === 'published' ? 'success' : 'secondary'}>
                    {cls.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                  <span className="text-sm font-semibold text-muted-foreground uppercase">{cls.subject}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{cls.title}</h3>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" /> {cls.enrolled} élèves
                  </div>
                  <div className="font-bold text-foreground">
                    {cls.price} TND / mois
                  </div>
                </div>
              </div>
              
              <div className="flex sm:flex-col justify-end gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                <Link href={`/professor/classes/${cls.id}`}>
                  <Button variant="outline" className="w-full justify-start"><Settings className="w-4 h-4 mr-2"/> Gérer</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary"><Edit3 className="w-4 h-4 mr-2"/> Modifier info</Button>
              </div>
            </Card>
          ))}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
