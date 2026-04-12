import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";
import {
  BookOpen, ChevronRight, ChevronDown, ChevronUp, Eye, EyeOff,
  CheckCircle2, XCircle, MinusCircle, Trophy, ArrowRight, Filter,
  AlertCircle,
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

const MARK_OPTIONS: { value: SelfMark; label: string; icon: any; color: string }[] = [
  { value: "correct",   label: "Correct",    icon: CheckCircle2, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100" },
  { value: "partial",   label: "Partiel",    icon: MinusCircle,  color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100" },
  { value: "incorrect", label: "Incorrect",  icon: XCircle,      color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100" },
];

function difficultyBadge(d: string) {
  if (d === "facile") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (d === "difficile") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
}

export function BanqueDeQuestionsSubject() {
  const [, params] = useRoute("/revision/:subject/banque-de-questions");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const sectionKey: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showCorrection, setShowCorrection] = useState<Record<number, boolean>>({});
  const [selfMarks, setSelfMarks] = useState<Record<number, SelfMark>>({});
  const [sessionDone, setSessionDone] = useState(false);

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

  const { data: questions = [], isLoading } = useQuery<any[]>({
    queryKey: ["revision-questions", subject, gradeLevel, sectionKey, selectedTopic, selectedDifficulty],
    queryFn: () => apiFetch(`/api/revision/content/questions?${queryParams}`),
    enabled: !!subject && !!gradeLevel,
  });

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
        title: "Séance enregistrée",
        description: data.gradeOutOf20 !== null
          ? `Résultat : ${data.gradeOutOf20.toFixed(1)}/20`
          : "Bonne continuation !",
      });
    },
  });

  function toggleCorrection(qId: number) {
    setShowCorrection(prev => ({ ...prev, [qId]: !prev[qId] }));
  }

  function setMark(qId: number, mark: SelfMark) {
    setSelfMarks(prev => ({ ...prev, [qId]: mark }));
  }

  function handleFinishSession() {
    const markedQuestions = questions.filter(q => selfMarks[q.id]);
    if (markedQuestions.length === 0) {
      toast({ title: "Aucune question évaluée", description: "Évalue au moins une question avant de terminer." });
      return;
    }

    // Compute score: correct = full marks, partial = half marks, incorrect = 0
    const totalMarks = markedQuestions.reduce((sum: number, q: any) => sum + (q.totalMarks ?? 1), 0);
    const marksAwarded = markedQuestions.reduce((sum: number, q: any) => {
      const mark = selfMarks[q.id];
      const qMarks = q.totalMarks ?? 1;
      if (mark === "correct") return sum + qMarks;
      if (mark === "partial") return sum + Math.floor(qMarks / 2);
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
      type: "practice",
      subject,
      gradeLevel,
      sectionKey,
      topic: selectedTopic ?? undefined,
      totalMarks,
      marksAwarded,
      questionsCount: markedQuestions.length,
      correctCount,
      answers,
    });

    setSessionDone(true);
  }

  const markedCount = Object.keys(selfMarks).length;
  const totalQuestions = questions.length;

  // ── Session result screen ───────────────────────────────────────────────────
  if (sessionDone && saveAttempt.data) {
    const grade = saveAttempt.data.gradeOutOf20;
    const gradeColor = grade >= 15 ? "text-green-600" : grade >= 10 ? "text-amber-600" : "text-red-600";
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Séance terminée !</h1>
          {grade !== null ? (
            <div>
              <p className={`text-6xl font-bold ${gradeColor}`}>{grade.toFixed(1)}</p>
              <p className="text-xl text-muted-foreground">/20</p>
            </div>
          ) : (
            <p className="text-xl text-muted-foreground">Résultats enregistrés</p>
          )}
          <p className="text-muted-foreground">
            {Object.values(selfMarks).filter(m => m === "correct").length} correcte(s) ·{" "}
            {Object.values(selfMarks).filter(m => m === "partial").length} partielle(s) ·{" "}
            {Object.values(selfMarks).filter(m => m === "incorrect").length} incorrecte(s)
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => { setSelfMarks({}); setShowCorrection({}); setSessionDone(false); setExpandedQuestion(null); }}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
            >
              Nouvelle séance
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">Révision Étude+</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${subjectToSlug(subject)}`} className="hover:text-foreground transition-colors">{subject}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Banque de Questions</span>
          </div>
          <h1 className="text-2xl font-bold">Banque de Questions — {subject}</h1>
          <p className="text-muted-foreground mt-1">
            Lis chaque question, essaie de répondre, puis vérifie le corrigé et évalue-toi.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtres :</span>
          </div>

          {/* Topic filter */}
          {topics.length > 0 && (
            <select
              value={selectedTopic ?? ""}
              onChange={e => setSelectedTopic(e.target.value || null)}
              className="text-sm border border-border rounded-xl px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tous les chapitres</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {/* Difficulty filter */}
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Toutes les difficultés</option>
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
          </select>
        </div>

        {/* No level configured */}
        {!gradeLevel && (
          <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Niveau non défini</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  <Link href="/student/settings" className="underline">Configure ton niveau scolaire</Link> pour voir les questions adaptées.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && questions.length === 0 && gradeLevel && (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Aucune question disponible</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Le contenu pour <strong>{subject}</strong>
              {selectedTopic ? ` (${selectedTopic})` : ""} sera disponible très bientôt.
            </p>
          </Card>
        )}

        {/* Questions list */}
        {!isLoading && questions.length > 0 && (
          <>
            <div className="space-y-4">
              {questions.map((q: any, idx: number) => {
                const isExpanded = expandedQuestion === q.id;
                const correctionVisible = showCorrection[q.id];
                const mark = selfMarks[q.id];

                return (
                  <Card
                    key={q.id}
                    className={cn(
                      "overflow-hidden transition-all",
                      mark === "correct" && "border-green-300 dark:border-green-800",
                      mark === "partial" && "border-amber-300 dark:border-amber-800",
                      mark === "incorrect" && "border-red-300 dark:border-red-800",
                    )}
                  >
                    {/* Question header */}
                    <button
                      type="button"
                      className="w-full text-left p-5 flex items-start gap-4"
                      onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", difficultyBadge(q.difficulty))}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground">{q.topic}</span>
                          {q.totalMarks && (
                            <span className="text-xs text-muted-foreground">{q.totalMarks} pt{q.totalMarks > 1 ? "s" : ""}</span>
                          )}
                          {mark && (
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                              mark === "correct" ? "bg-green-100 text-green-700" :
                              mark === "partial" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {mark === "correct" ? "✓ Correct" : mark === "partial" ? "~ Partiel" : "✗ Incorrect"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {q.questionText}
                        </p>
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-5">
                        {/* Optional context */}
                        {q.context && (
                          <div
                            className="text-sm bg-muted/40 rounded-xl p-4 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: q.context }}
                          />
                        )}

                        {/* Question text (full) */}
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {q.questionText}
                        </div>

                        {/* Parts */}
                        {q.parts?.length > 0 && (
                          <div className="space-y-3">
                            {q.parts.map((part: any) => (
                              <div key={part.id} className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                                  {part.label}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm">{part.text}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{part.marks} pt{part.marks > 1 ? "s" : ""}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show/hide correction button */}
                        <button
                          type="button"
                          onClick={() => toggleCorrection(q.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                        >
                          {correctionVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {correctionVisible ? "Masquer le corrigé" : "Voir le corrigé"}
                        </button>

                        {/* Correction panel */}
                        {correctionVisible && q.markScheme?.length > 0 && (
                          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
                            <p className="text-sm font-bold text-green-800 dark:text-green-300">Corrigé</p>
                            {q.markScheme.map((ms: any) => (
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
                            ))}
                          </div>
                        )}

                        {correctionVisible && (!q.markScheme || q.markScheme.length === 0) && (
                          <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="text-sm text-muted-foreground">Corrigé non disponible pour cette question.</p>
                          </div>
                        )}

                        {/* Self-mark buttons */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                            Évalue ta réponse
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {MARK_OPTIONS.map(opt => {
                              const Icon = opt.icon;
                              const selected = mark === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setMark(q.id, opt.value)}
                                  className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                                    opt.color,
                                    selected && "ring-2 ring-offset-1 ring-current shadow-sm"
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Session footer */}
            <div className="sticky bottom-4">
              <Card className="p-4 flex items-center justify-between shadow-lg bg-card/95 backdrop-blur border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{markedCount}</span> / {totalQuestions} question{totalQuestions > 1 ? "s" : ""} évaluée{markedCount > 1 ? "s" : ""}
                </p>
                <button
                  onClick={handleFinishSession}
                  disabled={markedCount === 0 || saveAttempt.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saveAttempt.isPending ? "Enregistrement..." : "Terminer la séance"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
