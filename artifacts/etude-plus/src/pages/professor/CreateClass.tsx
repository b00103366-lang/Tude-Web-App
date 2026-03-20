import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ArrowLeft, Save, AlertCircle, Clock, Wand2, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateClass } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { TUNISIA_CITIES } from "@/lib/constants";
import {
  getNiveauLabel, getSectionLabel, getSectionsForNiveau,
  getSubjectsForNiveauSection,
  isSectionLevel, isSimpleLevel,
  SIMPLE_LEVELS, SECTION_LEVELS,
} from "@/lib/educationConfig";

// ── API client for qualifications ─────────────────────────────────────────────

interface Qualification {
  id: number;
  professorId: number;
  niveauKey: string;
  sectionKey: string | null;
  subject: string;
}

function useMyQualifications() {
  return useQuery<Qualification[]>({
    queryKey: ["/api/qualifications/mine"],
    queryFn: async () => {
      const token = localStorage.getItem("etude_auth_token");
      const res = await fetch("/api/qualifications/mine", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des qualifications");
      return res.json();
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFullLevelLabel(niveauKey: string, sectionKey: string | null): string {
  if (!sectionKey) return getNiveauLabel(niveauKey);
  return `${getNiveauLabel(niveauKey)} — ${getSectionLabel(niveauKey, sectionKey)}`;
}

export function CreateClass() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createClass = useCreateClass();
  const { data: qualifications = [], isLoading: qualsLoading } = useMyQualifications();

  const professorStatus = user?.professorProfile?.status;
  const isPending = professorStatus === "pending" || !professorStatus;

  // ── Step state ───────────────────────────────────────────────────────────────
  const [niveauKey, setNiveauKey] = useState("");
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(user?.city ?? "Tunis");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState("1");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived qualification data ───────────────────────────────────────────────

  // Distinct (niveauKey, sectionKey) combos the professor is qualified for
  const qualifiedCombos = qualifications.reduce<Array<{ niveauKey: string; sectionKey: string | null }>>((acc, q) => {
    const exists = acc.some(c => c.niveauKey === q.niveauKey && c.sectionKey === q.sectionKey);
    if (!exists) acc.push({ niveauKey: q.niveauKey, sectionKey: q.sectionKey });
    return acc;
  }, []);

  // Subjects for the selected (niveau, section) combo
  const availableSubjects = niveauKey
    ? qualifications
        .filter(q => q.niveauKey === niveauKey && q.sectionKey === sectionKey)
        .map(q => q.subject)
        .sort((a, b) => a.localeCompare(b, "fr"))
    : [];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNiveauChange = (niveau: string, section: string | null) => {
    setNiveauKey(niveau);
    setSectionKey(section);
    setSubject("");
  };

  const suggestedTitle = subject && niveauKey
    ? `${subject} — ${getFullLevelLabel(niveauKey, sectionKey)}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!niveauKey) { setError("Sélectionnez un niveau."); return; }
    if (isSectionLevel(niveauKey) && !sectionKey) { setError("Sélectionnez une section."); return; }
    if (!subject) { setError("Sélectionnez une matière."); return; }
    if (!title.trim()) { setError("Le titre du cours est requis."); return; }
    if (!description.trim()) { setError("La description est requise."); return; }
    if (!price || isNaN(parseFloat(price))) { setError("Entrez un prix valide."); return; }

    try {
      await createClass.mutateAsync({
        data: {
          title: title.trim(),
          subject,
          gradeLevel: niveauKey,
          sectionKey: sectionKey ?? undefined,
          city,
          description,
          price: parseFloat(price),
          durationHours: parseFloat(durationHours),
          isRecurring,
        },
      });
      setLocation("/professor/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Erreur lors de la création du cours.";
      setError(msg.includes("not approved") ? "Votre compte est en attente de validation." : msg);
    }
  };

  // ── No qualifications state ───────────────────────────────────────────────────

  if (!qualsLoading && qualifications.length === 0 && professorStatus === "approved") {
    return (
      <DashboardLayout>
        <FadeIn>
          <Link href="/professor/classes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à mes cours
          </Link>
          <PageHeader title="Créer un nouveau cours" description="Configurez les détails de votre programme d'enseignement." />
          <Card className="p-8 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">Qualifications non configurées</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Avant de créer un cours, vous devez configurer vos qualifications d'enseignement (niveaux, sections et matières).
                  Accédez à votre profil pour les ajouter.
                </p>
                <Link href="/professor/qualifications">
                  <Button className="gap-2">
                    Configurer mes qualifications <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </FadeIn>
      </DashboardLayout>
    );
  }

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

        {isPending && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Compte en attente de validation</h4>
              <p className="text-sm text-amber-700 mt-1">
                Un administrateur doit approuver votre profil avant que vous puissiez publier des cours.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Step 1: Niveau de cours ── */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Niveau de cours</h3>

            {qualsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement de vos qualifications...</p>
            ) : qualifiedCombos.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1.5" />
                Aucune qualification configurée. Contactez un administrateur ou configurez vos qualifications.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Seuls les niveaux pour lesquels vous avez des qualifications approuvées sont affichés.
                </p>
                <div className="flex flex-wrap gap-2">
                  {qualifiedCombos.map(combo => {
                    const isSelected = niveauKey === combo.niveauKey && sectionKey === combo.sectionKey;
                    const label = getFullLevelLabel(combo.niveauKey, combo.sectionKey);
                    return (
                      <button
                        key={`${combo.niveauKey}-${combo.sectionKey ?? ""}`}
                        type="button"
                        onClick={() => handleNiveauChange(combo.niveauKey, combo.sectionKey)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* ── Step 2+3: Matière + Informations (shown once niveau is selected) ── */}
          {niveauKey && (isSectionLevel(niveauKey) ? sectionKey : true) && (
            <>
              {/* Matière */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Matière enseignée</h3>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Matières pour lesquelles vous êtes qualifié en{" "}
                    <strong>{getFullLevelLabel(niveauKey, sectionKey)}</strong>.
                  </p>
                  {availableSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Aucune matière trouvée pour ce niveau.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSubjects.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubject(s)}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            subject === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Informations du cours */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Informations du cours</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Titre du cours *</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        placeholder={suggestedTitle || "Ex : Mathématiques — Bac Sciences"}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        className="flex-1"
                      />
                      {suggestedTitle && title !== suggestedTitle && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTitle(suggestedTitle)}
                          className="shrink-0 gap-1.5"
                        >
                          <Wand2 className="w-3.5 h-3.5" /> Suggéré
                        </Button>
                      )}
                    </div>
                    {suggestedTitle && (
                      <p className="text-xs text-muted-foreground mt-1">Suggestion : <em>{suggestedTitle}</em></p>
                    )}
                  </div>

                  <div>
                    <Label>Description détaillée *</Label>
                    <textarea
                      className="mt-1.5 flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary resize-none"
                      placeholder="Décrivez le contenu du cours, les objectifs pédagogiques, ce que l'élève va apprendre..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Ville *</Label>
                    <select
                      className="mt-1.5 flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    >
                      {TUNISIA_CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Tarification */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Tarification et Format</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Prix par session (TND) *</Label>
                    <Input
                      type="number" min="1" max="30" step="0.5"
                      placeholder="20"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum <strong>30 TND</strong>. Vous recevrez{" "}
                      <strong>{price ? `${(parseFloat(price) * 0.85).toFixed(1)} TND` : "85%"}</strong> après la commission de 15%.
                      {price && parseFloat(price) > 30 && (
                        <span className="text-red-500 block font-semibold mt-1">Le prix ne peut pas dépasser 30 TND.</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label>Durée par session *</Label>
                    <select
                      className="mt-1.5 flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                      value={durationHours}
                      onChange={e => setDurationHours(e.target.value)}
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
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
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
            </>
          )}
        </form>
      </FadeIn>
    </DashboardLayout>
  );
}
