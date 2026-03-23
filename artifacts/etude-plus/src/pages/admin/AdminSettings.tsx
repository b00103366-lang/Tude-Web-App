import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ProfileCard } from "@/components/shared/ProfileCard";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Settings, Shield, AlertTriangle, KeyRound, Percent,
  DollarSign, Save, Loader2, User, Megaphone, Trash2,
  Tag, Copy, Check, ToggleLeft, ToggleRight, Plus, Calendar,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function adminFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
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

export function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState<"all" | "students" | "professors" | "admins" | "specific">("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; fullName: string; role: string }[]>([]);

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["admin-announcements"],
    queryFn: () => adminFetch("/api/announcements/all"),
    refetchInterval: 30_000,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["admin-all-users"],
    queryFn: () => adminFetch("/api/users"),
  });

  const filteredUsers = userSearch.trim().length > 1
    ? allUsers.filter((u: any) =>
        !selectedUsers.find(s => s.id === u.id) &&
        (u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(userSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const audienceLabels: Record<string, string> = {
    all: "Tout le monde",
    students: "Tous les étudiants",
    professors: "Tous les professeurs",
    admins: "Tous les admins",
    specific: "Personnes spécifiques",
  };

  const postAnn = useMutation({
    mutationFn: (data: { title: string; body: string; targetAudience: string; targetUserIds: number[] }) =>
      adminFetch("/api/announcements", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setAnnTitle(""); setAnnBody(""); setAnnAudience("all"); setSelectedUsers([]); setUserSearch("");
      toast({ title: "Annonce publiée", description: `Visible pour : ${audienceLabels[annAudience]}.` });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteAnn = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Discount codes
  const [dcCode, setDcCode] = useState("");
  const [dcPct, setDcPct] = useState("");
  const [dcMaxUses, setDcMaxUses] = useState("");
  const [dcExpiry, setDcExpiry] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDeleteDc, setConfirmDeleteDc] = useState<number | null>(null);

  const { data: discountCodes = [] } = useQuery<any[]>({
    queryKey: ["admin-discount-codes"],
    queryFn: () => adminFetch("/api/admin/discount-codes"),
  });

  const createDc = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/discount-codes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setDcCode(""); setDcPct(""); setDcMaxUses(""); setDcExpiry("");
      toast({ title: "Code créé", description: "Le code promo est maintenant actif." });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const patchDc = useMutation({
    mutationFn: ({ id, ...data }: any) => adminFetch(`/api/admin/discount-codes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-discount-codes"] }),
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteDc = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setConfirmDeleteDc(null);
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Platform settings — loaded from /api/admin/settings
  const [commission, setCommission] = useState("15");
  const [maxPrice, setMaxPrice] = useState("30");
  const [maintenance, setMaintenance] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);

  // Load real settings on mount
  const { data: platformSettings } = useQuery<any>({
    queryKey: ["admin-platform-settings"],
    queryFn: () => adminFetch("/api/admin/settings"),
  });

  // Sync state when settings load
  if (platformSettings && commission === "15" && maxPrice === "30" && !maintenance) {
    if (platformSettings.commissionRate !== undefined) setCommission(String(platformSettings.commissionRate));
    if (platformSettings.maxCoursePrice !== undefined) setMaxPrice(String(platformSettings.maxCoursePrice));
    if (platformSettings.maintenanceMode !== undefined) setMaintenance(!!platformSettings.maintenanceMode);
  }

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(commission);
    const p = parseFloat(maxPrice);
    if (isNaN(c) || c < 1 || c > 50) {
      toast({ title: "Erreur", description: "La commission doit être entre 1% et 50%.", variant: "destructive" });
      return;
    }
    if (isNaN(p) || p < 1) {
      toast({ title: "Erreur", description: "Le prix maximum doit être supérieur à 0.", variant: "destructive" });
      return;
    }
    setSavingPlatform(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ commissionRate: c, maxCoursePrice: p, maintenanceMode: maintenance }),
      });
      qc.invalidateQueries({ queryKey: ["admin-platform-settings"] });
      toast({
        title: "Paramètres enregistrés",
        description: maintenance
          ? "Mode maintenance activé. La plateforme est hors ligne pour les utilisateurs."
          : "Paramètres de la plateforme mis à jour.",
      });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit faire au moins 8 caractères.", variant: "destructive" });
      return;
    }
    if (!newPassword) {
      toast({ title: "Rien à modifier", description: "Saisissez un nouveau mot de passe.", variant: "destructive" });
      return;
    }
    setSavingAccount(true);
    try {
      if (newPassword) {
        await adminFetch("/api/auth/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
      }
      toast({ title: "Compte mis à jour", description: "Vos informations ont été sauvegardées." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Paramètres"
          description="Configuration globale de la plateforme Étude+."
        />

        <div className="max-w-3xl space-y-6">

          {/* Profile */}
          <ProfileCard />

          {/* Platform settings */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Paramètres plateforme</h3>
                <p className="text-sm text-muted-foreground">Règles financières et disponibilité de la plateforme</p>
              </div>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" /> Commission plateforme (%)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      value={commission}
                      onChange={e => setCommission(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Prélevée sur chaque transaction (actuellement {commission}%)</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" /> Prix maximum par cours (TND)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">TND</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Les professeurs ne peuvent pas dépasser cette limite</p>
                </div>
              </div>

              {/* Maintenance mode */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${maintenance ? "text-orange-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-semibold text-sm">Mode maintenance</p>
                    <p className="text-xs text-muted-foreground">
                      {maintenance
                        ? "⚠️ La plateforme est actuellement hors ligne pour les utilisateurs"
                        : "La plateforme est opérationnelle"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenance(m => !m)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${maintenance ? "bg-orange-500" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${maintenance ? "translate-x-7" : "translate-x-0"}`} />
                </button>
              </div>

              {maintenance && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-bold mb-1">Mode maintenance activé</p>
                    <p>Les élèves et professeurs ne pourront pas accéder à la plateforme. Seuls les administrateurs restent connectés. Pensez à désactiver ce mode une fois votre maintenance terminée.</p>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={savingPlatform}>
                {savingPlatform ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde…</> : <><Save className="w-4 h-4 mr-2" />Enregistrer les paramètres</>}
              </Button>
            </form>
          </Card>

          {/* Password change */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Changer le mot de passe</h3>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 max-w-sm">
              <div>
                <Label>Mot de passe actuel</Label>
                <Input
                  type="password"
                  placeholder="Requis pour changer le mot de passe"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  placeholder="Minimum 8 caractères"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Confirmer</Label>
                <Input
                  type="password"
                  placeholder="Répéter le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={savingAccount}>
                {savingAccount ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour…</> : <><Save className="w-4 h-4 mr-2" />Changer le mot de passe</>}
              </Button>
            </form>
          </Card>

          {/* Announcements */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Annonces plateforme</h3>
                <p className="text-sm text-muted-foreground">Visibles sur les tableaux de bord de tous les utilisateurs</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label>Titre</Label>
                <Input placeholder="ex: Maintenance prévue le..." value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Contenu de l'annonce..."
                  value={annBody}
                  onChange={e => setAnnBody(e.target.value)}
                />
              </div>

              {/* Audience selector */}
              <div>
                <Label>Destinataires</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {(["all", "students", "professors", "admins", "specific"] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setAnnAudience(opt); setSelectedUsers([]); setUserSearch(""); }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                        annAudience === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      {audienceLabels[opt]}
                    </button>
                  ))}
                </div>
              </div>

              {/* User picker for "specific" */}
              {annAudience === "specific" && (
                <div>
                  <Label>Rechercher des utilisateurs</Label>
                  <div className="relative mt-1">
                    <Input
                      placeholder="Nom ou email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                    {filteredUsers.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                        {filteredUsers.map((u: any) => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center justify-between gap-3 text-sm"
                            onClick={() => { setSelectedUsers(s => [...s, u]); setUserSearch(""); }}
                          >
                            <span className="font-medium">{u.fullName}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map(u => (
                        <span key={u.id} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                          {u.fullName}
                          <button type="button" onClick={() => setSelectedUsers(s => s.filter(x => x.id !== u.id))} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedUsers.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Ajoutez au moins une personne</p>
                  )}
                </div>
              )}

              <Button
                disabled={
                  postAnn.isPending || !annTitle || !annBody ||
                  (annAudience === "specific" && selectedUsers.length === 0)
                }
                onClick={() => postAnn.mutate({
                  title: annTitle,
                  body: annBody,
                  targetAudience: annAudience,
                  targetUserIds: selectedUsers.map(u => u.id),
                })}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                {postAnn.isPending ? "Publication..." : `Publier → ${audienceLabels[annAudience]}`}
              </Button>
            </div>

            {announcements.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Annonces actives ({announcements.length})</p>
                <div className="space-y-3">
                  {announcements.map((a: any) => (
                    <div key={a.id} className="flex items-start justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{a.title}</p>
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                            {audienceLabels[a.targetAudience] ?? "Tout le monde"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                        {a.targetAudience === "specific" && Array.isArray(a.targetUserIds) && a.targetUserIds.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.targetUserIds.length} destinataire{a.targetUserIds.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAnn.mutate(a.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Discount codes */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Codes Promo</h3>
                <p className="text-sm text-muted-foreground">Créez des codes de réduction pour vos étudiants</p>
              </div>
            </div>

            {/* Create form */}
            <div className="mb-6 p-5 bg-secondary/50 rounded-xl border border-border">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2"><Plus className="w-4 h-4" />Créer un nouveau code</h4>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Code (ex: SUMMER25)</Label>
                  <Input
                    placeholder="ETUDE20"
                    value={dcCode}
                    onChange={e => setDcCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="uppercase font-mono tracking-widest"
                  />
                </div>
                <div>
                  <Label>Réduction (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="20"
                    value={dcPct}
                    onChange={e => setDcPct(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Utilisations max (vide = illimité)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={dcMaxUses}
                    onChange={e => setDcMaxUses(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Date d'expiration (vide = jamais)</Label>
                  <Input
                    type="date"
                    value={dcExpiry}
                    onChange={e => setDcExpiry(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <Button
                onClick={() => createDc.mutate({ code: dcCode, discountPercentage: dcPct, maxUses: dcMaxUses || null, expiresAt: dcExpiry || null })}
                disabled={createDc.isPending || !dcCode || !dcPct}
              >
                {createDc.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Créer le code
              </Button>
            </div>

            {/* Codes table */}
            {discountCodes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucun code promo créé pour l'instant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="pb-3 pr-4">Code</th>
                      <th className="pb-3 pr-4">Réduction</th>
                      <th className="pb-3 pr-4">Utilisations</th>
                      <th className="pb-3 pr-4">Expiration</th>
                      <th className="pb-3 pr-4">Statut</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {discountCodes.map((dc: any) => {
                      const isExpired = dc.expiresAt && new Date() > new Date(dc.expiresAt);
                      const isExhausted = dc.maxUses !== null && dc.timesUsed >= dc.maxUses;
                      const statusLabel = isExpired ? "Expiré" : isExhausted ? "Épuisé" : dc.isActive ? "Actif" : "Inactif";
                      const statusClass = isExpired || isExhausted
                        ? "bg-red-100 text-red-700"
                        : dc.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground";

                      return (
                        <tr key={dc.id} className="py-3">
                          <td className="py-3 pr-4">
                            <span className="font-mono font-bold tracking-wider text-foreground">{dc.code}</span>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-primary">{dc.discountPercentage}%</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {dc.timesUsed}{dc.maxUses !== null ? `/${dc.maxUses}` : ""}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {dc.expiresAt ? new Date(dc.expiresAt).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              {/* Copy */}
                              <button
                                onClick={() => copyCode(dc.id, dc.code)}
                                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                                title="Copier le code"
                              >
                                {copiedId === dc.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {/* Toggle active */}
                              {!isExpired && !isExhausted && (
                                <button
                                  onClick={() => patchDc.mutate({ id: dc.id, isActive: !dc.isActive })}
                                  className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                                  title={dc.isActive ? "Désactiver" : "Activer"}
                                >
                                  {dc.isActive
                                    ? <ToggleRight className="w-4 h-4 text-green-500" />
                                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                                </button>
                              )}
                              {/* Delete */}
                              {confirmDeleteDc === dc.id ? (
                                <div className="flex items-center gap-1 ml-1">
                                  <button
                                    onClick={() => deleteDc.mutate(dc.id)}
                                    className="text-xs px-2 py-0.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteDc(null)}
                                    className="text-xs px-2 py-0.5 border border-border rounded-md hover:bg-muted"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteDc(dc.id)}
                                  className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-red-500"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* Platform info */}
          <Card className="p-8">
            <h3 className="font-bold text-base mb-4 pb-3 border-b border-border">Informations système</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Plateforme", "Étude+"],
                ["Version", "2.0.0"],
                ["Environnement", process.env.NODE_ENV ?? "production"],
                ["Base de données", "PostgreSQL"],
                ["Commission active", `${commission}%`],
                ["Prix max cours", `${maxPrice} TND`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
