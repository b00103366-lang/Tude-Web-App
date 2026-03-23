import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Upload, FileText, X, Eye, Loader2, ChevronRight,
  AlertCircle, Camera, BadgeCheck, ShieldCheck,
} from "lucide-react";

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

interface UploadedFile { name: string; objectPath: string }

// ─── Reusable upload slot ──────────────────────────────────────────────────────

function UploadSlot({
  label, subtitle, required, accept, file, uploading, onUpload, onClear, icon: Icon = FileText,
}: {
  label: string; subtitle: string; required?: boolean; accept: string;
  file: UploadedFile | null; uploading: boolean;
  onUpload: (f: File) => void; onClear: () => void;
  icon?: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${file ? "border-green-400 bg-green-50" : "border-border bg-muted/30 hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? "bg-green-100" : "bg-muted"}`}>
            {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              {label} {required && <span className="text-destructive">*</span>}
              {!required && <span className="text-xs font-normal text-muted-foreground ml-1">(optionnel)</span>}
            </p>
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
      <input ref={inputRef} type="file" className="hidden" accept={accept}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const STEPS = ["Identité", "Documents", "Confirmation"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((label, i) => {
          const done = i + 1 < step;
          const active = i + 1 === step;
          return (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {i < STEPS.length - 1 && (
                <div className={`absolute top-4 left-1/2 w-full h-0.5 ${done ? "bg-primary" : "bg-border"}`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground border-2 border-border"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })}
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

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Step 1: Identity
  const [cinFront, setCinFront] = useState<UploadedFile | null>(null);
  const [cinBack, setCinBack] = useState<UploadedFile | null>(null);
  const [uploadingCinFront, setUploadingCinFront] = useState(false);
  const [uploadingCinBack, setUploadingCinBack] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState((user as any)?.phone ?? "");

  // Step 2: Documents
  const [diploma, setDiploma] = useState<UploadedFile | null>(null);
  const [teachingCert, setTeachingCert] = useState<UploadedFile | null>(null);
  const [additionalDoc, setAdditionalDoc] = useState<UploadedFile | null>(null);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  // Step 3
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (kycStatus === "rejected" && profProfile) {
      if (profProfile.legalName) setLegalName(profProfile.legalName);
      if (profProfile.dateOfBirth) setDateOfBirth(profProfile.dateOfBirth);
      if ((user as any)?.phone) setPhone((user as any).phone);
    }
  }, [kycStatus]);

  useEffect(() => {
    if (kycStatus === "approved") {
      setTimeout(() => setLocation("/professor/dashboard"), 1500);
    }
  }, [kycStatus]);

  // Upload helpers
  async function handleUpload(
    file: File,
    setter: (f: UploadedFile) => void,
    setUploading: (v: boolean) => void,
  ) {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fichier trop grand", description: "Maximum 20MB", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      const path = await uploadDoc(file);
      setter({ name: file.name, objectPath: path });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  }

  // Validation
  const canProceedStep1 = cinFront && cinBack && legalName.trim().length >= 2 && dateOfBirth && phone.trim().length >= 5;
  const canProceedStep2 = !!diploma; // only diploma is required

  async function handleSubmit() {
    if (!certified) {
      toast({ title: "Certification requise", description: "Veuillez cocher la case de certification.", variant: "destructive" });
      return;
    }
    if (!profId) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/professors/${profId}/submit-kyc`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cinFrontUrl: cinFront!.objectPath,
          cinBackUrl: cinBack!.objectPath,
          universityDiplomaUrl: diploma!.objectPath,
          teachingCertUrl: teachingCert?.objectPath ?? null,
          additionalDocUrl: additionalDoc?.objectPath ?? null,
          legalName: legalName.trim(),
          dateOfBirth,
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? "Erreur lors de la soumission");
      }

      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  // ── Status screens ────────────────────────────────────────────────────────

  if (kycStatus === "pending") {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader title="Vérification KYC" description="Votre dossier est entre nos mains." />
          <div className="max-w-lg space-y-4">
            <Card className="p-8 text-center border-2 border-blue-200 bg-blue-50">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Dossier en cours d'examen</h2>
              <p className="text-muted-foreground">Notre équipe examine votre dossier (24-48h). Vous recevrez une réponse par email.</p>
            </Card>
            <Card className="p-5 border border-border">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Prochaine étape après approbation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Une fois votre identité validée, vous pourrez soumettre des demandes de qualification pour chaque matière / niveau que vous souhaitez enseigner, avec un document justificatif par demande.
                  </p>
                </div>
              </div>
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
          <PageHeader title="Profil vérifié" description="Vous êtes un professeur vérifié sur Étude+." />
          <div className="max-w-lg space-y-4">
            <Card className="p-8 text-center border-2 border-green-200 bg-green-50">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Identité vérifiée ✓</h2>
              <p className="text-muted-foreground mb-6">Félicitations ! Votre identité a été confirmée. Passez maintenant à l'étape 2 : les qualifications par matière.</p>
              <Button onClick={() => setLocation("/professor/qualifications")} size="lg" className="w-full">
                Soumettre mes qualifications →
              </Button>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <FadeIn>
          <div className="max-w-lg space-y-4">
            <Card className="p-8 text-center border-2 border-green-200 bg-green-50">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Dossier soumis !</h2>
              <p className="text-muted-foreground mb-2">Votre dossier d'identité est en cours d'examen.</p>
              <p className="text-muted-foreground mb-6">Vous recevrez une réponse par email dans les 48 heures.</p>
              <Button onClick={() => setLocation("/professor/dashboard")} size="lg" className="w-full">
                Aller à mon tableau de bord
              </Button>
            </Card>
            <Card className="p-5 border border-border">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Ce qui se passe ensuite</p>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Notre équipe vérifie votre identité et diplôme (24-48h)</li>
                    <li>Une fois approuvé, vous soumettez des demandes de qualification par matière</li>
                    <li>Chaque qualification approuvée vous permet de créer des cours pour ce niveau/matière</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        </FadeIn>
      </DashboardLayout>
    );
  }

  // ── Rejection banner ──────────────────────────────────────────────────────

  const rejectionBanner = kycStatus === "rejected" && (
    <Card className="p-4 border-2 border-red-200 bg-red-50 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800 mb-1">Votre demande précédente a été refusée</p>
          {kycRejectionReasons.length > 0 && (
            <ul className="space-y-1 mb-2">
              {kycRejectionReasons.map((reason, i) => (
                <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-red-600">Corrigez les points ci-dessus et soumettez à nouveau.</p>
        </div>
      </div>
    </Card>
  );

  // ── STEP 1: Identity ──────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader
            title="Vérification KYC — Étape 1 sur 2"
            description="Prouvez votre identité pour devenir professeur vérifié sur Étude+."
          />
          <div className="max-w-2xl">
            {rejectionBanner}
            <ProgressBar step={1} />
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Pièce d'identité</h2>
                <p className="text-sm text-muted-foreground">
                  Ces informations doivent correspondre exactement à votre carte d'identité nationale (CIN).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadSlot
                  label="CIN — Recto" subtitle="Photo ou scan du recto de votre CIN" required
                  accept=".jpg,.jpeg,.png,.pdf" icon={Camera}
                  file={cinFront} uploading={uploadingCinFront}
                  onUpload={f => handleUpload(f, setCinFront, setUploadingCinFront)}
                  onClear={() => setCinFront(null)}
                />
                <UploadSlot
                  label="CIN — Verso" subtitle="Photo ou scan du verso de votre CIN" required
                  accept=".jpg,.jpeg,.png,.pdf" icon={Camera}
                  file={cinBack} uploading={uploadingCinBack}
                  onUpload={f => handleUpload(f, setCinBack, setUploadingCinBack)}
                  onClear={() => setCinBack(null)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Nom légal complet <span className="text-destructive">*</span>
                </label>
                <input
                  type="text" value={legalName} onChange={e => setLegalName(e.target.value)}
                  placeholder="Prénom et nom tels qu'ils apparaissent sur votre CIN"
                  className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Date de naissance <span className="text-destructive">*</span></label>
                  <input
                    type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Téléphone <span className="text-destructive">*</span></label>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                  />
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

  // ── STEP 2: Documents ─────────────────────────────────────────────────────

  if (step === 2) {
    return (
      <DashboardLayout>
        <FadeIn>
          <PageHeader
            title="Vérification KYC — Étape 2 sur 2"
            description="Fournissez vos diplômes et certifications pour prouver que vous êtes professeur."
          />
          <div className="max-w-2xl">
            {rejectionBanner}
            <ProgressBar step={2} />
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Diplômes & Certifications</h2>
                <p className="text-sm text-muted-foreground">
                  Téléversez vos documents académiques. Seul le diplôme universitaire est obligatoire.
                  Les qualifications par matière seront soumises séparément après approbation.
                </p>
              </div>

              <div className="space-y-3">
                <UploadSlot
                  label="Diplôme universitaire" required
                  subtitle="Licence, Master, Doctorat ou équivalent (PDF, JPG, PNG)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={diploma} uploading={uploadingDiploma}
                  onUpload={f => handleUpload(f, setDiploma, setUploadingDiploma)}
                  onClear={() => setDiploma(null)}
                />
                <UploadSlot
                  label="Certificat d'enseignement"
                  subtitle="CAPES, certificat pédagogique, attestation d'établissement, ou équivalent"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={teachingCert} uploading={uploadingCert}
                  onUpload={f => handleUpload(f, setTeachingCert, setUploadingCert)}
                  onClear={() => setTeachingCert(null)}
                />
                <UploadSlot
                  label="Document complémentaire"
                  subtitle="Tout autre document justifiant votre parcours d'enseignement"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={additionalDoc} uploading={uploadingAdditional}
                  onUpload={f => handleUpload(f, setAdditionalDoc, setUploadingAdditional)}
                  onClear={() => setAdditionalDoc(null)}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  Vérification en deux temps
                </p>
                <p>
                  Cette étape confirme que vous êtes bien professeur. Après approbation, vous pourrez
                  soumettre des <strong>demandes de qualification par matière</strong> (avec documents
                  spécifiques) pour chaque niveau que vous souhaitez enseigner.
                </p>
              </div>

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

  // ── STEP 3: Review & Submit ───────────────────────────────────────────────

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Vérification KYC — Récapitulatif" description="Vérifiez vos informations avant de soumettre." />
        <div className="max-w-2xl">
          {rejectionBanner}
          <ProgressBar step={3} />
          <Card className="p-6 space-y-6">

            {/* Identity summary */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Identité
              </p>
              <div className="p-4 bg-muted/30 rounded-xl text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom légal</span>
                  <span className="font-medium">{legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de naissance</span>
                  <span className="font-medium">{dateOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CIN</span>
                  <span className="font-medium text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 2 photos téléversées
                  </span>
                </div>
              </div>
            </div>

            {/* Documents summary */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Documents
              </p>
              <div className="space-y-2">
                {[
                  { doc: diploma, label: "Diplôme universitaire" },
                  { doc: teachingCert, label: "Certificat d'enseignement" },
                  { doc: additionalDoc, label: "Document complémentaire" },
                ].filter(d => d.doc).map(({ doc, label }) => (
                  <a key={label} href={`/api/storage${doc!.objectPath}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 flex-1 truncate">{label} : {doc!.name}</span>
                    <Eye className="w-4 h-4 text-green-600" />
                  </a>
                ))}
              </div>
            </div>

            {/* Info banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Après approbation :</p>
              <p>Vous pourrez soumettre des <strong>demandes de qualification par matière</strong> depuis votre tableau de bord. Chaque demande permet d'enseigner un niveau/matière spécifique.</p>
            </div>

            {/* Certification */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-muted/30 rounded-xl">
              <input
                type="checkbox" checked={certified} onChange={e => setCertified(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-primary"
              />
              <span className="text-sm font-medium">
                Je certifie que toutes les informations et documents fournis sont exacts et authentiques.
                Je comprends qu'une fausse déclaration entraîne la suspension de mon compte.
              </span>
            </label>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="lg" onClick={() => setStep(2)}>Retour</Button>
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
