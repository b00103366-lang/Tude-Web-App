import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { useGetProfessorStats } from "@workspace/api-client-react";
import { Users, BookOpen, DollarSign, Star, ArrowUpRight, Video } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatTND } from "@/lib/utils";

export function ProfessorDashboard() {
  const { user } = useAuth();
  
  // Use hook but provide robust mock data for the visual
  const { data: statsData } = useGetProfessorStats(user?.id || 0, { query: { enabled: !!user?.id } });
  
  const stats = statsData || {
    totalEarnings: 2450.50,
    totalStudents: 124,
    totalClasses: 4,
    averageRating: 4.8,
    earningsByMonth: [
      { month: 'Jan', amount: 400 },
      { month: 'Fév', amount: 300 },
      { month: 'Mar', amount: 550 },
      { month: 'Avr', amount: 450 },
      { month: 'Mai', amount: 600 },
      { month: 'Juin', amount: 800 },
    ]
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Tableau de Bord Professeur" 
          description="Gérez vos cours et suivez vos revenus."
          action={<Button>Créer un cours</Button>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Revenus Totals", value: formatTND(stats.totalEarnings), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
            { label: "Étudiants Actifs", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Cours Publiés", value: stats.totalClasses, icon: BookOpen, color: "text-primary", bg: "bg-primary/20" },
            { label: "Note Moyenne", value: `${stats.averageRating}/5`, icon: Star, color: "text-orange-500", bg: "bg-orange-100" }
          ].map((s, i) => (
            <Card key={i} className="p-6 border-none shadow-md shadow-black/5">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("w-6 h-6", s.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Évolution des revenus</h3>
              <Button variant="ghost" size="sm" className="text-primary">Rapport complet <ArrowUpRight className="w-4 h-4 ml-1"/></Button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.earningsByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(v) => `${v}TND`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatTND(value), 'Revenus']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-4">Actions Rapides</h3>
            <div className="space-y-3 flex-1">
              <Button variant="outline" className="w-full justify-start h-14 text-left">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mr-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                Ajouter un support de cours
              </Button>
              <Button variant="outline" className="w-full justify-start h-14 text-left">
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center mr-3">
                  <Video className="w-4 h-4 text-accent" />
                </div>
                Programmer une session live
              </Button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Statut du compte</h4>
              <div className="flex items-center gap-3 bg-green-50 text-green-700 p-3 rounded-xl border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-sm">Professeur Vérifié</span>
              </div>
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
