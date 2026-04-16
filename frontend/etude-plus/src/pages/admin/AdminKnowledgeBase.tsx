/**
 * Admin Knowledge Base — folder-based content manager.
 *
 * Level 1  →  Grade levels (all grades as cards)
 * Level 2  →  Subjects inside a grade
 * Level 3  →  Files inside a subject + upload modal
 *
 * Route: /admin/knowledge-base
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  SIMPLE_LEVELS, SECTION_LEVELS,
  getSubjectsForNiveauSection, getNiveauLabel, getSectionLabel, isSectionLevel,
} from "@/lib/educationConfig";
import {
  Folder, FolderOpen, ChevronRight, ChevronLeft,
  Upload, FileText, FileImage, Trash2, X, Plus,
  BookOpen, AlertCircle, CheckCircle2, Loader2, ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, apiFetchArray } from "@/lib/api";

const API = import.meta.env.VITE_API_URL ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

type FolderSummaryRow = {
  gradeLevel: string;
  sectionKey: string | null;
  subject: string;
  total: number;
  processed: number;
};

type KBFile = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  subject: string;
  gradeLevel: string;
  sectionKey: string | null;
  topic: string;
  contentType: string;
  status: "processing" | "processed" | "error";
  errorMessage: string | null;
  questionsCount: number;
  flashcardsCount: number;
  notionsCount: number;
  createdAt: string;
  processedAt: string | null;
};

type Level = "grades" | "subjects" | "files";

type GradeFolder = {
  gradeLevel: string;
  sectionKey: string | null;
  label: string;
};

// ── Grade level list ─────────────────────────────────────────────────────────

const GRADE_FOLDERS: GradeFolder[] = [
  { gradeLevel: "7eme",            sectionKey: null,            label: "7ème année de base" },
  { gradeLevel: "8eme",            sectionKey: null,            label: "8ème année de base" },
  { gradeLevel: "9eme",            sectionKey: null,            label: "9ème année de base" },
  { gradeLevel: "1ere_secondaire", sectionKey: null,            label: "1ère Secondaire" },
  { gradeLevel: "2eme",            sectionKey: "sciences",      label: "2ème — Sciences" },
  { gradeLevel: "2eme",            sectionKey: "lettres",       label: "2ème — Lettres" },
  { gradeLevel: "2eme",            sectionKey: "economie",      label: "2ème — Économie" },
  { gradeLevel: "2eme",            sectionKey: "technique",     label: "2ème — Technique" },
  { gradeLevel: "2eme",            sectionKey: "sport",         label: "2ème — Sport" },
  { gradeLevel: "2eme",            sectionKey: "informatique",  label: "2ème — Informatique" },
  { gradeLevel: "3eme",            sectionKey: "sciences_maths",label: "3ème — Sciences Maths" },
  { gradeLevel: "3eme",            sectionKey: "sciences_exp",  label: "3ème — Sciences Exp" },
  { gradeLevel: "3eme",            sectionKey: "technique",     label: "3ème — Technique" },
  { gradeLevel: "3eme",            sectionKey: "economie",      label: "3ème — Économie" },
  { gradeLevel: "3eme",            sectionKey: "lettres",       label: "3ème — Lettres" },
  { gradeLevel: "3eme",            sectionKey: "sport",         label: "3ème — Sport" },
  { gradeLevel: "3eme",            sectionKey: "informatique",  label: "3ème — Informatique" },
  { gradeLevel: "bac",             sectionKey: "sciences_maths",label: "Bac — Sciences Maths" },
  { gradeLevel: "bac",             sectionKey: "sciences_exp",  label: "Bac — Sciences Exp" },
  { gradeLevel: "bac",             sectionKey: "technique",     label: "Bac — Technique" },
  { gradeLevel: "bac",             sectionKey: "economie",      label: "Bac — Économie" },
  { gradeLevel: "bac",             sectionKey: "lettres",       label: "Bac — Lettres" },
  { gradeLevel: "bac",             sectionKey: "sport",         label: "Bac — Sport" },
  { gradeLevel: "bac",             sectionKey: "informatique",  label: "Bac — Informatique" },
];

const CONTENT_TYPES = [
  { value: "cours",     label: "Cours / Leçon" },
  { value: "examen",    label: "Examen / Contrôle" },
  { value: "exercices", label: "Exercices" },
  { value: "annale",    label: "Annale officielle" },
  { value: "resume",    label: "Résumé / Fiche" },
  { value: "manuel",    label: "Manuel scolaire" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(name: string, mime?: string | null) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.includes("pdf") || ext === "pdf")   return <FileText className="w-4 h-4 text-red-500" />;
  if (ext === "txt")                             return <FileText className="w-4 h-4 text-gray-500" />;
  if (ext === "pptx")                            return <FileText className="w-4 h-4 text-orange-500" />;
  if (mime?.includes("image") || ["jpg","jpeg","png"].includes(ext))
                                                 return <FileImage className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-400" />;
}

function StatusBadge({ status }: { status: KBFile["status"] }) {
  if (status === "processing") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Loader2 className="w-3 h-3 animate-spin" /> En traitement
    </span>
  );
  if (status === "processed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 className="w-3 h-3" /> Traité
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <AlertCircle className="w-3 h-3" /> Erreur
    </span>
  );
}

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  gradeFolder,
  subject,
  onClose,
  onUploaded,
}: {
  gradeFolder: GradeFolder;
  subject: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [topic, setTopic]             = useState("");
  const [contentType, setContentType] = useState("");
  const [notes, setNotes]             = useState("");
  const [files, setFiles]             = useState<File[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...incoming.filter(f => !existing.has(f.name))];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const canSubmit = topic && contentType && files.length > 0 && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    fd.append("subject",      subject);
    fd.append("grade_level",  gradeFolder.gradeLevel);
    if (gradeFolder.sectionKey) fd.append("section_key", gradeFolder.sectionKey);
    fd.append("topic",        topic);
    fd.append("content_type", contentType);
    if (notes) fd.append("notes", notes);

    try {
      const result = await apiFetch(`${API}/api/kb/upload`, { method: "POST", body: fd as any });
      if (result === null) throw new Error("Envoi échoué — vérifiez votre connexion");
      onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Ajouter des ressources</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {gradeFolder.label} → {subject}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Glisser-déposer ou cliquer pour parcourir</p>
          <p className="text-xs text-muted-foreground mt-1">PDF · TXT · PPTX · JPG · PNG — max 25 Mo</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.txt,.pptx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
          />
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-sm">
                {fileIcon(f.name, f.type)}
                <span className="flex-1 truncate font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Chapitre / Thème *</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="ex. Fonctions affines, La cellule..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Type de contenu *</label>
            <select
              value={contentType}
              onChange={e => setContentType(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Sélectionner...</option>
              {CONTENT_TYPES.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes IA (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Contexte pour l'IA..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : <><Upload className="w-4 h-4" /> Envoyer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminKnowledgeBase() {
  const [level, setLevel]             = useState<Level>("grades");
  const [selGrade, setSelGrade]       = useState<GradeFolder | null>(null);
  const [selSubject, setSelSubject]   = useState<string | null>(null);
  const [summary, setSummary]         = useState<FolderSummaryRow[]>([]);
  const [files, setFiles]             = useState<KBFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [pollingIds, setPollingIds]   = useState<number[]>([]);
  const [refresh, setRefresh]         = useState(0);

  // Load folder summary — always results in an array; never reaches .filter() as non-array
  useEffect(() => {
    apiFetchArray<FolderSummaryRow>(`${API}/api/kb/folder-summary`)
      .then(data => setSummary(Array.isArray(data) ? data : []));
  }, [refresh]);

  // Load files when inside a subject
  useEffect(() => {
    if (!selGrade || !selSubject) return;
    setFilesLoading(true);
    const params = new URLSearchParams({
      gradeLevel: selGrade.gradeLevel,
      subject:    selSubject,
      ...(selGrade.sectionKey ? { sectionKey: selGrade.sectionKey } : {}),
    });
    apiFetchArray<KBFile>(`${API}/api/kb/files?${params}`)
      .then(data => {
        const safeData = Array.isArray(data) ? data : [];
        setFiles(safeData);
        setPollingIds(safeData.filter(f => f.status === "processing").map(f => f.id));
      })
      .finally(() => setFilesLoading(false));
  }, [selGrade, selSubject, refresh]);

  // Poll processing files
  useEffect(() => {
    if (pollingIds.length === 0) return;
    const interval = setInterval(async () => {
      const raw = await apiFetchArray<KBFile>(
        `${API}/api/kb/files/status?ids=${pollingIds.join(",")}`,
      );
      const data = Array.isArray(raw) ? raw : [];
      setFiles(prev => (Array.isArray(prev) ? prev : []).map(f => data.find(d => d.id === f.id) ?? f));
      const still = data.filter(d => d.status === "processing").map(d => d.id);
      setPollingIds(still);
      if (still.length === 0) setRefresh(r => r + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingIds]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function countForGrade(g: GradeFolder) {
    const safe = Array.isArray(summary) ? summary : [];
    return safe.filter(
      r => r.gradeLevel === g.gradeLevel && r.sectionKey === g.sectionKey
    ).reduce((s, r) => s + r.total, 0);
  }

  function countForSubject(g: GradeFolder, sub: string) {
    const safe = Array.isArray(summary) ? summary : [];
    return safe.find(
      r => r.gradeLevel === g.gradeLevel && r.sectionKey === g.sectionKey && r.subject === sub
    )?.total ?? 0;
  }

  function getSubjectsForGrade(g: GradeFolder): string[] {
    return getSubjectsForNiveauSection(g.gradeLevel, g.sectionKey) as string[];
  }

  async function deleteFile(id: number) {
    if (!confirm("Supprimer ce fichier et tout son contenu généré ?")) return;
    await apiFetch(`${API}/api/kb/files/${id}`, { method: "DELETE" });
    setFiles(prev => prev.filter(f => f.id !== id));
    setRefresh(r => r + 1);
  }

  // ── Breadcrumb ───────────────────────────────────────────────────────────

  function Breadcrumb() {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <button
          onClick={() => { setLevel("grades"); setSelGrade(null); setSelSubject(null); }}
          className={cn("hover:text-foreground transition-colors", level === "grades" && "text-foreground font-semibold")}
        >
          Base de Connaissances
        </button>
        {selGrade && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              onClick={() => { setLevel("subjects"); setSelSubject(null); }}
              className={cn("hover:text-foreground transition-colors", level === "subjects" && "text-foreground font-semibold")}
            >
              {selGrade.label}
            </button>
          </>
        )}
        {selSubject && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-semibold">{selSubject}</span>
          </>
        )}
      </div>
    );
  }

  // ── Level 1: Grade cards ─────────────────────────────────────────────────

  function GradeLevel() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Base de Connaissances</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sélectionner un niveau pour gérer son contenu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {GRADE_FOLDERS.map(g => {
            const count = countForGrade(g);
            const key   = `${g.gradeLevel}_${g.sectionKey ?? ""}`;
            return (
              <button
                key={key}
                onClick={() => { setSelGrade(g); setLevel("subjects"); }}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-border bg-background hover:bg-muted/40 hover:border-primary/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{g.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count > 0 ? `${count} fichier${count > 1 ? "s" : ""}` : "Vide"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Level 2: Subject folders ─────────────────────────────────────────────

  function SubjectLevel() {
    if (!selGrade) return null;
    const subjects = getSubjectsForGrade(selGrade);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLevel("grades"); setSelGrade(null); }}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selGrade.label}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Sélectionner une matière.</p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune matière pour ce niveau.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {subjects.map(sub => {
              const count = countForSubject(selGrade, sub);
              return (
                <button
                  key={sub}
                  onClick={() => { setSelSubject(sub); setLevel("files"); }}
                  className="group flex items-center gap-3 p-4 rounded-2xl border border-border bg-background hover:bg-muted/40 hover:border-primary/30 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{sub}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count > 0 ? `${count} fichier${count > 1 ? "s" : ""}` : "Vide"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Level 3: Files in subject ────────────────────────────────────────────

  function FilesLevel() {
    if (!selGrade || !selSubject) return null;
    // Hard guard: never pass a non-array into .filter() / .map()
    const safeFiles = Array.isArray(files) ? files : [];

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setLevel("subjects"); setSelSubject(null); }}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selSubject}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{selGrade.label}</p>
          </div>
          <button
            onClick={() => setRefresh(r => r + 1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter des ressources
          </button>
        </div>

        {/* Stats row */}
        {safeFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Fichiers",    value: safeFiles.length },
              { label: "Traités",     value: safeFiles.filter(f => f.status === "processed").length },
              { label: "Erreurs",     value: safeFiles.filter(f => f.status === "error").length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* File list */}
        {filesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : safeFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <div>
              <p className="font-semibold">Aucune ressource</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cliquez sur « Ajouter des ressources » pour importer du contenu.
              </p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fichier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chapitre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Généré</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {safeFiles.map(f => (
                  <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {fileIcon(f.fileName, f.fileType)}
                        <span className="font-medium truncate max-w-[180px]">{f.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px]">
                      <span className="truncate block">{f.topic}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                        {CONTENT_TYPES.find(c => c.value === f.contentType)?.label ?? f.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {f.status === "processed"
                        ? `${f.questionsCount}q · ${f.flashcardsCount}fc · ${f.notionsCount}n`
                        : f.status === "error"
                        ? <span className="text-red-500 text-xs">{f.errorMessage?.slice(0, 40) ?? "Erreur"}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(f.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {f.fileUrl && (
                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Ouvrir le fichier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteFile(f.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Content by level */}
        {level === "grades"   && <GradeLevel />}
        {level === "subjects" && <SubjectLevel />}
        {level === "files"    && <FilesLevel />}
      </div>

      {/* Upload modal */}
      {showUpload && selGrade && selSubject && (
        <UploadModal
          gradeFolder={selGrade}
          subject={selSubject}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setRefresh(r => r + 1); }}
        />
      )}
    </DashboardLayout>
  );
}
