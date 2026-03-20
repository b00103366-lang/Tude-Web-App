import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Upload, FileText, X, Eye, Loader2, ChevronRight,
  Video, AlertCircle, Play, RotateCcw, Camera,
} from "lucide-react";
import {
  SIMPLE_LEVELS, SECTION_LEVELS, isSectionLevel,
  getNiveauLabel, getSectionLabel, getSubjectsForNiveauSection,
} from "@/lib/educationConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string;
  objectPath: string;
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadDoc(file: File): Promise<string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch("/api/storage/uploads/request-url", {
    method: "POST", headers,
    body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }),
  });
  const { uploadURL, objectPath, local } = await r.json();
  if (local) {
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await fetch("/api/storage/uploads/direct", {
      method: "POST", headers,
      body: JSON.stringify({ objectPath, content: b64, contentType: file.type }),
    });
  } else {
    await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  }
  return objectPath;
}

async function uploadFileWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const reqRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST", headers,
    body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }),
  });
  if (!reqRes.ok) throw new Error("Impossible d'obtenir l'URL de téléversement");
  const { uploadURL, objectPath, local } = await reqRes.json();

  if (local) {
    onProgress(30);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    onProgress(70);
    const upRes = await fetch("/api/storage/uploads/direct", {
      method: "POST", headers,
      body: JSON.stringify({ objectPath, content: base64, contentType: file.type }),
    });
    if (!upRes.ok) throw new Error("Échec du téléversement");
    onProgress(100);
    return objectPath;
  } else {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve(objectPath); }
        else reject(new Error("Échec du téléversement"));
      };
      xhr.onerror = () => reject(new Error("Erreur réseau"));
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  }
}

// ─── ImageUploadSlot ──────────────────────────────────────────────────────────

