import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getDashboardPath } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, Home, ShieldCheck, Mail,
  Upload, FileText, AlertCircle, X, Eye
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const TUNISIA_CITIES = [
  "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès",
  "Ariana", "Gafsa", "Monastir", "Ben Arous", "Kasserine",
  "Médenine", "Nabeul", "Tataouine", "Béja"
];

const GRADE_LEVELS = [
  "7ème Année de base", "8ème Année de base", "9ème Année de base",
  "1ère Année Secondaire", "2ème Année Secondaire", "3ème Année Secondaire", "Baccalauréat"
];

const SUBJECTS = [
  "Mathématiques", "Physique", "Chimie", "Sciences de la vie et de la terre",
  "Informatique", "Technique", "Français", "Anglais", "Arabe", "Philosophie", "Histoire-Géo"
];

const baseSchema = z.object({
  fullName: z.string().min(3, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
  city: z.string().min(1, "Ville requise"),
});

const studentSchema = baseSchema.extend({
  gradeLevel: z.string().min(1, "Niveau scolaire requis"),
  schoolName: z.string().optional()
});

const professorSchema = baseSchema.extend({
  phone: z.string().optional(),
  bio: z.string().min(10, "Une courte bio est requise"),
  yearsExperience: z.coerce.number().min(0).max(50),
  qualifications: z.string().optional(),
});

type ProfStep = "form" | "documents" | "pending";

const STEPS: { id: ProfStep; label: string }[] = [
  { id: "form",      label: "Profil"      },
  { id: "documents", label: "Documents"   },
  { id: "pending",   label: "En attente"  },
];

function StepBar({ current }: { current: ProfStep }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done   ? "bg-green-500 text-white" :
                active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                         "bg-muted text-muted-foreground border-2 border-border"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-4 ${i < idx ? "bg-green-400" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface UploadedFile {
  name: string;
  objectPath: string;
  previewUrl?: string;
}

function DocUploadSlot({
  label, description, required, file, onUpload, onClear, isUploading
}: {
  label: string;
  description: string;
  required?: boolean;
  file: UploadedFile | null;
  onUpload: (f: File) => void;
  onClear: () => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      file ? "border-green-400 bg-green-50" : "border-border bg-muted/30 hover:border-primary/40"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            file ? "bg-green-100" : "bg-muted"
          }`}>
            {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              {label} {required && <span className="text-destructive">*</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            {file && (
              <p className="text-xs text-green-700 font-medium mt-1 truncate">{file.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {file && (
            <button
              type="button"
              onClick={() => window.open(`/api/storage${file.objectPath}`, "_blank")}
              className="p-1.5 rounded-lg hover:bg-green-100 text-green-700"
              title="Prévisualiser"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {file ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {isUploading ? "Envoi..." : "Choisir"}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
      />
    </div>
  );
}

export function Register() {
  const { registerFn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "professor" ? "professor" : "student";

  const [role, setRole] = useState<"student" | "professor">(initialRole as any);
  const [isLoading, setIsLoading] = useState(false);
  const [profStep, setProfStep] = useState<ProfStep>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [professorId, setProfessorId] = useState<number | null>(null);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades]   = useState<string[]>([]);

  // Document state
  const [idDoc,      setIdDoc]      = useState<UploadedFile | null>(null);
  const [certDoc,    setCertDoc]    = useState<UploadedFile | null>(null);
  const [extraDoc,   setExtraDoc]   = useState<UploadedFile | null>(null);
  const [uploading,  setUploading]  = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const schema = role === "student" ? studentSchema : professorSchema;
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: "Tunis",
      ...(role === "student" ? { gradeLevel: "Baccalauréat" } : { yearsExperience: 5 })
    }
  });

  const uploadFile = async (file: File, slot: string): Promise<UploadedFile | null> => {
    try {
      const authToken = localStorage.getItem("etude_auth_token");
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) throw new Error("Impossible d'obtenir l'URL de téléversement");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Échec du téléversement");

      return { name: file.name, objectPath };
    } catch (e: any) {
      toast({ title: "Erreur de téléversement", description: e.message, variant: "destructive" });
      return null;
    }
  };

  const handleUpload = async (file: File, slot: "id" | "cert" | "extra") => {
    setUploading(p => ({ ...p, [slot]: true }));
    const result = await uploadFile(file, slot);
    setUploading(p => ({ ...p, [slot]: false }));
    if (!result) return;
    if (slot === "id")    setIdDoc(result);
    if (slot === "cert")  setCertDoc(result);
    if (slot === "extra") setExtraDoc(result);
  };

  const handleDocSubmit = async () => {
    if (!idDoc || !certDoc) {
      toast({ title: "Documents requis", description: "Veuillez téléverser votre pièce d'identité et votre certificat d'enseignement.", variant: "destructive" });
      return;
    }
    if (!professorId) {
      toast({ title: "Erreur", description: "Identifiant professeur introuvable.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const authToken = localStorage.getItem("etude_auth_token");
      const res = await fetch(`/api/professors/${professorId}/submit-documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          idDocumentUrl: idDoc.objectPath,
          teachingCertUrl: certDoc.objectPath,
          additionalDocUrl: extraDoc?.objectPath ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la soumission");
      }
      setProfStep("pending");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    if (role === "professor") {
      data.subjects  = selectedSubjects;
      data.gradeLevels = selectedGrades;
      if (selectedSubjects.length === 0 || selectedGrades.length === 0) {
        toast({ title: "Erreur", description: "Veuillez sélectionner au moins une matière et un niveau.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    data.role = role;

    try {
      const registeredUser = await registerFn(data);
      if (role === "professor") {
        setRegisteredEmail(data.email);
        const profId = (registeredUser as any)?.professorProfile?.id;
        setProfessorId(profId ?? null);
        setProfStep("documents");
      } else {
        setLocation(getDashboardPath(registeredUser.role));
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Erreur lors de l'inscription", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (sub: string) =>
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);

  const toggleGrade = (g: string) =>
    setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  // ── Step 2: Document Upload ──
  if (profStep === "documents") {
    return (
      <div className="min-h-screen bg-secondary/30 py-10 px-4">
        <FadeIn className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Accueil
            </Link>
          </div>
          <StepBar current="documents" />

          <Card className="shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Téléversez vos documents</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Votre compte a bien été créé. Soumettez maintenant vos documents pour que notre équipe puisse vérifier votre profil.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Required info box */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>Les documents marqués d'une <span className="text-destructive font-bold">*</span> sont obligatoires. Formats acceptés : PDF, JPG, PNG.</p>
              </div>

              <DocUploadSlot
                label="Pièce d'identité nationale"
                description="CIN tunisienne recto/verso, passeport, ou carte de séjour."
                required
                file={idDoc}
                onUpload={f => handleUpload(f, "id")}
                onClear={() => setIdDoc(null)}
                isUploading={!!uploading.id}
              />

              <DocUploadSlot
                label="Certificat d'enseignement"
                description="Diplôme, CAPES, attestation du Ministère de l'Éducation, ou toute preuve de qualification pédagogique."
                required
                file={certDoc}
                onUpload={f => handleUpload(f, "cert")}
                onClear={() => setCertDoc(null)}
                isUploading={!!uploading.cert}
              />

              <DocUploadSlot
                label="Document complémentaire (optionnel)"
                description="Relevé de notes, attestation d'expérience, lettres de recommandation, etc."
                file={extraDoc}
                onUpload={f => handleUpload(f, "extra")}
                onClear={() => setExtraDoc(null)}
                isUploading={!!uploading.extra}
              />
            </div>

            <div className="p-6 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Vos documents sont transmis de manière sécurisée et ne seront utilisés qu'à des fins de vérification.
              </p>
              <Button
                onClick={handleDocSubmit}
                size="lg"
                className="shrink-0"
                disabled={submitting || !idDoc || !certDoc}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Soumettre mon dossier</>
                )}
              </Button>
            </div>
          </Card>
        </FadeIn>
      </div>
    );
  }

  // ── Step 3: "En attente" confirmation ──
  if (profStep === "pending") {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <FadeIn className="w-full max-w-lg">
          <div className="flex justify-end mb-4 w-full">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Accueil
            </Link>
          </div>
          <StepBar current="pending" />

          <Card className="shadow-xl p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold mb-3">Dossier soumis avec succès !</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Votre profil et vos documents ont bien été reçus. Notre équipe de conformité examinera votre dossier et vous contactera à <strong>{registeredEmail}</strong>.
            </p>

            <div className="bg-muted rounded-2xl p-6 mb-8 text-left space-y-4">
              {[
                { done: true, active: false, label: "Profil complété", sub: "Vos informations professionnelles ont été enregistrées." },
                { done: true, active: false, label: "Documents soumis", sub: "Vos pièces justificatives ont été envoyées à notre équipe." },
                { done: false, active: true,  label: "Examen en cours (24–48h)", sub: "L'équipe de conformité analyse votre dossier." },
                { done: false, active: false, label: "Accès activé", sub: "Vous serez notifié par email dès approbation." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    step.done   ? "bg-green-500" :
                    step.active ? "bg-amber-400 animate-pulse" :
                                  "border-2 border-border bg-background"
                  }`}>
                    {step.done   ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                     step.active ? <Clock className="w-3.5 h-3.5 text-white" /> :
                                   <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${step.done ? "text-green-700" : step.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => setLocation("/professor/dashboard")} size="lg" className="w-full">
              Accéder à mon espace
            </Button>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              Questions ?{" "}
              <a href="mailto:support@etude.tn" className="text-primary hover:underline">support@etude.tn</a>
            </div>
          </Card>
        </FadeIn>
      </div>
    );
  }

  // ── Step 1: Registration form ──
  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

      <FadeIn className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <Link href="/select-role" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <Home className="w-4 h-4" /> Accueil
          </Link>
        </div>

        {role === "professor" && <StepBar current="form" />}

        <Card className="shadow-xl overflow-hidden">
          <div className="bg-muted p-2 flex border-b border-border">
            <button
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${role === 'student' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => { setRole("student"); reset(); }}
              type="button"
            >
              Je suis un Élève
            </button>
            <button
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${role === 'professor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => { setRole("professor"); reset(); }}
              type="button"
            >
              Je suis un Professeur
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">
                {role === "student" ? "Créer mon compte élève" : "Devenir professeur sur Étude+"}
              </h1>
              {role === "professor" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Étape 1 — Renseignez votre profil, vous soumettrez vos documents ensuite.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nom complet</Label>
                <Input {...register("fullName")} placeholder="Dr. Mohamed Ben Ahmed" className="mt-1.5" />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Adresse email</Label>
                <Input {...register("email")} type="email" placeholder="vous@exemple.com" className="mt-1.5" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Mot de passe</Label>
                <Input {...register("password")} type="password" placeholder="••••••••" className="mt-1.5" />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <Label>Ville</Label>
              <select
                {...register("city")}
                className="mt-1.5 flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
              >
                {TUNISIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {role === "student" && (
              <div>
                <Label>Niveau scolaire</Label>
                <select
                  {...register("gradeLevel")}
                  className="mt-1.5 flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                >
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {(errors as any).gradeLevel && <p className="text-xs text-destructive mt-1">{(errors as any).gradeLevel.message}</p>}
              </div>
            )}

            {role === "professor" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone</Label>
                    <Input {...register("phone" as any)} placeholder="+216 XX XXX XXX" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Années d'expérience</Label>
                    <Input {...register("yearsExperience")} type="number" min={0} max={50} placeholder="5" className="mt-1.5" />
                  </div>
                </div>

                <div>
                  <Label>Matières enseignées</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SUBJECTS.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${selectedSubjects.includes(sub) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  {selectedSubjects.length === 0 && <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins une matière</p>}
                </div>

                <div>
                  <Label>Niveaux enseignés</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {GRADE_LEVELS.map(grade => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${selectedGrades.includes(grade) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                  {selectedGrades.length === 0 && <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins un niveau</p>}
                </div>

                <div>
                  <Label>Biographie professionnelle</Label>
                  <textarea
                    {...register("bio")}
                    placeholder="Décrivez votre parcours, vos méthodes pédagogiques et vos spécialités..."
                    className="mt-1.5 flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
                  />
                  {(errors as any).bio && <p className="text-xs text-destructive mt-1">{(errors as any).bio.message}</p>}
                </div>

                <div>
                  <Label>Diplômes et qualifications</Label>
                  <Input {...register("qualifications" as any)} placeholder="ex: Licence en Mathématiques, CAPES..." className="mt-1.5" />
                </div>
              </>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création du compte...</>
              ) : role === "professor" ? (
                "Suivant — Soumettre mes documents"
              ) : (
                "Créer mon compte élève"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
