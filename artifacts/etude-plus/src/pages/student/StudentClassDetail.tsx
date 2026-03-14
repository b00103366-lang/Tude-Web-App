import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { PlayCircle, FileText, FileQuestion, Calendar, Download, Clock, Video, CheckCircle2, BookOpen, Upload, AlertCircle, ChevronLeft, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useGetClass, useListClassMaterials, useListClassQuizzes,
  useListClassTests, useListClassAssignments, useListClassSessions,
} from "@workspace/api-client-react";

export function StudentClassDetail() {
  const [, params] = useRoute("/student/classes/:id");
  const [activeTab, setActiveTab] = useState("overview");
  const classId = params?.id ? parseInt(params.id) : 0;

  const { data: cls, isLoading } = useGetClass(classId, { query: { enabled: !!classId } });
  const { data: materials = [] } = useListClassMaterials(classId, { query: { enabled: !!classId } }) as any;
  const { data: quizzes = [] } = useListClassQuizzes(classId, { query: { enabled: !!classId } }) as any;
  const { data: tests = [] } = useListClassTests(classId, { query: { enabled: !!classId } }) as any;
  const { data: assignments = [] } = useListClassAssignments(classId, { query: { enabled: !!classId } }) as any;
  const { data: allSessions = [] } = useListClassSessions(classId, { query: { enabled: !!classId } }) as any;

  const upcomingSessions = allSessions.filter((s: any) => s.status === "scheduled" || s.status === "live")
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const pastSessions = allSessions.filter((s: any) => s.status === "ended")
    .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const publishedQuizzes = quizzes.filter((q: any) => q.isPublished);
  const publishedTests = tests.filter((t: any) => t.isPublished);
  const publishedAssignments = assignments.filter((a: any) => a.isPublished);

  const tabs = [
    { id: "overview", label: "Aperçu" },
    { id: "live", label: "Session Live" },
    { id: "materials", label: `Supports${materials.length > 0 ? ` (${materials.length})` : ""}` },
    { id: "quizzes", label: `Quiz${publishedQuizzes.length > 0 ? ` (${publishedQuizzes.length})` : ""}` },
    { id: "tests", label: `Contrôles${publishedTests.length > 0 ? ` (${publishedTests.length})` : ""}` },
    { id: "assignments", label: `Devoirs${publishedAssignments.length > 0 ? ` (${publishedAssignments.length})` : ""}` },
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
          <Link href="/student/classes"><Button>← Retour à mes cours</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/student/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à mes cours
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
              className={`px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <FadeIn>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
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
                        <div key={k} className="flex justify-between py-1.5 border-b border-border/40 last:border-0">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: "Supports", count: materials.length, icon: FileText, tab: "materials" },
                      { label: "Quiz", count: publishedQuizzes.length, icon: FileQuestion, tab: "quizzes" },
                      { label: "Contrôles", count: publishedTests.length, icon: ClipboardList, tab: "tests" },
                    ].map(item => (
                      <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                        className="p-5 border-2 border-border rounded-2xl hover:border-primary/50 text-left transition-colors">
                        <item.icon className="w-6 h-6 text-primary mb-2" />
                        <p className="text-2xl font-bold">{item.count}</p>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                      </button>
                    ))}
                  </div>
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
                        <p className="text-sm text-muted-foreground">{cls.professor?.city}</p>
                      </div>
                    </div>
                    {cls.nextSession && (
                      <div className="bg-primary/5 rounded-xl p-4 mt-4">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Prochaine session</p>
                        <p className="font-semibold text-sm">{cls.nextSession.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(cls.nextSession.scheduledAt), "EEEE d MMMM à HH:mm", { locale: fr })}
                        </p>
                        <button onClick={() => setActiveTab("live")} className="mt-3 text-xs text-primary font-semibold hover:underline">
                          Voir la session →
                        </button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </FadeIn>
          )}

          {/* LIVE SESSION TAB */}
          {activeTab === "live" && (
            <FadeIn>
              {allSessions.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Aucune session prévue</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore programmé de session live.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {upcomingSessions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4">Sessions à venir</h3>
                      <div className="space-y-4">
                        {upcomingSessions.map((s: any) => (
                          <Card key={s.id} className={`p-6 ${s.status === "live" ? "border-red-300 shadow-lg shadow-red-100" : "border-primary/20"}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {s.status === "live" ? (
                                    <Badge className="bg-red-500/10 text-red-600 border-red-200">
                                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block mr-1" /> EN DIRECT
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Programmée</Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">{s.price} TND</span>
                                </div>
                                <h4 className="text-xl font-bold mb-1">{s.title}</h4>
                                {s.description && <p className="text-muted-foreground text-sm mb-3">{s.description}</p>}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {format(new Date(s.scheduledAt), "EEEE d MMMM", { locale: fr })}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-primary" />
                                    {format(new Date(s.scheduledAt), "HH:mm")}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Video className="w-4 h-4 text-primary" />
                                    {s.durationHours}h
                                  </span>
                                </div>
                              </div>
                              <Link href={`/classroom/${s.id}`}>
                                <Button className={s.status === "live" ? "bg-red-600 hover:bg-red-700 text-white" : ""}>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  {s.status === "live" ? "Rejoindre" : "Accéder"}
                                </Button>
                              </Link>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {pastSessions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 text-muted-foreground">Sessions passées</h3>
                      <div className="space-y-3">
                        {pastSessions.map((s: any) => (
                          <Card key={s.id} className="p-4 flex items-center justify-between opacity-60">
                            <div>
                              <p className="font-semibold">{s.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(s.scheduledAt), "d MMMM yyyy", { locale: fr })} • {s.durationHours}h
                              </p>
                            </div>
                            <Badge variant="secondary">Terminée</Badge>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </FadeIn>
          )}

          {/* MATERIALS TAB */}
          {activeTab === "materials" && (
            <FadeIn>
              {materials.length > 0 ? (
                <Card className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {materials.map((m: any) => (
                      <div key={m.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold">{m.title}</h4>
                            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                            {m.createdAt && (
                              <p className="text-xs text-muted-foreground">Ajouté le {format(new Date(m.createdAt), "dd/MM/yyyy")}</p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm"><Download className="w-5 h-5 text-primary" /></Button>
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
              {publishedQuizzes.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {publishedQuizzes.map((q: any) => (
                    <Card key={q.id} className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <FileQuestion className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{q.title}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{q.questions?.length ?? 0} questions</p>
                      {q.dueDate && (
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Avant le {format(new Date(q.dueDate), "dd/MM/yyyy")}
                        </p>
                      )}
                      <Button className="w-full">Commencer le quiz</Button>
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

          {/* TESTS TAB */}
          {activeTab === "tests" && (
            <FadeIn>
              {publishedTests.length > 0 ? (
                <div className="space-y-4">
                  {publishedTests.map((t: any) => (
                    <Card key={t.id} className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{t.title}</h4>
                            <p className="text-sm text-muted-foreground">{t.questions?.length ?? 0} questions</p>
                            {t.dueDate && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-4 h-4" /> Avant le {format(new Date(t.dueDate), "dd MMMM yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button>Commencer</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucun contrôle disponible</h3>
                  <p className="text-muted-foreground">Le professeur n'a pas encore publié de contrôles.</p>
                </Card>
              )}
            </FadeIn>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === "assignments" && (
            <FadeIn>
              {publishedAssignments.length > 0 ? (
                <div className="space-y-4">
                  {publishedAssignments.map((a: any) => (
                    <Card key={a.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg mb-1">{a.title}</h4>
                            {a.instructions && (
                              <p className="text-sm text-muted-foreground mb-2">{a.instructions}</p>
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
