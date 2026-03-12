import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input, Label } from "@/components/ui/Premium";
import {
  Video, FileText, Plus, Users, Settings, Clock, Calendar,
  FileQuestion, ClipboardList, BookOpen, LayoutDashboard,
  Trash2, Edit3, PlayCircle, Download, Eye, X, Check, Save
} from "lucide-react";

// --- Shared Modal ---
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

// --- Demo Data ---
const DEMO_CLASS = {
  id: 101,
  title: "Mathématiques 101: Analyse et Algèbre",
  subject: "Mathématiques",
  gradeLevel: "Baccalauréat",
  city: "Tunis",
  description: "Cours complet couvrant l'analyse réelle, l'algèbre linéaire et la géométrie analytique. Préparation intensive pour l'examen national du baccalauréat.",
  price: 45,
  durationHours: 2,
  isRecurring: true,
  isPublished: true,
  enrolledCount: 120,
};

const DEMO_SESSIONS = [
  { id: 1, title: "Chapitre 3: Les suites réelles", description: "Révision des théorèmes fondamentaux et exercices d'application type bac.", price: 45, durationHours: 2, scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", enrolledCount: 115 },
  { id: 2, title: "Chapitre 2: Nombres complexes", description: "Formes algébrique, trigonométrique et exponentielle.", price: 45, durationHours: 2, scheduledAt: new Date(Date.now() - 7 * 86400000).toISOString(), status: "completed", enrolledCount: 118 },
];

const DEMO_MATERIALS = [
  { id: 1, title: "Support PDF – Chapitre 1: Fonctions", description: "Cours complet avec définitions et démonstrations", type: "pdf", createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 2, title: "Série d'exercices n°4 corrigés", description: "50 exercices niveau bac avec solutions détaillées", type: "document", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 3, title: "Formulaire de mathématiques – Bac", description: "Toutes les formules essentielles pour l'examen", type: "pdf", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

const DEMO_QUIZZES = [
  { id: 1, title: "Quiz: Limites et Continuité", questions: 10, dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), published: true, submissions: 87 },
  { id: 2, title: "Quiz: Dérivées et Applications", questions: 8, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), published: false, submissions: 0 },
];

const DEMO_TESTS = [
  { id: 1, title: "Contrôle 1: Algèbre Linéaire", questions: 5, dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), duration: 60, published: true, submissions: 102 },
  { id: 2, title: "Contrôle 2: Analyse Réelle", questions: 6, dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), duration: 90, published: false, submissions: 0 },
];

const DEMO_ASSIGNMENTS = [
  { id: 1, title: "Devoir 1: Problèmes de suites", instructions: "Résoudre les 5 problèmes du polycopié distribué en cours. Présentation soignée obligatoire.", dueDate: new Date(Date.now() + 4 * 86400000).toISOString(), published: true, submissions: 63 },
  { id: 2, title: "Devoir 2: Intégrales", instructions: "Calculer les intégrales des chapitres 3 et 4.", dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), published: false, submissions: 0 },
];

const DEMO_STUDENTS = [
  { id: 1, name: "Amira Ben Ali", enrolledAt: "2024-09-01", grade: "Baccalauréat", city: "Tunis", lastActive: "il y a 2h" },
  { id: 2, name: "Youssef Trabelsi", enrolledAt: "2024-09-05", grade: "Baccalauréat", city: "Ariana", lastActive: "il y a 1 jour" },
  { id: 3, name: "Fatma Chaabane", enrolledAt: "2024-09-10", grade: "Baccalauréat", city: "Sfax", lastActive: "il y a 3h" },
  { id: 4, name: "Sami Kouki", enrolledAt: "2024-09-12", grade: "Baccalauréat", city: "Sousse", lastActive: "il y a 5h" },
  { id: 5, name: "Nour Belhaj", enrolledAt: "2024-09-15", grade: "3ème Secondaire", city: "Bizerte", lastActive: "il y a 1 jour" },
];

