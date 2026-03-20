import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getDashboardPath } from "@/hooks/use-auth";
import { Button, Card, Input, Label, FadeIn } from "@/components/ui/Premium";
import { BookPlus, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export function Login() {
  const { loginFn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const user = await loginFn(data);
      setLocation(getDashboardPath(user.role));
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? "Identifiants invalides";
      toast({ title: "Connexion échouée", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input {...register("email")} placeholder="vous@exemple.com" type="email" autoComplete="email" />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Mot de passe</Label>
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
        </Card>
      </FadeIn>
    </div>
  );
}