function ImageUploadSlot({ label, file, onUpload, onClear, uploading }: {
  label: string;
  file: UploadedFile | null;
  onUpload: (f: File) => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${file ? "border-green-400 bg-green-50" : "border-border bg-muted/30 hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? "bg-green-100" : "bg-muted"}`}>
            {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{label} <span className="text-destructive">*</span></p>
            {file ? (
              <p className="text-xs text-green-700 font-medium mt-1 truncate">{file.name}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG — max 10MB</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {file && (
            <a href={`/api/storage${file.objectPath}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Voir">
              <Eye className="w-4 h-4" />
            </a>
          )}
          {file ? (
            <button type="button" onClick={onClear} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:border-primary/40 disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Envoi..." : "Choisir"}
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
}

// ─── DocUploadSlot ────────────────────────────────────────────────────────────

function DocUploadSlot({ label, subtitle, file, onUpload, onClear, uploading }: {
  label: string;
  subtitle: string;
  file: UploadedFile | null;
  onUpload: (f: File) => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${file ? "border-green-400 bg-green-50" : "border-border bg-muted/30 hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? "bg-green-100" : "bg-muted"}`}>
            {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{label} <span className="text-destructive">*</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            {file && <p className="text-xs text-green-700 font-medium mt-1 truncate">{file.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {file && (
            <a href={`/api/storage${file.objectPath}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Voir">
              <Eye className="w-4 h-4" />
            </a>
          )}
          {file ? (
            <button type="button" onClick={onClear} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:border-primary/40 disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Envoi..." : "Choisir"}
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
}

// ─── SubjectPicker ────────────────────────────────────────────────────────────

interface SubjectPickerProps {
  selectedNiveaux: Set<string>;
  selectedSections: Map<string, Set<string>>;
  selectedSubjects: Map<string, Set<string>>;
  onToggleNiveau: (niveauKey: string) => void;
  onToggleSection: (niveauKey: string, sectionKey: string) => void;
  onToggleSubject: (compositeKey: string, subject: string) => void;
}

function SubjectPicker({
  selectedNiveaux, selectedSections, selectedSubjects,
  onToggleNiveau, onToggleSection, onToggleSubject,
}: SubjectPickerProps) {
  const totalSubjects = Array.from(selectedSubjects.values()).reduce((acc, set) => acc + set.size, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Matières à enseigner <span className="text-destructive">*</span></p>
        {totalSubjects > 0 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            {totalSubjects} matière{totalSubjects > 1 ? "s" : ""} sélectionnée{totalSubjects > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Simple levels */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collège</p>
        {Object.entries(SIMPLE_LEVELS).filter(([, v]) => (v as any).cycle === "college").map(([niveauKey, niveau]) => {
          const isChecked = selectedNiveaux.has(niveauKey);
          const compositeKey = `${niveauKey}__`;
          const subjectsForKey = selectedSubjects.get(compositeKey) ?? new Set<string>();
          return (
            <div key={niveauKey} className="rounded-xl border border-border overflow-hidden">
              <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={isChecked} onChange={() => onToggleNiveau(niveauKey)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-medium text-sm">{niveau.label}</span>
                {isChecked && subjectsForKey.size > 0 && (
                  <span className="ml-auto text-xs text-green-600 font-medium">{subjectsForKey.size} matière{subjectsForKey.size > 1 ? "s" : ""}</span>
                )}
              </label>
              {isChecked && (
                <div className="border-t border-border p-3 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {niveau.subjects.map((subject: string) => {
                      const checked = subjectsForKey.has(subject);
                      return (
                        <button key={subject} type="button"
                          onClick={() => onToggleSubject(compositeKey, subject)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 1ère secondaire (simple, but lycée cycle) */}
        {Object.entries(SIMPLE_LEVELS).filter(([, v]) => (v as any).cycle === "lycee").map(([niveauKey, niveau]) => {
          const isChecked = selectedNiveaux.has(niveauKey);
          const compositeKey = `${niveauKey}__`;
          const subjectsForKey = selectedSubjects.get(compositeKey) ?? new Set<string>();
          return (
            <div key={niveauKey} className="rounded-xl border border-border overflow-hidden">
              <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={isChecked} onChange={() => onToggleNiveau(niveauKey)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-medium text-sm">{niveau.label}</span>
                {isChecked && subjectsForKey.size > 0 && (
                  <span className="ml-auto text-xs text-green-600 font-medium">{subjectsForKey.size} matière{subjectsForKey.size > 1 ? "s" : ""}</span>
                )}
              </label>
              {isChecked && (
                <div className="border-t border-border p-3 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {niveau.subjects.map((subject: string) => {
                      const checked = subjectsForKey.has(subject);
                      return (
                        <button key={subject} type="button"
                          onClick={() => onToggleSubject(compositeKey, subject)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Section levels */}
      <div className="space-y-2 mt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lycée (avec sections)</p>
        {Object.entries(SECTION_LEVELS).map(([niveauKey, niveau]) => {
          const isNiveauChecked = selectedNiveaux.has(niveauKey);
          const sectionsForNiveau = selectedSections.get(niveauKey) ?? new Set<string>();
          return (
            <div key={niveauKey} className="rounded-xl border border-border overflow-hidden">
              <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={isNiveauChecked} onChange={() => onToggleNiveau(niveauKey)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-medium text-sm">{niveau.label}</span>
              </label>
              {isNiveauChecked && (
                <div className="border-t border-border p-3 bg-muted/30 space-y-2">
                  {Object.entries(niveau.sections).map(([sectionKey, section]) => {
                    const isSectionChecked = sectionsForNiveau.has(sectionKey);
                    const compositeKey = `${niveauKey}__${sectionKey}`;
                    const subjectsForKey = selectedSubjects.get(compositeKey) ?? new Set<string>();
                    return (
                      <div key={sectionKey} className="rounded-lg border border-border bg-background overflow-hidden">
                        <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/30">
                          <input type="checkbox" checked={isSectionChecked}
                            onChange={() => onToggleSection(niveauKey, sectionKey)}
                            className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-medium">{section.label}</span>
                          {isSectionChecked && subjectsForKey.size > 0 && (
                            <span className="ml-auto text-xs text-green-600 font-medium">{subjectsForKey.size} mat.</span>
                          )}
                        </label>
                        {isSectionChecked && (
                          <div className="border-t border-border p-2.5 bg-muted/20">
                            <div className="flex flex-wrap gap-1.5">
                              {section.subjects.map((subject: string) => {
                                const checked = subjectsForKey.has(subject);
                                return (
                                  <button key={subject} type="button"
                                    onClick={() => onToggleSubject(compositeKey, subject)}
                                    className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                    {subject}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const labels = ["Identité", "Qualifications", "Vidéo", "Récapitulatif"];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-muted-foreground">Étape {step} sur 4</span>
        <span className="text-sm font-medium text-primary">{labels[step - 1]}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <div className="flex justify-between mt-2">
        {labels.map((label, i) => (
          <span key={label} className={`text-xs font-medium ${i + 1 === step ? "text-primary" : i + 1 < step ? "text-green-600" : "text-muted-foreground"}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfessorKYC() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const profProfile = (user as any)?.professorProfile;
  const profId: number | undefined = profProfile?.id;
  const kycStatus: string = profProfile?.kycStatus ?? "not_submitted";
  const kycRejectionReasons: string[] = profProfile?.kycRejectionReasons ?? [];

  // Step state: 1–4 + "submitted"
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // ── Step 1: Identity ────────────────────────────────────────────────────────
  const [cinFront, setCinFront] = useState<UploadedFile | null>(null);
  const [cinBack, setCinBack] = useState<UploadedFile | null>(null);
  const [uploadingCinFront, setUploadingCinFront] = useState(false);
  const [uploadingCinBack, setUploadingCinBack] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState((user as any)?.phone ?? "");

  // ── Step 2: Qualifications ──────────────────────────────────────────────────
  const [universityDiploma, setUniversityDiploma] = useState<UploadedFile | null>(null);
  const [teachingCert, setTeachingCert] = useState<UploadedFile | null>(null);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Subject selection state
  const [selectedNiveaux, setSelectedNiveaux] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Map<string, Set<string>>>(new Map());
  const [selectedSubjects, setSelectedSubjects] = useState<Map<string, Set<string>>>(new Map());

  // ── Step 3: Video ───────────────────────────────────────────────────────────
  const [pitchVideo, setPitchVideo] = useState<UploadedFile | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // ── Step 4: Certification ───────────────────────────────────────────────────
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Pre-fill if rejected ────────────────────────────────────────────────────
  useEffect(() => {
    if (kycStatus === "rejected" && profProfile) {
      if (profProfile.legalName) setLegalName(profProfile.legalName);
      if (profProfile.dateOfBirth) setDateOfBirth(profProfile.dateOfBirth);
      if ((user as any)?.phone) setPhone((user as any).phone);
    }
  }, [kycStatus]);

  // Redirect if approved
  useEffect(() => {
    if (kycStatus === "approved") {
      setTimeout(() => setLocation("/professor/dashboard"), 2000);
    }
  }, [kycStatus]);

  // ── Subject picker helpers ──────────────────────────────────────────────────

  const handleToggleNiveau = (niveauKey: string) => {
    setSelectedNiveaux(prev => {
      const next = new Set(prev);
      if (next.has(niveauKey)) {
        next.delete(niveauKey);
        // Clear sections and subjects for this niveau
        setSelectedSections(sm => { const nm = new Map(sm); nm.delete(niveauKey); return nm; });
        setSelectedSubjects(ssm => {
          const nm = new Map(ssm);
          for (const key of Array.from(nm.keys())) {
            if (key.startsWith(`${niveauKey}__`)) nm.delete(key);
          }
          return nm;
        });
      } else {
        next.add(niveauKey);
      }
      return next;
    });
  };

  const handleToggleSection = (niveauKey: string, sectionKey: string) => {
    setSelectedSections(prev => {
      const nm = new Map(prev);
      const sectionSet = nm.get(niveauKey) ? new Set(nm.get(niveauKey)!) : new Set<string>();
      if (sectionSet.has(sectionKey)) {
        sectionSet.delete(sectionKey);
        // Clear subjects for this section
        setSelectedSubjects(ssm => { const nm2 = new Map(ssm); nm2.delete(`${niveauKey}__${sectionKey}`); return nm2; });
      } else {
        sectionSet.add(sectionKey);
      }
      nm.set(niveauKey, sectionSet);
      return nm;
    });
  };

  const handleToggleSubject = (compositeKey: string, subject: string) => {
    setSelectedSubjects(prev => {
      const nm = new Map(prev);
      const subjectSet = nm.get(compositeKey) ? new Set(nm.get(compositeKey)!) : new Set<string>();
      if (subjectSet.has(subject)) subjectSet.delete(subject);
      else subjectSet.add(subject);
      nm.set(compositeKey, subjectSet);
      return nm;
    });
  };

  const totalSubjectsSelected = Array.from(selectedSubjects.values()).reduce((acc, s) => acc + s.size, 0);

  // ── File upload handlers ────────────────────────────────────────────────────

  const handleUploadCinFront = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Fichier trop grand", description: "Maximum 10MB", variant: "destructive" }); return; }
    setUploadingCinFront(true);
    try {
      const path = await uploadDoc(file);
      setCinFront({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploadingCinFront(false); }
  };

  const handleUploadCinBack = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Fichier trop grand", description: "Maximum 10MB", variant: "destructive" }); return; }
    setUploadingCinBack(true);
    try {
      const path = await uploadDoc(file);
      setCinBack({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploadingCinBack(false); }
  };

  const handleUploadDiploma = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Fichier trop grand", description: "Maximum 10MB", variant: "destructive" }); return; }
    setUploadingDiploma(true);
    try {
      const path = await uploadDoc(file);
      setUniversityDiploma({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploadingDiploma(false); }
  };

  const handleUploadCert = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Fichier trop grand", description: "Maximum 10MB", variant: "destructive" }); return; }
    setUploadingCert(true);
    try {
      const path = await uploadDoc(file);
      setTeachingCert({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploadingCert(false); }
  };

  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleUploadVideo = async (file: File) => {
    if (file.size > 200 * 1024 * 1024) {
      toast({ title: "Vidéo trop lourde", description: "Maximum 200MB", variant: "destructive" }); return;
    }

    // Validate duration
    const duration = await new Promise<number>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => { resolve(video.duration); URL.revokeObjectURL(video.src); };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });

    if (duration > 180) {
      toast({ title: "Vidéo trop longue", description: "La vidéo doit durer 3 minutes maximum.", variant: "destructive" }); return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const path = await uploadFileWithProgress(file, setVideoProgress);
      setPitchVideo({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploadingVideo(false); }
  };

  // ── Step validation ─────────────────────────────────────────────────────────

  const canProceedStep1 = cinFront && cinBack && legalName.trim().length >= 2 && dateOfBirth && phone.trim().length >= 5;
  const canProceedStep2 = universityDiploma && teachingCert && totalSubjectsSelected > 0;
  const canProceedStep3 = !!pitchVideo;

  // ── Build declaredSubjects ──────────────────────────────────────────────────

  function buildDeclaredSubjects() {
    const result: Array<{ niveauKey: string; sectionKey: string | null; subjects: string[] }> = [];
    for (const [key, subjects] of Array.from(selectedSubjects.entries())) {
      if (subjects.size === 0) continue;
      const [niveauKey, sectionKey] = key.split("__");
      result.push({
        niveauKey,
        sectionKey: sectionKey || null,
        subjects: Array.from(subjects),
      });
    }
    return result;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!certified) { toast({ title: "Certification requise", description: "Veuillez cocher la case de certification.", variant: "destructive" }); return; }
    if (!profId) return;

    setSubmitting(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const declaredSubjects = buildDeclaredSubjects();

      const res = await fetch(`/api/professors/${profId}/submit-kyc`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cinFrontUrl: cinFront!.objectPath,
          cinBackUrl: cinBack!.objectPath,
          universityDiplomaUrl: universityDiploma!.objectPath,
          teachingCertUrl: teachingCert!.objectPath,
          pitchVideoUrl: pitchVideo!.objectPath,
          legalName: legalName.trim(),
          dateOfBirth,
          phone: phone.trim(),
          declaredSubjects,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de la soumission");
      }

      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Show status screens for pending/approved ────────────────────────────────

  if (kycStatus === "pending") {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Vérification en cours" description="Votre dossier est entre nos mains." />
          <div className="max-w-lg">
            <Card className="p-8 text-center border-2 border-blue-200 bg-blue-50">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Dossier en cours d'examen</h2>
              <p className="text-muted-foreground">Votre dossier est en cours d'examen (24-48h). Vous recevrez une réponse par email.</p>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  if (kycStatus === "approved") {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Profil vérifié" description="Vous êtes un professeur vérifié." />
          <div className="max-w-lg">
            <Card className="p-8 text-center border-2 border-green-200 bg-green-50">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Votre profil est vérifié</h2>
              <p className="text-muted-foreground mb-6">Félicitations ! Vous pouvez maintenant publier vos cours.</p>
              <Button onClick={() => setLocation("/professor/dashboard")} size="lg" className="w-full">
                Aller à mon tableau de bord
              </Button>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── Submitted confirmation screen ───────────────────────────────────────────

  if (submitted) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Demande soumise" description="Votre dossier est en cours d'examen." />
          <div className="max-w-lg">
            <Card className="p-8 text-center border-2 border-green-200 bg-green-50">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-3">Demande soumise avec succès</h2>
              <p className="text-muted-foreground mb-2">Votre dossier est en cours d'examen.</p>
              <p className="text-muted-foreground mb-2">Vous recevrez une réponse par email dans 48 heures.</p>
              <p className="text-muted-foreground mb-8">En attendant, vous pouvez compléter votre profil et préparer vos cours en mode brouillon.</p>
              <Button onClick={() => setLocation("/professor/dashboard")} size="lg" className="w-full">
                Aller à mon tableau de bord
              </Button>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── Show rejection reasons if rejected ──────────────────────────────────────

  const rejectionBanner = kycStatus === "rejected" && kycRejectionReasons.length > 0 && (
    <Card className="p-4 border-2 border-red-200 bg-red-50 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800 mb-2">Votre demande précédente a été refusée pour les raisons suivantes :</p>
          <ul className="space-y-1">
            {kycRejectionReasons.map((reason, i) => (
              <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
          <p className="text-sm text-red-600 mt-2">Veuillez corriger ces points et soumettre à nouveau.</p>
        </div>
      </div>
    </Card>
  );

  // ── STEP 1: Identity ────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Vérification KYC" description="Complétez votre dossier pour publier des cours sur Étude+." />
          <div className="max-w-2xl">
            {rejectionBanner}
            <ProgressBar step={1} />
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Identité</h2>
                <p className="text-sm text-muted-foreground">Ces informations correspondent à votre pièce d'identité officielle.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadSlot label="CIN recto" file={cinFront} onUpload={handleUploadCinFront} onClear={() => setCinFront(null)} uploading={uploadingCinFront} />
                  <ImageUploadSlot label="CIN verso" file={cinBack} onUpload={handleUploadCinBack} onClear={() => setCinBack(null)} uploading={uploadingCinBack} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Nom légal complet <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={e => setLegalName(e.target.value)}
                    placeholder="Prénom et nom tels qu'ils apparaissent sur votre CIN"
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Date de naissance <span className="text-destructive">*</span></label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Numéro de téléphone <span className="text-destructive">*</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+216 XX XXX XXX"
                      className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)} className="gap-2">
                  Continuer <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── STEP 2: Qualifications ──────────────────────────────────────────────────

  if (step === 2) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Vérification KYC" description="Complétez votre dossier pour publier des cours sur Étude+." />
          <div className="max-w-2xl">
            {rejectionBanner}
            <ProgressBar step={2} />
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Qualifications</h2>
                <p className="text-sm text-muted-foreground">Documents justificatifs et matières que vous souhaitez enseigner.</p>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents justificatifs</p>
                <DocUploadSlot
                  label="Diplôme universitaire"
                  subtitle="Licence, Master, Doctorat ou équivalent"
                  file={universityDiploma}
                  onUpload={handleUploadDiploma}
                  onClear={() => setUniversityDiploma(null)}
                  uploading={uploadingDiploma}
                />
                <DocUploadSlot
                  label="Certificat d'enseignement"
                  subtitle="CAPES, certificat pédagogique, attestation d'établissement scolaire, ou tout document prouvant votre expérience d'enseignement"
                  file={teachingCert}
                  onUpload={handleUploadCert}
                  onClear={() => setTeachingCert(null)}
                  uploading={uploadingCert}
                />
              </div>

              {/* Subject picker */}
              <SubjectPicker
                selectedNiveaux={selectedNiveaux}
                selectedSections={selectedSections}
                selectedSubjects={selectedSubjects}
                onToggleNiveau={handleToggleNiveau}
                onToggleSection={handleToggleSection}
                onToggleSubject={handleToggleSubject}
              />

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>Retour</Button>
                <Button size="lg" disabled={!canProceedStep2} onClick={() => setStep(3)} className="gap-2">
                  Continuer <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── STEP 3: Pitch Video ─────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Vérification KYC" description="Complétez votre dossier pour publier des cours sur Étude+." />
          <div className="max-w-2xl">
            {rejectionBanner}
            <ProgressBar step={3} />
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Vidéo de présentation</h2>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-blue-800">Vidéo de présentation</p>
                </div>
                <p className="text-sm text-blue-700">Enregistrez une courte vidéo (maximum 3 minutes) incluant :</p>
                <ul className="space-y-1.5">
                  {[
                    "Votre nom et parcours académique",
                    "Les matières que vous souhaitez enseigner",
                    "Votre expérience d'enseignement",
                    "Pourquoi vous êtes qualifié(e) pour enseigner ces matières spécifiquement",
                    "Pourquoi vous voulez rejoindre Étude+",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600">Formats acceptés : MP4, MOV, WebM — Maximum 200MB, 3 minutes</p>
              </div>

              {/* Upload zone */}
              {!pitchVideo && !uploadingVideo && (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold mb-1">Cliquez pour téléverser votre vidéo</p>
                  <p className="text-sm text-muted-foreground">MP4, MOV, WebM — max 200MB, 3 min</p>
                  <input ref={videoInputRef} type="file" className="hidden"
                    accept="video/mp4,video/mov,video/webm,video/quicktime"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadVideo(f); }} />
                </div>
              )}

              {/* Upload progress */}
              {uploadingVideo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Téléversement en cours...</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Video preview */}
              {pitchVideo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{pitchVideo.name}</span>
                    </div>
                    <button type="button" onClick={() => setPitchVideo(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Changer
                    </button>
                  </div>
                  <video
                    src={`/api/storage${pitchVideo.objectPath}`}
                    controls
                    className="w-full rounded-xl border border-border"
                    style={{ maxHeight: "320px" }}
                  />
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>Retour</Button>
                <Button size="lg" disabled={!canProceedStep3} onClick={() => setStep(4)} className="gap-2">
                  Continuer <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── STEP 4: Review & Submit ─────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Vérification KYC" description="Complétez votre dossier pour publier des cours sur Étude+." />
        <div className="max-w-2xl">
          {rejectionBanner}
          <ProgressBar step={4} />
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Récapitulatif</h2>
              <p className="text-sm text-muted-foreground">Vérifiez vos informations avant de soumettre votre dossier.</p>
            </div>

            {/* Section: Identité */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Identité</p>
              <div className="p-4 bg-muted/30 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom légal</span><span className="font-medium">{legalName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date de naissance</span><span className="font-medium">{dateOfBirth}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span className="font-medium">{phone}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CIN</span>
                  <span className="font-medium text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 2 photos téléversées</span>
                </div>
              </div>
            </div>

            {/* Section: Documents */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Documents</p>
              <div className="space-y-2">
                {universityDiploma && (
                  <a href={`/api/storage${universityDiploma.objectPath}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 flex-1 min-w-0 truncate">Diplôme : {universityDiploma.name}</span>
                    <Eye className="w-4 h-4 text-green-600" />
                  </a>
                )}
                {teachingCert && (
                  <a href={`/api/storage${teachingCert.objectPath}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 flex-1 min-w-0 truncate">Certificat : {teachingCert.name}</span>
                    <Eye className="w-4 h-4 text-green-600" />
                  </a>
                )}
              </div>
            </div>

            {/* Section: Matières */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Matières ({totalSubjectsSelected})</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedSubjects.entries()).flatMap(([key, subjects]) => {
                  const [niveauKey, sectionKey] = key.split("__");
                  return Array.from(subjects).map(subject => {
                    const niveauLabel = getNiveauLabel(niveauKey);
                    const label = sectionKey
                      ? `${subject} (${niveauLabel} - ${getSectionLabel(niveauKey, sectionKey)})`
                      : `${subject} (${niveauLabel})`;
                    return (
                      <span key={`${key}-${subject}`} className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {label}
                      </span>
                    );
                  });
                })}
              </div>
            </div>

            {/* Section: Vidéo */}
            {pitchVideo && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Vidéo de présentation</p>
                <video
                  src={`/api/storage${pitchVideo.objectPath}`}
                  controls
                  className="w-full rounded-xl border border-border"
                  style={{ maxHeight: "240px" }}
                />
              </div>
            )}

            {/* Certification checkbox */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certified}
                  onChange={e => setCertified(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary"
                />
                <span className="text-sm text-amber-800 font-medium">
                  Je certifie que toutes les informations fournies sont exactes et authentiques.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="lg" onClick={() => setStep(3)}>Retour</Button>
              <Button size="lg" disabled={!certified || submitting} onClick={handleSubmit} className="gap-2">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Soumission...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Soumettre mon dossier</>
                }
              </Button>
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
