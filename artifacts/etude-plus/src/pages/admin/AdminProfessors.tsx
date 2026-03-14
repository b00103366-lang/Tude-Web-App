import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import {
  ShieldAlert, ShieldCheck, Eye, X, FileText, CheckCircle2,
  XCircle, Clock, User, MapPin, BookOpen, Download, ExternalLink
} from "lucide-react";
import { useListProfessors, useApproveProfessor, useRejectProfessor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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

const statusConfig = {
  approved: { label: "Approuvé", icon: ShieldCheck, badge: "success" as const, color: "text-green-600 bg-green-100" },
  pending: { label: "En attente", icon: Clock, badge: "secondary" as const, color: "text-orange-600 bg-orange-100" },
  rejected: { label: "Refusé", icon: XCircle, badge: "destructive" as const, color: "text-red-600 bg-red-100" },
};

type FilterKey = "all" | "pending" | "approved" | "rejected";

export function AdminProfessors() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedProf, setSelectedProf] = useState<any>(null);

  const { data: professorsData, isLoading } = useListProfessors() as any;
  const professors: any[] = professorsData?.professors ?? [];
  const approveMutation = useApproveProfessor();
  const rejectMutation = useRejectProfessor();

  const filtered = filter === "all" ? professors : professors.filter((p: any) => p.status === filter);

  const counts = {
    all: professors.length,
    pending: professors.filter((p: any) => p.status === "pending").length,
    approved: professors.filter((p: any) => p.status === "approved").length,
    rejected: professors.filter((p: any) => p.status === "rejected").length,
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
    rejectMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/professors"] });
        if (selectedProf?.id === id) setSelectedProf((p: any) => p ? { ...p, status: "rejected" } : null);
      }
    });
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Professeurs & Vérification KYC"
          description="Examinez les dossiers KYC et gérez les candidatures des professeurs."
        />

        {/* Filter stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {([
            { key: "all", label: "Total", color: "bg-slate-100 text-slate-700" },
            { key: "pending", label: "En attente", color: "bg-orange-100 text-orange-700" },
            { key: "approved", label: "Approuvés", color: "bg-green-100 text-green-700" },
            { key: "rejected", label: "Refusés", color: "bg-red-100 text-red-700" },
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
              {filter === "all" ? "Aucun professeur inscrit pour l'instant." : `Aucun professeur dans la catégorie "${statusConfig[filter as keyof typeof statusConfig]?.label ?? filter}".`}
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
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {prof.user?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{prof.user.city}</span>}
                          {prof.subjects?.length > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{prof.subjects.join(", ")}</span>}
                          {prof.user?.email && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{prof.user.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setSelectedProf(prof)}>
                        <Eye className="w-4 h-4 mr-1.5" /> Dossier
                      </Button>
                      {status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={rejectMutation.isPending} onClick={() => handleReject(prof.id)}>
                            <X className="w-4 h-4 mr-1" /> Refuser
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={approveMutation.isPending} onClick={() => handleApprove(prof.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approuver
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Modal open={!!selectedProf} onClose={() => setSelectedProf(null)}>
          {selectedProf && (() => {
            const status = selectedProf.status as keyof typeof statusConfig;
            const cfg = statusConfig[status] ?? statusConfig.pending;
            const name = selectedProf.user?.fullName ?? selectedProf.fullName ?? `Professeur #${selectedProf.id}`;
            return (
              <>
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h3 className="text-xl font-bold">{name}</h3>
                    <p className="text-sm text-muted-foreground">Dossier KYC · Professeur #{selectedProf.id}</p>
                  </div>
                  <button onClick={() => setSelectedProf(null)} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${cfg.color}`}>
                    <cfg.icon className="w-5 h-5" />
                    <p className="font-semibold">Statut KYC: {cfg.label}</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Informations</h4>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ["Email", selectedProf.user?.email],
                        ["Ville", selectedProf.user?.city],
                        ["Matières", selectedProf.subjects?.join(", ")],
                        ["Niveaux", selectedProf.gradeLevels?.join(", ")],
                        ["Cours actifs", String(selectedProf.totalClasses ?? 0)],
                        ["Élèves totaux", String(selectedProf.totalStudents ?? 0)],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">{k}</p>
                          <p className="font-semibold">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedProf.bio && (
                    <div>
                      <h4 className="font-bold mb-2 text-sm uppercase text-muted-foreground tracking-wider">Biographie</h4>
                      <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 leading-relaxed">{selectedProf.bio}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Documents KYC (via KBlox)</h4>
                    <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Les documents sont gérés directement sur la plateforme KBlox.</p>
                    </div>
                    <a href="https://kblox.replit.app" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="w-4 h-4" /> Ouvrir le dossier sur KBlox
                    </a>
                  </div>

                  {status === "pending" && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={rejectMutation.isPending} onClick={() => handleReject(selectedProf.id)}>
                        <X className="w-4 h-4 mr-2" /> Refuser
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={approveMutation.isPending} onClick={() => handleApprove(selectedProf.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approuver le KYC
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
