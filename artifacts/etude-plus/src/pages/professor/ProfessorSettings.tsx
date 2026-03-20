import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ProfileCard } from "@/components/shared/ProfileCard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Loader2, BookOpen, Save, ShieldCheck, AlertCircle, Clock,
  RefreshCw, CheckCircle2, PlusCircle, Upload, FileText, X, Eye,
} from "lucide-react";
import { Link } from "wouter";
import { ALL_SUBJECTS, LEVEL_TREE, getLevelLabel } from "@/lib/educationConfig";

// ── helpers ──────────────────────────────────────────────────────────────────

async function apiFetch(url: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  return res;
}

async function uploadFile(file: File): Promise<string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const reqRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST", headers,
    body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }),
  });
  const reqData = await reqRes.json();

  if (reqData.local) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const up = await fetch("/api/storage/uploads/direct", {
      method: "POST", headers,
      body: JSON.stringify({ objectPath: reqData.objectPath, content: base64, contentType: file.type }),
    });
    const upData = await up.json();
    return upData.objectPath ?? reqData.objectPath;
  } else if (reqData.uploadUrl) {
    await fetch(reqData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    return reqData.objectPath;
  }
  throw new Error("Upload failed");
}

// ── ChangePasswordCard ────────────────────────────────────────────────────────

function ChangePasswordCard() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" }); return; }
    if (next.length < 8) { toast({ title: "Erreur", description: "Minimum 8 caractères.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast({ title: "Mot de passe mis à jour" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-bold text-lg">Changer le mot de passe</h3>
      </div>
      <form onSubmit={handle} className="space-y-4 max-w-sm">
        <div><Label>Mot de passe actuel</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" /></div>
        <div><Label>Nouveau mot de passe</Label><Input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Minimum 8 caractères" /></div>
        <div><Label>Confirmer</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter le mot de passe" /></div>
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour…</> : "Changer le mot de passe"}
        </Button>
      </form>
    </Card>
  );
}

// ── ProfessionalCard ──────────────────────────────────────────────────────────

