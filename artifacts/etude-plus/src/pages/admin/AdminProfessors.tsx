import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import {
  ShieldAlert, ShieldCheck, Eye, X, FileText, CheckCircle2,
  XCircle, Clock, User, MapPin, BookOpen, Download, ExternalLink
} from "lucide-react";

// --- KYC Demo Data ---
const PROFESSORS = [
  {
    id: 1,
    name: "Dr. Sami Trabelsi",
    email: "prof@etude.tn",
    city: "Tunis",
    subjects: ["Mathématiques"],
    gradeLevels: ["Baccalauréat"],
    yearsExperience: 12,
    bio: "Professeur agrégé de Mathématiques avec 12 ans d'expérience dans les lycées de Tunis. Spécialisé en analyse et algèbre.",
    status: "approved" as const,
    kycId: "KYC-2024-0001",
    kycDate: "2024-01-15",
    documents: [
      { id: 1, type: "Carte d'identité nationale (CIN)", status: "verified", uploadDate: "2024-01-14" },
      { id: 2, type: "Diplôme d'agrégation (Mathématiques)", status: "verified", uploadDate: "2024-01-14" },
      { id: 3, type: "Attestation d'expérience professionnelle", status: "verified", uploadDate: "2024-01-14" },
    ],
    classes: 3,
    totalStudents: 120,
    approvedBy: "Admin",
  },
  {
    id: 2,
    name: "Mme. Rym Jlassi",
    email: "rym.jlassi@etude.tn",
    city: "Sfax",
    subjects: ["Physique", "Chimie"],
    gradeLevels: ["Baccalauréat", "3ème Secondaire"],
    yearsExperience: 7,
    bio: "Enseignante de Physique-Chimie diplômée de l'ENS de Tunis. Passionnée par les sciences et la pédagogie active.",
    status: "pending" as const,
    kycId: "KYC-2024-0005",
    kycDate: "2024-03-10",
    documents: [
      { id: 4, type: "Carte d'identité nationale (CIN)", status: "pending", uploadDate: "2024-03-09" },
      { id: 5, type: "Diplôme de Maîtrise en Physique", status: "pending", uploadDate: "2024-03-09" },
      { id: 6, type: "Certificat de bonne conduite", status: "pending", uploadDate: "2024-03-09" },
    ],
    classes: 0,
    totalStudents: 0,
    approvedBy: null,
  },
  {
    id: 3,
    name: "M. Karim Mansouri",
    email: "k.mansouri@etude.tn",
    city: "Sousse",
    subjects: ["Informatique", "Mathématiques"],
    gradeLevels: ["Baccalauréat", "1ère Secondaire"],
    yearsExperience: 5,
    bio: "Ingénieur informaticien reconverti dans l'enseignement. Expert en programmation et algorithmique.",
    status: "pending" as const,
    kycId: "KYC-2024-0008",
    kycDate: "2024-03-11",
    documents: [
      { id: 7, type: "Carte d'identité nationale (CIN)", status: "verified", uploadDate: "2024-03-10" },
      { id: 8, type: "Diplôme d'Ingénieur (INSAT)", status: "pending", uploadDate: "2024-03-10" },
    ],
    classes: 0,
    totalStudents: 0,
    approvedBy: null,
  },
  {
    id: 4,
    name: "Dr. Leila Hammami",
    email: "l.hammami@etude.tn",
    city: "Monastir",
    subjects: ["Biologie", "Sciences de la vie"],
    gradeLevels: ["Baccalauréat", "9ème Année"],
    yearsExperience: 9,
    bio: "Docteure en Biologie Cellulaire. Enseignante au lycée et chercheuse associée à l'Université de Monastir.",
    status: "rejected" as const,
    kycId: "KYC-2024-0003",
    kycDate: "2024-02-20",
    documents: [
      { id: 9, type: "Carte d'identité nationale (CIN)", status: "rejected", uploadDate: "2024-02-19" },
      { id: 10, type: "Doctorat en Biologie Cellulaire", status: "verified", uploadDate: "2024-02-19" },
    ],
    classes: 0,
    totalStudents: 0,
    approvedBy: null,
    rejectionReason: "La CIN est expirée. Veuillez soumettre une version à jour.",
  },
];

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

