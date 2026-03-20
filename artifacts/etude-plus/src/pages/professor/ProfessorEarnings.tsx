import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Wallet, DollarSign, TrendingUp, CheckCircle, Clock, ArrowUpRight } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useGetProfessorStats } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ProfessorEarnings() {
  const { user } = useAuth();
  const profId = (user as any)?.professorProfile?.id;
  const { data: stats, isLoading } = useGetProfessorStats(profId || 0, {
    query: { enabled: !!profId } as any,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("etude_auth_token");
    if (!token) return;
    fetch("/api/transactions/my-earnings", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setTransactions).catch(() => {});
  }, []);

  const totalEarnings = stats?.totalEarnings ?? 0;
  const platformFees = (stats as any)?.platformFees ?? 0;
  const earningsByMonth: { month: string; amount: number }[] = stats?.earningsByMonth ?? [];

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Payé</Badge>;
    if (status === "pending") return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Revenus et Finances"
          description="Suivez vos gains et demandez vos virements."
          action={
            <Button disabled={totalEarnings === 0}>
              <Wallet className="w-4 h-4 mr-2" /> Demander un virement
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-foreground text-background">
            <p className="text-background/70 font-medium mb-2">Gains Nets Totals</p>
            <p className="text-4xl font-bold">
              {isLoading ? "..." : formatTND(totalEarnings)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-background/50">
              <TrendingUp className="w-4 h-4" />
              {totalEarnings > 0 ? `${transactions.filter(t => t.status === "completed").length} paiements reçus` : "Aucun revenu pour l'instant"}
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground font-medium mb-2">Solde disponible</p>
            <p className="text-4xl font-bold text-foreground">
              {isLoading ? "..." : formatTND(totalEarnings)}
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" disabled={totalEarnings === 0}>
              <ArrowUpRight className="w-4 h-4 mr-2" />Transférer vers banque
            </Button>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <p className="text-orange-800 font-medium mb-2">Frais de plateforme (15%)</p>
            <p className="text-4xl font-bold text-orange-900">
              {isLoading ? "..." : formatTND(platformFees)}
            </p>
            <p className="text-sm text-orange-700 mt-4 border-t border-orange-200 pt-3">
              Frais déduits automatiquement
            </p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="font-bold text-lg mb-6">Évolution des revenus (6 derniers mois)</h3>
          {earningsByMonth.some(m => m.amount > 0) ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}TND`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number) => [formatTND(v), "Revenus"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#earningGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
              <DollarSign className="w-14 h-14 mb-3 opacity-20" />
              <p className="font-medium">Aucune donnée disponible</p>
              <p className="text-sm mt-1">Le graphique s'affichera après vos premières inscriptions.</p>
            </div>
          )}
        </Card>

        <h3 className="font-bold text-xl mb-4">Dernières transactions</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
            <Wallet className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">Aucune transaction pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-1">Les paiements de vos élèves apparaîtront ici.</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Cours</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Étudiant</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Montant</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Vos gains</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{t.class?.title ?? `Cours #${t.classId}`}</td>
                      <td className="p-4 text-muted-foreground">{t.student?.fullName ?? `Étudiant #${t.studentId}`}</td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(t.createdAt), "d MMM yyyy", { locale: fr })}
                      </td>
                      <td className="p-4 text-right font-medium">{formatTND(t.amount)}</td>
                      <td className="p-4 text-right font-bold text-green-600">{formatTND(t.professorAmount)}</td>
                      <td className="p-4 text-right">{statusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
