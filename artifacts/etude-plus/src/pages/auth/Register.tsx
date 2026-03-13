import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getDashboardPath } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink, ShieldCheck, ArrowRight, Clock, Home } from "lucide-react";
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
  bio: z.string().min(10, "Une courte bio est requise"),
  yearsExperience: z.coerce.number().min(0).max(50),
});

type KycStep = "form" | "kblox-redirect" | "kblox-waiting" | "success";

const KYC_STEPS = [
  { id: "form", label: "Inscription" },
  { id: "kblox-redirect", label: "Vérification KBlox" },
  { id: "kblox-waiting", label: "En attente" },
] as const;

function StepProgress({ current, onStepClick }: { current: KycStep; onStepClick: (step: KycStep) => void }) {
  const currentIdx = KYC_STEPS.findIndex(s => s.id === current);
  return (
    <div className="w-full max-w-lg mb-6 flex items-center justify-between">
      {KYC_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const clickable = idx < currentIdx;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step.id as KycStep)}
              className={`flex items-center gap-2 group ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"} ${clickable ? "group-hover:scale-110" : ""}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : done ? "text-green-600" : "text-muted-foreground"}`}>{step.label}</span>
            </button>
            {idx < KYC_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${idx < currentIdx ? "bg-green-400" : "bg-border"}`} />
            )}
          </div>
        );
      })}
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
  const [kycStep, setKycStep] = useState<KycStep>("form");
  const [registeredData, setRegisteredData] = useState<any>(null);
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  const schema = role === "student" ? studentSchema : professorSchema;
  type FormValues = z.infer<typeof schema>;
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: "Tunis",
      ...(role === "student" ? { gradeLevel: "Baccalauréat" } : { yearsExperience: 5 })
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    if (role === "professor") {
      data.subjects = selectedSubjects;
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
        setRegisteredData(data);
        setKycStep("kblox-redirect");
      } else {
        setLocation(getDashboardPath(registeredUser.role));
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Erreur lors de l'inscription", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  };
  
  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
  };

  const handleOpenKblox = () => {
    window.open("https://kblox.replit.app/login", "_blank", "noopener,noreferrer");
    setKycStep("kblox-waiting");
  };

  // KBlox redirect step — explain and open KBlox
  if (kycStep === "kblox-redirect") {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <FadeIn className="w-full max-w-lg">
          {/* Top nav bar */}
          <div className="flex items-center justify-between mb-4 w-full">
            <button
              type="button"
              onClick={() => setKycStep("form")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Étape précédente
            </button>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Accueil
            </Link>
          </div>

          <StepProgress current="kblox-redirect" onStepClick={setKycStep} />

          <Card className="shadow-xl overflow-hidden">
            {/* KBlox branded header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Vérification d'identité requise</h2>
              <p className="text-slate-300 mt-1 text-sm">Powered by <span className="text-white font-semibold">KBlox</span></p>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Pour garantir la qualité et la sécurité de notre plateforme, tous les professeurs doivent compléter une vérification d'identité via <strong>KBlox</strong>, notre partenaire KYC de confiance.
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { step: "01", text: "Cliquez sur le bouton ci-dessous pour ouvrir KBlox" },
                    { step: "02", text: "Créez un compte avec la même adresse email que celle utilisée ici" },
                    { step: "03", text: "Soumettez votre pièce d'identité et les documents requis" },
                    { step: "04", text: "Notre équipe validera votre profil sous 24–48h" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{step}</span>
                      <p className="text-sm text-foreground pt-0.5">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 text-xs font-medium">
                    ⚠️ Utilisez la même adresse email : <strong>{registeredData?.email}</strong>
                  </p>
                </div>
              </div>

              <Button
                onClick={handleOpenKblox}
                className="w-full gap-2"
                size="lg"
              >
                Continuer vers KBlox
                <ExternalLink className="w-4 h-4" />
              </Button>

              <button
                onClick={() => setKycStep("kblox-waiting")}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                J'ai déjà complété la vérification →
              </button>
            </div>
          </Card>
        </FadeIn>
      </div>
    );
  }

  // KBlox waiting step — user has opened KBlox and is completing verification
  if (kycStep === "kblox-waiting") {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <FadeIn className="w-full max-w-md">
          {/* Top nav bar */}
          <div className="flex items-center justify-between mb-4 w-full">
            <button
              type="button"
              onClick={() => setKycStep("kblox-redirect")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Étape précédente
            </button>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Accueil
            </Link>
          </div>

          <StepProgress current="kblox-waiting" onStepClick={setKycStep} />

          <Card className="shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">En attente de vérification</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Votre compte a été créé. Votre vérification KBlox est en cours de traitement par notre équipe de conformité.
              </p>
            </div>

            <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Compte Étude+ créé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0 flex items-center justify-center">
                  <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
                </div>
                <span className="text-sm text-muted-foreground">Vérification KBlox en cours...</span>
              </div>
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Accès au tableau de bord professeur</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://kblox.replit.app/login"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border hover:border-primary/30 text-sm font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Ouvrir KBlox
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <Button
                onClick={() => setLocation("/professor/dashboard")}
                className="w-full gap-2"
                size="lg"
              >
                Accéder au tableau de bord
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Votre compte est en attente d'approbation. Certaines fonctionnalités seront disponibles après validation.
            </p>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />
      <div className="absolute inset-0 bg-math-pattern opacity-[0.03] pointer-events-none" />
      
      <FadeIn className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/select-role" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <Home className="w-4 h-4" /> Accueil
          </Link>
        </div>
        
        <Card className="shadow-xl overflow-hidden">
          <div className="bg-muted p-2 flex border-b border-border">
            <button 
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${role === 'student' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setRole("student")}
              type="button"
            >
              Je suis un Élève
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${role === 'professor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setRole("professor")}
              type="button"
            >
              Je suis un Professeur
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-serif font-bold">Créer votre compte</h1>
              <p className="text-muted-foreground mt-1">
                {role === "student" ? "Rejoignez la plateforme et commencez à apprendre" : "Rejoignez notre réseau de professeurs d'excellence"}
              </p>
              {role === "professor" && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Vérification KBlox requise pour les professeurs
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Nom complet</Label>
                  <Input {...register("fullName")} placeholder="Ali Ben Salah" />
                  {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message as string}</p>}
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} placeholder="ali@exemple.com" />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Mot de passe</Label>
                  <Input type="password" {...register("password")} placeholder="••••••••" />
                  {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message as string}</p>}
                </div>
                <div>
                  <Label>Ville</Label>
                  <select 
                    {...register("city")} 
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                  >
                    {TUNISIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message as string}</p>}
                </div>
              </div>

              {role === "student" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-border pt-5">
                    <div>
                      <Label>Niveau scolaire</Label>
                      <select 
                        {...register("gradeLevel")} 
                        className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                      >
                        {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {errors.gradeLevel && <p className="text-destructive text-xs mt-1">{errors.gradeLevel.message as string}</p>}
                    </div>
                    <div>
                      <Label>Lycée / Collège (Optionnel)</Label>
                      <Input {...register("schoolName")} placeholder="Lycée Pilote..." />
                    </div>
                  </div>
                </>
              )}

              {role === "professor" && (
                <div className="space-y-5 border-t border-border pt-5">
                  <div>
                    <Label>Biographie & Parcours</Label>
                    <textarea 
                      {...register("bio")}
                      className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all resize-none"
                      placeholder="Décrivez votre parcours, vos diplômes et votre approche pédagogique..."
                    />
                    {errors.bio && <p className="text-destructive text-xs mt-1">{errors.bio.message as string}</p>}
                  </div>
                  
                  <div>
                    <Label>Années d'expérience d'enseignement</Label>
                    <Input type="number" min="0" {...register("yearsExperience")} />
                  </div>

                  <div>
                    <Label className="mb-3">Matières enseignées</Label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubject(sub)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedSubjects.includes(sub) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3">Niveaux enseignés</Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADE_LEVELS.map(grade => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => toggleGrade(grade)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedGrades.includes(grade) ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-muted-foreground border-border hover:border-accent/50'}`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
                {role === "student" ? "Créer mon compte" : "Continuer vers la vérification KBlox"}
                {role === "professor" && !isLoading && <ShieldCheck className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground text-sm">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
