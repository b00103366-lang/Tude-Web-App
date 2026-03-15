import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import {
  ShieldAlert, ShieldCheck, Eye, X, FileText, CheckCircle2,
  XCircle, Clock, User, MapPin, BookOpen, Download, AlertCircle
} from "lucide-react";
import { useListProfessors, useApproveProfessor, getToken } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DocLink({ label, objectPath }: { label: string; objectPath?: string | null }) {
  if (!objectPath) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Non soumis</p>
        </div>
      </div>
    );
  }

  const url = `/api/storage${objectPath}`;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-green-800">{label}</p>
        <p className="text-xs text-green-600 truncate">{objectPath.split("/").pop()}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-green-100 text-green-700"
          title="Ouvrir"
        >
          <Eye className="w-4 h-4" />
        </a>
        <a
          href={url}
          download
          className="p-1.5 rounded-lg hover:bg-green-100 text-green-700"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

const statusConfig = {
  approved:      { label: "Approuvé",      icon: ShieldCheck, badge: "success" as const,      color: "text-green-600 bg-green-100"  },
  pending:       { label: "En attente",    icon: Clock,       badge: "secondary" as const,    color: "text-orange-600 bg-orange-100"},
  kyc_submitted: { label: "Documents soumis", icon: FileText, badge: "secondary" as const,    color: "text-blue-600 bg-blue-100"    },
  rejected:      { label: "Refusé",        icon: XCircle,     badge: "destructive" as const,  color: "text-red-600 bg-red-100"      },
};

type FilterKey = "all" | "pending" | "kyc_submitted" | "approved" | "rejected";

