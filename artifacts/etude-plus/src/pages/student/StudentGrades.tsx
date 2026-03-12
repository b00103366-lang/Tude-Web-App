import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { Trophy, ArrowUpRight, ArrowDownRight, Award, LineChart } from "lucide-react";

export function StudentGrades() {
  const grades = [
    { id: 1, subject: "Mathématiques", class: "Mathématiques 101", title: "Test des prérequis", type: "Test", score: 18, total: 20, average: 14, date: "12 Oct 2023", comment: "Excellent travail, continuez ainsi !" },
    { id: 2, subject: "Physique", class: "Mécanique Quantique", title: "Devoir n°1", type: "Devoir", score: 15.5, total: 20, average: 12.5, date: "05 Oct 2023", comment: "Bonne compréhension globale." },
    { id: 3, subject: "Mathématiques", class: "Mathématiques 101", title: "Quiz Nombres Complexes", type: "Quiz", score: 12, total: 20, average: 13, date: "28 Sep 2023", comment: "Attention aux erreurs de calcul." },
  ];

  const averages = [
    { subject: "Mathématiques", avg: 15, trend: "up" },
    { subject: "Physique", avg: 15.5, trend: "up" }
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Mes Notes" 
          description="Suivez votre progression et vos résultats d'évaluation."
        />

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl shadow-primary/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-primary-foreground/80 font-medium">Moyenne Générale</p>
                <p className="text-3xl font-bold">15.25 <span className="text-lg font-normal opacity-70">/20</span></p>
              </div>
            </div>
            <div className="bg-black/10 rounded-lg p-3 text-sm flex items-center justify-between">
              <span>+1.5 pts par rapport au mois dernier</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Card>
          
          {averages.map((avg, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <LineChart className="w-5 h-5 text-muted-foreground" />
                </div>
                <Badge variant={avg.trend === 'up' ? 'success' : 'secondary'} className="rounded-md">
                  {avg.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {avg.subject}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Moyenne {avg.subject}</p>
              <p className="text-2xl font-bold text-foreground">{avg.avg}/20</p>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-6">Historique des évaluations</h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {grades.map((g, i) => (
            <FadeIn key={g.id} delay={i * 0.1}>
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                  <div>
                    <Badge variant="outline" className="mb-2">{g.type}</Badge>
                    <h3 className="font-bold text-lg">{g.title}</h3>
                    <p className="text-sm text-muted-foreground">{g.class}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{g.score}<span className="text-sm text-muted-foreground">/{g.total}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Moy. classe: {g.average}</p>
                  </div>
                </div>
                
                <div className="bg-secondary/50 rounded-xl p-4 flex gap-3">
                  <Award className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Commentaire du professeur</p>
                    <p className="text-sm font-medium italic">"{g.comment}"</p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
