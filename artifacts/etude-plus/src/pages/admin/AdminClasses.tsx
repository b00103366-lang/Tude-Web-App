import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn } from "@/components/ui/Premium";

export function AdminClasses() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Catalogue des cours" description="Vision globale des cours publiés." />
        <Card className="p-8 text-center text-muted-foreground">
          Tableau des cours à venir...
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
