import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Input, Label } from "@/components/ui/Premium";
import { ProfileCard } from "@/components/shared/ProfileCard";
import { LevelPicker } from "@/components/shared/LevelPicker";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@workspace/api-client-react";
import { KeyRound, Loader2, GraduationCap, Save } from "lucide-react";
import { getLevelLabel } from "@/lib/educationConfig";

function ChangePasswordCard() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" }); return; }
    if (next.length < 8) { toast({ title: "Erreur", description: "Minimum 8 caractères.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast({ title: "Mot de passe mis à jour" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-bold text-lg">Changer le mot de passe</h3>
      </div>
      <form onSubmit={handle} className="space-y-4 max-w-sm">
        <div><Label>Mot de passe actuel</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" /></div>
        <div><Label>Nouveau mot de passe</Label><Input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Minimum 8 caractères" /></div>
        <div><Label>Confirmer</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter le mot de passe" /></div>
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour…</> : "Changer le mot de passe"}
        </Button>
      </form>
    </Card>
  );
}

function EducationLevelCard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const currentLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const currentSection: string | null = (user as any)?.studentProfile?.educationSection ?? null;
  const [niveauKey, setNiveauKey] = useState(currentLevel);
  const [sectionKey, setSectionKey] = useState<string | null>(currentSection);
  const [saving, setSaving] = useState(false);

  const changed = niveauKey !== currentLevel || sectionKey !== currentSection;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niveauKey) { toast({ title: "Erreur", description: "Sélectionnez un niveau.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/users/${(user as any).id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ gradeLevel: niveauKey, educationSection: sectionKey }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as any).error ?? "Erreur"); }
      await refreshUser();
      toast({ title: "Niveau mis à jour", description: `Vous êtes maintenant en ${getLevelLabel(niveauKey)}.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Niveau scolaire</h3>
          {currentLevel && (
            <p className="text-xs text-muted-foreground mt-0.5">Actuel : <strong>{getLevelLabel(currentLevel)}</strong></p>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Votre niveau détermine quels cours vous sont affichés. Modifiez-le si vous avez fait une erreur ou si vous avez changé d'année.
      </p>
      <form onSubmit={handle} className="space-y-4">
        <LevelPicker niveauValue={niveauKey} sectionValue={sectionKey} onChange={(n, s) => { setNiveauKey(n); setSectionKey(s); }} />
        <Button type="submit" disabled={saving || !changed || !niveauKey}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour…</> : <><Save className="w-4 h-4 mr-2" />Enregistrer le niveau</>}
        </Button>
      </form>
    </Card>
  );
}

export function StudentSettings() {
  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Mon profil" description="Gérez vos informations personnelles et votre niveau scolaire." />
        <div className="max-w-3xl space-y-6">
          <ProfileCard />
          <EducationLevelCard />
          <ChangePasswordCard />
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