// Format date helper
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ProfessorClassManagement() {
  const [, params] = useRoute("/professor/classes/:id");
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();

  // Modal states
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  // Local data states (start with demo data)
  const [materials, setMaterials] = useState(DEMO_MATERIALS);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [quizzes, setQuizzes] = useState(DEMO_QUIZZES);
  const [tests, setTests] = useState(DEMO_TESTS);
  const [assignments, setAssignments] = useState(DEMO_ASSIGNMENTS);
  const [students] = useState(DEMO_STUDENTS);

  // Form states
  const [matForm, setMatForm] = useState({ title: "", description: "", type: "pdf" });
  const [sessionForm, setSessionForm] = useState({ title: "", description: "", price: "45", durationHours: "2", scheduledAt: "" });
  const [quizForm, setQuizForm] = useState({ title: "", questions: "5", dueDate: "" });
  const [testForm, setTestForm] = useState({ title: "", questions: "5", duration: "60", dueDate: "" });
  const [assignForm, setAssignForm] = useState({ title: "", instructions: "", dueDate: "" });

  const tabs = [
    { id: "overview", label: "Aperçu", icon: LayoutDashboard },
    { id: "live", label: "Sessions Live", icon: Video },
    { id: "materials", label: "Supports", icon: FileText },
    { id: "quizzes", label: "Quiz", icon: FileQuestion },
    { id: "tests", label: "Contrôles", icon: ClipboardList },
    { id: "assignments", label: "Devoirs", icon: BookOpen },
    { id: "students", label: `Élèves (${DEMO_CLASS.enrolledCount})`, icon: Users },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const addMaterial = () => {
    if (!matForm.title) return;
    setMaterials(prev => [...prev, { id: Date.now(), ...matForm, createdAt: new Date().toISOString() }]);
    setMatForm({ title: "", description: "", type: "pdf" });
    setShowAddMaterial(false);
  };

  const addSession = () => {
    if (!sessionForm.title || !sessionForm.scheduledAt) return;
    setSessions(prev => [{
      id: Date.now(), ...sessionForm,
      price: parseFloat(sessionForm.price), durationHours: parseFloat(sessionForm.durationHours),
      status: "scheduled", enrolledCount: 0
    }, ...prev]);
    setSessionForm({ title: "", description: "", price: "45", durationHours: "2", scheduledAt: "" });
    setShowCreateSession(false);
  };

  const addQuiz = () => {
    if (!quizForm.title) return;
    setQuizzes(prev => [...prev, { id: Date.now(), ...quizForm, questions: parseInt(quizForm.questions), published: false, submissions: 0 }]);
    setQuizForm({ title: "", questions: "5", dueDate: "" });
    setShowCreateQuiz(false);
  };

  const addTest = () => {
    if (!testForm.title) return;
    setTests(prev => [...prev, { id: Date.now(), ...testForm, questions: parseInt(testForm.questions), duration: parseInt(testForm.duration), published: false, submissions: 0 }]);
    setTestForm({ title: "", questions: "5", duration: "60", dueDate: "" });
    setShowCreateTest(false);
  };

  const addAssignment = () => {
    if (!assignForm.title) return;
    setAssignments(prev => [...prev, { id: Date.now(), ...assignForm, published: false, submissions: 0 }]);
    setAssignForm({ title: "", instructions: "", dueDate: "" });
    setShowCreateAssignment(false);
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/professor/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 transition-colors">
          ← Retour aux cours
        </Link>

        <PageHeader
          title={DEMO_CLASS.title}
          description={`${DEMO_CLASS.subject} • ${DEMO_CLASS.gradeLevel} • ${DEMO_CLASS.city}`}
          action={<Badge variant="success" className="text-sm px-4 py-1">Publié</Badge>}
        />

        {/* Tabs */}
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
                { label: "Élèves inscrits", value: DEMO_CLASS.enrolledCount, icon: Users, color: "bg-blue-100 text-blue-600" },
                { label: "Sessions réalisées", value: sessions.filter(s => s.status === "completed").length, icon: Video, color: "bg-green-100 text-green-600" },
                { label: "Supports de cours", value: materials.length, icon: FileText, color: "bg-orange-100 text-orange-600" },
                { label: "Revenus estimés", value: `${Math.round(DEMO_CLASS.price * DEMO_CLASS.enrolledCount * 0.85)} TND`, icon: Clock, color: "bg-purple-100 text-purple-600" },
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
                    ["Matière", DEMO_CLASS.subject],
                    ["Niveau", DEMO_CLASS.gradeLevel],
                    ["Ville", DEMO_CLASS.city],
                    ["Prix", `${DEMO_CLASS.price} TND / session`],
                    ["Durée", `${DEMO_CLASS.durationHours}h par session`],
                    ["Type", DEMO_CLASS.isRecurring ? "Récurrent (mensuel)" : "Paiement unique"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("settings")}>
                  <Edit3 className="w-4 h-4 mr-2" /> Modifier les infos
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{DEMO_CLASS.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setActiveTab("live")}>
                    <Video className="w-4 h-4 mr-2" /> Sessions live
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

            <div className="space-y-4">
              {sessions.map(s => (
                <Card key={s.id} className={`p-6 ${s.status === "completed" ? "opacity-60" : "border-primary/20 shadow-md shadow-primary/5"}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {s.status === "scheduled" ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Video className="w-3 h-3 mr-1 inline" /> Programmée</Badge>
                        ) : (
                          <Badge variant="secondary">Terminée</Badge>
                        )}
                        <span className="text-sm font-medium text-muted-foreground">{s.price} TND</span>
                      </div>
                      <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{fmtDT(s.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.durationHours}h</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{s.enrolledCount} inscrits</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {s.status === "scheduled" && (
                        <Link href={`/classroom/${s.id}`}>
                          <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                            <PlayCircle className="w-4 h-4 mr-2" /> Lancer
                          </Button>
                        </Link>
                      )}
                      {s.status === "completed" && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" /> Résumé
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {sessions.length === 0 && (
                <Card className="p-12 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucune session programmée</h3>
                  <p className="text-muted-foreground mb-6">Créez votre première session live pour commencer à enseigner.</p>
                  <Button onClick={() => setShowCreateSession(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Créer une session
                  </Button>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* ─── MATERIALS ─── */}
        {activeTab === "materials" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Supports de cours</h3>
              <Button onClick={() => setShowAddMaterial(true)}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter un support
              </Button>
            </div>
            <Card className="divide-y divide-border overflow-hidden">
              {materials.map(m => (
                <div key={m.id} className="p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">{m.description} • Ajouté le {fmt(m.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setMaterials(prev => prev.filter(x => x.id !== m.id))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {materials.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun support. Ajoutez votre premier document.</p>
                </div>
              )}
            </Card>
          </FadeIn>
        )}

        {/* ─── QUIZZES ─── */}
        {activeTab === "quizzes" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Quiz</h3>
              <Button onClick={() => setShowCreateQuiz(true)}>
                <Plus className="w-4 h-4 mr-2" /> Créer un quiz
              </Button>
            </div>
            <div className="space-y-4">
              {quizzes.map(q => (
                <Card key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileQuestion className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{q.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {q.questions} questions • À rendre avant le {fmt(q.dueDate)} • {q.submissions} soumissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={q.published ? "success" : "secondary"}>{q.published ? "Publié" : "Brouillon"}</Badge>
                    {!q.published && (
                      <Button size="sm" onClick={() => setQuizzes(prev => prev.map(x => x.id === q.id ? { ...x, published: true } : x))}>
                        <Check className="w-4 h-4 mr-1" /> Publier
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setQuizzes(prev => prev.filter(x => x.id !== q.id))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {quizzes.length === 0 && (
                <Card className="p-12 text-center">
                  <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun quiz créé.</p>
                  <Button onClick={() => setShowCreateQuiz(true)}><Plus className="w-4 h-4 mr-2" /> Créer un quiz</Button>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* ─── TESTS ─── */}
        {activeTab === "tests" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Contrôles</h3>
              <Button onClick={() => setShowCreateTest(true)}>
                <Plus className="w-4 h-4 mr-2" /> Créer un contrôle
              </Button>
            </div>
            <div className="space-y-4">
              {tests.map(t => (
                <Card key={t.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t.questions} questions • {t.duration} min • Avant le {fmt(t.dueDate)} • {t.submissions} soumissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={t.published ? "success" : "secondary"}>{t.published ? "Publié" : "Brouillon"}</Badge>
                    {!t.published && (
                      <Button size="sm" onClick={() => setTests(prev => prev.map(x => x.id === t.id ? { ...x, published: true } : x))}>
                        <Check className="w-4 h-4 mr-1" /> Publier
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setTests(prev => prev.filter(x => x.id !== t.id))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {tests.length === 0 && (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun contrôle créé.</p>
                  <Button onClick={() => setShowCreateTest(true)}><Plus className="w-4 h-4 mr-2" /> Créer un contrôle</Button>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* ─── ASSIGNMENTS ─── */}
        {activeTab === "assignments" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Devoirs</h3>
              <Button onClick={() => setShowCreateAssignment(true)}>
                <Plus className="w-4 h-4 mr-2" /> Créer un devoir
              </Button>
            </div>
            <div className="space-y-4">
              {assignments.map(a => (
                <Card key={a.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{a.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {a.instructions} • Avant le {fmt(a.dueDate)} • {a.submissions} soumissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={a.published ? "success" : "secondary"}>{a.published ? "Publié" : "Brouillon"}</Badge>
                    {!a.published && (
                      <Button size="sm" onClick={() => setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, published: true } : x))}>
                        <Check className="w-4 h-4 mr-1" /> Publier
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAssignments(prev => prev.filter(x => x.id !== a.id))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {assignments.length === 0 && (
                <Card className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun devoir créé.</p>
                  <Button onClick={() => setShowCreateAssignment(true)}><Plus className="w-4 h-4 mr-2" /> Créer un devoir</Button>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* ─── STUDENTS ─── */}
        {activeTab === "students" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Élèves inscrits</h3>
              <Badge variant="secondary" className="text-base px-4 py-1">{students.length} élèves</Badge>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Élève</th>
                    <th className="px-6 py-4 font-semibold hidden sm:table-cell">Ville</th>
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Inscrit le</th>
                    <th className="px-6 py-4 font-semibold hidden lg:table-cell">Dernière activité</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{s.city}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{fmt(s.enrolledAt)}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">{s.lastActive}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">Contacter</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </FadeIn>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === "settings" && (
          <FadeIn>
            <div className="max-w-2xl space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-5 border-b border-border pb-3">Informations du cours</h3>
                <div className="space-y-4">
                  <div><Label>Titre du cours</Label><Input defaultValue={DEMO_CLASS.title} /></div>
                  <div><Label>Description</Label>
                    <textarea className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" defaultValue={DEMO_CLASS.description} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Prix (TND)</Label><Input type="number" defaultValue={DEMO_CLASS.price} /></div>
                    <div><Label>Durée (heures)</Label><Input type="number" defaultValue={DEMO_CLASS.durationHours} /></div>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-destructive/20">
                <h3 className="font-bold text-lg mb-2 text-destructive">Zone de danger</h3>
                <p className="text-sm text-muted-foreground mb-4">La suppression du cours est irréversible et supprimera toutes les données associées.</p>
                <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer ce cours
                </Button>
              </Card>
              <div className="flex justify-end">
                <Button size="lg"><Save className="w-5 h-5 mr-2" /> Sauvegarder</Button>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ─── MODALS ─── */}

        {/* Add Material */}
        <Modal open={showAddMaterial} onClose={() => setShowAddMaterial(false)} title="Ajouter un support de cours">
          <div className="space-y-4">
            <div><Label>Titre du document</Label><Input placeholder="ex: Support PDF – Chapitre 4" value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Input placeholder="Décrivez brièvement le contenu..." value={matForm.description} onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Type de fichier</Label>
              <select className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm" value={matForm.type} onChange={e => setMatForm(f => ({ ...f, type: e.target.value }))}>
                <option value="pdf">PDF</option>
                <option value="document">Document Word</option>
                <option value="video">Vidéo</option>
                <option value="link">Lien externe</option>
              </select>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Glissez votre fichier ici ou</p>
              <Button variant="outline" size="sm">Choisir un fichier</Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMaterial(false)}>Annuler</Button>
              <Button className="flex-1" onClick={addMaterial}>Ajouter le support</Button>
            </div>
          </div>
        </Modal>

        {/* Create Session */}
        <Modal open={showCreateSession} onClose={() => setShowCreateSession(false)} title="Programmer une session live">
          <div className="space-y-4">
            <div><Label>Titre de la session</Label><Input placeholder="ex: Chapitre 4 – Intégrales" value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label>
              <textarea className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" placeholder="Ce que couvre cette session..." value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Prix (TND)</Label><Input type="number" placeholder="45" value={sessionForm.price} onChange={e => setSessionForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Durée (heures)</Label><Input type="number" placeholder="2" value={sessionForm.durationHours} onChange={e => setSessionForm(f => ({ ...f, durationHours: e.target.value }))} /></div>
            </div>
            <div><Label>Date et heure</Label><Input type="datetime-local" value={sessionForm.scheduledAt} onChange={e => setSessionForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateSession(false)}>Annuler</Button>
              <Button className="flex-1" onClick={addSession}>Programmer la session</Button>
            </div>
          </div>
        </Modal>

        {/* Create Quiz */}
        <Modal open={showCreateQuiz} onClose={() => setShowCreateQuiz(false)} title="Créer un quiz">
          <div className="space-y-4">
            <div><Label>Titre du quiz</Label><Input placeholder="ex: Quiz – Dérivées" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Nombre de questions</Label><Input type="number" min="1" value={quizForm.questions} onChange={e => setQuizForm(f => ({ ...f, questions: e.target.value }))} /></div>
              <div><Label>Date limite</Label><Input type="date" value={quizForm.dueDate} onChange={e => setQuizForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
              Les questions détaillées peuvent être ajoutées après création depuis la page du quiz.
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateQuiz(false)}>Annuler</Button>
              <Button className="flex-1" onClick={addQuiz}>Créer le quiz</Button>
            </div>
          </div>
        </Modal>

        {/* Create Test */}
        <Modal open={showCreateTest} onClose={() => setShowCreateTest(false)} title="Créer un contrôle">
          <div className="space-y-4">
            <div><Label>Titre du contrôle</Label><Input placeholder="ex: Contrôle – Algèbre linéaire" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Questions</Label><Input type="number" min="1" value={testForm.questions} onChange={e => setTestForm(f => ({ ...f, questions: e.target.value }))} /></div>
              <div><Label>Durée (min)</Label><Input type="number" min="10" value={testForm.duration} onChange={e => setTestForm(f => ({ ...f, duration: e.target.value }))} /></div>
              <div><Label>Date limite</Label><Input type="date" value={testForm.dueDate} onChange={e => setTestForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateTest(false)}>Annuler</Button>
              <Button className="flex-1" onClick={addTest}>Créer le contrôle</Button>
            </div>
          </div>
        </Modal>

        {/* Create Assignment */}
        <Modal open={showCreateAssignment} onClose={() => setShowCreateAssignment(false)} title="Créer un devoir">
          <div className="space-y-4">
            <div><Label>Titre du devoir</Label><Input placeholder="ex: Devoir 3 – Intégrales" value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Instructions</Label>
              <textarea className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none" placeholder="Décrivez ce que les élèves doivent faire..." value={assignForm.instructions} onChange={e => setAssignForm(f => ({ ...f, instructions: e.target.value }))} />
            </div>
            <div><Label>Date limite</Label><Input type="date" value={assignForm.dueDate} onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateAssignment(false)}>Annuler</Button>
              <Button className="flex-1" onClick={addAssignment}>Créer le devoir</Button>
            </div>
          </div>
        </Modal>
      </FadeIn>
    </DashboardLayout>
  );
}
