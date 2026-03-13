import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ArrowLeft, Save, AlertCircle, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateClass } from "@workspace/api-client-react";

const SUBJECTS = [
  "Mathématiques", "Physique", "Chimie", "Biologie", "Informatique",
  "Français", "Arabe", "Anglais", "Histoire-Géographie", "Philosophie",
  "Sciences de la Vie et de la Terre", "Économie", "Comptabilité",
];

const GRADE_LEVELS = [
  "Primaire 1ère-2ème", "Primaire 3ème-4ème", "Primaire 5ème-6ème",
  "Collège 7ème", "Collège 8ème", "Collège 9ème",
  "Lycée 1ère année", "Lycée 2ème année", "3ème année secondaire",
  "Baccalauréat",
];

const CITIES = [
  "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana",
  "Gafsa", "Monastir", "Ben Arous", "Kasserine", "Médenine", "Nabeul",
];

export function CreateClass() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createClass = useCreateClass();

  const professorStatus = user?.professorProfile?.status;
  const isPending = professorStatus === "pending" || !professorStatus;

  const [form, setForm] = useState({
    title: "",
    subject: SUBJECTS[0],
    gradeLevel: GRADE_LEVELS[GRADE_LEVELS.length - 1],
    city: CITIES[0],
    description: "",
    price: "",
    durationHours: "1",
    isRecurring: false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createClass.mutateAsync({
        data: {
          title: form.title,
          subject: form.subject,
          gradeLevel: form.gradeLevel,
          city: form.city,
          description: form.description,
          price: parseFloat(form.price),
          durationHours: parseFloat(form.durationHours),
          isRecurring: form.isRecurring,
        },
      });
      setLocation("/professor/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Erreur lors de la création du cours.";
      if (msg.includes("not approved") || msg.includes("Professor not approved")) {
        setError("Votre compte professeur est en attente de validation par un administrateur. Vous pourrez créer des cours dès que votre compte sera approuvé.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/professor/classes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à mes cours
        </Link>

        <PageHeader
          title="Créer un nouveau cours"
          description="Configurez les détails de votre programme d'enseignement."
        />

        {/* Pending professor warning */}
        {isPending && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Votre compte est en attente de validation</h4>
              <p className="text-sm text-amber-700 mt-1">
                Un administrateur doit approuver votre profil professeur avant que vous puissiez publier des cours. Vous pouvez préparer votre cours maintenant — il sera enregistré dès que vous serez approuvé(e).
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
          {/* API error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Informations Générales</h3>
            <div className="space-y-6">
              <div>
                <Label>Titre du cours *</Label>
                <Input
                  placeholder="ex: Physique quantique pour le bac"
                  value={form.title}
                  onChange={set("title")}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label>Matière *</Label>
                  <select
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                    value={form.subject}
                    onChange={set("subject")}
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Niveau scolaire *</Label>
                  <select
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                    value={form.gradeLevel}
                    onChange={set("gradeLevel")}
                  >
                    {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Ville *</Label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                  value={form.city}
                  onChange={set("city")}
                >
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label>Description détaillée *</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
                  placeholder="Décrivez le contenu du cours, les objectifs pédagogiques, ce que les élèves apprendront..."
                  value={form.description}
                  onChange={set("description")}
                  required
                />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Tarification et Format</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label>Prix par session (TND) *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="45"
                  value={form.price}
                  onChange={set("price")}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Vous recevrez <strong>{form.price ? `${(parseFloat(form.price) * 0.85).toFixed(1)} TND` : "85%"}</strong> après la commission de 15% de la plateforme.
                </p>
              </div>

              <div>
                <Label>Durée par session (heures) *</Label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                  value={form.durationHours}
                  onChange={set("durationHours")}
                >
                  {["0.5", "1", "1.5", "2", "2.5", "3"].map(h => (
                    <option key={h} value={h}>{parseFloat(h) === 0.5 ? "30 min" : `${h}h`}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Type d'abonnement</Label>
                <div className="flex items-center gap-3 mt-2 p-4 border-2 border-border rounded-xl">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={form.isRecurring}
                    onChange={set("isRecurring")}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="isRecurring" className="text-sm cursor-pointer">
                    <span className="font-semibold">Cours récurrent (mensuel)</span>
                    <span className="text-muted-foreground ml-2">— Les élèves sont facturés chaque mois</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/professor/classes">
              <Button variant="outline" type="button">Annuler</Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={createClass.isPending}
            >
              <Save className="w-5 h-5 mr-2" />
              {createClass.isPending ? "Publication en cours..." : "Publier le cours"}
            </Button>
          </div>
        </form>
      </FadeIn>
    </DashboardLayout>
  );
}