export function AdminProfessors() {
  const qc = useQueryClient();
  const [filter, setFilter]           = useState<FilterKey>("all");
  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [rejectNotes, setRejectNotes]  = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: professorsData, isLoading } = useListProfessors() as any;
  const professors: any[] = professorsData?.professors ?? [];
  const approveMutation = useApproveProfessor();

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const token = getToken();
      const res = await fetch(`/api/professors/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Erreur lors du refus");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/professors"] });
      if (selectedProf?.id === vars.id) {
        setSelectedProf((p: any) => p ? { ...p, status: "rejected", documentNotes: vars.notes } : null);
      }
      setShowRejectForm(false);
      setRejectNotes("");
    }
  });

  const filtered = filter === "all" ? professors : professors.filter((p: any) => p.status === filter);

  const counts = {
    all:           professors.length,
    pending:       professors.filter((p: any) => p.status === "pending").length,
    kyc_submitted: professors.filter((p: any) => p.status === "kyc_submitted").length,
    approved:      professors.filter((p: any) => p.status === "approved").length,
    rejected:      professors.filter((p: any) => p.status === "rejected").length,
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/professors"] });
        if (selectedProf?.id === id) setSelectedProf((p: any) => p ? { ...p, status: "approved" } : null);
      }
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id, notes: rejectNotes });
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Professeurs & Vérification"
          description="Examinez les dossiers soumis et gérez les candidatures des professeurs."
        />

        {/* Filter stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {([
            { key: "all",           label: "Total",             color: "bg-slate-100 text-slate-700"  },
            { key: "pending",       label: "En attente",        color: "bg-orange-100 text-orange-700"},
            { key: "kyc_submitted", label: "Docs soumis",       color: "bg-blue-100 text-blue-700"   },
            { key: "approved",      label: "Approuvés",         color: "bg-green-100 text-green-700" },
            { key: "rejected",      label: "Refusés",           color: "bg-red-100 text-red-700"     },
          ] as { key: FilterKey; label: string; color: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${filter === s.key ? "border-primary shadow-md" : "border-transparent"} ${s.color}`}
            >
              <p className="text-3xl font-bold">{counts[s.key]}</p>
              <p className="text-sm font-semibold mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {filter === "all" ? "Aucun professeur inscrit pour l'instant." : `Aucun professeur dans cette catégorie.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((prof: any) => {
              const status = prof.status as keyof typeof statusConfig;
              const cfg = statusConfig[status] ?? statusConfig.pending;
              return (
                <Card key={prof.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <cfg.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg">{prof.user?.fullName ?? prof.fullName ?? `Professeur #${prof.id}`}</h3>
                          <Badge variant={cfg.badge}>{cfg.label}</Badge>
                          {prof.idDocumentUrl && <Badge variant="outline" className="text-xs">📎 Docs</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {prof.user?.city   && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{prof.user.city}</span>}
                          {prof.subjects?.length > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{prof.subjects.join(", ")}</span>}
                          {prof.user?.email  && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{prof.user.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedProf(prof); setShowRejectForm(false); setRejectNotes(""); }}>
                        <Eye className="w-4 h-4 mr-1.5" /> Dossier
                      </Button>
                      {(status === "pending" || status === "kyc_submitted") && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={approveMutation.isPending} onClick={() => handleApprove(prof.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approuver
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Modal open={!!selectedProf} onClose={() => { setSelectedProf(null); setShowRejectForm(false); setRejectNotes(""); }}>
          {selectedProf && (() => {
            const status = selectedProf.status as keyof typeof statusConfig;
            const cfg = statusConfig[status] ?? statusConfig.pending;
            const name = selectedProf.user?.fullName ?? selectedProf.fullName ?? `Professeur #${selectedProf.id}`;
            const canAct = status === "pending" || status === "kyc_submitted";
            const hasDocs = selectedProf.idDocumentUrl || selectedProf.teachingCertUrl;

            return (
              <>
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h3 className="text-xl font-bold">{name}</h3>
                    <p className="text-sm text-muted-foreground">Dossier de candidature · Professeur #{selectedProf.id}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedProf(null); setShowRejectForm(false); }}
                    className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status badge */}
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${cfg.color}`}>
                    <cfg.icon className="w-5 h-5" />
                    <p className="font-semibold">Statut : {cfg.label}</p>
                  </div>

                  {/* Rejection notes (if any) */}
                  {selectedProf.documentNotes && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-semibold mb-1">Motif de refus</p>
                        <p>{selectedProf.documentNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Info grid */}
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Informations</h4>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ["Email", selectedProf.user?.email ?? selectedProf.email],
                        ["Téléphone", selectedProf.user?.phone ?? selectedProf.phone],
                        ["Ville", selectedProf.user?.city ?? selectedProf.city],
                        ["Matières", selectedProf.subjects?.join(", ")],
                        ["Niveaux", selectedProf.gradeLevels?.join(", ")],
                        ["Expérience", selectedProf.yearsOfExperience ? `${selectedProf.yearsOfExperience} ans` : null],
                        ["Qualifications", selectedProf.qualifications],
                        ["Élèves totaux", String(selectedProf.totalStudents ?? 0)],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">{k}</p>
                          <p className="font-semibold text-sm">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedProf.bio && (
                    <div>
                      <h4 className="font-bold mb-2 text-sm uppercase text-muted-foreground tracking-wider">Biographie</h4>
                      <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 leading-relaxed">{selectedProf.bio}</p>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Documents soumis</h4>
                    {!hasDocs ? (
                      <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun document soumis pour l'instant.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <DocLink label="Pièce d'identité nationale" objectPath={selectedProf.idDocumentUrl} />
                        <DocLink label="Certificat d'enseignement" objectPath={selectedProf.teachingCertUrl} />
                        {selectedProf.additionalDocUrl && (
                          <DocLink label="Document complémentaire" objectPath={selectedProf.additionalDocUrl} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reject form */}
                  {canAct && showRejectForm && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                      <p className="text-sm font-semibold text-red-800">Motif du refus (optionnel)</p>
                      <textarea
                        value={rejectNotes}
                        onChange={e => setRejectNotes(e.target.value)}
                        placeholder="Ex: Documents illisibles, certificat expiré, pièce d'identité non valide..."
                        className="w-full rounded-lg border border-red-200 bg-white p-3 text-sm resize-none min-h-[80px] focus:outline-none focus:border-red-400"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRejectForm(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          disabled={rejectMutation.isPending}
                          onClick={() => handleReject(selectedProf.id)}
                        >
                          {rejectMutation.isPending ? "Envoi..." : "Confirmer le refus"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {canAct && !showRejectForm && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowRejectForm(true)}
                      >
                        <X className="w-4 h-4 mr-2" /> Refuser
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={approveMutation.isPending}
                        onClick={() => handleApprove(selectedProf.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approuver
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      </FadeIn>
    </DashboardLayout>
  );
}
