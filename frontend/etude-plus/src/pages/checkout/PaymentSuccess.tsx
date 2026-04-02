import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button, FadeIn } from "@/components/ui/Premium";
import { CheckCircle2, PlayCircle } from "lucide-react";

export function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <Navbar />
      <FadeIn className="max-w-md mx-auto mt-20 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-4">Paiement Réussi !</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Bienvenue dans le cours. Vous avez maintenant un accès complet aux supports et aux sessions live.
        </p>
        <div className="space-y-4">
          <Link href="/student/dashboard">
            <Button size="lg" className="w-full">Aller à mon tableau de bord</Button>
          </Link>
          <Link href="/classroom/1">
            <Button variant="outline" size="lg" className="w-full bg-card">
              <PlayCircle className="w-5 h-5 mr-2" /> Rejoindre la salle d'attente
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
