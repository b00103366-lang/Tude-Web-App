/**
 * Admin Manual Question Entry
 * Allows admins to type a question + mark scheme directly.
 * Questions are saved as 'published' immediately — students see them right away.
 * Route: /admin/manual-question
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import {
  PenLine, Plus, Trash2, CheckCircle2, Loader2, ChevronLeft,
  BookOpen, AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// ── Constants ─────────────────────────────────────────────────────────────────

type GradeOption = { value: string; label: string; sectionKey?: string };

const GRADE_OPTIONS: GradeOption[] = [
  { value: "7eme",             label: "7ème année de base" },
  { value: "8eme",             label: "8ème année de base" },
  { value: "9eme",             label: "9ème année de base" },
  { value: "1ere_secondaire",  label: "1ère année secondaire" },
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

const QUESTION_TYPES = [
  { value: "Exercice",  label: "Exercice" },
  { value: "QCM",       label: "QCM" },
  { value: "Problème",  label: "Problème" },
  { value: "Rédaction", label: "Rédaction / Essai" },
];

const DIFFICULTIES = [
  { value: "facile",    label: "Facile",    color: "text-green-600" },
  { value: "moyen",     label: "Moyen",     color: "text-amber-600" },
  { value: "difficile", label: "Difficile", color: "text-red-600" },
];

// ── Part row type ─────────────────────────────────────────────────────────────

interface Part {
  id: string;
  label: string;
  text: string;
  marks: string;
  answer: string;
}

function newPart(index: number): Part {
  return {
    id: `${Date.now()}-${Math.random()}`,
    label: String.fromCharCode(97 + index), // a, b, c…
    text: "",
    marks: "",
    answer: "",
  };
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function inputCls(extra = "") {
  return cn(
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm",
    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all",
    extra,
  );
}

function selectCls() {
  return cn(
    "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm",
    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all",
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminManualQuestion() {
  const { toast } = useToast();

  // Form fields
  const [subject,     setSubject]     = useState("");
  const [gradeKey,    setGradeKey]    = useState<GradeOption | null>(null);
  const [topic,       setTopic]       = useState("");
  const [type,        setType]        = useState("Exercice");
  const [difficulty,  setDifficulty]  = useState("moyen");
  const [questionText, setQuestionText] = useState("");
  const [context,     setContext]     = useState("");
  const [totalMarks,  setTotalMarks]  = useState("");
  const [hasParts,    setHasParts]    = useState(false);
  const [parts,       setParts]       = useState<Part[]>([newPart(0)]);
  // When no parts: single mark scheme answer
  const [simpleAnswer, setSimpleAnswer] = useState("");

  const [saving,   setSaving]   = useState(false);
  const [lastSaved, setLastSaved] = useState<{ id: number; subject: string; topic: string } | null>(null);

  // ── Part CRUD ───────────────────────────────────────────────────────────────

  function addPart() {
    setParts(prev => [...prev, newPart(prev.length)]);
  }

  function removePart(id: string) {
    setParts(prev => {
      const next = prev.filter(p => p.id !== id);
      return next.map((p, i) => ({ ...p, label: String.fromCharCode(97 + i) }));
    });
  }

  function updatePart(id: string, field: keyof Part, value: string) {
    setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !gradeKey || !topic || !questionText) return;

    setSaving(true);
    try {
      const partsPayload = hasParts
        ? parts.map(p => ({ label: p.label, text: p.text, marks: Number(p.marks) || 0 }))
        : [];

      const markSchemePayload = hasParts
        ? parts
            .filter(p => p.answer.trim())
            .map(p => ({ partLabel: p.label, answer: p.answer }))
        : simpleAnswer.trim()
          ? [{ partLabel: "a", answer: simpleAnswer }]
          : [];

      const data = await apiFetch<{ id: number; status: string }>(`${API}/api/kb/questions/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          gradeLevel:  gradeKey.value,
          sectionKey:  gradeKey.sectionKey ?? null,
          topic,
          type,
          difficulty,
          questionText,
          context:     context || null,
          totalMarks:  totalMarks ? Number(totalMarks) : null,
          parts:       partsPayload,
          markScheme:  markSchemePayload,
        }),
      });

      if (!data) {
        toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
        return;
      }

      setLastSaved({ id: data.id, subject, topic });
      toast({ title: "Question publiée", description: `ID #${data.id} — visible immédiatement pour les étudiants.` });

      // Reset form for next question, keep subject/grade/topic for quick batch entry
      setQuestionText("");
      setContext("");
      setSimpleAnswer("");
      setParts([newPart(0)]);
      setHasParts(false);

    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !!subject && !!gradeKey && !!topic && !!questionText && !saving;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Link
            href="/admin/knowledge-base"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Base de connaissances
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="w-6 h-6 text-primary" />
            Saisie manuelle de question
          </h1>
          <p className="text-muted-foreground mt-1">
            Tapez une question et son corrigé. Elle est publiée immédiatement — les étudiants peuvent la voir tout de suite.
          </p>
        </div>

        {/* Success banner */}
        {lastSaved && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-5 py-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Question #{lastSaved.id} publiée dans la banque
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {lastSaved.subject} · {lastSaved.topic}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Context fields */}
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <BookOpen className="w-4 h-4" /> Contexte
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Matière *
                </label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className={selectCls()} required>
                  <option value="">Sélectionner...</option>
                  {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Niveau / Section *
                </label>
                <select
                  value={gradeKey ? `${gradeKey.value}__${gradeKey.sectionKey ?? ""}` : ""}
                  onChange={e => {
                    const [val, sk] = e.target.value.split("__");
                    setGradeKey(GRADE_OPTIONS.find(g => g.value === val && (g.sectionKey ?? "") === sk) ?? null);
                  }}
                  className={selectCls()}
                  required
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Chapitre / Thème *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="ex. Fonctions linéaires"
                  className={inputCls()}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Total des points
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalMarks}
                  onChange={e => setTotalMarks(e.target.value)}
                  placeholder="ex. 4"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Type
                </label>
                <select value={type} onChange={e => setType(e.target.value)} className={selectCls()}>
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Difficulté
                </label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={selectCls()}>
                  {DIFFICULTIES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Question text */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Énoncé de la question *
            </h2>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              rows={5}
              placeholder="Tapez la question ici..."
              className={inputCls("resize-none")}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Contexte / Tableau / Données (optionnel)
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={3}
                placeholder="Tableau, extrait, données supplémentaires..."
                className={inputCls("resize-none")}
              />
            </div>
          </Card>

          {/* Parts toggle */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sous-questions (parties)
              </h2>
              <button
                type="button"
                onClick={() => setHasParts(v => !v)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors",
                  hasParts
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {hasParts ? "Désactiver" : "Ajouter des parties a), b), c)..."}
              </button>
            </div>

            {!hasParts && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Corrigé / Réponse attendue
                </label>
                <textarea
                  value={simpleAnswer}
                  onChange={e => setSimpleAnswer(e.target.value)}
                  rows={4}
                  placeholder="Réponse modèle pour cette question..."
                  className={inputCls("resize-none")}
                />
              </div>
            )}

            {hasParts && (
              <div className="space-y-4">
                {parts.map((part, i) => (
                  <div key={part.id} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">Partie {part.label})</span>
                      {parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePart(part.id)}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Énoncé</label>
                        <textarea
                          rows={2}
                          value={part.text}
                          onChange={e => updatePart(part.id, "text", e.target.value)}
                          placeholder={`Texte de la partie ${part.label})...`}
                          className={inputCls("resize-none")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Points</label>
                        <input
                          type="number"
                          min="0"
                          value={part.marks}
                          onChange={e => updatePart(part.id, "marks", e.target.value)}
                          placeholder="2"
                          className={inputCls()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Corrigé partie {part.label})</label>
                      <textarea
                        rows={2}
                        value={part.answer}
                        onChange={e => updatePart(part.id, "answer", e.target.value)}
                        placeholder="Réponse attendue pour cette partie..."
                        className={inputCls("resize-none")}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPart}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Ajouter une partie
                </button>
              </div>
            )}
          </Card>

          {/* Info banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              La question sera publiée <strong>immédiatement</strong> — pas besoin d'appuyer sur "Publier tout". Elle apparaît dans la banque de questions de l'étudiant dès la soumission.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Publier la question</>
            )}
          </button>

        </form>
      </div>
    </DashboardLayout>
  );
}
