import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Users, GraduationCap, DollarSign, AlertCircle } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { Link } from "wouter";

export function AdminDashboard() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Administration"
          description="Vue globale de la plateforme Étude+"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="p-6 bg-foreground text-background">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-background/70 font-medium mb-1">Volume des transactions</p>
            <p className="text-3xl font-bold">{formatTND(0)}</p>
          </Card>
          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Élèves inscrits</p>
            <p className="text-3xl font-bold text-foreground">0</p>
          </Card>
          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Professeurs vérifiés</p>
            <p className="text-3xl font-bold text-foreground">0</p>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-orange-800 font-medium mb-1">En attente de validation</p>
            <p className="text-3xl font-bold text-orange-900">0</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Validations KYC en attente</h3>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 opacity-20 mx-auto mb-3" />
              <p className="font-medium">Aucune validation en attente</p>
              <p className="text-sm mt-1">Les nouvelles candidatures apparaîtront ici.</p>
            </div>
            <Link href="/admin/professors">
              <Button variant="outline" className="w-full mt-2">Voir tous les professeurs</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-6">Accès rapide</h3>
            <div className="space-y-3">
              {[
                { label: "Gérer les professeurs & KYC", href: "/admin/professors" },
                { label: "Gérer les cours", href: "/admin/classes" },
                { label: "Voir les transactions", href: "/admin/transactions" },
                { label: "Paramètres de la plateforme", href: "/admin/settings" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <Button variant="outline" className="w-full justify-start">
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
