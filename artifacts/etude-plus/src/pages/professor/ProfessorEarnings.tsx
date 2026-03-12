import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Download, Wallet, ArrowUpRight, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTND } from "@/lib/utils";

export function ProfessorEarnings() {
  const stats = {
    totalEarnings: 3200,
    platformFee: 480,
    netEarnings: 2720,
    pendingPayout: 450
  };

  const chartData = [
    { name: 'Sep', total: 400 },
    { name: 'Oct', total: 600 },
    { name: 'Nov', total: 800 },
    { name: 'Déc', total: 1100 },
    { name: 'Jan', total: 950 },
    { name: 'Fév', total: 1200 },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Revenus et Finances" 
          description="Suivez vos gains et demandez vos virements."
          action={<Button><Wallet className="w-4 h-4 mr-2"/> Demander un virement</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-foreground text-background">
            <p className="text-background/70 font-medium mb-2">Gains Nets Totals</p>
            <p className="text-4xl font-bold">{formatTND(stats.netEarnings)}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" /> +15% ce mois
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground font-medium mb-2">Solde disponible</p>
            <p className="text-4xl font-bold text-foreground">{formatTND(stats.pendingPayout)}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">Transférer vers banque</Button>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <p className="text-orange-800 font-medium mb-2">Frais de plateforme (15%)</p>
            <p className="text-4xl font-bold text-orange-900">{formatTND(stats.platformFee)}</p>
            <p className="text-sm text-orange-700 mt-4 border-t border-orange-200 pt-3">Frais déduits automatiquement</p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="font-bold text-lg mb-6">Évolution des revenus (6 derniers mois)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={(v) => `${v}TND`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [formatTND(value), 'Revenus']}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <h3 className="font-bold text-xl mb-4">Dernières transactions</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Élève</th>
                <th className="px-6 py-4 font-semibold text-right">Montant Brut</th>
                <th className="px-6 py-4 font-semibold text-right">Net (85%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">24 Oct 2023</td>
                  <td className="px-6 py-4 font-medium">Inscription: Mathématiques 101</td>
                  <td className="px-6 py-4">Amira B.</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{formatTND(45)}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{formatTND(38.25)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
