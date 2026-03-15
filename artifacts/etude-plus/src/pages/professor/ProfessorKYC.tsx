import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight, Mail, FileText, Eye, Download, Upload } from "lucide-react";
import { Link } from "wouter";

function DocRow({ label, objectPath }: { label: string; objectPath?: string | null }) {
  if (!objectPath) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Non soumis</p>
        </div>
      </div>
    );
  }

  const url = `/api/storage${objectPath}`;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-green-800">{label}</p>
        <p className="text-xs text-green-600 truncate">{objectPath.split("/").pop()}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Ouvrir">
          <Eye className="w-4 h-4" />
        </a>
        <a href={url} download
          className="p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Télécharger">
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export function ProfessorKYC() {
  const { user } = useAuth();
  const profProfile = (user as any)?.professorProfile;
  const profStatus = profProfile?.status ?? "pending";
  const userEmail = user?.email ?? "";

  const configs = {
    pending: {
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      iconBg: "bg-amber-100",
      title: "Documents requis",
      subtitle: "Votre dossier est en attente de soumission",
      desc: "Pour activer votre compte professeur, veuillez soumettre vos documents justificatifs via la page d'inscription ou contactez notre équipe si vous rencontrez un problème.",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
    },
    kyc_submitted: {
      icon: <ShieldCheck className="w-14 h-14 text-blue-500" />,
      iconBg: "bg-blue-100",
      title: "Dossier en cours d'examen",
      subtitle: "Vos documents ont été soumis",
      desc: "Notre équipe de conformité examine votre dossier. Vous recevrez une notification par email dès que la vérification sera complétée.",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
    },
    approved: {
      icon: <CheckCircle2 className="w-14 h-14 text-green-500" />,
      iconBg: "bg-green-100",
      title: "Compte approuvé !",
      subtitle: "Vous êtes un professeur vérifié sur Étude+",
      desc: "Félicitations ! Votre dossier a été validé. Vous avez accès à toutes les fonctionnalités de la plateforme.",
      borderColor: "border-green-200",
      bgColor: "bg-green-50",
    },
    rejected: {
      icon: <AlertCircle className="w-14 h-14 text-red-500" />,
      iconBg: "bg-red-100",
      title: "Dossier non retenu",
      subtitle: "Votre candidature n'a pas été validée",
      desc: "Votre dossier a été examiné mais n'a pas pu être approuvé. Consultez le motif ci-dessous et contactez notre équipe pour plus d'informations.",
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
          description="Suivez l'avancement de votre dossier de candidature."
        />

        <div className="max-w-2xl space-y-6">
          {/* Main status card */}
          <Card className={`p-8 text-center border-2 ${cfg.borderColor} ${cfg.bgColor}`}>
            <div className={`w-24 h-24 rounded-2xl ${cfg.iconBg} flex items-center justify-center mx-auto mb-6`}>
              {cfg.icon}
            </div>
            <h2 className="text-2xl font-bold mb-1">{cfg.title}</h2>
            <p className="text-sm font-medium text-muted-foreground mb-4">{cfg.subtitle}</p>
            <p className="text-muted-foreground leading-relaxed">{cfg.desc}</p>

            {profStatus === "approved" && (
              <Link href="/professor/dashboard" className="mt-6 inline-block">
                <Button size="lg" className="gap-2">
                  Accéder au tableau de bord <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </Card>

          {/* Rejection notes */}
          {profStatus === "rejected" && profProfile?.documentNotes && (
            <Card className="p-5 border-2 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Motif communiqué par l'équipe</p>
                  <p className="text-sm text-red-700">{profProfile.documentNotes}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200">
                <a
                  href={`mailto:support@etude.tn?subject=Dossier refusé - ${userEmail}&body=Bonjour, je souhaite des informations concernant le refus de mon dossier.`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline"
                >
                  <Mail className="w-4 h-4" /> Contacter le support pour re-soumettre
                </a>
              </div>
            </Card>
          )}

          {/* Uploaded documents */}
          {(profProfile?.idDocumentUrl || profProfile?.teachingCertUrl) && (
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-muted-foreground" />
                Documents soumis
              </h3>
              <div className="space-y-3">
                <DocRow label="Pièce d'identité nationale"    objectPath={profProfile?.idDocumentUrl} />
                <DocRow label="Certificat d'enseignement"     objectPath={profProfile?.teachingCertUrl} />
                {profProfile?.additionalDocUrl && (
                  <DocRow label="Document complémentaire"     objectPath={profProfile?.additionalDocUrl} />
                )}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-bold mb-5">Processus de vérification</h3>
            <div className="space-y-5">
              {[
                {
                  label: "Inscription complétée",
                  desc: "Votre compte professeur a été créé sur Étude+.",
                  done: true,
                  active: false,
                },
                {
                  label: "Documents soumis",
                  desc: "Vos pièces justificatives ont été envoyées à notre équipe de conformité.",
                  done: profStatus === "kyc_submitted" || profStatus === "approved" || profStatus === "rejected",
                  active: profStatus === "pending",
                },
                {
                  label: "Examen par l'équipe de conformité",
                  desc: "Notre équipe vérifie vos documents et vos qualifications (24–48h).",
                  done: profStatus === "approved" || profStatus === "rejected",
                  active: profStatus === "kyc_submitted",
                },
                {
                  label: "Approbation et activation",
                  desc: "Votre compte est activé et vous pouvez créer des cours et accueillir des élèves.",
                  done: profStatus === "approved",
                  active: false,
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                    step.done   ? "bg-green-500 text-white" :
                    step.active ? "bg-amber-400 text-white animate-pulse" :
                                  "bg-muted border-2 border-border text-muted-foreground"
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
            <div className="p-4 rounded-xl bg-muted flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Des questions ?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contactez-nous à{" "}
                  <a href="mailto:support@etude.tn" className="text-primary hover:underline">support@etude.tn</a>
                  {" "}en mentionnant votre email : <strong>{userEmail}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
