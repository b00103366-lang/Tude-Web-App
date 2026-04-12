import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";
import {
  BookOpen, ChevronRight, ChevronLeft, Eye, EyeOff,
  CheckCircle2, XCircle, MinusCircle, Trophy, ArrowRight, Filter,
  AlertCircle, ListFilter, BookMarked, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type SelfMark = "correct" | "partial" | "incorrect" | null;

const MARK_OPTIONS: { value: SelfMark; label: string; icon: any; color: string; activeColor: string }[] = [
  {
    value: "correct",
    label: "Correct",
    icon: CheckCircle2,
    color: "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
    activeColor: "bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600",
  },
  {
    value: "partial",
    label: "Partiel",
    icon: MinusCircle,
    color: "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
    activeColor: "bg-amber-500 border-amber-500 text-white dark:bg-amber-600 dark:border-amber-600",
  },
  {
    value: "incorrect",
    label: "Incorrect",
    icon: XCircle,
    color: "border-red-200 text-red-700 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
    activeColor: "bg-red-500 border-red-500 text-white dark:bg-red-600 dark:border-red-600",
  },
];

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    facile:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    moyen:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    difficile: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  const labels: Record<string, string> = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", map[difficulty] ?? map.moyen)}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}

export function BanqueDeQuestionsSubject() {
  const [, params] = useRoute("/revision/:subject/banque-de-questions");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const sectionKey: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  const [selectedTopic, setSelectedTopic]         = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentIdx, setCurrentIdx]               = useState(0);
  const [showCorrection, setShowCorrection]       = useState(false);
  const [selfMarks, setSelfMarks]                 = useState<Record<number, SelfMark>>({});
  const [sessionDone, setSessionDone]             = useState(false);

  // Fetch available topics
  const { data: topics = [] } = useQuery<string[]>({
    queryKey: ["revision-topics", subject, gradeLevel, sectionKey],
    queryFn: () => apiFetch(
      `/api/revision/content/topics?subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(gradeLevel)}${sectionKey ? `&sectionKey=${encodeURIComponent(sectionKey)}` : ""}`
    ),
    enabled: !!subject && !!gradeLevel,
  });

  // Fetch questions
  const queryParams = new URLSearchParams({
    subject,
    gradeLevel,
    ...(sectionKey && { sectionKey }),
    ...(selectedTopic && { topic: selectedTopic }),
    ...(selectedDifficulty !== "all" && { difficulty: selectedDifficulty }),
    limit: "15",
  });

  const { data: questions = [] as any[], isLoading } = useQuery<any[]>({
    queryKey: ["revision-questions", subject, gradeLevel, sectionKey, selectedTopic, selectedDifficulty],
    queryFn: () => apiFetch(`/api/revision/content/questions?${queryParams}`),
    enabled: !!subject && !!gradeLevel,
  });

  // Reset viewer when the question set changes
  useEffect(() => {
    setCurrentIdx(0);
    setShowCorrection(false);
  }, [selectedTopic, selectedDifficulty]);

  // Save attempt mutation
  const saveAttempt = useMutation({
    mutationFn: async (body: any) => {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/progress/attempts`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save attempt");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      queryClient.invalidateQueries({ queryKey: ["progress-history"] });
      toast({
        title: "Révision enregistrée",
        description: data.gradeOutOf20 !== null
          ? `Résultat : ${data.gradeOutOf20.toFixed(1)}/20`
          : "Bonne continuation !",
      });
    },
  });

  const currentQuestion = questions[currentIdx] ?? null;
  const mark = currentQuestion ? selfMarks[currentQuestion.id] : null;
  const markedCount = Object.keys(selfMarks).length;
  const totalQuestions = questions.length;

  function goTo(idx: number) {
    setCurrentIdx(idx);
    setShowCorrection(false);
  }

  function setMark(qId: number, value: SelfMark) {
    setSelfMarks(prev => ({ ...prev, [qId]: value }));
  }

  function handleFinishSession() {
    const markedQuestions = questions.filter((q: any) => selfMarks[q.id]);
    if (markedQuestions.length === 0) {
      toast({ title: "Aucune question évaluée", description: "Évalue au moins une question avant de terminer." });
      return;
    }
    const totalMarks = markedQuestions.reduce((sum: number, q: any) => sum + (q.totalMarks ?? 1), 0);
    const marksAwarded = markedQuestions.reduce((sum: number, q: any) => {
      const m = selfMarks[q.id];
      const qm = q.totalMarks ?? 1;
      if (m === "correct") return sum + qm;
      if (m === "partial") return sum + Math.floor(qm / 2);
      return sum;
    }, 0);
    const correctCount = Object.values(selfMarks).filter(m => m === "correct").length;
    const answers = markedQuestions.map((q: any) => ({
      questionId: q.id,
      subject,
      topic: q.topic,
      isCorrect: selfMarks[q.id] === "correct",
      marksAwarded: selfMarks[q.id] === "correct" ? (q.totalMarks ?? 1) :
        selfMarks[q.id] === "partial" ? Math.floor((q.totalMarks ?? 1) / 2) : 0,
      marksAvailable: q.totalMarks ?? 1,
    }));
    saveAttempt.mutate({
      type: "practice", subject, gradeLevel, sectionKey,
      topic: selectedTopic ?? undefined,
      totalMarks, marksAwarded, questionsCount: markedQuestions.length, correctCount, answers,
    });
    setSessionDone(true);
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (sessionDone && saveAttempt.data) {
    const grade = saveAttempt.data.gradeOutOf20;
    const gradeColor = grade >= 15 ? "text-green-600 dark:text-green-400" : grade >= 10 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
    const correctC = Object.values(selfMarks).filter(m => m === "correct").length;
    const partialC = Object.values(selfMarks).filter(m => m === "partial").length;
    const incorrectC = Object.values(selfMarks).filter(m => m === "incorrect").length;
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Révision terminée !</h1>
            <p className="text-muted-foreground">{subject}</p>
          </div>
          {grade !== null && (
            <div className="py-4">
              <p className={cn("text-6xl font-bold", gradeColor)}>{grade.toFixed(1)}</p>
              <p className="text-xl text-muted-foreground">/20</p>
            </div>
          )}
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctC}</p>
              <p className="text-muted-foreground">Correcte{correctC > 1 ? "s" : ""}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{partialC}</p>
              <p className="text-muted-foreground">Partielle{partialC > 1 ? "s" : ""}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{incorrectC}</p>
              <p className="text-muted-foreground">Incorrecte{incorrectC > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => { setSelfMarks({}); setShowCorrection(false); setSessionDone(false); setCurrentIdx(0); }}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
            >
              Nouvelle révision
            </button>
            <Link href="/student/progress">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Voir ma progression <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">Révision Étude+</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${subjectToSlug(subject)}`} className="hover:text-foreground transition-colors">{subject}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Banque de Questions</span>
          </div>
          <h1 className="text-2xl font-bold">{subject} — Banque de Questions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Lis chaque question, essaie de répondre, puis révèle le corrigé et évalue ta réponse.
          </p>
        </div>

        {/* ── No level configured ───────────────────────────────────────────── */}
        {!gradeLevel && (
          <Card className="p-5 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Niveau non défini</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  <Link href="/student/settings" className="underline">Configure ton niveau scolaire</Link> pour voir les questions adaptées.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl bg-muted/40 border border-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ListFilter className="w-4 h-4" />
            <span>Filtres</span>
          </div>

          {topics.length > 0 && (
            <select
              value={selectedTopic ?? ""}
              onChange={e => { setSelectedTopic(e.target.value || null); setCurrentIdx(0); setShowCorrection(false); }}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
            >
              <option value="">Tous les chapitres</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <select
            value={selectedDifficulty}
            onChange={e => { setSelectedDifficulty(e.target.value); setCurrentIdx(0); setShowCorrection(false); }}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Toutes les difficultés</option>
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
          </select>

          {totalQuestions > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {totalQuestions} question{totalQuestions > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <div className="h-72 bg-muted rounded-2xl animate-pulse" />
            <div className="h-72 bg-muted rounded-2xl animate-pulse" />
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && questions.length === 0 && gradeLevel && (
          <Card className="p-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Aucune question disponible</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Le contenu pour <strong>{subject}</strong>
              {selectedTopic ? ` (${selectedTopic})` : ""} sera disponible très bientôt.
            </p>
          </Card>
        )}

        {/* ── Two-panel viewer ─────────────────────────────────────────────── */}
        {!isLoading && questions.length > 0 && currentQuestion && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">

            {/* ── Left: question navigator + content ───────────────────────── */}
            <div className="space-y-4">
              {/* Question navigator dots */}
              <div className="flex items-center gap-2 flex-wrap">
                {questions.map((q: any, i: number) => {
                  const m = selfMarks[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(i)}
                      title={`Question ${i + 1}`}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-bold transition-all border-2",
                        i === currentIdx
                          ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md"
                          : m === "correct"   ? "bg-green-500 border-green-500 text-white"
                          : m === "partial"   ? "bg-amber-500 border-amber-500 text-white"
                          : m === "incorrect" ? "bg-red-500 border-red-500 text-white"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question card */}
              <Card className={cn(
                "overflow-hidden transition-all",
                mark === "correct"   && "border-green-300 dark:border-green-800",
                mark === "partial"   && "border-amber-300 dark:border-amber-800",
                mark === "incorrect" && "border-red-300 dark:border-red-800",
              )}>
                {/* Card header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {currentIdx + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <DifficultyBadge difficulty={currentQuestion.difficulty} />
                    {currentQuestion.topic && (
                      <span className="text-xs text-muted-foreground font-medium">{currentQuestion.topic}</span>
                    )}
                    {currentQuestion.totalMarks && (
                      <span className="text-xs text-muted-foreground">
                        {currentQuestion.totalMarks} pt{currentQuestion.totalMarks > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {mark && (
                    <span className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full",
                      mark === "correct"   ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : mark === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      :                     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    )}>
                      {mark === "correct" ? "✓ Correct" : mark === "partial" ? "~ Partiel" : "✗ Incorrect"}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="px-6 py-6 space-y-5">
                  {/* Context / stimulus */}
                  {currentQuestion.context && (
                    <div
                      className="text-sm bg-muted/50 rounded-xl p-4 prose prose-sm dark:prose-invert max-w-none border border-border"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.context }}
                    />
                  )}

                  {/* Question stem */}
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.questionText}
                  </p>

                  {/* Sub-parts */}
                  {currentQuestion.parts?.length > 0 && (
                    <div className="space-y-3 pl-1">
                      {currentQuestion.parts.map((part: any) => (
                        <div key={part.id} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                            {part.label}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{part.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{part.marks} pt{part.marks > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correction panel (inline) */}
                  {showCorrection && (
                    <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5 space-y-3">
                      <p className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                        <BookMarked className="w-4 h-4" /> Corrigé
                      </p>
                      {currentQuestion.markScheme?.length > 0 ? (
                        currentQuestion.markScheme.map((ms: any) => (
                          <div key={ms.id} className="flex gap-3">
                            {ms.partLabel && (
                              <span className="w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-300 shrink-0 mt-0.5">
                                {ms.partLabel}
                              </span>
                            )}
                            <div className="flex-1 text-sm text-green-900 dark:text-green-200">
                              <p className="font-medium">{ms.answer}</p>
                              {ms.marksBreakdown && (
                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">{ms.marksBreakdown}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-green-700 dark:text-green-400">Corrigé non disponible pour cette question.</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => goTo(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Précédente
                </button>
                <span className="text-sm text-muted-foreground font-medium">
                  {currentIdx + 1} / {totalQuestions}
                </span>
                <button
                  onClick={() => goTo(currentIdx + 1)}
                  disabled={currentIdx === totalQuestions - 1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivante <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Right: action panel ───────────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Corrigé toggle */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-bold text-sm">Corrigé</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCorrection(v => !v)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    showCorrection
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                      : "border-border hover:bg-muted text-foreground"
                  )}
                >
                  {showCorrection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showCorrection ? "Masquer le corrigé" : "Voir le corrigé"}
                </button>
              </Card>

              {/* Self-assessment */}
              <Card className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-sm">Auto-évaluation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Comment as-tu répondu à cette question ?</p>
                </div>
                <div className="space-y-2">
                  {MARK_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const selected = mark === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMark(currentQuestion.id, opt.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                          selected ? opt.activeColor : cn("bg-background", opt.color)
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* AI feedback (coming soon) */}
              <Card className="p-5 space-y-3 opacity-60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-bold text-sm">Feedback IA</h3>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Bientôt
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Analyse détaillée de ta réponse et conseils personnalisés basés sur l'IA.
                </p>
              </Card>

              {/* Session progress + finish */}
              <Card className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-sm">Progression</h3>
                    <span className="text-sm font-bold text-primary">{markedCount}/{totalQuestions}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: totalQuestions > 0 ? `${(markedCount / totalQuestions) * 100}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {markedCount} question{markedCount > 1 ? "s" : ""} évaluée{markedCount > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={handleFinishSession}
                  disabled={markedCount === 0 || saveAttempt.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saveAttempt.isPending ? "Enregistrement..." : "Terminer la révision"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
