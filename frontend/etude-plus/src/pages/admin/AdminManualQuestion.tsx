/**
 * Admin Manual Content Entry
 * Add questions, flashcards, or practice exam questions manually.
 * All content goes live immediately — no AI needed.
 * Route: /admin/manual-question
 */

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import {
  PenLine, Plus, Trash2, CheckCircle2, Loader2,
  ChevronLeft, BookOpen, Layers, FileText, Brain,
  Pencil, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const SUPABASE_FN = "https://hilqkzjqysqjbfftqlkf.supabase.co/functions/v1";

// ── Shared data ───────────────────────────────────────────────────────────────

type GradeOption = { value: string; label: string; sectionKey?: string };

const GRADE_OPTIONS: GradeOption[] = [
  { value: "7eme",            label: "7ème année de base" },
  { value: "8eme",            label: "8ème année de base" },
  { value: "9eme",            label: "9ème année de base" },
  { value: "1ere_secondaire", label: "1ère année secondaire" },
  { value: "2eme", sectionKey: "sciences",       label: "2ème — Sciences" },
  { value: "2eme", sectionKey: "lettres",        label: "2ème — Lettres" },
  { value: "2eme", sectionKey: "economie",       label: "2ème — Économie" },
  { value: "2eme", sectionKey: "technique",      label: "2ème — Technique" },
  { value: "2eme", sectionKey: "sport",          label: "2ème — Sport" },
  { value: "2eme", sectionKey: "informatique",   label: "2ème — Informatique" },
  { value: "3eme", sectionKey: "sciences_maths", label: "3ème — Sciences Maths" },
  { value: "3eme", sectionKey: "sciences_exp",   label: "3ème — Sciences Exp" },
  { value: "3eme", sectionKey: "technique",      label: "3ème — Technique" },
  { value: "3eme", sectionKey: "economie",       label: "3ème — Économie" },
  { value: "3eme", sectionKey: "lettres",        label: "3ème — Lettres" },
  { value: "3eme", sectionKey: "sport",          label: "3ème — Sport" },
  { value: "3eme", sectionKey: "informatique",   label: "3ème — Informatique" },
  { value: "bac",  sectionKey: "sciences_maths", label: "Bac — Sciences Maths" },
  { value: "bac",  sectionKey: "sciences_exp",   label: "Bac — Sciences Exp" },
  { value: "bac",  sectionKey: "technique",      label: "Bac — Technique" },
  { value: "bac",  sectionKey: "economie",       label: "Bac — Économie" },
  { value: "bac",  sectionKey: "lettres",        label: "Bac — Lettres" },
  { value: "bac",  sectionKey: "sport",          label: "Bac — Sport" },
  { value: "bac",  sectionKey: "informatique",   label: "Bac — Informatique" },
];

const ALL_SUBJECTS = [
  "Mathématiques", "Physique-Chimie", "Sciences Naturelles", "Informatique",
  "Arabe", "Français", "Anglais", "Espagnol", "Allemand", "Italien",
  "Histoire-Géographie", "Philosophie", "Économie", "Gestion", "Comptabilité",
  "Technologie", "Sciences de l'Ingénieur", "Sport",
  "Éducation Islamique", "Éducation Artistique", "Éducation Musicale", "Éducation Civique",
];

const QUESTION_TYPES = ["Exercice", "QCM", "Problème", "Rédaction"];
const DIFFICULTIES    = [
  { value: "facile",    label: "Facile" },
  { value: "moyen",     label: "Moyen" },
  { value: "difficile", label: "Difficile" },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputCls = (extra = "") =>
  cn("w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm",
     "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all", extra);

const selectCls = () =>
  cn("w-full h-10 rounded-xl border border-border bg-background px-3 text-sm",
     "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all");

// ── Context picker (reused by all tabs) ───────────────────────────────────────

function ContextPicker({
  subject, setSubject,
  gradeKey, setGradeKey,
  topic, setTopic,
}: {
  subject: string; setSubject: (v: string) => void;
  gradeKey: GradeOption | null; setGradeKey: (v: GradeOption | null) => void;
  topic: string; setTopic: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Matière *</label>
        <select value={subject} onChange={e => setSubject(e.target.value)} className={selectCls()} required>
          <option value="">Sélectionner...</option>
          {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Niveau / Section *</label>
        <select
          value={gradeKey ? `${gradeKey.value}__${gradeKey.sectionKey ?? ""}` : ""}
          onChange={e => {
            const [val, sk] = e.target.value.split("__");
            setGradeKey(GRADE_OPTIONS.find(g => g.value === val && (g.sectionKey ?? "") === sk) ?? null);
          }}
          className={selectCls()} required
        >
          <option value="">Sélectionner...</option>
          {GRADE_OPTIONS.map(g => (
            <option key={`${g.value}__${g.sectionKey ?? ""}`} value={`${g.value}__${g.sectionKey ?? ""}`}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Chapitre / Thème *</label>
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="ex. Fonctions linéaires" className={inputCls()} required />
      </div>
    </div>
  );
}

// ── Success banner ────────────────────────────────────────────────────────────

function SuccessBanner({ label, id }: { label: string; id: number }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-5 py-4 flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
        {label} <span className="font-normal text-green-700 dark:text-green-400">#{id} ajouté — visible immédiatement pour les étudiants</span>
      </p>
    </div>
  );
}

// ── TAB 1: Question bank ──────────────────────────────────────────────────────

interface QuestionRow {
  id: number;
  subject: string;
  gradeLevel: string;
  sectionKey: string | null;
  topic: string;
  type: string;
  difficulty: string;
  questionText: string;
  totalMarks: number | null;
  status: string;
  kbFileId: number | null;
  createdAt: string;
  markScheme: Array<{ partLabel: string; answer: string; orderIndex: number }>;
}

const DIFF_BADGE: Record<string, string> = {
  facile:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  moyen:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  difficile: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function QuestionTab() {
  const { toast } = useToast();
  const [subject, setSubject]       = useState("");
  const [gradeKey, setGradeKey]     = useState<GradeOption | null>(null);
  const [topic, setTopic]           = useState("");
  const [type, setType]             = useState("Exercice");
  const [difficulty, setDifficulty] = useState("moyen");
  const [questionText, setQuestionText] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [simpleAnswer, setSimpleAnswer] = useState("");
  const [hasParts, setHasParts]     = useState(false);
  const [parts, setParts]           = useState([{ label: "a", text: "", marks: "", answer: "" }]);
  const [saving, setSaving]         = useState(false);

  const [questionList, setQuestionList] = useState<QuestionRow[]>([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [editId, setEditId]             = useState<number | null>(null);

  useEffect(() => {
    if (!subject || !gradeKey || !topic) { setQuestionList([]); return; }
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, gradeKey?.value, gradeKey?.sectionKey, topic]);

  async function loadQuestions() {
    setLoadingList(true);
    const params = new URLSearchParams({ subject, gradeLevel: gradeKey!.value, topic });
    if (gradeKey!.sectionKey) params.set("sectionKey", gradeKey!.sectionKey);
    const data = await apiFetch<QuestionRow[]>(`${SUPABASE_FN}/admin-questions?${params}`);
    setQuestionList(data ?? []);
    setLoadingList(false);
  }

  function startEdit(q: QuestionRow) {
    setEditId(q.id);
    setType(q.type ?? "Exercice");
    setDifficulty(q.difficulty ?? "moyen");
    setQuestionText(q.questionText ?? "");
    setTotalMarks(q.totalMarks != null ? String(q.totalMarks) : "");
    setHasParts(false);
    setSimpleAnswer(q.markScheme?.[0]?.answer ?? "");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setQuestionText(""); setSimpleAnswer(""); setTotalMarks("");
    setParts([{ label: "a", text: "", marks: "", answer: "" }]); setHasParts(false);
  }

  async function deleteQuestion(id: number) {
    if (!window.confirm("Supprimer cette question définitivement ?")) return;
    const res = await apiFetch<{ deleted: boolean }>(`${SUPABASE_FN}/admin-questions?id=${id}`, {
      method: "DELETE",
    });
    if (!res) {
      toast({ title: "Erreur", description: "Impossible de supprimer la question.", variant: "destructive" });
      return;
    }
    toast({ title: "Question supprimée" });
    loadQuestions();
  }

  function addPart() {
    setParts(p => [...p, { label: String.fromCharCode(97 + p.length), text: "", marks: "", answer: "" }]);
  }
  function removePart(i: number) {
    setParts(p => p.filter((_, j) => j !== i).map((x, j) => ({ ...x, label: String.fromCharCode(97 + j) })));
  }
  function updatePart(i: number, field: string, val: string) {
    setParts(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !gradeKey || !topic || !questionText) return;
    setSaving(true);
    try {
      const payload = {
        subject, gradeLevel: gradeKey.value, sectionKey: gradeKey.sectionKey ?? null,
        topic, type, difficulty, questionText,
        totalMarks: totalMarks ? Number(totalMarks) : null,
        parts: hasParts ? parts.map(p => ({ label: p.label, text: p.text, marks: Number(p.marks) || 0 })) : [],
        markScheme: hasParts
          ? parts.filter(p => p.answer).map(p => ({ partLabel: p.label, answer: p.answer }))
          : simpleAnswer ? [{ partLabel: "a", answer: simpleAnswer }] : [],
      };

      const url = editId
        ? `${SUPABASE_FN}/admin-questions?id=${editId}`
        : `${SUPABASE_FN}/admin-questions`;
      const method = editId ? "PUT" : "POST";

      const data = await apiFetch<{ id: number }>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!data) {
        toast({ title: "Erreur serveur", description: "Impossible d'enregistrer la question. Vérifiez la console (F12) pour le détail.", variant: "destructive" });
        return;
      }

      toast({ title: editId ? "Question mise à jour ✓" : "Question publiée dans la banque ✓" });
      setEditId(null);
      setQuestionText(""); setSimpleAnswer(""); setTotalMarks("");
      setParts([{ label: "a", text: "", marks: "", answer: "" }]); setHasParts(false);
      loadQuestions();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* Questions list */}
      {subject && gradeKey && topic && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Questions enregistrées
              {questionList.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({questionList.length})</span>}
            </span>
            <button type="button" onClick={loadQuestions} disabled={loadingList}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RefreshCw className={cn("w-3.5 h-3.5", loadingList && "animate-spin")} />
            </button>
          </div>

          {loadingList && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          )}

          {!loadingList && questionList.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune question pour ce chapitre.</p>
          )}

          {!loadingList && questionList.length > 0 && (
            <div className="space-y-2">
              {questionList.map(q => (
                <div key={q.id}
                  className={cn("flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    editId === q.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", DIFF_BADGE[q.difficulty] ?? DIFF_BADGE.moyen)}>
                        {q.difficulty}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                        q.kbFileId == null
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300")}>
                        {q.kbFileId == null ? "Manuel" : "IA"}
                      </span>
                      {q.totalMarks != null && (
                        <span className="text-xs text-muted-foreground">{q.totalMarks} pts</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => editId === q.id ? cancelEdit() : startEdit(q)}
                      className={cn("p-1.5 rounded-lg transition-colors",
                        editId === q.id
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit form */}
      <form onSubmit={submit} className="space-y-5">
        {editId && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">Mode édition — question #{editId}</span>
            <button type="button" onClick={cancelEdit}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
          </div>
        )}

        <Card className="p-5 space-y-4">
          <ContextPicker subject={subject} setSubject={setSubject} gradeKey={gradeKey} setGradeKey={setGradeKey} topic={topic} setTopic={setTopic} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={selectCls()}>
                {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Difficulté</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={selectCls()}>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Points</label>
              <input type="number" min="0" value={totalMarks} onChange={e => setTotalMarks(e.target.value)}
                placeholder="ex. 4" className={inputCls()} />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Énoncé de la question *</label>
          <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
            rows={4} placeholder="Tapez la question ici..." className={inputCls("resize-none")} required />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium">Sous-questions (parties)</span>
            <button type="button" onClick={() => setHasParts(v => !v)}
              className={cn("px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors",
                hasParts ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
              {hasParts ? "Supprimer les parties" : "Ajouter a), b), c)..."}
            </button>
          </div>

          {!hasParts && (
            <>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Corrigé / Réponse</label>
              <textarea value={simpleAnswer} onChange={e => setSimpleAnswer(e.target.value)}
                rows={3} placeholder="Réponse attendue..." className={inputCls("resize-none")} />
            </>
          )}

          {hasParts && (
            <div className="space-y-3">
              {parts.map((p, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{p.label})</span>
                    {parts.length > 1 && (
                      <button type="button" onClick={() => removePart(i)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <textarea rows={2} value={p.text} onChange={e => updatePart(i, "text", e.target.value)}
                        placeholder={`Énoncé partie ${p.label})...`} className={inputCls("resize-none")} />
                    </div>
                    <div>
                      <input type="number" min="0" value={p.marks} onChange={e => updatePart(i, "marks", e.target.value)}
                        placeholder="pts" className={inputCls()} />
                    </div>
                  </div>
                  <textarea rows={2} value={p.answer} onChange={e => updatePart(i, "answer", e.target.value)}
                    placeholder={`Corrigé partie ${p.label})...`} className={inputCls("resize-none")} />
                </div>
              ))}
              <button type="button" onClick={addPart}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Plus className="w-4 h-4" /> Ajouter une partie
              </button>
            </div>
          )}
        </Card>

        <button type="submit" disabled={!subject || !gradeKey || !topic || !questionText || saving}
          className="w-full py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            : editId
              ? <><CheckCircle2 className="w-4 h-4" /> Mettre à jour la question</>
              : <><CheckCircle2 className="w-4 h-4" /> Publier dans la banque de questions</>}
        </button>
      </form>
    </div>
  );
}

// ── TAB 2: Flashcard ─────────────────────────────────────────────────────────

function FlashcardTab() {
  const { toast } = useToast();
  const [subject, setSubject]   = useState("");
  const [gradeKey, setGradeKey] = useState<GradeOption | null>(null);
  const [topic, setTopic]       = useState("");
  const [front, setFront]       = useState("");
  const [back, setBack]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [lastId, setLastId]     = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !gradeKey || !topic || !front || !back) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ id: number }>(`${API}/api/kb/flashcards/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, gradeLevel: gradeKey.value, sectionKey: gradeKey.sectionKey ?? null, topic, front, back }),
      });
      if (!data) {
        toast({ title: "Erreur serveur", description: "Impossible d'enregistrer la flashcard. Vérifiez la console (F12).", variant: "destructive" });
        return;
      }
      setLastId(data.id);
      toast({ title: "Flashcard ajoutée ✓" });
      setFront(""); setBack("");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {lastId && <SuccessBanner label="Flashcard" id={lastId} />}

      <Card className="p-5 space-y-4">
        <ContextPicker subject={subject} setSubject={setSubject} gradeKey={gradeKey} setGradeKey={setGradeKey} topic={topic} setTopic={setTopic} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">R</span>
            </div>
            <span className="text-sm font-bold">Recto (Question)</span>
          </div>
          <textarea value={front} onChange={e => setFront(e.target.value)}
            rows={5} placeholder="Ce qui s'affiche en premier sur la flashcard..." className={inputCls("resize-none")} required />
        </Card>

        <Card className="p-5 space-y-3 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">V</span>
            </div>
            <span className="text-sm font-bold">Verso (Réponse)</span>
          </div>
          <textarea value={back} onChange={e => setBack(e.target.value)}
            rows={5} placeholder="La réponse / définition qui apparaît en retournant la carte..." className={inputCls("resize-none")} required />
        </Card>
      </div>

      <button type="submit" disabled={!subject || !gradeKey || !topic || !front || !back || saving}
        className="w-full py-3.5 rounded-xl font-bold text-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Brain className="w-4 h-4" /> Ajouter la flashcard</>}
      </button>
    </form>
  );
}

// ── TAB 3: Practice exam ──────────────────────────────────────────────────────

interface ExamQuestion {
  question: string;
  totalMarks: string;
  answer: string;
}

function PracticeExamTab() {
  const { toast } = useToast();
  const [subject, setSubject]   = useState("");
  const [gradeKey, setGradeKey] = useState<GradeOption | null>(null);
  const [topic, setTopic]       = useState("");
  const [year, setYear]         = useState("");
  const [questions, setQuestions] = useState<ExamQuestion[]>([{ question: "", totalMarks: "", answer: "" }]);
  const [saving, setSaving]     = useState(false);
  const [lastId, setLastId]     = useState<number | null>(null);

  function addQ() {
    setQuestions(q => [...q, { question: "", totalMarks: "", answer: "" }]);
  }
  function removeQ(i: number) {
    setQuestions(q => q.filter((_, j) => j !== i));
  }
  function updateQ(i: number, field: keyof ExamQuestion, val: string) {
    setQuestions(q => q.map((x, j) => j === i ? { ...x, [field]: val } : x));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !gradeKey || !topic || questions.length === 0) return;
    setSaving(true);
    try {
      const qs = questions.map(q => ({
        question: q.question,
        totalMarks: q.totalMarks ? Number(q.totalMarks) : undefined,
        parts: [],
      }));
      const sols = questions.map(q => ({ answer: q.answer }));
      const data = await apiFetch<{ id: number }>(`${API}/api/kb/annales/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject, gradeLevel: gradeKey.value, sectionKey: gradeKey.sectionKey ?? null,
          topic, year: year ? Number(year) : null,
          questions: qs, solutions: sols,
        }),
      });
      if (!data) {
        toast({ title: "Erreur serveur", description: "Impossible d'enregistrer l'examen. Vérifiez la console (F12).", variant: "destructive" });
        return;
      }
      setLastId(data.id);
      toast({ title: "Examen pratique ajouté ✓" });
      setQuestions([{ question: "", totalMarks: "", answer: "" }]); setYear("");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {lastId && <SuccessBanner label="Examen pratique" id={lastId} />}

      <Card className="p-5 space-y-4">
        <ContextPicker subject={subject} setSubject={setSubject} gradeKey={gradeKey} setGradeKey={setGradeKey} topic={topic} setTopic={setTopic} />
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Année (optionnel)</label>
          <input type="number" min="2000" max="2030" value={year} onChange={e => setYear(e.target.value)}
            placeholder="ex. 2024" className={inputCls("max-w-[160px]")} />
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold">Question {i + 1}</span>
              </div>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQ(i)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <textarea rows={3} value={q.question} onChange={e => updateQ(i, "question", e.target.value)}
                  placeholder="Énoncé de la question..." className={inputCls("resize-none")} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Points</label>
                <input type="number" min="0" value={q.totalMarks} onChange={e => updateQ(i, "totalMarks", e.target.value)}
                  placeholder="ex. 4" className={inputCls()} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Corrigé</label>
              <textarea rows={2} value={q.answer} onChange={e => updateQ(i, "answer", e.target.value)}
                placeholder="Réponse modèle pour cette question..." className={inputCls("resize-none")} />
            </div>
          </Card>
        ))}
      </div>

      <button type="button" onClick={addQ}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Ajouter une question
      </button>

      <button type="submit" disabled={!subject || !gradeKey || !topic || questions.some(q => !q.question) || saving}
        className="w-full py-3.5 rounded-xl font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><FileText className="w-4 h-4" /> Publier l'examen pratique</>}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "question" | "flashcard" | "exam";

const TABS: { id: Tab; label: string; desc: string; icon: any; color: string; active: string }[] = [
  {
    id: "question",  label: "Banque de questions", desc: "Questions avec corrigé notées",
    icon: BookOpen,
    color: "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
    active: "border-primary bg-primary/5 text-primary",
  },
  {
    id: "flashcard", label: "Flashcards", desc: "Cartes recto / verso",
    icon: Brain,
    color: "border-border text-muted-foreground hover:border-purple-400/50 hover:text-foreground",
    active: "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  },
  {
    id: "exam", label: "Examen pratique", desc: "Sujets d'annale complets",
    icon: FileText,
    color: "border-border text-muted-foreground hover:border-amber-400/50 hover:text-foreground",
    active: "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  },
];

export function AdminManualQuestion() {
  const [tab, setTab] = useState<Tab>("question");

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/knowledge-base"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ChevronLeft className="w-4 h-4" /> Base de connaissances
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saisie manuelle</h1>
              <p className="text-muted-foreground text-sm">Contenu publié immédiatement — visible par les étudiants sans attendre l'IA</p>
            </div>
          </div>
        </div>

        {/* Tab picker */}
        <div className="grid grid-cols-3 gap-3">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={cn("flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-all",
                  isActive ? t.active : t.color)}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-bold">{t.label}</span>
                </div>
                <span className="text-xs opacity-70">{t.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        {tab === "question"  && <QuestionTab />}
        {tab === "flashcard" && <FlashcardTab />}
        {tab === "exam"      && <PracticeExamTab />}

      </div>
    </DashboardLayout>
  );
}
