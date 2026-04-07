import { useState, useRef, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Button, Badge } from "@/components/ui/Premium";
import {
  BrainCircuit, Plus, Search, Trash2, Globe, EyeOff,
  Filter, Loader2, FileText, Upload, Database, ChevronDown,
  CheckCircle2, AlertCircle, Clock, X,
} from "lucide-react";
import { Link } from "wouter";
import { getToken } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SIMPLE_LEVELS, SECTION_LEVELS, getNiveauLabel, ALL_SUBJECTS } from "@/lib/educationConfig";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function adminFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `HTTP ${res.status}`);
  return data;
}

async function kbFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `HTTP ${res.status}`);
  return data;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<string, { label: string; class: string }> = {
  facile:    { label: "Facile",    class: "bg-green-100 text-green-700 border-green-200" },
  moyen:     { label: "Moyen",     class: "bg-amber-100 text-amber-700 border-amber-200" },
  difficile: { label: "Difficile", class: "bg-red-100 text-red-700 border-red-200" },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  published: { label: "Publié",    class: "bg-green-100 text-green-700 border-green-200" },
  draft:     { label: "Brouillon", class: "bg-gray-100 text-gray-600 border-gray-200" },
};

const ALL_NIVEAU_KEYS = [
  ...Object.keys(SIMPLE_LEVELS),
  ...Object.keys(SECTION_LEVELS),
];

type GradeOption = { value: string; label: string; sectionKey?: string };

const GRADE_OPTIONS: GradeOption[] = [
  { value: "7eme",             label: "7ème année de base" },
  { value: "8eme",             label: "8ème année de base" },
  { value: "9eme",             label: "9ème année de base" },
  { value: "1ere_secondaire",  label: "1ère année secondaire" },
  { value: "2eme", sectionKey: "sciences",     label: "2ème — Sciences" },
  { value: "2eme", sectionKey: "lettres",      label: "2ème — Lettres" },
  { value: "2eme", sectionKey: "economie",     label: "2ème — Économie" },
  { value: "2eme", sectionKey: "technique",    label: "2ème — Technique" },
  { value: "2eme", sectionKey: "sport",        label: "2ème — Sport" },
  { value: "2eme", sectionKey: "informatique", label: "2ème — Informatique" },
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

const CONTENT_TYPES = [
  { value: "cours",     label: "Cours / Leçon" },
  { value: "examen",    label: "Examen / Contrôle" },
  { value: "exercices", label: "Exercices" },
  { value: "annale",    label: "Annale officielle" },
  { value: "resume",    label: "Résumé / Fiche" },
  { value: "manuel",    label: "Manuel scolaire (extrait)" },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuestionRow {
  id: number;
  status: string;
  gradeLevel: string;
  sectionKey: string | null;
  subject: string;
  topic: string;
  type: string;
  difficulty: string;
  language: string;
  totalMarks: number | null;
  createdAt: string;
}

interface SelectedFile {
  file: File;
  id: string;
  dupWarning: boolean;
  dupExisting: any | null;
  ignoredup: boolean;
}

interface KBFile {
  id:              number;
  file_name:       string;
  file_type:       string | null;
  subject:         string;
  grade_level:     string;
  section_key:     string | null;
  topic:           string;
  content_type:    string;
  status:          "processing" | "processed" | "error";
  error_message:   string | null;
  questions_count: number;
  flashcards_count: number;
  notions_count:   number;
  created_at:      string;
  processed_at:    string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fileIcon(name: string, mime: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.includes("pdf") || ext === "pdf")  return "📄";
  if (ext === "txt")                           return "📝";
  if (ext === "pptx")                          return "📊";
  if (mime.includes("image") || ["jpg","jpeg","png"].includes(ext)) return "🖼️";
  return "📎";
}

function KBStatusBadge({ status }: { status: KBFile["status"] }) {
  if (status === "processing") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> En traitement
    </span>
  );
  if (status === "processed") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Traité
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
      <AlertCircle className="w-3 h-3" /> Erreur
    </span>
  );
}

// ── Mutations ──────────────────────────────────────────────────────────────────

