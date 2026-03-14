import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Users, GraduationCap, DollarSign, AlertCircle, Clock, ShieldCheck, BookOpen } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { Link } from "wouter";
import { useGetOverviewStats, useListProfessors } from "@workspace/api-client-react";

export function AdminDashboard() {
  const { data: stats, isLoading } = useGetOverviewStats();
  const { data: professorsData } = useListProfessors() as any;
  const professors = professorsData?.professors ?? [];
  const pendingProfs = professors.filter((p: any) => p.status === "pending");

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
            <p className="text-3xl font-bold">
              {isLoading ? "..." : formatTND(stats?.totalRevenue ?? 0)}
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Élèves inscrits</p>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "..." : stats?.totalStudents ?? 0}
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Professeurs vérifiés</p>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "..." : stats?.totalProfessors ?? 0}
            </p>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-orange-800 font-medium mb-1">En attente de validation</p>
            <p className="text-3xl font-bold text-orange-900">
              {isLoading ? "..." : stats?.pendingProfessors ?? 0}
            </p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Validations KYC en attente</h3>
              <Link href="/admin/professors">
                <Button variant="ghost" size="sm" className="text-primary">Voir tout →</Button>
              </Link>
            </div>
            {pendingProfs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 opacity-20 mx-auto mb-3" />
                <p className="font-medium">Aucune validation en attente</p>
                <p className="text-sm mt-1">Toutes les candidatures ont été traitées.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingProfs.slice(0, 5).map((prof: any) => (
                  <Link href="/admin/professors" key={prof.id}>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700">
                          {(prof.user?.fullName ?? prof.fullName ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{prof.user?.fullName ?? prof.fullName}</p>
                          <p className="text-xs text-muted-foreground">{prof.subjects?.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">
                          <Clock className="w-3 h-3 mr-1" /> En attente
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/professors">
              <Button variant="outline" className="w-full mt-4">Gérer les professeurs & KYC</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-6">Accès rapide</h3>
            <div className="space-y-3">
              {[
                { label: "Gérer les professeurs & KYC", href: "/admin/professors", icon: GraduationCap, desc: `${stats?.pendingProfessors ?? 0} en attente` },
                { label: "Gérer les cours", href: "/admin/classes", icon: BookOpen, desc: `${stats?.totalClasses ?? 0} cours publiés` },
                { label: "Voir les transactions", href: "/admin/transactions", icon: DollarSign, desc: formatTND(stats?.totalRevenue ?? 0) },
                { label: "Tous les utilisateurs", href: "/admin/users", icon: Users, desc: `${(stats?.totalStudents ?? 0) + (stats?.totalProfessors ?? 0)} utilisateurs` },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
