import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { PlayCircle, FileText, FileQuestion, Calendar, Download, Clock, Video, CheckCircle2, BookOpen, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function StudentClassDetail() {
  const [, params] = useRoute("/student/classes/:id");
  const [activeTab, setActiveTab] = useState("live");

  // Mock data for demo
  const cls = {
    id: 101, title: "Mathématiques 101: Analyse et Algèbre", subject: "Mathématiques",
    gradeLevel: "Baccalauréat", description: "Cours complet couvrant l'analyse, l'algèbre et la géométrie. Préparation intensive pour l'examen national.", 
    professor: { fullName: "Dr. Sami Trabelsi", rating: 4.8, totalStudents: 120 },
    nextSession: { 
      id: 1, title: "Chapitre 3: Les suites réelles", description: "Révision des théorèmes fondamentaux et exercices d'application type bac.", 
      durationHours: 2, scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled" 
    },
    materials: [
      { id: 1, title: "Support de cours: Suites réelles", type: "pdf", url: "#", createdAt: new Date().toISOString() },
      { id: 2, title: "Série d'exercices n°4", type: "document", url: "#", createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    quizzes: [
      { id: 1, title: "Quiz Rapide: Nombres complexes", durationMinutes: 15, dueDate: new Date(Date.now() + 172800000).toISOString(), isCompleted: false },
      { id: 2, title: "Test des prérequis", durationMinutes: 30, dueDate: new Date(Date.now() - 172800000).toISOString(), isCompleted: true, score: 18 }
    ]
  };

  const assignments = [
    { id: 1, title: "Devoir 1: Problèmes de suites", instructions: "Résoudre les 5 problèmes du polycopié. Présentation soignée obligatoire.", dueDate: new Date(Date.now() + 4 * 86400000).toISOString(), submitted: false },
    { id: 2, title: "Devoir 2: Intégrales définies", instructions: "Calculer les intégrales des exercices 12 à 18 du manuel.", dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), submitted: true },
  ];

  const tabs = [
    { id: "live", label: "Session Live" },
    { id: "overview", label: "Aperçu" },
    { id: "materials", label: "Supports" },
    { id: "quizzes", label: "Quiz & Tests" },
    { id: "assignments", label: "Devoirs" },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/student/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-block transition-colors">
          &larr; Retour à mes cours
        </Link>
        
        <PageHeader 
          title={cls.title} 
          description={`Par ${cls.professor.fullName} • ${cls.subject} • ${cls.gradeLevel}`}
        />

        {/* Custom Tabs */}
        <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "live" && (
            <FadeIn>
              {cls.nextSession ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card className="p-8 border-primary/30 shadow-xl shadow-primary/5 relative overflow-hidden bg-gradient-to-br from-card to-secondary/50">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                      
                      <Badge className="bg-red-500/10 text-red-600 border-red-200 mb-6">
                        <Video className="w-3 h-3 mr-1 inline" /> EN DIRECT BIENTÔT
                      </Badge>
                      
                      <h2 className="text-3xl font-serif font-bold mb-4">{cls.nextSession.title}</h2>
                      <p className="text-lg text-muted-foreground mb-8 max-w-2xl">{cls.nextSession.description}</p>
                      
                      <div className="flex flex-wrap gap-6 mb-8 text-sm font-medium">
                        <div className="flex items-center gap-2 bg-background py-2 px-4 rounded-xl border border-border">
                          <Calendar className="w-5 h-5 text-primary" />
                          {format(new Date(cls.nextSession.scheduledAt), "EEEE d MMMM", { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 bg-background py-2 px-4 rounded-xl border border-border">
                          <Clock className="w-5 h-5 text-primary" />
                          {format(new Date(cls.nextSession.scheduledAt), "HH:mm")} ({cls.nextSession.durationHours}h)
                        </div>
                      </div>
                      
                      <Link href={`/classroom/${cls.nextSession.id}`}>
                        <Button size="lg" className="w-full sm:w-auto text-lg px-12 shadow-lg shadow-primary/20">
                          Rejoindre la salle virtuelle
                        </Button>
                      </Link>
                    </Card>
                  </div>
                  
                  <div>
                    <Card className="p-6 h-full flex flex-col">
                      <h3 className="font-bold text-lg mb-6">Prérequis</h3>
                      <ul className="space-y-4 flex-1">
                        <li className="flex gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-muted-foreground">Avoir lu le chapitre 2</span>
                        </li>
                        <li className="flex gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-muted-foreground">Préparer une calculatrice scientifique</span>
                        </li>
                      </ul>
                      <div className="mt-6 pt-6 border-t border-border">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" /> Support de cours
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Aucune session prévue</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore programmé la prochaine session live.</p>
                </Card>
              )}
            </FadeIn>
          )}

          {activeTab === "overview" && (
            <FadeIn>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">À propos de ce cours</h3>
                    <p className="text-muted-foreground leading-relaxed">{cls.description}</p>
                  </Card>
                </div>
                <div>
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">Votre Professeur</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
                        {cls.professor.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{cls.professor.fullName}</p>
                        <p className="text-sm text-muted-foreground">{cls.professor.rating}/5 • {cls.professor.totalStudents} élèves</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">Envoyer un message</Button>
                  </Card>
                </div>
              </div>
            </FadeIn>
          )}

          {activeTab === "materials" && (
            <FadeIn>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {cls.materials.map(m => (
                    <div key={m.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold">{m.title}</h4>
                          <p className="text-sm text-muted-foreground">Ajouté le {format(new Date(m.createdAt), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Download className="w-5 h-5 text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}

          {activeTab === "quizzes" && (
            <FadeIn>
              <div className="grid sm:grid-cols-2 gap-6">
                {cls.quizzes.map(q => (
                  <Card key={q.id} className="p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-primary" />
                      </div>
                      {q.isCompleted ? (
                        <Badge variant="success">Terminé : {q.score}/20</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">À faire</Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-lg mb-2">{q.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {q.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Avant le {format(new Date(q.dueDate), "dd/MM")}</span>
                    </div>
                    <Button variant={q.isCompleted ? "outline" : "default"} className="w-full">
                      {q.isCompleted ? "Voir la correction" : "Commencer le quiz"}
                    </Button>
                  </Card>
                ))}
              </div>
            </FadeIn>
          )}
          {activeTab === "assignments" && (
            <FadeIn>
              <div className="space-y-4">
                {assignments.map(a => (
                  <Card key={a.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h4 className="font-bold text-lg">{a.title}</h4>
                            {a.submitted ? (
                              <Badge variant="success">Rendu</Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">À rendre</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{a.instructions}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            À rendre avant le {format(new Date(a.dueDate), "dd MMMM yyyy", { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {a.submitted ? (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" /> Mon rendu
                          </Button>
                        ) : (
                          <Button size="sm">
                            <Upload className="w-4 h-4 mr-2" /> Remettre
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
