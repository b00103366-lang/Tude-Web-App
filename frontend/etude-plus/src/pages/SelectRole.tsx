import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button, FadeIn } from "@/components/ui/Premium";
import { BookOpen, BarChart3, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { icon: BookOpen,  text: "Banque de questions par matière et chapitre" },
  { icon: Sparkles,  text: "Annales, flashcards et notions clés" },
  { icon: BarChart3, text: "Suivi de ta progression en temps réel" },
];

export function SelectRole() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-math-pattern opacity-[0.03] pointer-events-none" />
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4 relative z-10">
        <div className="w-full max-w-md text-center">
          <FadeIn>
            {/* Brand mark */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="font-serif font-bold text-3xl text-primary">É</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
              Bienvenue sur <span className="text-primary">Étude+</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              La plateforme de révision pour les élèves tunisiens.
              Commence à réviser intelligemment dès aujourd'hui.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 mb-10 text-left">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link href="/register">
              <Button size="lg" className="w-full gap-2 text-base">
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <p className="mt-6 text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
