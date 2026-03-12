import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function ProfessorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Succès", description: "Profil professeur mis à jour." });
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Paramètres Professeur" description="Modifiez votre profil public." />
        <Card className="p-8 max-w-3xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>Nom d'affichage</Label><Input defaultValue={user?.fullName} /></div>
              <div><Label>Email pro</Label><Input defaultValue={user?.email} disabled className="bg-muted"/></div>
            </div>
            <div>
              <Label>Biographie publique</Label>
              <textarea 
                className="flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
                defaultValue="Professeur agrégé avec plus de 10 ans d'expérience..."
              />
            </div>
            <Button type="submit">Enregistrer</Button>
          </form>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
