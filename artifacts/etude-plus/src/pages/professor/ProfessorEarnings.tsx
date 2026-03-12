import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Wallet, DollarSign, TrendingUp } from "lucide-react";
import { formatTND } from "@/lib/utils";

export function ProfessorEarnings() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Revenus et Finances"
          description="Suivez vos gains et demandez vos virements."
          action={<Button disabled><Wallet className="w-4 h-4 mr-2" /> Demander un virement</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-foreground text-background">
            <p className="text-background/70 font-medium mb-2">Gains Nets Totals</p>
            <p className="text-4xl font-bold">{formatTND(0)}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-background/50">
              <TrendingUp className="w-4 h-4" /> Aucun revenu pour l'instant
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground font-medium mb-2">Solde disponible</p>
            <p className="text-4xl font-bold text-foreground">{formatTND(0)}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
              Transférer vers banque
            </Button>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <p className="text-orange-800 font-medium mb-2">Frais de plateforme (15%)</p>
            <p className="text-4xl font-bold text-orange-900">{formatTND(0)}</p>
            <p className="text-sm text-orange-700 mt-4 border-t border-orange-200 pt-3">
              Frais déduits automatiquement
            </p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="font-bold text-lg mb-6">Évolution des revenus</h3>
          <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground">
            <DollarSign className="w-14 h-14 mb-3 opacity-20" />
            <p className="font-medium">Aucune donnée disponible</p>
            <p className="text-sm mt-1">
              Le graphique s'affichera après vos premières inscriptions.
            </p>
          </div>
        </Card>

        <h3 className="font-bold text-xl mb-4">Dernières transactions</h3>
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <Wallet className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Aucune transaction pour l'instant</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les paiements de vos élèves apparaîtront ici.
          </p>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
