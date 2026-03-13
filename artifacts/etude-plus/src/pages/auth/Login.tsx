import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getSavedAccounts, getDashboardPath, RecentAccount } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import { BookPlus, ArrowLeft, UserCircle, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const ROLE_LABELS: Record<string, string> = {
  student: "Élève",
  professor: "Professeur",
  admin: "Administrateur",
};

const DEMO_ACCOUNTS = [
  { email: "admin@etude.tn", role: "admin", label: "Admin", password: "password" },
  { email: "prof@etude.tn", role: "professor", label: "Professeur", password: "password" },
  { email: "student@etude.tn", role: "student", label: "Élève", password: "password" },
];

export function Login() {
  const { loginFn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);

  useEffect(() => {
    setRecentAccounts(getSavedAccounts());
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const user = await loginFn(data);
      setLocation(getDashboardPath(user.role));
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "Identifiants invalides";
      toast({ title: "Connexion échouée", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fillAccount = (email: string, password?: string) => {
    setValue("email", email);
    if (password) setValue("password", password);
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

      <FadeIn className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Link>

        <Card className="p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mb-4 shadow-lg shadow-primary/20">
              <BookPlus className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-center">Bon retour sur Étude+</h1>
            <p className="text-muted-foreground mt-2 text-center">Connectez-vous à votre compte</p>
          </div>

          {/* Recent accounts */}
          {recentAccounts.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comptes récents</p>
              <div className="space-y-2">
                {recentAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillAccount(acc.email)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{acc.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{acc.email} · {ROLE_LABELS[acc.role] ?? acc.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">ou connectez-vous avec un autre compte</span></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input {...register("email")} placeholder="vous@exemple.com" type="email" autoComplete="email" />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label className="mb-0">Mot de passe</Label>
              </div>
              <Input type="password" {...register("password")} placeholder="••••••••" autoComplete="current-password" />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              Pas encore de compte ?{" "}
              <Link href="/select-role" className="text-primary font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 bg-muted/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">Comptes de démonstration</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillAccount(acc.email, acc.password)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all"
                >
                  <span className="text-lg">{acc.role === "admin" ? "🛡️" : acc.role === "professor" ? "👨‍🏫" : "🎓"}</span>
                  <span className="text-xs font-semibold">{acc.label}</span>
                  <span className="text-[10px] text-muted-foreground">password</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Cliquez pour remplir automatiquement</p>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
