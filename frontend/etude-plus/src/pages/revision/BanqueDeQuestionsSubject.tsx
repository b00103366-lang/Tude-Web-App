/**
 * BanqueDeQuestionsSubject — student-facing question bank for a specific subject.
 * Layout closely matches the reference design:
 *   - Horizontal filter bar at top
 *   - Large question card on the left
 *   - Sticky action panel on the right
 */

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { subjectFromSlug, subjectToSlug } from "@/lib/educationConfig";
import {
  BookOpen, ChevronRight, ChevronLeft, Eye, EyeOff,
  CheckCircle2, XCircle, MinusCircle, Trophy, ArrowRight,
  AlertCircle, Calculator, BookMarked, Sparkles, Bookmark,
  BookmarkCheck, Video, Maximize2, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Strip trailing slash so VITE_API_URL="https://backend.com/" doesn't create "//api/..."
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function apiFetch(path: string) {
  const token = getToken();
  const fullUrl = `${API_URL}${path}`;
  const res = await fetch(fullUrl, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    console.error(`[BdQ] ${res.status} ${res.statusText} — ${fullUrl}`);
    throw new Error(`HTTP ${res.status} — ${fullUrl}`);
  }
  return res.json();
}

type SelfMark = "correct" | "partial" | "incorrect" | null;

// ── Sub-components ──────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    facile:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
    moyen:     "bg-amber-50 text-amber-700 border border-amber-200",
    difficile: "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = {
    facile: "Facile", moyen: "Moyen", difficile: "Difficile",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
      styles[difficulty] ?? styles.moyen
    )}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────────

type Filters = {
  topic: string;
  type: string;
  difficulty: string;
};

function FilterBar({
  topics,
  filters,
  onChange,
  totalCount,
  currentIdx,
  onGoTo,
}: {
  topics: string[];
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  totalCount: number;
  currentIdx: number;
  onGoTo: (n: number) => void;
}) {
  const [goInput, setGoInput] = useState("");

  const selectClass =
    "text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 h-9";

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-border">
      {/* Question Type */}
      <select
        value={filters.type}
        onChange={e => onChange({ type: e.target.value })}
        className={selectClass}
      >
        <option value="">Type de question</option>
        <option value="Exercice">Exercice</option>
        <option value="Problème">Problème</option>
        <option value="QCM">QCM</option>
        <option value="Rédaction">Rédaction</option>
      </select>

      {/* Topic / Paper */}
      {topics.length > 0 && (
        <select
          value={filters.topic}
          onChange={e => onChange({ topic: e.target.value })}
          className={selectClass}
        >
          <option value="">Tous les chapitres</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}

      {/* Difficulty */}
      <select
        value={filters.difficulty}
        onChange={e => onChange({ difficulty: e.target.value })}
        className={selectClass}
      >
        <option value="">Difficulté</option>
        <option value="facile">Facile</option>
        <option value="moyen">Moyen</option>
        <option value="difficile">Difficile</option>
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Question count */}
      {totalCount > 0 && (
        <span className="text-xs text-muted-foreground font-medium hidden sm:block">
          {totalCount} question{totalCount > 1 ? "s" : ""}
        </span>
      )}

      {/* Go to Question */}
      <div className="flex items-center gap-1.5">
        <Hash className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="number"
          min={1}
          max={totalCount || 1}
          value={goInput}
          onChange={e => setGoInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              const n = parseInt(goInput, 10);
              if (!isNaN(n) && n >= 1 && n <= totalCount) {
                onGoTo(n - 1);
                setGoInput("");
              }
            }
          }}
          placeholder="Aller à..."
          className="w-24 text-sm border border-border rounded-xl px-3 py-2 h-9 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

// ── Right action panel ──────────────────────────────────────────────────────────

