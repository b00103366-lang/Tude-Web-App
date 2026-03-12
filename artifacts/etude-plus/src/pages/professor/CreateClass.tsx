import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useLocation } from "wouter";

export function CreateClass() {
  const [, setLocation] = useLocation();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/professor/classes");
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/professor/classes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Annuler
        </Link>
        
        <PageHeader 
          title="Créer un nouveau cours" 
          description="Configurez les détails de votre programme."
        />

        <form onSubmit={handleSave} className="max-w-3xl space-y-8">
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Informations Générales</h3>
            <div className="space-y-6">
              <div>
                <Label>Titre du cours</Label>
                <Input placeholder="ex: Physique quantique pour le bac" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label>Matière</Label>
                  <select className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary">
                    <option>Mathématiques</option>
                    <option>Physique</option>
                    <option>Informatique</option>
                  </select>
                </div>
                <div>
                  <Label>Niveau scolaire</Label>
                  <select className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary">
                    <option>Baccalauréat</option>
                    <option>3ème Année</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Description détaillée</Label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
                  placeholder="Décrivez le contenu du cours, les objectifs..."
                  required
                />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Tarification et Format</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label>Prix (TND)</Label>
                <Input type="number" min="0" placeholder="45" required />
                <p className="text-xs text-muted-foreground mt-2">La plateforme retient une commission de 15%.</p>
              </div>
              <div>
                <Label>Type d'abonnement</Label>
                <select className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary">
                  <option value="monthly">Mensuel (Récurrent)</option>
                  <option value="one_time">Paiement Unique</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/professor/classes">
              <Button variant="outline" type="button">Brouillon</Button>
            </Link>
            <Button type="submit" size="lg"><Save className="w-5 h-5 mr-2"/> Publier le cours</Button>
          </div>
        </form>
      </FadeIn>
    </DashboardLayout>
  );
}
