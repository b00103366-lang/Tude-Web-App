import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { Users, GraduationCap, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { formatTND } from "@/lib/utils";

export function AdminDashboard() {
  // Mock data for admin
  const stats = {
    totalRevenue: 125000,
    totalStudents: 3450,
    totalProfessors: 120,
    pendingApprovals: 5
  };

  const pendingProfs = [
    { id: 1, name: "Ahmed Ben Salem", subject: "Physique", date: "Il y a 2h" },
    { id: 2, name: "Sonia Khemiri", subject: "Mathématiques", date: "Il y a 5h" },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Administration" 
          description="Vue globale de la plateforme Étude+"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="p-6 bg-foreground text-background">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-background/70 font-medium mb-1">Volume des transactions</p>
            <p className="text-3xl font-bold">{formatTND(stats.totalRevenue)}</p>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Élèves inscrits</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalStudents}</p>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Professeurs vérifiés</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalProfessors}</p>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-orange-800 font-medium mb-1">En attente de validation</p>
            <p className="text-3xl font-bold text-orange-900">{stats.pendingApprovals}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Validations KYC Professeurs</h3>
              <Badge variant="outline">Action Requise</Badge>
            </div>
            <div className="space-y-4">
              {pendingProfs.map(prof => (
                <div key={prof.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{prof.name}</p>
                      <p className="text-xs text-muted-foreground">{prof.subject} &bull; {prof.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white border-destructive/20">Refuser</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Valider</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