function ProfessionalCard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const prof = (user as any)?.professorProfile;
  const [bio, setBio] = useState(prof?.bio ?? "");
  const [qualifications, setQualifications] = useState(prof?.qualifications ?? "");
  const [saving, setSaving] = useState(false);

  if (!prof) return null;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${(user as any).id}`, {
        method: "PUT",
        body: JSON.stringify({ bio, qualifications }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as any).error ?? "Erreur"); }
      await refreshUser();
      toast({ title: "Profil professionnel mis à jour" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Profil professionnel</h3>
          <p className="text-xs text-muted-foreground">Visible par les élèves sur votre page publique</p>
        </div>
      </div>

      {/* Current approved subjects + levels */}
      {(prof.subjects?.length > 0 || prof.gradeLevels?.length > 0) && (
        <div className="mb-5 p-4 bg-muted/50 rounded-xl space-y-3">
          {prof.subjects?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Matières approuvées</p>
              <div className="flex flex-wrap gap-1.5">
                {prof.subjects.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {prof.gradeLevels?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Niveaux approuvés</p>
              <div className="flex flex-wrap gap-1.5">
                {prof.gradeLevels.map((g: string) => (
                  <span key={g} className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{getLevelLabel(g)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handle} className="space-y-5">
        <div>
          <Label>Biographie</Label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            placeholder="Décrivez votre expérience, votre méthode d'enseignement…"
            className="flex w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
          />
        </div>
        <div>
          <Label>Qualifications</Label>
          <Input value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="Ex: Master en Mathématiques, Agrégé…" />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde…</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
        </Button>
      </form>
    </Card>
  );
}

// ── VerificationStatusCard ────────────────────────────────────────────────────

function VerificationStatusCard() {
  const { user } = useAuth();
  const prof = (user as any)?.professorProfile;
  const status: string = prof?.status ?? "pending";

  const cfg = {
    pending: { icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50 border-amber-200", label: "En attente de soumission", desc: "Soumettez vos documents pour activer votre compte professeur.", cta: "Soumettre mes documents" },
    kyc_submitted: { icon: <ShieldCheck className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50 border-blue-200", label: "Dossier en cours d'examen", desc: "Votre dossier est en cours de vérification par notre équipe (24–48h).", cta: "Voir le statut" },
    approved: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50 border-green-200", label: "Compte vérifié", desc: "Votre profil est validé. Vous pouvez créer et publier des cours.", cta: null },
    rejected: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: "bg-red-50 border-red-200", label: "Dossier refusé", desc: "Votre dossier n'a pas été validé. Consultez les détails pour re-soumettre.", cta: "Voir les détails" },
    needs_revision: { icon: <RefreshCw className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50 border-amber-200", label: "Corrections demandées", desc: "Des éléments de votre dossier nécessitent des corrections.", cta: "Corriger mon dossier" },
  };
  const c = cfg[status as keyof typeof cfg] ?? cfg.pending;

  return (
    <Card className={`p-6 border-2 ${c.bg}`}>
      <div className="flex items-center gap-3 mb-1">{c.icon}<h3 className="font-bold">Vérification du compte</h3></div>
      <p className="text-sm text-muted-foreground mb-1 ml-8">{c.label}</p>
      <p className="text-sm text-muted-foreground ml-8">{c.desc}</p>
      {c.cta && (
        <div className="mt-4 ml-8">
          <Link href="/professor/kyc"><Button variant="outline" size="sm">{c.cta}</Button></Link>
        </div>
      )}
    </Card>
  );
}

// ── SubjectRequestCard ────────────────────────────────────────────────────────

function SubjectRequestCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const prof = (user as any)?.professorProfile;
  const profId: number | undefined = prof?.id;

  const approvedSubjects: string[] = prof?.subjects ?? [];
  const approvedLevels: string[] = prof?.gradeLevels ?? [];

  // New selections (exclude already approved)
  const [newSubjects, setNewSubjects] = useState<string[]>([]);
  const [newLevels, setNewLevels] = useState<string[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch existing requests
  const { data: requests = [], refetch } = useQuery<any[]>({
    queryKey: ["subject-requests", profId],
    queryFn: async () => {
      if (!profId) return [];
      const res = await apiFetch(`/api/professors/${profId}/subject-requests`);
      return res.ok ? res.json() : [];
    },
    enabled: !!profId,
  });

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjects.length === 0) { toast({ title: "Erreur", description: "Sélectionnez au moins une matière.", variant: "destructive" }); return; }
    if (!docFile) { toast({ title: "Erreur", description: "Un document justificatif est requis.", variant: "destructive" }); return; }

    setUploading(true);
    let docUrl: string;
    try {
      docUrl = await uploadFile(docFile);
    } catch {
      toast({ title: "Erreur", description: "Échec du téléversement du document.", variant: "destructive" });
      setUploading(false);
      return;
    }
    setUploading(false);
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/professors/${profId}/subject-requests`, {
        method: "POST",
        body: JSON.stringify({ subjects: newSubjects, gradeLevels: newLevels, documentUrl: docUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast({ title: "Demande envoyée", description: "Un admin examinera votre demande sous 24–48h." });
      setNewSubjects([]); setNewLevels([]); setDocFile(null); setShowForm(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (!prof || prof.status !== "approved") return null;

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const availableSubjects = ALL_SUBJECTS.filter(s => !approvedSubjects.includes(s));
  const hasPending = requests.some((r: any) => r.status === "pending");

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <PlusCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Ajouter des matières / niveaux</h3>
            <p className="text-xs text-muted-foreground">Demandez l'autorisation d'enseigner de nouvelles matières</p>
          </div>
        </div>
        {!showForm && !hasPending && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <PlusCircle className="w-4 h-4" /> Nouvelle demande
          </Button>
        )}
      </div>

      {/* Past requests */}
      {requests.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Demandes précédentes</p>
          {requests.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${
              r.status === "approved" ? "bg-green-50 border-green-200" :
              r.status === "rejected" ? "bg-red-50 border-red-200" :
              "bg-amber-50 border-amber-200"
            }`}>
              {r.status === "approved" ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> :
               r.status === "rejected" ? <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> :
               <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0 animate-pulse" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {r.status === "approved" ? "Approuvée" : r.status === "rejected" ? "Refusée" : "En attente d'examen"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Matières : {r.subjects.join(", ")}
                  {r.gradeLevels?.length > 0 && ` • Niveaux : ${r.gradeLevels.map(getLevelLabel).join(", ")}`}
                </p>
                {r.adminNotes && (
                  <p className="text-xs mt-1 italic">Note admin : {r.adminNotes}</p>
                )}
                {r.documentUrl && (
                  <a href={`/api/storage${r.documentUrl}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                    <Eye className="w-3 h-3" /> Voir le document
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          ))}
        </div>
      )}

      {hasPending && !showForm && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Clock className="w-4 h-4 inline mr-1.5" />
          Une demande est en cours d'examen. Vous pourrez en soumettre une nouvelle après la réponse de l'admin.
        </div>
      )}

      {/* Form */}
      {showForm && !hasPending && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New subjects */}
          <div>
            <Label>Matières à ajouter <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Seules les matières que vous n'enseignez pas encore sont affichées.
            </p>
            {availableSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vous enseignez déjà toutes les matières disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map(s => (
                  <button key={s} type="button" onClick={() => toggle(newSubjects, setNewSubjects, s)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      newSubjects.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New levels (optional) */}
          <div>
            <Label>Niveaux à ajouter (optionnel)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Si votre document justifie de nouveaux niveaux.</p>
            <div className="space-y-2">
              {LEVEL_TREE.map(group => {
                const available = group.levels.filter(({ key }) => !approvedLevels.includes(key));
                if (available.length === 0) return null;
                return (
                  <div key={group.id}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => toggle(newLevels, setNewLevels, key)}
                          className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            newLevels.includes(key) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supporting document */}
          <div>
            <Label>Document justificatif <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Diplôme, attestation, ou tout document prouvant votre compétence. (PDF, JPG, PNG)
            </p>
            <div
              className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                docFile ? "border-green-400 bg-green-50" : "border-dashed border-border hover:border-primary/40"
              }`}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
              <div className="flex items-center gap-3">
                {docFile
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  : <Upload className="w-5 h-5 text-muted-foreground shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{docFile ? docFile.name : "Cliquez pour choisir un fichier"}</p>
                  {docFile && <p className="text-xs text-green-600 mt-0.5">{(docFile.size / 1024).toFixed(0)} KB</p>}
                </div>
                {docFile && (
                  <button type="button" onClick={e => { e.stopPropagation(); setDocFile(null); }}
                    className="ml-auto p-1 rounded hover:bg-destructive/10 text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || uploading || newSubjects.length === 0 || !docFile} className="gap-2">
              {(submitting || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {uploading ? "Envoi du document…" : submitting ? "Soumission…" : "Soumettre la demande"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setNewSubjects([]); setNewLevels([]); setDocFile(null); }}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {!showForm && !hasPending && requests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Vous pouvez demander l'ajout de nouvelles matières ou niveaux à tout moment en soumettant un document justificatif.
        </p>
      )}

      {!showForm && !hasPending && requests.length > 0 && requests.every((r: any) => r.status !== "pending") && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5 mt-2">
          <PlusCircle className="w-4 h-4" /> Nouvelle demande
        </Button>
      )}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfessorSettings() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Mon profil" description="Gérez votre profil public et vos informations personnelles." />
        <div className="max-w-3xl space-y-6">
          <VerificationStatusCard />
          <ProfileCard />
          <ProfessionalCard />
          <SubjectRequestCard />
          <ChangePasswordCard />
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
