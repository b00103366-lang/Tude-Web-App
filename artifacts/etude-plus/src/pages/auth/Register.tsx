import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import { BookPlus, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
  subjects: z.array(z.string()).min(1, "Sélectionnez au moins une matière"),
  gradeLevels: z.array(z.string()).min(1, "Sélectionnez au moins un niveau")
});

export function Register() {
  const { registerFn } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "professor" ? "professor" : "student";
  
  const [role, setRole] = useState<"student" | "professor">(initialRole as any);
  const [isLoading, setIsLoading] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [kycStatus, setKycStatus] = useState<"pending" | "success">("pending");
  
  // Selected arrays for Professor checkboxes
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  const schema = role === "student" ? studentSchema : professorSchema;
  type FormValues = z.infer<typeof schema>;
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: "Tunis",
      ...(role === "student" ? { gradeLevel: "Baccalauréat" } : { yearsExperience: 5 })
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    // Add arrays for professor
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
      if (role === "professor") {
        setShowKyc(true);
        // Simulate KYC verification
        setTimeout(async () => {
          setKycStatus("success");
          setTimeout(async () => {
             await registerFn(data);
             setLocation("/professor/dashboard");
          }, 1500);
        }, 2500);
      } else {
        await registerFn(data);
        setLocation("/student/dashboard");
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Erreur lors de l'inscription", variant: "destructive" });
      setShowKyc(false);
    } finally {
      if (role !== "professor") setIsLoading(false);
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  };
  
  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
  };

  if (showKyc) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-xl">
          <div className="mb-6 flex justify-center">
            {kycStatus === "pending" ? (
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {kycStatus === "pending" ? "Vérification KYC en cours" : "Identité Vérifiée !"}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {kycStatus === "pending" 
              ? "Veuillez patienter pendant que nous vérifions vos informations (Mock KYCblox)..." 
              : "Votre compte professeur a été créé avec succès. Redirection..."}
          </p>
          
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full bg-primary transition-all duration-1000 ease-in-out ${kycStatus === 'pending' ? 'w-2/3' : 'w-full'}`}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />
      <div className="absolute inset-0 bg-math-pattern opacity-[0.03] pointer-events-none" />
      
      <FadeIn className="w-full max-w-xl">
        <Link href="/select-role" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Link>
        
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
                {role === "student" ? "Créer mon compte" : "Soumettre ma candidature"}
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
