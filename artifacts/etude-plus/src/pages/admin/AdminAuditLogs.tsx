import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input } from "@/components/ui/Premium";
import {
  ScrollText, ChevronLeft, ChevronRight, Search, Filter,
  UserPlus, LogIn, LogOut, ShieldAlert, BookOpen, CreditCard,
  Settings, Trash2, UserCog, Key, FileText, AlertTriangle, Activity,
} from "lucide-react";
import { getToken } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PAGE_SIZE = 30;

// ── Event metadata ─────────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; icon: any; color: string; bg: string; category: string }> = {
  // Auth
  user_registered:          { label: "Inscription",          icon: UserPlus,     color: "text-green-700",  bg: "bg-green-100",  category: "auth" },
  user_login:               { label: "Connexion",            icon: LogIn,        color: "text-blue-700",   bg: "bg-blue-100",   category: "auth" },
  login_failed:             { label: "Échec connexion",      icon: AlertTriangle, color: "text-red-700",   bg: "bg-red-100",    category: "auth" },
  login_blocked_suspended:  { label: "Compte suspendu",      icon: ShieldAlert,  color: "text-red-700",    bg: "bg-red-100",    category: "auth" },
  // Classes
  create_class:             { label: "Cours créé",           icon: BookOpen,     color: "text-violet-700", bg: "bg-violet-100", category: "classes" },
  update_class:             { label: "Cours modifié",        icon: BookOpen,     color: "text-violet-700", bg: "bg-violet-100", category: "classes" },
  delete_class:             { label: "Cours supprimé",       icon: Trash2,       color: "text-red-700",    bg: "bg-red-100",    category: "classes" },
  archive_class:            { label: "Cours archivé",        icon: BookOpen,     color: "text-orange-700", bg: "bg-orange-100", category: "classes" },
  unarchive_class:          { label: "Cours désarchivé",     icon: BookOpen,     color: "text-orange-700", bg: "bg-orange-100", category: "classes" },
  // Transactions
  payment_completed:        { label: "Paiement",             icon: CreditCard,   color: "text-emerald-700",bg: "bg-emerald-100",category: "finance" },
  enroll_class:             { label: "Inscription cours",    icon: CreditCard,   color: "text-emerald-700",bg: "bg-emerald-100",category: "finance" },
  override_transaction_status: { label: "Statut TX modifié",icon: CreditCard,   color: "text-orange-700", bg: "bg-orange-100", category: "finance" },
  // Admin actions
  create_user:              { label: "Compte créé (admin)",  icon: UserPlus,     color: "text-blue-700",   bg: "bg-blue-100",   category: "admin" },
  suspend_user:             { label: "Compte suspendu",      icon: ShieldAlert,  color: "text-red-700",    bg: "bg-red-100",    category: "admin" },
  unsuspend_user:           { label: "Compte réactivé",      icon: ShieldAlert,  color: "text-green-700",  bg: "bg-green-100",  category: "admin" },
  delete_user:              { label: "Compte supprimé",      icon: Trash2,       color: "text-red-700",    bg: "bg-red-100",    category: "admin" },
  change_role:              { label: "Rôle modifié",         icon: Settings,     color: "text-purple-700", bg: "bg-purple-100", category: "admin" },
  reset_password:           { label: "MDP réinitialisé",     icon: Key,          color: "text-orange-700", bg: "bg-orange-100", category: "admin" },
  approve_professor:        { label: "Prof approuvé",        icon: FileText,     color: "text-green-700",  bg: "bg-green-100",  category: "admin" },
  reject_professor:         { label: "Prof refusé",          icon: FileText,     color: "text-red-700",    bg: "bg-red-100",    category: "admin" },
  impersonate_user:         { label: "Impersonation",        icon: UserCog,      color: "text-amber-700",  bg: "bg-amber-100",  category: "admin" },
  kyc_document_submitted:   { label: "Documents KYC soumis", icon: FileText,    color: "text-blue-700",   bg: "bg-blue-100",   category: "kyc" },
};

const CATEGORIES = [
  { key: "all",     label: "Tout" },
  { key: "auth",    label: "Connexions" },
  { key: "classes", label: "Cours" },
  { key: "finance", label: "Finances" },
  { key: "admin",   label: "Admin" },
  { key: "kyc",     label: "KYC" },
];

function getEventMeta(action: string) {
  return EVENT_META[action] ?? {
    label: action,
    icon: Activity,
    color: "text-slate-700",
    bg: "bg-slate-100",
    category: "other",
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchAuditLogs(page: number, limit: number) {
  const token = getToken();
  const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Erreur lors du chargement");
  return res.json();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Fetch a large page so we can filter client-side without re-fetching
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/audit-logs", page],
    queryFn: () => fetchAuditLogs(page, PAGE_SIZE),
  });

  const allLogs: any[] = data?.logs ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side filter by category + search
  const filtered = allLogs.filter(log => {
    const meta = getEventMeta(log.action);
    if (category !== "all" && meta.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const actorName = log.admin?.fullName?.toLowerCase() ?? "";
      const actorEmail = log.admin?.email?.toLowerCase() ?? "";
      const details = JSON.stringify(log.details ?? "").toLowerCase();
      if (!actorName.includes(q) && !actorEmail.includes(q) && !details.includes(q) && !log.action.includes(q)) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Journal d'audit"
          description="Tout ce qui se passe sur la plateforme — inscriptions, connexions, actions admin."
          action={
            <div className="px-4 py-2 bg-muted rounded-xl text-sm font-semibold">
              {total} événement{total !== 1 ? "s" : ""}
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Category tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  category === c.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher (nom, email, détails…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="px-3 py-1.5 bg-muted rounded-xl text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-muted-foreground">
              <ScrollText className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <p>Impossible de charger le journal d'audit.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ScrollText className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <p>Aucun événement trouvé.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((log: any) => {
                const meta = getEventMeta(log.action);
                const Icon = meta.icon;
                const details = log.details as Record<string, unknown> | null;

                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{meta.label}</span>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{log.action}</code>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {/* Actor */}
                        {log.admin ? (
                          <span>
                            Par <span className="font-semibold text-foreground">{log.admin.fullName}</span>
                            {log.admin.role && <span className="text-muted-foreground/70"> ({log.admin.role})</span>}
                          </span>
                        ) : (
                          <span className="italic">système</span>
                        )}

                        {/* Target */}
                        {log.targetType && (
                          <span>{log.targetType}{log.targetId ? ` #${log.targetId}` : ""}</span>
                        )}

                        {/* IP */}
                        {log.ipAddress && (
                          <span className="font-mono">{log.ipAddress}</span>
                        )}
                      </div>

                      {/* Details */}
                      {details && Object.keys(details).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(details).map(([k, v]) => (
                            <span key={k} className="text-[11px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                              <span className="font-semibold text-foreground/70">{k}:</span> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p className="font-medium">{format(new Date(log.createdAt), "d MMM yyyy", { locale: fr })}</p>
                      <p className="font-mono">{format(new Date(log.createdAt), "HH:mm:ss")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages} · {total} événements au total
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
