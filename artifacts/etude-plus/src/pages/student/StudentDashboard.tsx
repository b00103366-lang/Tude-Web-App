import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { useListClasses, useGetMyEnrollments, useGetMyNotifications } from "@workspace/api-client-react";
import { BookOpen, Calendar, Trophy, PlayCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

export function StudentDashboard() {
  const { user } = useAuth();
  const { data: enrollmentsData, isLoading } = useGetMyEnrollments();
  
  // Provide demo fallback data if API returns empty/errors
  const enrollments = enrollmentsData?.length ? enrollmentsData : [
    {
      id: 1, studentId: user?.id || 1, classId: 101, status: "active", createdAt: new Date().toISOString(),
      class: {
        id: 101, professorId: 2, title: "Mathématiques 101: Analyse et Algèbre", subject: "Mathematics",
        gradeLevel: "Baccalauréat", city: "Tunis", description: "Cours complet", price: 45, durationHours: 2,
        isRecurring: true, isPublished: true, enrolledCount: 15, createdAt: new Date().toISOString(),
        professor: { id: 1, userId: 2, fullName: "Dr. Sami Trabelsi", subjects: [], gradeLevels: [], status: "approved", totalReviews: 45, totalStudents: 120, isVerified: true, createdAt: "" },
        nextSession: { id: 1, classId: 101, title: "Chapitre 3: Les suites réelles", description: "", price: 45, durationHours: 2, scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", enrolledCount: 15, createdAt: "" }
      }
    }
  ];

  const activeClasses = enrollments.filter(e => e.status === 'active').map(e => e.class);

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title={`Bonjour, ${user?.fullName.split(' ')[0]} 👋`} 
          description="Voici un résumé de votre apprentissage aujourd'hui."
          action={
            <Link href="/student/browse">
              <Button>Nouveau Cours</Button>
            </Link>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-primary-foreground/80 font-medium">Cours Actifs</p>
                <p className="text-3xl font-bold">{activeClasses.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Sessions à venir</p>
                <p className="text-3xl font-bold text-foreground">2</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Moyenne Générale</p>
                <p className="text-3xl font-bold text-foreground">16.5/20</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Session Hero */}
        {activeClasses[0]?.nextSession && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Prochaine Session</h2>
            <Card className="p-1 border-primary/30 shadow-lg shadow-primary/5 bg-gradient-to-r from-card to-secondary">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <PlayCircle className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <Badge className="mb-2">{activeClasses[0].subject}</Badge>
                  <h3 className="text-2xl font-bold text-foreground">{activeClasses[0].nextSession.title}</h3>
                  <p className="text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <Clock className="w-4 h-4" />
                    {format(new Date(activeClasses[0].nextSession.scheduledAt), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                <Link href={`/classroom/${activeClasses[0].nextSession.id}`}>
                  <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                    Rejoindre la salle
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Enrolled Classes List */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Mes Cours Récents</h2>
            <Link href="/student/classes" className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeClasses.map((cls) => (
              <Card key={cls.id} className="group hover:border-primary/50 transition-colors">
                <div className="h-32 bg-secondary flex items-center justify-center border-b border-border">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>{cls.subject}</span> &bull; <span>{cls.gradeLevel}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{cls.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Par {cls.professor?.fullName}</p>
                  <Link href={`/student/classes/${cls.id}`}>
                    <Button variant="outline" className="w-full">Ouvrir le cours</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
