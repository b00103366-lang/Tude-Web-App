import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Label } from "@/components/ui/Premium";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, CheckCircle2, Clock, Plus, XCircle,
  Upload, FileText, Eye, X, Loader2,
} from "lucide-react";
import {
  SIMPLE_LEVELS, SECTION_LEVELS,
  getNiveauLabel, getSectionLabel, getSectionsForNiveau,
  getSubjectsForNiveauSection, isSectionLevel,
} from "@/lib/educationConfig";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Qualification { id: number; niveauKey: string; sectionKey: string | null; subject: string }
interface QualRequest {
  id: number; niveauKey: string; sectionKey: string | null;
  subjects: string[]; documentUrl: string;
  status: "pending" | "approved" | "rejected"; adminNotes: string | null; createdAt: string;
}

const apiHeaders = () => {
  const token = localStorage.getItem("etude_auth_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function comboLabel(niveauKey: string, sectionKey: string | null) {
  return sectionKey
    ? `${getNiveauLabel(niveauKey)} — ${getSectionLabel(niveauKey, sectionKey)}`
    : getNiveauLabel(niveauKey);
}

// ── File upload helper ────────────────────────────────────────────────────────

function DocUploadSlot({ file, onUpload, onClear, isUploading }: {
  file: { name: string; objectPath: string } | null;
  onUpload: (f: File) => void;
  onClear: () => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${file ? "border-green-400 bg-green-50" : "border-border bg-muted/30 hover:border-primary/40"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? "bg-green-100" : "bg-muted"}`}>
            {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Document justificatif <span className="text-destructive">*</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Diplôme, attestation, relevé de notes (PDF, JPG, PNG)</p>
            {file && <p className="text-xs text-green-700 font-medium mt-1 truncate">{file.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {file && (
            <button type="button" onClick={() => window.open(`/api/storage${file.objectPath}`, "_blank")} className="p-1.5 rounded-lg hover:bg-green-100 text-green-700">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {file ? (
            <button type="button" onClick={onClear} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {isUploading ? "Envoi..." : "Choisir"}
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
}

// ── Add request form ──────────────────────────────────────────────────────────

function AddRequestForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [niveauKey, setNiveauKey] = useState("");
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [docFile, setDocFile] = useState<{ name: string; objectPath: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSubjects = niveauKey ? getSubjectsForNiveauSection(niveauKey, sectionKey) : [];
  const sections = niveauKey && isSectionLevel(niveauKey) ? Object.entries(getSectionsForNiveau(niveauKey)) : [];
  const readyForSubjects = niveauKey && (!isSectionLevel(niveauKey) || sectionKey);

  const toggleSubject = (s: string) =>
    setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleNiveauSelect = (n: string) => {
    setNiveauKey(n);
    setSectionKey(null);
    setSelectedSubjects([]);
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem("etude_auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST", headers,
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Impossible d'obtenir l'URL");
      const { uploadURL, objectPath, local } = await urlRes.json();
      if (local) {
        const base64 = await readFileAsBase64(file);
        const up = await fetch("/api/storage/uploads/direct", { method: "POST", headers, body: JSON.stringify({ objectPath, content: base64, contentType: file.type }) });
        if (!up.ok) throw new Error("Échec du téléversement");
      } else {
        const up = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!up.ok) throw new Error("Échec du téléversement");
      }
      setDocFile({ name: file.name, objectPath });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!niveauKey) { setError("Sélectionnez un niveau."); return; }
    if (isSectionLevel(niveauKey) && !sectionKey) { setError("Sélectionnez une section."); return; }
    if (selectedSubjects.length === 0) { setError("Sélectionnez au moins une matière."); return; }
    if (!docFile) { setError("Téléversez un document justificatif."); return; }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/qualifications/requests", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ niveauKey, sectionKey, subjects: selectedSubjects, documentUrl: docFile.objectPath }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur"); }
      await qc.invalidateQueries({ queryKey: ["/api/qualifications/requests/mine"] });
      toast({ title: "Demande envoyée", description: "Un administrateur examinera votre demande sous 24-48h." });
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Niveau */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">1. Niveau</Label>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collège</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SIMPLE_LEVELS).filter(([, v]) => v.cycle === "college").map(([k, v]) => (
              <button key={k} type="button" onClick={() => handleNiveauSelect(k)}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${niveauKey === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">Lycée</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleNiveauSelect("1ere_secondaire")}
              className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${niveauKey === "1ere_secondaire" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
              1ère année secondaire
            </button>
            {(["2eme", "3eme", "bac"] as const).map(k => (
              <button key={k} type="button" onClick={() => handleNiveauSelect(k)}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${niveauKey === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                {getNiveauLabel(k)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section */}
      {niveauKey && isSectionLevel(niveauKey) && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">2. Section</Label>
          <div className="flex flex-wrap gap-2">
            {sections.map(([sk, sv]) => (
              <button key={sk} type="button" onClick={() => { setSectionKey(sk); setSelectedSubjects([]); }}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${sectionKey === sk ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                {sv.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subjects */}
      {readyForSubjects && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">{isSectionLevel(niveauKey) ? "3." : "2."} Matières</Label>
          <div className="flex flex-wrap gap-2">
            {[...availableSubjects].map(s => (
              <button key={s} type="button" onClick={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${selectedSubjects.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                {s}
              </button>
            ))}
          </div>
          {selectedSubjects.length > 0 && (
            <p className="text-xs text-primary mt-1.5">{selectedSubjects.length} matière{selectedSubjects.length > 1 ? "s" : ""} sélectionnée{selectedSubjects.length > 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      {/* Document */}
      {readyForSubjects && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">{isSectionLevel(niveauKey) ? "4." : "3."} Document justificatif</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Téléversez un diplôme, attestation ou tout document prouvant que vous pouvez enseigner ces matières.
          </p>
          <DocUploadSlot file={docFile} onUpload={handleUpload} onClear={() => setDocFile(null)} isUploading={uploading} />
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button onClick={handleSave} disabled={saving || uploading}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</> : "Soumettre la demande"}
        </Button>
        <Button variant="outline" onClick={onDone}>Annuler</Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: "En attente",  icon: Clock,          className: "bg-amber-50 border-amber-200 text-amber-800" },
  approved: { label: "Approuvée",   icon: CheckCircle2,   className: "bg-green-50 border-green-200 text-green-800" },
  rejected: { label: "Refusée",     icon: XCircle,        className: "bg-red-50 border-red-200 text-red-800"    },
};

export function ProfessorQualifications() {
  const qc = useQueryClient();

  const { data: quals = [] } = useQuery<Qualification[]>({
    queryKey: ["/api/qualifications/mine"],
    queryFn: async () => {
      const res = await fetch("/api/qualifications/mine", { headers: apiHeaders() });
      return res.json();
    },
  });

  const { data: requests = [], isLoading } = useQuery<QualRequest[]>({
    queryKey: ["/api/qualifications/requests/mine"],
    queryFn: async () => {
      const res = await fetch("/api/qualifications/requests/mine", { headers: apiHeaders() });
      return res.json();
    },
  });

  const [showAdd, setShowAdd] = useState(false);

  // Group approved qualifications by (niveauKey, sectionKey)
  const approvedGroups = quals.reduce<Record<string, Qualification[]>>((acc, q) => {
    const key = `${q.niveauKey}||${q.sectionKey ?? ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  const pending  = requests.filter(r => r.status === "pending");
  const rejected = requests.filter(r => r.status === "rejected");

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mes qualifications"
          description="Soumettez des demandes avec un document justificatif. Un administrateur les approuvera avant activation."
        />

        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <div className="max-w-3xl space-y-8">

            {/* ── Add button / form ── */}
            {!showAdd ? (
              <Button onClick={() => setShowAdd(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Soumettre une demande de qualification
              </Button>
            ) : (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-5">Nouvelle demande de qualification</h3>
                <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>Votre demande sera examinée par un administrateur. Seuls les niveaux et matières approuvés apparaîtront dans la création de cours.</p>
                </div>
                <AddRequestForm onDone={() => setShowAdd(false)} />
              </Card>
            )}

            {/* ── Pending requests ── */}
            {pending.length > 0 && (
              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Demandes en attente
                </h3>
                <div className="space-y-3">
                  {pending.map(r => (
                    <Card key={r.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold">{comboLabel(r.niveauKey, r.sectionKey)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.subjects.join(" • ")}
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/api/storage${r.documentUrl}`, "_blank")}
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir le document
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Approved qualifications ── */}
            {Object.keys(approvedGroups).length > 0 && (
              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Qualifications approuvées
                </h3>
                <div className="space-y-3">
                  {Object.entries(approvedGroups).map(([groupKey, groupQuals]) => {
                    const [nk, sk] = groupKey.split("||");
                    return (
                      <Card key={groupKey} className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold">{comboLabel(nk, sk || null)}</p>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 border border-green-200 text-green-800">
                            <CheckCircle2 className="w-3 h-3" /> Approuvée
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupQuals.map(q => (
                            <span key={q.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-sm font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              {q.subject}
                            </span>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Rejected requests ── */}
            {rejected.length > 0 && (
              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" /> Demandes refusées
                </h3>
                <div className="space-y-3">
                  {rejected.map(r => (
                    <Card key={r.id} className="p-5 border-red-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold">{comboLabel(r.niveauKey, r.sectionKey)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.subjects.join(" • ")}</p>
                          {r.adminNotes && (
                            <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg px-3 py-2">
                              <span className="font-semibold">Motif : </span>{r.adminNotes}
                            </p>
                          )}
                        </div>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 border border-red-200 text-red-800 shrink-0">
                          <XCircle className="w-3 h-3" /> Refusée
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {!showAdd && quals.length === 0 && requests.length === 0 && (
              <Card className="p-10 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-lg mb-1">Aucune qualification</p>
                <p className="text-sm text-muted-foreground">
                  Soumettez une demande avec un document justificatif pour commencer à enseigner.
                </p>
              </Card>
            )}
          </div>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