const docStatusIcon = {
  verified: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  pending: <Clock className="w-4 h-4 text-orange-400" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

export function AdminProfessors() {
  const [professors, setProfessors] = useState(PROFESSORS);
  const [selectedProf, setSelectedProf] = useState<typeof PROFESSORS[0] | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = filter === "all" ? professors : professors.filter(p => p.status === filter);

  const approve = (id: number) => {
    setProfessors(prev => prev.map(p => p.id === id ? { ...p, status: "approved" as const } : p));
    setSelectedProf(prev => prev?.id === id ? { ...prev, status: "approved" as const } : prev);
  };

  const reject = (id: number) => {
    setProfessors(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" as const } : p));
    setSelectedProf(prev => prev?.id === id ? { ...prev, status: "rejected" as const } : prev);
  };

  const counts = {
    all: professors.length,
    pending: professors.filter(p => p.status === "pending").length,
    approved: professors.filter(p => p.status === "approved").length,
    rejected: professors.filter(p => p.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Professeurs & Vérification KYC"
          description="Examinez les dossiers KYC et gérez les candidatures des professeurs."
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { key: "all", label: "Total", color: "bg-slate-100 text-slate-700" },
            { key: "pending", label: "En attente", color: "bg-orange-100 text-orange-700" },
            { key: "approved", label: "Approuvés", color: "bg-green-100 text-green-700" },
            { key: "rejected", label: "Refusés", color: "bg-red-100 text-red-700" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as any)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${filter === s.key ? "border-primary shadow-md" : "border-transparent"} ${s.color}`}
            >
              <p className="text-3xl font-bold">{counts[s.key as keyof typeof counts]}</p>
              <p className="text-sm font-semibold mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Professor List */}
        <div className="space-y-4">
          {filtered.map(prof => {
            const cfg = statusConfig[prof.status];
            return (
              <Card key={prof.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <cfg.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">{prof.name}</h3>
                        <Badge variant={cfg.badge}>{cfg.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{prof.city}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{prof.subjects.join(", ")}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{prof.yearsExperience} ans d'expérience</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-muted px-2 py-1 rounded-full">KYC ID: {prof.kycId}</span>
                        <span className="bg-muted px-2 py-1 rounded-full">Soumis le {prof.kycDate}</span>
                        <span className="bg-muted px-2 py-1 rounded-full">{prof.documents.length} document{prof.documents.length > 1 ? "s" : ""}</span>
                      </div>
                      {prof.status === "rejected" && (prof as any).rejectionReason && (
                        <div className="mt-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                          Raison du refus: {(prof as any).rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProf(prof)}>
                      <Eye className="w-4 h-4 mr-1.5" /> Dossier KYC
                    </Button>
                    {prof.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => reject(prof.id)}>
                          <X className="w-4 h-4 mr-1" /> Refuser
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approve(prof.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approuver
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card className="p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun professeur dans cette catégorie.</p>
            </Card>
          )}
        </div>

        {/* Detail Modal */}
        <Modal open={!!selectedProf} onClose={() => setSelectedProf(null)}>
          {selectedProf && (() => {
            const cfg = statusConfig[selectedProf.status];
            return (
              <>
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h3 className="text-xl font-bold">{selectedProf.name}</h3>
                    <p className="text-sm text-muted-foreground">Dossier KYC · {selectedProf.kycId}</p>
                  </div>
                  <button onClick={() => setSelectedProf(null)} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status banner */}
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${cfg.color}`}>
                    <cfg.icon className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">Statut KYC: {cfg.label}</p>
                      {selectedProf.status === "approved" && <p className="text-xs">Approuvé le {selectedProf.kycDate}</p>}
                      {selectedProf.status === "rejected" && (selectedProf as any).rejectionReason && (
                        <p className="text-xs">{(selectedProf as any).rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Informations personnelles</h4>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ["Email", selectedProf.email],
                        ["Ville", selectedProf.city],
                        ["Expérience", `${selectedProf.yearsExperience} ans`],
                        ["Matières", selectedProf.subjects.join(", ")],
                        ["Niveaux", selectedProf.gradeLevels.join(", ")],
                        ["Cours actifs", String(selectedProf.classes)],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">{k}</p>
                          <p className="font-semibold">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="font-bold mb-2 text-sm uppercase text-muted-foreground tracking-wider">Biographie</h4>
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 leading-relaxed">{selectedProf.bio}</p>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Documents soumis via KBlox</h4>
                    <div className="space-y-3">
                      {selectedProf.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{doc.type}</p>
                              <p className="text-xs text-muted-foreground">Soumis le {doc.uploadDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {docStatusIcon[doc.status as keyof typeof docStatusIcon]}
                            <span className="text-xs font-medium capitalize">{doc.status === "verified" ? "Vérifié" : doc.status === "pending" ? "En attente" : "Rejeté"}</span>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <a href="https://kblox.replit.app" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="w-4 h-4" /> Voir le dossier complet sur KBlox
                    </a>
                  </div>

                  {/* Actions */}
                  {selectedProf.status === "pending" && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => reject(selectedProf.id)}>
                        <X className="w-4 h-4 mr-2" /> Refuser
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => approve(selectedProf.id)}>
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
