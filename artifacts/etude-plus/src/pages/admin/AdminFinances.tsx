import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge, Button } from "@/components/ui/Premium";
import { formatTND } from "@/lib/utils";
import { useListTransactions, getToken } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, Users, Download, Search, CheckCircle,
  Clock, XCircle, RefreshCw, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_OPTIONS = ["pending", "completed", "failed", "refunded"] as const;
type TxStatus = typeof STATUS_OPTIONS[number];

const STATUS_LABELS: Record<TxStatus, string> = {
  pending: "En attente",
  completed: "Complété",
  failed: "Échoué",
  refunded: "Remboursé",
};

function statusBadge(status: string) {
  if (status === "completed") return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Complété</Badge>;
  if (status === "pending") return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
  if (status === "refunded") return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1" />Remboursé</Badge>;
  return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{STATUS_LABELS[status as TxStatus] ?? status}</Badge>;
}

function useOverrideStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TxStatus }) => {
      const token = getToken();
      const res = await fetch(`/api/admin/transactions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/transactions"] }); toast({ title: "Statut mis à jour" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
}

// Build CSV from transactions
function exportCSV(transactions: any[]) {
  const headers = ["#", "Étudiant", "Email étudiant", "Cours", "Professeur", "Date", "Montant (TND)", "Frais plateforme (TND)", "Versé prof (TND)", "Statut"];
  const rows = transactions.map(t => [
    t.id,
    t.student?.fullName ?? "",
    t.student?.email ?? "",
    t.class?.title ?? `Cours #${t.classId}`,
    t.professor?.fullName ?? "",
    t.createdAt ? format(new Date(t.createdAt), "dd/MM/yyyy HH:mm") : "",
    t.amount,
    t.platformFee ?? (t.amount * 0.15).toFixed(2),
    t.professorAmount ?? (t.amount * 0.85).toFixed(2),
    t.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `etude-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminFinances() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { data, isLoading } = useListTransactions() as any;
  const transactions: any[] = data?.transactions ?? [];
  const overrideMutation = useOverrideStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = transactions;
    if (statusFilter !== "all") list = list.filter((t: any) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t: any) =>
        t.student?.fullName?.toLowerCase().includes(q) ||
        t.student?.email?.toLowerCase().includes(q) ||
        t.class?.title?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    }
    return list;
  }, [transactions, statusFilter, search]);

  const completed = transactions.filter((t: any) => t.status === "completed");
  const totalVolume = completed.reduce((s: number, t: any) => s + t.amount, 0);
  const platformTotal = completed.reduce((s: number, t: any) => s + (t.platformFee ?? t.amount * 0.15), 0);
  const profTotal = completed.reduce((s: number, t: any) => s + (t.professorAmount ?? t.amount * 0.85), 0);

  // Per-teacher earnings
  const teacherMap: Record<string, { name: string; email: string; total: number; fees: number; count: number }> = {};
  completed.forEach((t: any) => {
    const key = t.professor?.fullName ?? `Prof #${t.professorId}`;
    if (!teacherMap[key]) teacherMap[key] = { name: key, email: t.professor?.email ?? "", total: 0, fees: 0, count: 0 };
    teacherMap[key].total += t.professorAmount ?? t.amount * 0.85;
    teacherMap[key].fees += t.platformFee ?? t.amount * 0.15;
    teacherMap[key].count += 1;
  });
  const teacherRows = Object.values(teacherMap).sort((a, b) => b.total - a.total);

  const [tab, setTab] = useState<"transactions" | "payouts">("transactions");

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Finances"
          description="Flux financiers, commissions et versements de la plateforme."
          action={
            <Button onClick={() => exportCSV(filtered)} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Exporter CSV
            </Button>
          }
        />

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {[
            { label: "Volume total (complété)", value: formatTND(totalVolume), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100", sub: `${completed.length} transactions` },
            { label: "Revenus plateforme (15%)", value: formatTND(platformTotal), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100", sub: "Commission sur chaque vente" },
            { label: "Versé aux professeurs (85%)", value: formatTND(profTotal), icon: Users, color: "text-violet-600", bg: "bg-violet-100", sub: `${teacherRows.length} professeur(s)` },
          ].map((s, i) => (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "…" : s.value}</p>
                <p className="text-sm font-semibold text-foreground/80">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {(["transactions", "payouts"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "transactions" ? `Toutes les transactions (${transactions.length})` : `Versements par professeur (${teacherRows.length})`}
            </button>
          ))}
        </div>

        {/* Transactions tab */}
        {tab === "transactions" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-48 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher étudiant, cours, ID..."
                  className="w-full pl-9 pr-3 h-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(["all", ...STATUS_OPTIONS] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
                  >
                    {s === "all" ? "Tous" : STATUS_LABELS[s as TxStatus]}
                  </button>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <DollarSign className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  <p>Aucune transaction trouvée.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {["#", "Cours", "Étudiant", "Professeur", "Date", "Montant", "Frais (15%)", "Prof (85%)", "Statut"].map(h => (
                          <th key={h} className={`p-4 font-semibold text-muted-foreground ${h === "#" || h === "Cours" || h === "Étudiant" || h === "Professeur" || h === "Date" ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t: any) => (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-muted-foreground font-mono text-xs">#{t.id}</td>
                          <td className="p-4 font-medium max-w-[180px] truncate">{t.class?.title ?? `#${t.classId}`}</td>
                          <td className="p-4 text-muted-foreground">{t.student?.fullName ?? `#${t.studentId}`}</td>
                          <td className="p-4 text-muted-foreground">{t.professor?.fullName ?? `#${t.professorId}`}</td>
                          <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">
                            {t.createdAt ? format(new Date(t.createdAt), "d MMM yyyy", { locale: fr }) : "—"}
                          </td>
                          <td className="p-4 text-right font-bold">{formatTND(t.amount)}</td>
                          <td className="p-4 text-right text-emerald-600 font-semibold">{formatTND(t.platformFee ?? t.amount * 0.15)}</td>
                          <td className="p-4 text-right text-blue-600 font-semibold">{formatTND(t.professorAmount ?? t.amount * 0.85)}</td>
                          <td className="p-4 text-right">
                            {isSuperAdmin ? (
                              editingId === t.id ? (
                                <select
                                  autoFocus
                                  className="text-xs border border-border rounded-lg px-2 py-1 bg-background"
                                  defaultValue={t.status}
                                  disabled={overrideMutation.isPending}
                                  onBlur={() => setEditingId(null)}
                                  onChange={e => {
                                    const newStatus = e.target.value as TxStatus;
                                    if (newStatus !== t.status) overrideMutation.mutate({ id: t.id, status: newStatus });
                                    setEditingId(null);
                                  }}
                                >
                                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                </select>
                              ) : (
                                <button onClick={() => setEditingId(t.id)} title="Modifier le statut" className="hover:opacity-70 transition-opacity">
                                  {statusBadge(t.status)}
                                </button>
                              )
                            ) : statusBadge(t.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {filtered.length > 0 && (
                <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{filtered.length} transaction(s)</span>
                  <span className="font-bold">
                    Total affiché : {formatTND(filtered.filter((t: any) => t.status === "completed").reduce((s: number, t: any) => s + t.amount, 0))}
                  </span>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Payouts tab */}
        {tab === "payouts" && (
          <Card className="overflow-hidden">
            {teacherRows.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="w-10 h-10 opacity-30 mx-auto mb-3" />
                <p>Aucun versement à afficher.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-semibold text-muted-foreground">Professeur</th>
                      <th className="text-left p-4 font-semibold text-muted-foreground">Email</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Transactions</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Frais plateforme</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">À verser (85%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherRows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold">{r.name}</td>
                        <td className="p-4 text-muted-foreground text-xs">{r.email || "—"}</td>
                        <td className="p-4 text-right text-muted-foreground">{r.count}</td>
                        <td className="p-4 text-right text-emerald-600 font-semibold">{formatTND(r.fees)}</td>
                        <td className="p-4 text-right font-bold text-blue-600">{formatTND(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 font-bold">
                    <tr className="border-t-2 border-border">
                      <td className="p-4" colSpan={2}>Total</td>
                      <td className="p-4 text-right">{completed.length}</td>
                      <td className="p-4 text-right text-emerald-600">{formatTND(platformTotal)}</td>
                      <td className="p-4 text-right text-blue-600">{formatTND(profTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
