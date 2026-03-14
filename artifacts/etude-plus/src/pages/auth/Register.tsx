import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getDashboardPath } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import { ArrowLeft, Loader2, CheckCircle2, Clock, Home, ShieldCheck } from "lucide-react";
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

export function Register() {
  const { registerFn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "professor" ? "professor" : "student";

  const [role, setRole] = useState<"student" | "professor">(initialRole as any);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  const schema = role === "student" ? studentSchema : professorSchema;
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
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
        setRegisteredEmail(data.email);
        setRegistered(true);
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

  // ── Professor registered → "En attente" confirmation ──
  if (registered && role === "professor") {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <FadeIn className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6 w-full">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Accueil
            </Link>
          </div>

          <Card className="shadow-xl p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold mb-3">Inscription réussie !</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Votre dossier a bien été reçu. L'équipe de conformité d'Étude+ va examiner votre candidature et vous contactera à <strong>{registeredEmail}</strong>.
            </p>

            {/* Steps */}
            <div className="bg-muted rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Inscription complétée</p>
                  <p className="text-xs text-muted-foreground">Votre compte professeur a été créé avec succès.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Vérification en cours</p>
                  <p className="text-xs text-muted-foreground">L'équipe de conformité examine votre dossier (24–48h).</p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-40">
                <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Accès au tableau de bord</p>
                  <p className="text-xs text-muted-foreground">Vous serez notifié par email dès approbation.</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setLocation("/professor/dashboard")} size="lg" className="w-full">
              Accéder à mon espace
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Délai de vérification habituel : 24 à 48 heures ouvrées.
            </p>
          </Card>
        </FadeIn>
      </div>
    );
  }

  // ── Main registration form ──
  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

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
                  Votre candidature sera examinée par notre équipe sous 24–48h.
                </p>
              )}
            </div>

            {/* Common fields */}
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

            {/* Student-specific */}
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

            {/* Professor-specific */}
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
                  {selectedSubjects.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins une matière</p>
                  )}
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
                  {selectedGrades.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins un niveau</p>
                  )}
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
                "Soumettre ma candidature"
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