function ActionPanel({
  question,
  selfMark,
  onMark,
  bookmarked,
  onBookmark,
  showMarkScheme,
  onToggleMarkScheme,
  onFinish,
  markedCount,
  totalCount,
  isPending,
}: {
  question: any;
  selfMark: SelfMark;
  onMark: (v: SelfMark) => void;
  bookmarked: boolean;
  onBookmark: () => void;
  showMarkScheme: boolean;
  onToggleMarkScheme: () => void;
  onFinish: () => void;
  markedCount: number;
  totalCount: number;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">

      {/* Bookmark + Complete row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBookmark}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all",
            bookmarked
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border hover:bg-muted text-muted-foreground"
          )}
        >
          {bookmarked
            ? <BookmarkCheck className="w-5 h-5" />
            : <Bookmark className="w-5 h-5" />}
          {bookmarked ? "Sauvegardé" : "Sauvegarder"}
        </button>
        <button
          onClick={() => {
            if (selfMark === "correct") onMark(null);
            else onMark("correct");
          }}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all",
            selfMark === "correct"
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-border hover:bg-muted text-muted-foreground"
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
          {selfMark === "correct" ? "Correct ✓" : "Complet"}
        </button>
      </div>

      {/* Self-assessment */}
      <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Auto-évaluation
        </p>
        <div className="space-y-2">
          {([
            { value: "correct" as SelfMark,   label: "Correct",   icon: CheckCircle2, active: "bg-emerald-500 border-emerald-500 text-white", base: "text-emerald-700 border-emerald-200 hover:bg-emerald-50" },
            { value: "partial" as SelfMark,   label: "Partiel",   icon: MinusCircle,  active: "bg-amber-500 border-amber-500 text-white",   base: "text-amber-700 border-amber-200 hover:bg-amber-50" },
            { value: "incorrect" as SelfMark, label: "Incorrect", icon: XCircle,      active: "bg-red-500 border-red-500 text-white",       base: "text-red-700 border-red-200 hover:bg-red-50" },
          ] as const).map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => onMark(selfMark === opt.value ? null : opt.value)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  selfMark === opt.value ? opt.active : cn("bg-background", opt.base)
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mark Scheme */}
      <button
        onClick={onToggleMarkScheme}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all",
          showMarkScheme
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
            : "border-border hover:bg-muted text-foreground"
        )}
      >
        <BookMarked className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Corrigé / Barème</span>
        {showMarkScheme ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {/* Video Solution */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm font-semibold text-muted-foreground">
        <Video className="w-4 h-4 shrink-0" />
        <span className="flex-1">Correction vidéo</span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full">
          Bientôt
        </span>
      </div>

      {/* AI Feedback */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm font-semibold text-muted-foreground">
        <Sparkles className="w-4 h-4 shrink-0 text-yellow-500" />
        <span className="flex-1">Feedback IA</span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full">
          Bientôt
        </span>
      </div>

      {/* Progress + Finish */}
      <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">Progression</span>
          <span className="font-bold text-primary">{markedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(markedCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
        <button
          onClick={onFinish}
          disabled={markedCount === 0 || isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Enregistrement..." : "Terminer la révision"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main question card ──────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  selfMark,
  showMarkScheme,
}: {
  question: any;
  index: number;
  selfMark: SelfMark;
  showMarkScheme: boolean;
}) {
  const markBorder =
    selfMark === "correct"   ? "ring-2 ring-emerald-400 dark:ring-emerald-600" :
    selfMark === "partial"   ? "ring-2 ring-amber-400 dark:ring-amber-600" :
    selfMark === "incorrect" ? "ring-2 ring-red-400 dark:ring-red-600" :
    "";

  return (
    <div className={cn(
      "bg-background rounded-2xl border border-border shadow-sm overflow-hidden transition-all",
      markBorder
    )}>
      {/* Card header */}
      <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3 flex-wrap">
        {/* Calculator */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          question.requiresCalculator
            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
            : "bg-muted text-muted-foreground border-border"
        )}>
          <Calculator className="w-3 h-3" />
          {question.requiresCalculator ? "Calculatrice" : "Sans calculatrice"}
        </div>

        <DifficultyBadge difficulty={question.difficulty} />

        {question.totalMarks && (
          <span className="text-xs text-muted-foreground font-medium">
            {question.totalMarks} pt{question.totalMarks > 1 ? "s" : ""}
          </span>
        )}

        {question.topic && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {question.topic}
          </span>
        )}

        {question.estimatedTimeMinutes && (
          <span className="text-xs text-muted-foreground ml-auto">
            ~{question.estimatedTimeMinutes} min
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 py-8 space-y-6">

        {/* Context / stimulus */}
        {question.context && (
          <div
            className="text-sm bg-muted/40 rounded-xl p-4 border border-border leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: question.context }}
          />
        )}

        {/* Main question text */}
        <p className="text-base font-medium text-foreground leading-relaxed whitespace-pre-wrap">
          {question.questionText}
        </p>

        {/* Parts */}
        {question.parts?.length > 0 && (
          <div className="space-y-4 pt-2">
            {question.parts.map((part: any, i: number) => (
              <div key={part.id ?? i} className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <span className="inline-flex w-7 h-7 rounded-full bg-primary/10 items-center justify-center text-xs font-bold text-primary">
                    {part.label}
                  </span>
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm text-foreground leading-relaxed">{part.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {part.marks} pt{part.marks > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mark Scheme (inline, toggled from right panel) */}
        {showMarkScheme && (
          <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Corrigé / Barème
              </p>
            </div>
            {question.markScheme?.length > 0 ? (
              <div className="space-y-3">
                {question.markScheme.map((ms: any, i: number) => (
                  <div key={ms.id ?? i} className="flex gap-3">
                    {ms.partLabel && (
                      <span className="shrink-0 inline-flex w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {ms.partLabel}
                      </span>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap">
                        {ms.answer}
                      </p>
                      {ms.marksBreakdown && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {ms.marksBreakdown}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Corrigé non disponible pour cette question.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result screen ───────────────────────────────────────────────────────────────

function ResultScreen({
  grade,
  selfMarks,
  subject,
  onRetry,
}: {
  grade: number | null;
  selfMarks: Record<number, SelfMark>;
  subject: string;
  onRetry: () => void;
}) {
  const correctC  = Object.values(selfMarks).filter(m => m === "correct").length;
  const partialC  = Object.values(selfMarks).filter(m => m === "partial").length;
  const incorrectC = Object.values(selfMarks).filter(m => m === "incorrect").length;
  const gradeColor =
    grade !== null
      ? grade >= 15 ? "text-emerald-600 dark:text-emerald-400"
      : grade >= 10 ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"
      : "text-foreground";

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
            <p className="text-xl text-muted-foreground mt-1">/20</p>
          </div>
        )}
        <div className="flex justify-center gap-8 text-sm">
          {[
            { count: correctC,   label: "Correcte",   color: "text-emerald-600" },
            { count: partialC,   label: "Partielle",  color: "text-amber-600" },
            { count: incorrectC, label: "Incorrecte", color: "text-red-600" },
          ].map(({ count, label, color }) => (
            <div key={label} className="text-center">
              <p className={cn("text-2xl font-bold", color)}>{count}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {label}{count > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onRetry}
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

// ── Root component ──────────────────────────────────────────────────────────────

export function BanqueDeQuestionsSubject() {
  const [, params] = useRoute("/revision/:subject/banque-de-questions");
  const subject = params?.subject
    ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject))
    : "";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const sectionKey: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  // Filters
  const [filters, setFilters] = useState<Filters>({ topic: "", type: "", difficulty: "" });
  const updateFilters = (f: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...f }));
    setCurrentIdx(0);
    setShowMarkScheme(false);
  };

  // Viewer state
  const [currentIdx, setCurrentIdx]       = useState(0);
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [selfMarks, setSelfMarks]           = useState<Record<number, SelfMark>>({});
  const [bookmarks, setBookmarks]           = useState<Set<number>>(new Set());
  const [sessionDone, setSessionDone]       = useState(false);

  // Build the topics URL so it can be shown in error messages
  const topicsUrl = `/api/revision/content/topics?subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(gradeLevel)}${sectionKey ? `&sectionKey=${encodeURIComponent(sectionKey)}` : ""}`;

  // Fetch topics
  const { data: topics = [], isError: topicsError, error: topicsErrorObj } = useQuery<string[]>({
    queryKey: ["revision-topics", subject, gradeLevel, sectionKey],
    queryFn: () => apiFetch(topicsUrl),
    enabled: !!subject && !!gradeLevel,
  });

  // Build query params
  const queryParams = new URLSearchParams({
    subject,
    gradeLevel,
    ...(sectionKey && { sectionKey }),
    ...(filters.topic && { topic: filters.topic }),
    ...(filters.difficulty && { difficulty: filters.difficulty }),
    ...(filters.type && { type: filters.type }),
    limit: "20",
  });

  const questionsUrl = `/api/revision/content/questions?${queryParams}`;
  const { data: questions = [] as any[], isLoading, isError: questionsError, error: questionsErrorObj } = useQuery<any[]>({
    queryKey: ["revision-questions", subject, gradeLevel, sectionKey, filters],
    queryFn: () => apiFetch(questionsUrl),
    enabled: !!subject && !!gradeLevel,
  });

  // Reset on filter change
  useEffect(() => {
    setCurrentIdx(0);
    setShowMarkScheme(false);
  }, [filters]);

  // Save attempt
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
  const selfMark        = currentQuestion ? (selfMarks[currentQuestion.id] ?? null) : null;
  const markedCount     = Object.keys(selfMarks).length;
  const totalQuestions  = questions.length;

  function goTo(idx: number) {
    const clamped = Math.max(0, Math.min(idx, totalQuestions - 1));
    setCurrentIdx(clamped);
    setShowMarkScheme(false);
  }

  function toggleBookmark(id: number) {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleFinishSession() {
    const marked = questions.filter((q: any) => selfMarks[q.id]);
    if (marked.length === 0) {
      toast({ title: "Aucune question évaluée", description: "Évalue au moins une question avant de terminer." });
      return;
    }
    const totalMarks  = marked.reduce((s: number, q: any) => s + (q.totalMarks ?? 1), 0);
    const marksAwarded = marked.reduce((s: number, q: any) => {
      const m = selfMarks[q.id];
      const qm = q.totalMarks ?? 1;
      return m === "correct" ? s + qm : m === "partial" ? s + Math.floor(qm / 2) : s;
    }, 0);
    const correctCount = Object.values(selfMarks).filter(m => m === "correct").length;
    const answers = marked.map((q: any) => ({
      questionId:      q.id,
      subject,
      topic:           q.topic,
      isCorrect:       selfMarks[q.id] === "correct",
      marksAwarded:    selfMarks[q.id] === "correct" ? (q.totalMarks ?? 1)
                     : selfMarks[q.id] === "partial"  ? Math.floor((q.totalMarks ?? 1) / 2) : 0,
      marksAvailable:  q.totalMarks ?? 1,
    }));
    saveAttempt.mutate({
      type: "practice", subject, gradeLevel, sectionKey,
      topic: filters.topic || undefined,
      totalMarks, marksAwarded,
      questionsCount: marked.length, correctCount, answers,
    });
    setSessionDone(true);
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (sessionDone && saveAttempt.data) {
    return (
      <ResultScreen
        grade={saveAttempt.data.gradeOutOf20}
        selfMarks={selfMarks}
        subject={subject}
        onRetry={() => {
          setSelfMarks({}); setBookmarks(new Set());
          setShowMarkScheme(false); setSessionDone(false); setCurrentIdx(0);
        }}
      />
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Breadcrumb + title ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">Révision Étude+</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${subjectToSlug(subject)}`} className="hover:text-foreground transition-colors">
              {subject}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Banque de Questions</span>
          </div>
          <h1 className="text-2xl font-bold">{subject} — Banque de Questions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lis chaque question, essaie de répondre, révèle le corrigé et auto-évalue ta réponse.
          </p>
        </div>

        {/* ── Level not configured ───────────────────────────────────── */}
        {!gradeLevel && (
          <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Niveau non défini</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                <Link href="/student/settings" className="underline">Configure ton niveau scolaire</Link> pour voir les questions adaptées.
              </p>
            </div>
          </div>
        )}

        {/* ── Filter bar ─────────────────────────────────────────────── */}
        <FilterBar
          topics={topics}
          filters={filters}
          onChange={updateFilters}
          totalCount={totalQuestions}
          currentIdx={currentIdx}
          onGoTo={goTo}
        />

        {/* ── Loading ────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-5">
            <div className="space-y-4">
              <div className="h-8 w-40 bg-muted rounded-xl animate-pulse" />
              <div className="h-80 bg-muted rounded-2xl animate-pulse" />
            </div>
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
        )}

        {/* ── Error state ─────────────────────────────────────────────── */}
        {!isLoading && (questionsError || topicsError) && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-2xl border border-dashed border-red-200 dark:border-red-900">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500 opacity-70" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold">Impossible de charger les questions</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {(questionsErrorObj as any)?.message || (topicsErrorObj as any)?.message || "Erreur de chargement"}
              </p>
              <p className="text-xs text-muted-foreground mt-3 font-mono bg-muted px-3 py-1.5 rounded-lg break-all">
                {API_URL || window.location.origin}{questionsError ? questionsUrl : topicsUrl}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────── */}
        {!isLoading && !questionsError && questions.length === 0 && gradeLevel && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Aucune question disponible</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                Le contenu pour <strong>{subject}</strong>
                {filters.topic ? ` (${filters.topic})` : ""} sera disponible très bientôt.
              </p>
            </div>
          </div>
        )}

        {/* ── Two-panel viewer ───────────────────────────────────────── */}
        {!isLoading && questions.length > 0 && currentQuestion && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

            {/* ── Left: question ──────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Navigation dots + heading */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Prev */}
                <button
                  onClick={() => goTo(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Préc.
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((q: any, i: number) => {
                    const m = selfMarks[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => goTo(i)}
                        title={`Question ${i + 1}`}
                        className={cn(
                          "w-7 h-7 rounded-full text-[11px] font-bold transition-all border-2",
                          i === currentIdx
                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow"
                            : m === "correct"   ? "bg-emerald-500 border-emerald-500 text-white"
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

                {/* Next */}
                <button
                  onClick={() => goTo(currentIdx + 1)}
                  disabled={currentIdx === totalQuestions - 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  Suiv. <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <span className="ml-auto text-sm text-muted-foreground font-medium">
                  {currentIdx + 1} / {totalQuestions}
                </span>
              </div>

              {/* "Question N" heading */}
              <h2 className="text-2xl font-bold tracking-tight">
                Question {currentIdx + 1}
              </h2>

              {/* Question card */}
              <QuestionCard
                question={currentQuestion}
                index={currentIdx}
                selfMark={selfMark}
                showMarkScheme={showMarkScheme}
              />
            </div>

            {/* ── Right: action panel ─────────────────────────────────── */}
            <div className="lg:sticky lg:top-6">
              <ActionPanel
                question={currentQuestion}
                selfMark={selfMark}
                onMark={v => setSelfMarks(prev => ({ ...prev, [currentQuestion.id]: v }))}
                bookmarked={bookmarks.has(currentQuestion.id)}
                onBookmark={() => toggleBookmark(currentQuestion.id)}
                showMarkScheme={showMarkScheme}
                onToggleMarkScheme={() => setShowMarkScheme(v => !v)}
                onFinish={handleFinishSession}
                markedCount={markedCount}
                totalCount={totalQuestions}
                isPending={saveAttempt.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
