import { useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ProfessorKYC() {
  const { user, refreshUser } = useAuth() as any;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  const profStatus = (user as any)?.professorProfile?.status ?? "pending";

  const handleMarkSubmitted = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("etude_auth_token");
      const profId = (user as any)?.professorProfile?.id;
      if (!profId) throw new Error("Profil professeur introuvable");

      const res = await fetch(`/api/professors/${profId}/kyc-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Erreur lors de la soumission");

      toast({ title: "KYC soumis", description: "Votre vérification a été soumise. L'équipe validera votre dossier sous 24–48h." });
      if (refreshUser) await refreshUser();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: {
      badge: <Badge variant="secondary">En attente de vérification</Badge>,
      icon: <Clock className="w-12 h-12 text-amber-500" />,
      title: "Vérification requise",
      desc: "Vous devez compléter la vérification KBlox pour activer votre compte professeur et accéder à toutes les fonctionnalités.",
      showKYC: true,
    },
    kyc_submitted: {
      badge: <Badge variant="secondary">KYC soumis — en cours d'examen</Badge>,
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      title: "Vérification en cours",
      desc: "Votre dossier de vérification KBlox a été soumis et est en cours d'examen par notre équipe. Cela prend généralement 24–48h.",
      showKYC: false,
    },
    approved: {
      badge: <Badge variant="success">Compte vérifié</Badge>,
      icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
      title: "Compte approuvé",
      desc: "Votre compte a été vérifié et approuvé. Vous avez accès à toutes les fonctionnalités de la plateforme.",
      showKYC: false,
    },
    rejected: {
      badge: <Badge variant="destructive">Vérification refusée</Badge>,
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      title: "Vérification refusée",
      desc: "Votre vérification a été refusée. Veuillez contacter notre équipe de support pour plus d'informations.",
      showKYC: true,
    },
  };

  const config = statusConfig[profStatus as keyof typeof statusConfig] ?? statusConfig.pending;

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Vérification d'identité KBlox"
          description="Complétez votre vérification pour activer votre compte professeur."
        />

        <div className="max-w-4xl">
          {/* Status Card */}
          <Card className="p-6 mb-6 flex items-center gap-4">
            {config.icon}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="font-bold text-lg">{config.title}</h2>
                {config.badge}
              </div>
              <p className="text-muted-foreground text-sm">{config.desc}</p>
            </div>
            {profStatus === "approved" && (
              <Button onClick={() => setLocation("/professor/dashboard")} className="gap-2">
                Aller au tableau de bord <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </Card>

          {/* Steps */}
          <Card className="p-6 mb-6">
            <h3 className="font-bold mb-4">Étapes de vérification</h3>
            <div className="space-y-3">
              {[
                { done: true, label: "Compte Étude+ créé", desc: "Votre compte professeur a été créé avec succès." },
                {
                  done: profStatus === "kyc_submitted" || profStatus === "approved",
                  active: profStatus === "pending" || profStatus === "rejected",
                  label: "Vérification KBlox",
                  desc: "Complétez le formulaire KYC ci-dessous pour soumettre vos documents d'identité.",
                },
                {
                  done: profStatus === "approved",
                  label: "Validation par l'équipe Étude+",
                  desc: "Notre équipe examine votre dossier et active votre compte sous 24–48h.",
                },
                {
                  done: profStatus === "approved",
                  label: "Accès complet à la plateforme",
                  desc: "Créez vos cours, gérez vos élèves et commencez à enseigner.",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? "bg-green-500" : "step" in step && step.active ? "bg-amber-400" : "bg-muted border-2 border-border"}`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${step.done ? "text-green-700" : "text-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* KBlox iframe */}
          {config.showKYC && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-base font-bold text-white">Vérification KBlox</h3>
                    <p className="text-slate-400 text-xs">Restez sur cette page — la vérification s'effectue ici</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full">Powered by KBlox</span>
              </div>

              {showIframe ? (
                <iframe
                  src="https://03200982-fabf-4e40-aa49-9588883ea3b7-00-111qxxwza91vm.kirk.replit.dev/embed/etude?embed=true"
                  style={{ width: "100%", height: "700px", border: "none" }}
                  allow="clipboard-write; camera; microphone"
                  title="Vérification KBlox"
                />
              ) : (
                <div className="p-12 text-center">
                  <ShieldCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Lancez votre vérification</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Cliquez ci-dessous pour ouvrir le formulaire de vérification d'identité KBlox. Vous resterez sur cette page.
                  </p>
                  <Button size="lg" onClick={() => setShowIframe(true)} className="gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Commencer la vérification
                  </Button>
                </div>
              )}

              {showIframe && (
                <div className="p-4 bg-muted border-t border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Une fois le formulaire soumis, cliquez sur le bouton ci-dessous.
                  </p>
                  <Button
                    onClick={handleMarkSubmitted}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    J'ai soumis ma vérification
                  </Button>
                </div>
              )}
            </Card>
          )}

          {(profStatus === "kyc_submitted") && (
            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800">En attente de validation</p>
                  <p className="text-blue-600 text-sm mt-1">
                    Notre équipe examine votre dossier. Vous recevrez une notification par email dès que votre compte sera validé.
                  </p>
                  <p className="text-blue-500 text-xs mt-2">Délai moyen : 24 à 48 heures</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
