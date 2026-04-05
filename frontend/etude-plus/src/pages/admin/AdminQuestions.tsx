import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Button, Badge } from "@/components/ui/Premium";
import {
  BrainCircuit, Plus, Search, Eye, Trash2, Globe, EyeOff,
  ChevronDown, Filter, Loader2, MoreHorizontal, FileText,
} from "lucide-react";
import { Link } from "wouter";
import { getToken } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SIMPLE_LEVELS, SECTION_LEVELS, getNiveauLabel } from "@/lib/educationConfig";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL ?? "";

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

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Mutations ─────────────────────────────────────────────────────────────────

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
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: data.status === "published" ? "Question publiée" : "Retirée de la banque" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminQuestions() {
  const { toast } = useToast();

  const [filterNiveau, setFilterNiveau]   = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [search, setSearch]               = useState("");
  const [openRow, setOpenRow]             = useState<number | null>(null);

  const deleteMut  = useDeleteQuestion();
  const publishMut = useTogglePublish();

  const { data, isLoading } = useQuery({
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
    return (
      q.subject.toLowerCase().includes(s) ||
      q.topic.toLowerCase().includes(s) ||
      q.type.toLowerCase().includes(s)
    );
  });

  function confirmDelete(id: number) {
    if (window.confirm("Supprimer définitivement cette question ?")) {
      deleteMut.mutate(id);
    }
  }

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
              {questions.length} question{questions.length !== 1 ? "s" : ""} au total
            </p>
          </div>
          <Link href="/admin/questions/generate">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Générer une Question IA
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher matière, thème..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Niveau filter */}
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

            {/* Status filter */}
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
          {isLoading ? (
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
                  ? "Générez votre première question avec l'IA."
                  : "Modifiez les filtres pour voir plus de résultats."}
              </p>
              {questions.length === 0 && (
                <Link href="/admin/questions/generate">
                  <Button size="sm" className="gap-2 mt-2">
                    <Plus className="w-4 h-4" /> Générer une Question
                  </Button>
                </Link>
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
                    const diff  = DIFFICULTY_CONFIG[q.difficulty];
                    const stat  = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
                    const isLoading = (deleteMut.isPending && deleteMut.variables === q.id)
                                   || (publishMut.isPending && publishMut.variables === q.id);
                    return (
                      <tr key={q.id} className="hover:bg-muted/20 transition-colors group">
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
                            {/* Publish toggle */}
                            <button
                              onClick={() => publishMut.mutate(q.id)}
                              disabled={isLoading}
                              title={q.status === "published" ? "Dépublier" : "Publier"}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                            >
                              {q.status === "published"
                                ? <EyeOff className="w-4 h-4" />
                                : <Globe className="w-4 h-4" />
                              }
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => confirmDelete(q.id)}
                              disabled={isLoading}
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
      </div>
    </DashboardLayout>
  );
}