function useDeleteQuestion() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => adminFetch(`${API_URL}/api/admin/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Question supprimée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
}

function useTogglePublish() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => adminFetch(`${API_URL}/api/admin/questions/${id}/publish`, { method: "POST" }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: data.status === "published" ? "Question publiée" : "Retirée de la banque" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AdminQuestions() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"questions" | "knowledge">("questions");

  // ── Question bank state ───────────────────────────────────────────────────────
  const [filterNiveau, setFilterNiveau]   = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [search, setSearch]               = useState("");

  const deleteMut  = useDeleteQuestion();
  const publishMut = useTogglePublish();

  const { data, isLoading: questionsLoading } = useQuery({
    queryKey: ["admin-questions", filterNiveau, filterSubject, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" });
      if (filterNiveau)  params.set("gradeLevel", filterNiveau);
      if (filterSubject) params.set("subject", filterSubject);
      if (filterStatus)  params.set("status", filterStatus);
      return adminFetch(`${API_URL}/api/admin/questions?${params}`);
    },
  });

  const questions: QuestionRow[] = data?.questions ?? [];
  const filtered = questions.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.subject.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s) || q.type.toLowerCase().includes(s);
  });

  function confirmDelete(id: number) {
    if (window.confirm("Supprimer définitivement cette question ?")) deleteMut.mutate(id);
  }

  // ── Knowledge base state ──────────────────────────────────────────────────────
  const [kbSubject,     setKbSubject]     = useState("");
  const [kbGradeKey,    setKbGradeKey]    = useState<GradeOption | null>(null);
  const [kbTopic,       setKbTopic]       = useState("");
  const [kbContentType, setKbContentType] = useState("");
  const [kbNotes,       setKbNotes]       = useState("");

  const [selectedFiles,  setSelectedFiles]  = useState<SelectedFile[]>([]);
  const [dragging,       setDragging]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadedBatch,  setUploadedBatch]  = useState<KBFile[]>([]);
  const [pollingIds,     setPollingIds]     = useState<number[]>([]);
  const [kbHistory,      setKbHistory]      = useState<KBFile[]>([]);
  const [kbHistLoading,  setKbHistLoading]  = useState(true);
  const [expandedRow,    setExpandedRow]    = useState<number | null>(null);
  const [expandedData,   setExpandedData]   = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load KB history when tab is first opened
  useEffect(() => {
    if (activeTab !== "knowledge" || !kbHistLoading) return;
    fetch(`${API_URL}/api/kb/files`, {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      credentials: "include",
    })
      .then(r => r.json())
      .then(setKbHistory)
      .catch(console.error)
      .finally(() => setKbHistLoading(false));
  }, [activeTab]);

  // Poll for status of recently uploaded files
  useEffect(() => {
    if (pollingIds.length === 0) return;
    const interval = setInterval(async () => {
      const data: KBFile[] = await fetch(
        `${API_URL}/api/kb/files/status?ids=${pollingIds.join(",")}`,
        {
          headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
          credentials: "include",
        }
      ).then(r => r.json()).catch(() => []);

      setUploadedBatch(prev => prev.map(f => data.find(d => d.id === f.id) ?? f));
      setKbHistory(prev => prev.map(f => data.find(d => d.id === f.id) ?? f));
      setPollingIds(data.filter(d => d.status === "processing").map(d => d.id));
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingIds]);

  const addFiles = useCallback((incoming: File[]) => {
    const allowed = incoming.filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return ["pdf","txt","pptx","jpg","jpeg","png"].includes(ext) ||
        ["application/pdf","text/plain","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/jpeg","image/png"].includes(f.type);
    });
    setSelectedFiles(prev => [
      ...prev,
      ...allowed.map(f => ({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}`, dupWarning: false, dupExisting: null, ignoredup: false })),
    ]);
  }, []);

  const removeFile = (id: string) => setSelectedFiles(prev => prev.filter(f => f.id !== id));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const checkDuplicates = async () => {
    if (!kbSubject || !kbGradeKey) return;
    const updated = await Promise.all(
      selectedFiles.map(async sf => {
        const params = new URLSearchParams({ file_name: sf.file.name, subject: kbSubject, grade_level: kbGradeKey.value });
        const res = await fetch(`${API_URL}/api/kb/check-duplicate?${params}`, {
          headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
          credentials: "include",
        });
        const data = await res.json();
        return { ...sf, dupWarning: data.duplicate, dupExisting: data.existing ?? null };
      })
    );
    setSelectedFiles(updated);
  };

  const canSubmit = kbSubject && kbGradeKey && kbTopic && kbContentType && selectedFiles.length > 0 && !uploading;

  const handleKBSubmit = async () => {
    if (!canSubmit) return;
    await checkDuplicates();
    const filesToProcess = selectedFiles.filter(sf => !sf.dupWarning || sf.ignoredup);
    if (filesToProcess.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    filesToProcess.forEach(sf => formData.append("files", sf.file));
    formData.append("subject",      kbSubject);
    formData.append("grade_level",  kbGradeKey!.value);
    if (kbGradeKey!.sectionKey) formData.append("section_key", kbGradeKey!.sectionKey);
    formData.append("topic",        kbTopic);
    formData.append("content_type", kbContentType);
    if (kbNotes) formData.append("notes", kbNotes);

    try {
      const created: KBFile[] = await kbFetch(`${API_URL}/api/kb/upload`, { method: "POST", body: formData });
      setUploadedBatch(created);
      setPollingIds(created.filter(f => f.status === "processing").map(f => f.id));
      setKbHistory(prev => [...created, ...prev]);
      setSelectedFiles([]);
      toast({ title: `${created.length} fichier${created.length > 1 ? "s" : ""} envoyé${created.length > 1 ? "s" : ""} — traitement IA en cours` });
    } catch (err: any) {
      toast({ title: "Erreur d'upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteKBFile = async (id: number) => {
    if (!confirm("Supprimer ce fichier et tout le contenu généré par l'IA ?")) return;
    await kbFetch(`${API_URL}/api/kb/files/${id}`, { method: "DELETE" });
    setKbHistory(prev => prev.filter(f => f.id !== id));
    setUploadedBatch(prev => prev.filter(f => f.id !== id));
    if (expandedRow === id) { setExpandedRow(null); setExpandedData(null); }
  };

  const toggleRow = async (id: number) => {
    if (expandedRow === id) { setExpandedRow(null); setExpandedData(null); return; }
    setExpandedRow(id);
    setExpandedData(null);
    const data = await kbFetch(`${API_URL}/api/kb/files/${id}`);
    setExpandedData(data);
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              Gestion des Questions
            </h1>
            <p className="text-muted-foreground mt-1">
              {questions.length} question{questions.length !== 1 ? "s" : ""} · {kbHistory.length} fichier{kbHistory.length !== 1 ? "s" : ""} dans la base de connaissances
            </p>
          </div>
          {activeTab === "questions" && (
            <Link href="/admin/questions/generate">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Générer une Question IA
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          <button
            onClick={() => setActiveTab("questions")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "questions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            Banque de Questions
            {questions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                {questions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "knowledge"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Database className="w-4 h-4" />
            Base de Connaissances
            {kbHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                {kbHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1 — BANQUE DE QUESTIONS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "questions" && (
          <>
            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher matière, thème..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <select
                  value={filterNiveau}
                  onChange={e => setFilterNiveau(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Tous les niveaux</option>
                  {ALL_NIVEAU_KEYS.map(k => (
                    <option key={k} value={k}>{getNiveauLabel(k)}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Tous les statuts</option>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
                {(filterNiveau || filterSubject || filterStatus || search) && (
                  <button
                    onClick={() => { setFilterNiveau(""); setFilterSubject(""); setFilterStatus(""); setSearch(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
              {questionsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Chargement…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="font-semibold text-muted-foreground">Aucune question trouvée</p>
                  <p className="text-sm text-muted-foreground/60 max-w-xs">
                    {questions.length === 0
                      ? "Importez des fichiers dans la Base de Connaissances — l'IA générera les questions automatiquement."
                      : "Modifiez les filtres pour voir plus de résultats."}
                  </p>
                  {questions.length === 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setActiveTab("knowledge")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Importer des fichiers
                      </button>
                      <Link href="/admin/questions/generate">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" /> Générer manuellement
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        {["Niveau", "Matière", "Thème", "Type", "Difficulté", "Statut", "Date", "Actions"].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map(q => {
                        const diff = DIFFICULTY_CONFIG[q.difficulty];
                        const stat = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
                        const isMutating = (deleteMut.isPending && deleteMut.variables === q.id)
                          || (publishMut.isPending && publishMut.variables === q.id);
                        return (
                          <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-medium">{getNiveauLabel(q.gradeLevel)}</span>
                              {q.sectionKey && (
                                <span className="block text-xs text-muted-foreground">{q.sectionKey.replace(/_/g, " ")}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium whitespace-nowrap">{q.subject}</td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <p className="truncate text-muted-foreground">{q.topic}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                {q.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {diff && (
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", diff.class)}>
                                  {diff.label}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", stat.class)}>
                                {stat.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                              {format(new Date(q.createdAt), "dd MMM yyyy", { locale: fr })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => publishMut.mutate(q.id)}
                                  disabled={isMutating}
                                  title={q.status === "published" ? "Dépublier" : "Publier"}
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                                >
                                  {q.status === "published" ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => confirmDelete(q.id)}
                                  disabled={isMutating}
                                  title="Supprimer"
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-40"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2 — BASE DE CONNAISSANCES
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">

            {/* Explainer banner */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-5 py-4 flex items-start gap-3">
              <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Comment ça marche</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  Importez vos cours, exercices, examens ou annales (PDF, image, TXT, PPTX).
                  L'IA Anthropic extrait le contenu, génère des <strong>questions</strong>,{" "}
                  <strong>flashcards</strong> et <strong>notions clés</strong> pour les étudiants,
                  et les publie automatiquement dans la Banque de Questions.
                </p>
              </div>
            </div>

            {/* Upload card */}
            <Card className="p-6 space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                Importer des fichiers
              </h2>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                  dragging
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    : "border-border hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/10"
                )}
              >
                <div className="text-4xl mb-3">📁</div>
                <p className="font-medium">Glisser-déposer des fichiers ici</p>
                <p className="text-sm text-muted-foreground mt-1">ou cliquer pour parcourir</p>
                <p className="text-xs text-muted-foreground/60 mt-2">PDF · TXT · PPTX · JPG · PNG — max 25 Mo par fichier</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.pptx,.jpg,.jpeg,.png,application/pdf,text/plain,image/jpeg,image/png"
                  className="hidden"
                  onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
                />
              </div>

              {/* Selected files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map(sf => (
                    <div key={sf.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <span className="text-xl shrink-0">{fileIcon(sf.file.name, sf.file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sf.file.name}</p>
                        <p className="text-xs text-muted-foreground">{(sf.file.size / 1024 / 1024).toFixed(2)} Mo</p>
                        {sf.dupWarning && !sf.ignoredup && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-amber-700">
                            <span>⚠️ Déjà importé.</span>
                            <button className="font-bold underline" onClick={() => setSelectedFiles(p => p.map(f => f.id === sf.id ? { ...f, ignoredup: true } : f))}>Retraiter</button>
                            <button className="font-bold underline text-destructive" onClick={() => removeFile(sf.id)}>Ignorer</button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFile(sf.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Matière *</label>
                  <select
                    value={kbSubject}
                    onChange={e => setKbSubject(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Niveau / Classe *</label>
                  <select
                    value={kbGradeKey ? `${kbGradeKey.value}__${kbGradeKey.sectionKey ?? ""}` : ""}
                    onChange={e => {
                      const [val, sk] = e.target.value.split("__");
                      setKbGradeKey(GRADE_OPTIONS.find(g => g.value === val && (g.sectionKey ?? "") === sk) ?? null);
                    }}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all"
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
                  <input
                    type="text"
                    value={kbTopic}
                    onChange={e => setKbTopic(e.target.value)}
                    placeholder="ex. Fonctions linéaires"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Type de contenu *</label>
                  <select
                    value={kbContentType}
                    onChange={e => setKbContentType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Notes pour l'IA (optionnel)</label>
                  <textarea
                    value={kbNotes}
                    onChange={e => setKbNotes(e.target.value)}
                    rows={2}
                    placeholder="Contexte supplémentaire, instructions spécifiques pour la génération..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleKBSubmit}
                disabled={!canSubmit}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Envoyer à l'IA{selectedFiles.length > 0 ? ` (${selectedFiles.length} fichier${selectedFiles.length > 1 ? "s" : ""})` : ""}</>
                )}
              </button>
            </Card>

            {/* Current batch status */}
            {uploadedBatch.length > 0 && (
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold">Dernier envoi — traitement en cours</h3>
                {uploadedBatch.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                    <span className="text-xl shrink-0">{fileIcon(f.file_name, f.file_type ?? "")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.file_name}</p>
                      {f.status === "processed" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {f.questions_count} questions · {f.flashcards_count} flashcards · {f.notions_count} notions générés
                        </p>
                      )}
                      {f.status === "error" && f.error_message && (
                        <p className="text-xs text-destructive mt-0.5">{f.error_message}</p>
                      )}
                    </div>
                    <KBStatusBadge status={f.status} />
                  </div>
                ))}
              </Card>
            )}

            {/* History table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Historique des imports</h3>
                <span className="text-xs text-muted-foreground">{kbHistory.length} fichier{kbHistory.length !== 1 ? "s" : ""}</span>
              </div>

              {kbHistLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /><span>Chargement...</span>
                </div>
              ) : kbHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Aucun fichier importé pour l'instant.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        {["Fichier", "Matière", "Niveau", "Statut", "Contenu IA", "Date", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {kbHistory.map(f => (
                        <>
                          <tr
                            key={f.id}
                            className="hover:bg-muted/20 cursor-pointer transition-colors"
                            onClick={() => toggleRow(f.id)}
                          >
                            <td className="px-4 py-3 max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0">{fileIcon(f.file_name, f.file_type ?? "")}</span>
                                <span className="truncate font-medium text-xs">{f.file_name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6 truncate">{f.topic}</p>
                            </td>
                            <td className="px-4 py-3 text-xs">{f.subject}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{getNiveauLabel(f.grade_level)}{f.section_key ? ` — ${f.section_key.replace(/_/g," ")}` : ""}</td>
                            <td className="px-4 py-3"><KBStatusBadge status={f.status} /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {f.status === "processed"
                                ? `${f.questions_count} q · ${f.flashcards_count} fc · ${f.notions_count} n`
                                : f.status === "error"
                                ? <span className="text-destructive">Erreur</span>
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(f.created_at), "dd MMM yy HH:mm", { locale: fr })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={e => { e.stopPropagation(); deleteKBFile(f.id); }}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded row — generated content preview */}
                          {expandedRow === f.id && (
                            <tr key={`${f.id}-detail`}>
                              <td colSpan={7} className="px-6 py-4 bg-muted/20 border-b border-border">
                                {!expandedData ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement...
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {expandedData.questions?.length > 0 && (
                                      <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                                          Questions générées ({expandedData.questions.length})
                                        </p>
                                        <div className="space-y-1.5">
                                          {expandedData.questions.slice(0, 5).map((q: any) => (
                                            <div key={q.id} className="text-xs bg-background rounded-lg border border-border px-3 py-2">
                                              <span className={cn("font-semibold mr-2", {
                                                "text-green-600": q.difficulty === "facile",
                                                "text-amber-600": q.difficulty === "moyen",
                                                "text-red-600": q.difficulty === "difficile",
                                              })}>
                                                [{q.difficulty ?? "—"}]
                                              </span>
                                              {(q.question_text ?? q.questionText ?? "").slice(0, 120)}…
                                            </div>
                                          ))}
                                          {expandedData.questions.length > 5 && (
                                            <p className="text-xs text-muted-foreground pl-1">+{expandedData.questions.length - 5} autres questions dans la banque</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {expandedData.flashcards?.length > 0 && (
                                      <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                                          Flashcards ({expandedData.flashcards.length})
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                                          {expandedData.flashcards.slice(0, 6).map((fc: any) => (
                                            <div key={fc.id} className="text-xs bg-background rounded-lg border border-border px-3 py-2">
                                              <p className="font-medium truncate">{fc.front?.slice(0, 60)}</p>
                                              <p className="text-muted-foreground truncate mt-0.5">{fc.back?.slice(0, 60)}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {expandedData.notions?.length > 0 && (
                                      <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                                          Notions Clés ({expandedData.notions.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {expandedData.notions.map((n: any) => (
                                            <span key={n.id} className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full px-2.5 py-0.5 border border-purple-200 dark:border-purple-800">
                                              {n.title}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {expandedData.annales?.length > 0 && (
                                      <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {expandedData.annales.length} annale{expandedData.annales.length > 1 ? "s" : ""} détectée{expandedData.annales.length > 1 ? "s" : ""} et sauvegardée{expandedData.annales.length > 1 ? "s" : ""}
                                      </p>
                                    )}

                                    {!expandedData.questions?.length && !expandedData.flashcards?.length && !expandedData.notions?.length && !expandedData.annales?.length && (
                                      <p className="text-xs text-muted-foreground italic">Aucun contenu généré pour ce fichier.</p>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
