import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function StudentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Succès", description: "Profil mis à jour avec succès." });
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Paramètres du compte" 
          description="Gérez vos informations personnelles."
        />

        <div className="max-w-3xl">
          <Card className="p-8 mb-8">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background shadow-lg">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{user?.fullName}</h3>
                <p className="text-muted-foreground">Élève • {user?.email}</p>
                <Button variant="outline" size="sm" className="mt-3">Changer la photo</Button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Nom complet</Label>
                  <Input defaultValue={user?.fullName} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input defaultValue="Tunis" />
                </div>
                <div>
                  <Label>Niveau scolaire</Label>
                  <select className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary">
                    <option>Baccalauréat</option>
                    <option>3ème Année Secondaire</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label>Lycée / Établissement</Label>
                  <Input defaultValue="Lycée Pilote de Tunis" />
                </div>
              </div>
              
              <div className="pt-6">
                <Button type="submit">Enregistrer les modifications</Button>
              </div>
            </form>
          </Card>

          <Card className="p-8 border-destructive/20 bg-destructive/5">
            <h3 className="font-bold text-lg text-destructive mb-2">Zone de danger</h3>
            <p className="text-muted-foreground text-sm mb-6">La suppression de votre compte effacera toutes vos données et votre historique de cours de manière permanente.</p>
            <Button variant="destructive">Supprimer mon compte</Button>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
