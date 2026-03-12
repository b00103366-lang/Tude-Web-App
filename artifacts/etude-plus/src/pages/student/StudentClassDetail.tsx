import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { PlayCircle, FileText, FileQuestion, Calendar, Download, Clock, Video, CheckCircle2, BookOpen, Upload, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useGetClass } from "@workspace/api-client-react";

export function StudentClassDetail() {
  const [, params] = useRoute("/student/classes/:id");
  const [activeTab, setActiveTab] = useState("live");
  const classId = params?.id ? parseInt(params.id) : 0;

  const { data: cls, isLoading } = useGetClass(classId, { query: { enabled: !!classId } });

  const tabs = [
    { id: "live", label: "Session Live" },
    { id: "overview", label: "Aperçu" },
    { id: "materials", label: "Supports" },
    { id: "quizzes", label: "Quiz & Tests" },
    { id: "assignments", label: "Devoirs" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!cls) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
          <p className="text-muted-foreground mb-6">Ce cours n'existe pas ou vous n'y avez pas accès.</p>
          <Link href="/student/classes">
            <Button>Retour à mes cours</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/student/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-block transition-colors">
          ← Retour à mes cours
        </Link>

        <PageHeader
          title={cls.title}
          description={`Par ${cls.professor?.fullName ?? "Professeur"} • ${cls.subject} • ${cls.gradeLevel}`}
        />

        <div className="flex border-b border-border mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {/* LIVE SESSION TAB */}
          {activeTab === "live" && (
            <FadeIn>
              {cls.nextSession ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card className="p-8 border-primary/30 shadow-xl shadow-primary/5 relative overflow-hidden bg-gradient-to-br from-card to-secondary/50">
                      <Badge className="bg-red-500/10 text-red-600 border-red-200 mb-6">
                        <Video className="w-3 h-3 mr-1 inline" /> EN DIRECT BIENTÔT
                      </Badge>
                      <h2 className="text-3xl font-serif font-bold mb-4">{cls.nextSession.title}</h2>
                      {cls.nextSession.description && (
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">{cls.nextSession.description}</p>
                      )}
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
                    <Card className="p-6 h-full">
                      <h3 className="font-bold text-lg mb-4">Informations</h3>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Prix: {cls.nextSession.price} TND
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Durée: {cls.nextSession.durationHours}h
                        </li>
                      </ul>
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

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <FadeIn>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">À propos de ce cours</h3>
                    <p className="text-muted-foreground leading-relaxed">{cls.description}</p>
                    <dl className="mt-6 space-y-3 text-sm border-t border-border pt-5">
                      {[
                        ["Matière", cls.subject],
                        ["Niveau", cls.gradeLevel],
                        ["Ville", cls.city],
                        ["Durée", `${cls.durationHours}h par session`],
                        ["Prix", `${cls.price} TND`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                </div>
                <div>
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">Votre Professeur</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
                        {cls.professor?.fullName?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-bold">{cls.professor?.fullName}</p>
                        {cls.professor?.rating && (
                          <p className="text-sm text-muted-foreground">{cls.professor.rating}/5</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">Envoyer un message</Button>
                  </Card>
                </div>
              </div>
            </FadeIn>
          )}

          {/* MATERIALS TAB */}
          {activeTab === "materials" && (
            <FadeIn>
              {(cls as any).materials?.length > 0 ? (
                <Card className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {(cls as any).materials.map((m: any) => (
                      <div key={m.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold">{m.title}</h4>
                            {m.createdAt && (
                              <p className="text-sm text-muted-foreground">
                                Ajouté le {format(new Date(m.createdAt), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-5 h-5 text-primary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucun support disponible</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore ajouté de supports de cours.</p>
                </Card>
              )}
            </FadeIn>
          )}

          {/* QUIZZES TAB */}
          {activeTab === "quizzes" && (
            <FadeIn>
              {(cls as any).quizzes?.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {(cls as any).quizzes.map((q: any) => (
                    <Card key={q.id} className="p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <FileQuestion className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{q.title}</h4>
                      {q.dueDate && (
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Avant le {format(new Date(q.dueDate), "dd/MM")}
                        </p>
                      )}
                      <Button className="w-full">Commencer</Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <FileQuestion className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucun quiz disponible</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore publié de quiz.</p>
                </Card>
              )}
            </FadeIn>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === "assignments" && (
            <FadeIn>
              {(cls as any).assignments?.length > 0 ? (
                <div className="space-y-4">
                  {(cls as any).assignments.map((a: any) => (
                    <Card key={a.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg mb-1">{a.title}</h4>
                            {a.description && (
                              <p className="text-sm text-muted-foreground mb-2">{a.description}</p>
                            )}
                            {a.dueDate && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                À rendre avant le {format(new Date(a.dueDate), "dd MMMM yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" className="shrink-0">
                          <Upload className="w-4 h-4 mr-2" /> Remettre
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucun devoir disponible</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore publié de devoirs.</p>
                </Card>
              )}
            </FadeIn>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
