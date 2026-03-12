import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn } from "@/components/ui/Premium";
import { formatTND } from "@/lib/utils";

export function AdminTransactions() {
  const txs = [
    { id: "TX123", amount: 45, fee: 6.75, date: "24 Oct", status: "success" }
  ];
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Transactions" description="Suivi des paiements." />
        <Card className="p-8 text-center text-muted-foreground">
          <p>Total des frais de plateforme collectés: <span className="font-bold text-primary">{formatTND(480)}</span></p>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
