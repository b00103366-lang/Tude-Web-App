import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { CreditCard, Receipt, ArrowDownToLine, Clock } from "lucide-react";
import { formatTND } from "@/lib/utils";

export function StudentPayments() {
  const transactions = [
    { id: "TRX-8921", class: "Mathématiques 101", amount: 45, date: "2023-10-15", status: "completed" },
    { id: "TRX-7643", class: "Physique: Mécanique", amount: 40, date: "2023-09-28", status: "completed" },
    { id: "TRX-6512", class: "SVT Chapitre 1", amount: 35, date: "2023-09-10", status: "completed" }
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Paiements" 
          description="Historique de vos transactions et factures."
        />

        <div className="mb-8 grid md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 bg-gradient-to-br from-card to-secondary">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Méthode de paiement par défaut</p>
                  <p className="font-bold text-lg">•••• •••• •••• 4242</p>
                </div>
              </div>
              <Badge>Carte Bancaire</Badge>
            </div>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Dépensé (Cette année)</p>
            <p className="text-4xl font-bold text-primary">{formatTND(120)}</p>
          </Card>
        </div>

        <Card className="overflow-hidden border border-border">
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="font-bold text-lg">Historique des transactions</h3>
          </div>
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{tx.class}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{tx.id}</span> • 
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                  <span className="font-bold text-lg">{formatTND(tx.amount)}</span>
                  <Badge variant="success">Payé</Badge>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <ArrowDownToLine className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
