import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight, Mail } from "lucide-react";
import { Link } from "wouter";

export function ProfessorKYC() {
  const { user } = useAuth();
  const profStatus = (user as any)?.professorProfile?.status ?? "pending";
  const userEmail = user?.email ?? "";

  const configs = {
    pending: {
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      iconBg: "bg-amber-100",
      title: "Dossier en cours d'examen",
      subtitle: "Votre candidature a bien été reçue",
      desc: "L'équipe de conformité d'Étude+ examine votre dossier. Vous recevrez une notification par email dès que votre compte sera approuvé.",
      delay: "Délai habituel : 24 à 48 heures ouvrées.",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
    },
    kyc_submitted: {
      icon: <ShieldCheck className="w-14 h-14 text-blue-500" />,
      iconBg: "bg-blue-100",
      title: "Vérification soumise",
      subtitle: "Votre dossier est complet",
      desc: "Votre vérification a été transmise à l'équipe de conformité. L'examen de votre profil est en cours.",
      delay: "Délai habituel : 24 à 48 heures ouvrées.",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
    },
    approved: {
      icon: <CheckCircle2 className="w-14 h-14 text-green-500" />,
      iconBg: "bg-green-100",
      title: "Compte approuvé !",
      subtitle: "Vous êtes maintenant professeur vérifié",
      desc: "Félicitations ! Votre compte a été vérifié et approuvé. Vous avez accès à toutes les fonctionnalités de la plateforme.",
      delay: "",
      borderColor: "border-green-200",
      bgColor: "bg-green-50",
    },
    rejected: {
      icon: <AlertCircle className="w-14 h-14 text-red-500" />,
      iconBg: "bg-red-100",
      title: "Candidature non retenue",
      subtitle: "Votre dossier n'a pas pu être validé",
      desc: "Votre vérification d'identité n'a pas abouti. Veuillez contacter notre équipe de support pour plus d'informations sur les raisons et les démarches à suivre.",
      delay: "",
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
    },
  };

  const cfg = configs[profStatus as keyof typeof configs] ?? configs.pending;

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Statut de vérification"
          description="Suivez l'avancement de votre candidature."
        />

        <div className="max-w-2xl">
          {/* Main status card */}
          <Card className={`p-8 text-center border-2 ${cfg.borderColor} ${cfg.bgColor} mb-6`}>
            <div className={`w-24 h-24 rounded-2xl ${cfg.iconBg} flex items-center justify-center mx-auto mb-6`}>
              {cfg.icon}
            </div>
            <h2 className="text-2xl font-bold mb-1">{cfg.title}</h2>
            <p className="text-sm font-medium text-muted-foreground mb-4">{cfg.subtitle}</p>
            <p className="text-muted-foreground leading-relaxed mb-3">{cfg.desc}</p>
            {cfg.delay && <p className="text-xs text-muted-foreground font-medium">{cfg.delay}</p>}

            {profStatus === "approved" && (
              <Link href="/professor/dashboard" className="mt-6 inline-block">
                <Button size="lg" className="gap-2">
                  Accéder au tableau de bord <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {profStatus === "rejected" && (
              <a href={`mailto:support@etude.tn?subject=Vérification refusée - ${userEmail}`} className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                <Mail className="w-4 h-4" /> Contacter le support
              </a>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-bold mb-5">Processus de vérification</h3>
            <div className="space-y-5">
              {[
                {
                  label: "Inscription complétée",
                  desc: "Votre compte professeur a été créé sur Étude+.",
                  done: true,
                },
                {
                  label: "Examen par l'équipe de conformité",
                  desc: "Notre équipe vérifie votre profil, vos qualifications et vos documents.",
                  done: profStatus === "approved",
                  active: profStatus === "pending" || profStatus === "kyc_submitted",
                },
                {
                  label: "Approbation et activation",
                  desc: "Votre compte est activé et vous pouvez créer des cours.",
                  done: profStatus === "approved",
                  active: false,
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                    step.done
                      ? "bg-green-500 text-white"
                      : step.active
                      ? "bg-amber-400 text-white animate-pulse"
                      : "bg-muted border-2 border-border text-muted-foreground"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${step.done ? "text-green-700" : step.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contact info */}
          {(profStatus === "pending" || profStatus === "kyc_submitted") && (
            <div className="mt-4 p-4 rounded-xl bg-muted flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vous avez des questions ?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contactez-nous à{" "}
                  <a href="mailto:support@etude.tn" className="text-primary hover:underline">support@etude.tn</a>
                  {" "}en mentionnant votre email d'inscription : <strong>{userEmail}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
