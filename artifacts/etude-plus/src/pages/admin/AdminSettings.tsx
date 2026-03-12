import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn } from "@/components/ui/Premium";

export function AdminSettings() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Paramètres Plateforme" />
        <Card className="p-8">
          Configuration des frais de plateforme, intégrations de paiement, etc.
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
