import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input, Label } from "@/components/ui/Premium";
import {
  Video, FileText, Plus, Users, Settings, Clock, Calendar,
  FileQuestion, ClipboardList, BookOpen, LayoutDashboard,
  Trash2, PlayCircle, Download, Eye, X, Check, Save, AlertCircle
} from "lucide-react";
import {
  useGetClass,
  useListClassSessions,
  useListClassMaterials,
  useListClassQuizzes,
  useListClassTests,
  useListClassAssignments,
  useListClassEnrollments,
  useCreateClassSession,
  useCreateMaterial,
  useCreateQuiz,
  useCreateTest,
  useCreateAssignment,
} from "@workspace/api-client-react";
import { formatTND } from "@/lib/utils";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="p-12 text-center">
      <Icon className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {action}
    </Card>
  );
}

export function ProfessorClassManagement() {
  const [, params] = useRoute("/professor/classes/:id");
  const classId = params?.id ? parseInt(params.id) : 0;
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  const { data: cls, isLoading: loadingClass } = useGetClass(classId, { query: { enabled: !!classId } });
  const { data: sessions = [], isLoading: loadingSessions } = useListClassSessions(classId, { query: { enabled: !!classId } }) as any;
  const { data: materials = [], isLoading: loadingMaterials } = useListClassMaterials(classId, { query: { enabled: !!classId } }) as any;
  const { data: quizzes = [], isLoading: loadingQuizzes } = useListClassQuizzes(classId, { query: { enabled: !!classId } }) as any;
  const { data: tests = [], isLoading: loadingTests } = useListClassTests(classId, { query: { enabled: !!classId } }) as any;
  const { data: assignments = [], isLoading: loadingAssignments } = useListClassAssignments(classId, { query: { enabled: !!classId } }) as any;
  const { data: enrollments = [], isLoading: loadingEnrollments } = useListClassEnrollments(classId, { query: { enabled: !!classId } }) as any;

  const createSession = useCreateClassSession();
  const createMaterial = useCreateMaterial();
  const createQuiz = useCreateQuiz();
  const createTest = useCreateTest();
  const createAssignment = useCreateAssignment();

  const [sessionForm, setSessionForm] = useState({ title: "", description: "", price: "", durationHours: "2", scheduledAt: "" });
  const [matForm, setMatForm] = useState({ title: "", description: "", type: "pdf" });
  const [quizForm, setQuizForm] = useState({ title: "", dueDate: "" });
  const [testForm, setTestForm] = useState({ title: "", dueDate: "" });
  const [assignForm, setAssignForm] = useState({ title: "", instructions: "", dueDate: "" });

  const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key] });

  const tabs = [
    { id: "overview", label: "Aperçu", icon: LayoutDashboard },
    { id: "live", label: "Sessions Live", icon: Video },
    { id: "materials", label: "Supports", icon: FileText },
    { id: "quizzes", label: "Quiz", icon: FileQuestion },
    { id: "tests", label: "Contrôles", icon: ClipboardList },
    { id: "assignments", label: "Devoirs", icon: BookOpen },
    { id: "students", label: `Élèves (${enrollments.length})`, icon: Users },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  if (!classId || loadingClass) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="h-10 bg-muted rounded-xl" />
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
          <Link href="/professor/classes"><Button className="mt-2">Retour aux cours</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/professor/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 transition-colors">
          ← Retour aux cours
        </Link>

        <PageHeader
          title={cls.title}
          description={`${cls.subject} • ${cls.gradeLevel} • ${cls.city}`}
          action={<Badge variant={cls.isPublished ? "success" : "secondary"} className="text-sm px-4 py-1">{cls.isPublished ? "Publié" : "Brouillon"}</Badge>}
        />

        <div className="flex border-b border-border mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Élèves inscrits", value: enrollments.length, icon: Users, color: "bg-blue-100 text-blue-600" },
                { label: "Sessions réalisées", value: sessions.filter((s: any) => s.status === "ended").length, icon: Video, color: "bg-green-100 text-green-600" },
                { label: "Supports de cours", value: materials.length, icon: FileText, color: "bg-orange-100 text-orange-600" },
                { label: "Prix par session", value: `${cls.price} TND`, icon: Clock, color: "bg-purple-100 text-purple-600" },
              ].map(s => (
                <Card key={s.label} className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Détails du cours</h3>
                <dl className="space-y-3 text-sm">
                  {[
                    ["Matière", cls.subject],
                    ["Niveau", cls.gradeLevel],
                    ["Ville", cls.city],
                    ["Prix", `${cls.price} TND / session`],
                    ["Durée", `${cls.durationHours}h par session`],
                    ["Type", cls.isRecurring ? "Récurrent" : "Paiement unique"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("settings")}>
                  Modifier les infos
                </Button>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cls.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setActiveTab("live")}>
                    <Video className="w-4 h-4 mr-2" /> Sessions
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("students")}>
                    <Users className="w-4 h-4 mr-2" /> Élèves
                  </Button>
                </div>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* ─── LIVE SESSIONS ─── */}
        {activeTab === "live" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Sessions Live</h3>
              <Button onClick={() => setShowCreateSession(true)}>
                <Plus className="w-4 h-4 mr-2" /> Programmer une session
              </Button>
            </div>
            {loadingSessions ? (
              <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : sessions.length === 0 ? (
              <EmptyState icon={Video} title="Aucune session programmée" description="Créez votre première session live pour commencer à enseigner."
                action={<Button onClick={() => setShowCreateSession(true)}><Plus className="w-4 h-4 mr-2" />Créer une session</Button>} />
            ) : (
              <div className="space-y-4">
                {sessions.map((s: any) => (
                  <Card key={s.id} className={`p-6 ${s.status === "ended" ? "opacity-60" : "border-primary/20"}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={s.status === "live" ? "bg-red-100 text-red-700" : s.status === "scheduled" ? "bg-blue-100 text-blue-700" : ""} variant={s.status === "ended" ? "secondary" : undefined}>
                            {s.status === "live" ? "En direct" : s.status === "scheduled" ? "Programmée" : "Terminée"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{s.price} TND</span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                        {s.description && <p className="text-sm text-muted-foreground mb-2">{s.description}</p>}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{fmtDT(s.scheduledAt)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.durationHours}h</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {(s.status === "scheduled" || s.status === "live") && (
                          <Link href={`/classroom/${s.id}`}>
                            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                              <PlayCircle className="w-4 h-4 mr-2" /> Lancer
                            </Button>
                          </Link>
                        )}
                        {s.status === "ended" && (
                          <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" />Résumé</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* ─── MATERIALS ─── */}
        {activeTab === "materials" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Supports de cours</h3>
              <Button onClick={() => setShowAddMaterial(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
            </div>
            {loadingMaterials ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : materials.length === 0 ? (
              <EmptyState icon={FileText} title="Aucun support" description="Ajoutez vos premiers documents de cours."
                action={<Button onClick={() => setShowAddMaterial(true)}><Plus className="w-4 h-4 mr-2" />Ajouter un support</Button>} />
            ) : (
              <Card className="divide-y divide-border overflow-hidden">
                {materials.map((m: any) => (
                  <div key={m.id} className="p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{m.title}</h4>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                        {m.createdAt && <p className="text-xs text-muted-foreground">Ajouté le {fmt(m.createdAt)}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                  </div>
                ))}
              </Card>
            )}
          </FadeIn>
        )}

        {/* ─── QUIZZES ─── */}
        {activeTab === "quizzes" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Quiz</h3>
              <Button onClick={() => setShowCreateQuiz(true)}><Plus className="w-4 h-4 mr-2" />Créer un quiz</Button>
            </div>
            {loadingQuizzes ? (
              <div className="space-y-3">{[1].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : quizzes.length === 0 ? (
              <EmptyState icon={FileQuestion} title="Aucun quiz" description="Créez des quiz pour évaluer vos élèves."
                action={<Button onClick={() => setShowCreateQuiz(true)}><Plus className="w-4 h-4 mr-2" />Créer un quiz</Button>} />
            ) : (
              <div className="space-y-4">
                {quizzes.map((q: any) => (
                  <Card key={q.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileQuestion className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{q.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {q.questions?.length ?? 0} questions{q.dueDate ? ` • Avant le ${fmt(q.dueDate)}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={q.isPublished ? "success" : "secondary"}>{q.isPublished ? "Publié" : "Brouillon"}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* ─── TESTS ─── */}
        {activeTab === "tests" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Contrôles</h3>
              <Button onClick={() => setShowCreateTest(true)}><Plus className="w-4 h-4 mr-2" />Créer un contrôle</Button>
            </div>
            {loadingTests ? (
              <div className="space-y-3">{[1].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : tests.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Aucun contrôle" description="Créez des contrôles pour évaluer vos élèves."
                action={<Button onClick={() => setShowCreateTest(true)}><Plus className="w-4 h-4 mr-2" />Créer un contrôle</Button>} />
            ) : (
              <div className="space-y-4">
                {tests.map((t: any) => (
                  <Card key={t.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{t.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {t.questions?.length ?? 0} questions{t.dueDate ? ` • Avant le ${fmt(t.dueDate)}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={t.isPublished ? "success" : "secondary"}>{t.isPublished ? "Publié" : "Brouillon"}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* ─── ASSIGNMENTS ─── */}
        {activeTab === "assignments" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Devoirs</h3>
              <Button onClick={() => setShowCreateAssignment(true)}><Plus className="w-4 h-4 mr-2" />Créer un devoir</Button>
            </div>
            {loadingAssignments ? (
              <div className="space-y-3">{[1].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : assignments.length === 0 ? (
              <EmptyState icon={BookOpen} title="Aucun devoir" description="Créez des devoirs à remettre pour vos élèves."
                action={<Button onClick={() => setShowCreateAssignment(true)}><Plus className="w-4 h-4 mr-2" />Créer un devoir</Button>} />
            ) : (
              <div className="space-y-4">
                {assignments.map((a: any) => (
                  <Card key={a.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{a.title}</h4>
                        {a.instructions && <p className="text-xs text-muted-foreground line-clamp-1">{a.instructions}</p>}
                        {a.dueDate && <p className="text-xs text-muted-foreground">Avant le {fmt(a.dueDate)}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* ─── STUDENTS ─── */}
        {activeTab === "students" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Élèves inscrits</h3>
              <Badge variant="secondary" className="text-base px-4 py-1">{enrollments.length} élève{enrollments.length !== 1 ? "s" : ""}</Badge>
            </div>
            {loadingEnrollments ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : enrollments.length === 0 ? (
              <EmptyState icon={Users} title="Aucun élève inscrit" description="Les élèves qui s'inscrivent à ce cours apparaîtront ici." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Élève</th>
                      <th className="px-6 py-4 font-semibold hidden md:table-cell">Date d'inscription</th>
                      <th className="px-6 py-4 font-semibold text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map((e: any) => (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                              {e.student?.fullName?.charAt(0) ?? "?"}
                            </div>
                            <p className="font-semibold">{e.student?.fullName ?? `Élève #${e.studentId}`}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{e.createdAt ? fmt(e.createdAt) : "—"}</td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant={e.status === "active" ? "success" : "secondary"}>{e.status === "active" ? "Actif" : e.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </FadeIn>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === "settings" && (
          <FadeIn>
            <div className="max-w-2xl space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-5 border-b border-border pb-3">Informations du cours</h3>
                <div className="space-y-4">
                  <div><Label>Titre du cours</Label><Input defaultValue={cls.title} /></div>
                  <div><Label>Description</Label>
                    <textarea className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" defaultValue={cls.description} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Prix (TND)</Label><Input type="number" defaultValue={cls.price} /></div>
                    <div><Label>Durée (heures)</Label><Input type="number" defaultValue={cls.durationHours} /></div>
                  </div>
                </div>
              </Card>
              <div className="flex justify-end">
                <Button size="lg"><Save className="w-5 h-5 mr-2" />Sauvegarder</Button>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ─── MODALS ─── */}

        <Modal open={showCreateSession} onClose={() => setShowCreateSession(false)} title="Programmer une session live">
          <div className="space-y-4">
            <div><Label>Titre de la session</Label><Input placeholder="ex: Chapitre 4 – Intégrales" value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label>
              <textarea className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" placeholder="Ce que couvre cette session..." value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Prix (TND)</Label><Input type="number" placeholder={String(cls.price)} value={sessionForm.price} onChange={e => setSessionForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Durée (heures)</Label><Input type="number" placeholder="2" value={sessionForm.durationHours} onChange={e => setSessionForm(f => ({ ...f, durationHours: e.target.value }))} /></div>
            </div>
            <div><Label>Date et heure</Label><Input type="datetime-local" value={sessionForm.scheduledAt} onChange={e => setSessionForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateSession(false)}>Annuler</Button>
              <Button className="flex-1" disabled={createSession.isPending}
                onClick={() => {
                  if (!sessionForm.title || !sessionForm.scheduledAt) return;
                  createSession.mutate({
                    id: classId,
                    data: {
                      title: sessionForm.title,
                      description: sessionForm.description,
                      price: parseFloat(sessionForm.price) || cls.price,
                      durationHours: parseFloat(sessionForm.durationHours) || 2,
                      scheduledAt: new Date(sessionForm.scheduledAt).toISOString(),
                    }
                  }, {
                    onSuccess: () => {
                      invalidate(`/api/classes/${classId}/sessions`);
                      setShowCreateSession(false);
                      setSessionForm({ title: "", description: "", price: "", durationHours: "2", scheduledAt: "" });
                    }
                  });
                }}>
                {createSession.isPending ? "..." : "Programmer"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={showAddMaterial} onClose={() => setShowAddMaterial(false)} title="Ajouter un support de cours">
          <div className="space-y-4">
            <div><Label>Titre</Label><Input placeholder="ex: Support PDF – Chapitre 4" value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description (optionnel)</Label><Input placeholder="Brève description..." value={matForm.description} onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Glissez votre fichier ici ou</p>
              <Button variant="outline" size="sm">Choisir un fichier</Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMaterial(false)}>Annuler</Button>
              <Button className="flex-1" disabled={createMaterial.isPending}
                onClick={() => {
                  if (!matForm.title) return;
                  createMaterial.mutate({
                    id: classId,
                    data: { title: matForm.title, description: matForm.description || null }
                  }, {
                    onSuccess: () => {
                      invalidate(`/api/classes/${classId}/materials`);
                      setShowAddMaterial(false);
                      setMatForm({ title: "", description: "", type: "pdf" });
                    }
                  });
                }}>
                {createMaterial.isPending ? "..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={showCreateQuiz} onClose={() => setShowCreateQuiz(false)} title="Créer un quiz">
          <div className="space-y-4">
            <div><Label>Titre du quiz</Label><Input placeholder="ex: Quiz – Dérivées" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Date limite (optionnel)</Label><Input type="date" value={quizForm.dueDate} onChange={e => setQuizForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">Les questions peuvent être ajoutées après la création.</div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateQuiz(false)}>Annuler</Button>
              <Button className="flex-1" disabled={createQuiz.isPending}
                onClick={() => {
                  if (!quizForm.title) return;
                  createQuiz.mutate({
                    id: classId,
                    data: { title: quizForm.title, dueDate: quizForm.dueDate || null, questions: [] }
                  }, {
                    onSuccess: () => {
                      invalidate(`/api/classes/${classId}/quizzes`);
                      setShowCreateQuiz(false);
                      setQuizForm({ title: "", dueDate: "" });
                    }
                  });
                }}>
                {createQuiz.isPending ? "..." : "Créer"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={showCreateTest} onClose={() => setShowCreateTest(false)} title="Créer un contrôle">
          <div className="space-y-4">
            <div><Label>Titre du contrôle</Label><Input placeholder="ex: Contrôle – Algèbre" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Date limite (optionnel)</Label><Input type="date" value={testForm.dueDate} onChange={e => setTestForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateTest(false)}>Annuler</Button>
              <Button className="flex-1" disabled={createTest.isPending}
                onClick={() => {
                  if (!testForm.title) return;
                  createTest.mutate({
                    id: classId,
                    data: { title: testForm.title, dueDate: testForm.dueDate || null, questions: [] }
                  }, {
                    onSuccess: () => {
                      invalidate(`/api/classes/${classId}/tests`);
                      setShowCreateTest(false);
                      setTestForm({ title: "", dueDate: "" });
                    }
                  });
                }}>
                {createTest.isPending ? "..." : "Créer"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={showCreateAssignment} onClose={() => setShowCreateAssignment(false)} title="Créer un devoir">
          <div className="space-y-4">
            <div><Label>Titre du devoir</Label><Input placeholder="ex: Devoir 3 – Intégrales" value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Instructions</Label>
              <textarea className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" placeholder="Décrivez ce que les élèves doivent faire..." value={assignForm.instructions} onChange={e => setAssignForm(f => ({ ...f, instructions: e.target.value }))} />
            </div>
            <div><Label>Date limite (optionnel)</Label><Input type="date" value={assignForm.dueDate} onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateAssignment(false)}>Annuler</Button>
              <Button className="flex-1" disabled={createAssignment.isPending}
                onClick={() => {
                  if (!assignForm.title) return;
                  createAssignment.mutate({
                    id: classId,
                    data: { title: assignForm.title, instructions: assignForm.instructions || null, dueDate: assignForm.dueDate || null }
                  }, {
                    onSuccess: () => {
                      invalidate(`/api/classes/${classId}/assignments`);
                      setShowCreateAssignment(false);
                      setAssignForm({ title: "", instructions: "", dueDate: "" });
                    }
                  });
                }}>
                {createAssignment.isPending ? "..." : "Créer"}
              </Button>
            </div>
          </div>
        </Modal>
      </FadeIn>
    </DashboardLayout>
  );
}
