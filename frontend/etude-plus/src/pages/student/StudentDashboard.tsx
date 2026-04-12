import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, FadeIn } from "@/components/ui/Premium";
import {
  Sparkles, TrendingUp, BookOpen, Target,
  ChevronRight, ArrowRight, AlertCircle, Trophy,
  BarChart3, Flame,
} from "lucide-react";
import { Link } from "wouter";
import { AnnouncementsWidget } from "@/components/shared/AnnouncementsWidget";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { subjectToSlug } from "@/lib/educationConfig";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function fetchOverview() {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/progress/overview`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch progress overview");
  return res.json();
}

function GradeBar({ grade, max = 20 }: { grade: number; max?: number }) {
  const pct = Math.min((grade / max) * 100, 100);
  const color = grade >= 15 ? "bg-green-500" : grade >= 10 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function gradeColor(g: number) {
  if (g >= 15) return "text-green-600 dark:text-green-400";
  if (g >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function typeLabel(type: string) {
  if (type === "past_paper") return "Annale";
  return "Entraînement";
}

export function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Élève";
  const gradeLevel = (user as any)?.studentProfile?.gradeLevel;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["progress-overview"],
    queryFn: fetchOverview,
    staleTime: 60_000,
  });

  const hasStats = !isLoading && overview?.totalAttempts > 0;
  const noData = !isLoading && !overview?.totalAttempts;

  return (
    <DashboardLayout>
      <FadeIn>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici l'état de ta préparation aux examens.
          </p>
        </div>

        <AnnouncementsWidget />

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
          {/* Overall average */}
          <Card className="p-5 col-span-2 lg:col-span-1 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl shadow-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-primary-foreground/80">Moyenne générale</p>
            </div>
            {isLoading ? (
              <div className="h-10 w-20 bg-white/20 rounded-xl animate-pulse" />
            ) : overview?.overallAverage !== null && overview?.overallAverage !== undefined ? (
              <p className="text-4xl font-bold">
                {overview.overallAverage.toFixed(1)}
                <span className="text-xl font-normal opacity-60">/20</span>
              </p>
            ) : (
              <p className="text-2xl font-semibold opacity-60">—</p>
            )}
          </Card>

          {/* Sessions done */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Séances</p>
            </div>
            {isLoading ? (
              <div className="h-9 w-16 bg-muted rounded-xl animate-pulse" />
            ) : (
              <p className="text-3xl font-bold">{overview?.totalAttempts ?? 0}</p>
            )}
          </Card>

          {/* Subjects with data */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Matières actives</p>
            </div>
            {isLoading ? (
              <div className="h-9 w-16 bg-muted rounded-xl animate-pulse" />
            ) : (
              <p className="text-3xl font-bold">{overview?.subjectAverages?.length ?? 0}</p>
            )}
          </Card>

          {/* Best subject */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Meilleure matière</p>
            </div>
            {isLoading ? (
              <div className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
            ) : overview?.subjectAverages?.length > 0 ? (
              <div>
                <p className="text-sm font-bold truncate">{overview.subjectAverages[0].subject}</p>
                <p className={`text-xl font-bold ${gradeColor(overview.subjectAverages[0].average)}`}>
                  {overview.subjectAverages[0].average.toFixed(1)}/20
                </p>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-muted-foreground">—</p>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Dernières séances ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Dernières séances</h2>
              <Link href="/student/progress" className="text-sm text-primary flex items-center gap-1 hover:underline">
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
              </div>
            ) : noData ? (
              <Card className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Aucune séance pour l'instant
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Lance ta première séance de révision pour voir tes résultats ici.
                </p>
                <Link href="/revision">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Sparkles className="w-4 h-4" /> Commencer à réviser
                  </button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {overview.recentAttempts.slice(0, 6).map((attempt: any) => (
                  <Card key={attempt.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{attempt.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel(attempt.type)}
                        {attempt.topic ? ` · ${attempt.topic}` : ""}
                        {attempt.annaleYear ? ` · ${attempt.annaleYear}` : ""}
                      </p>
                    </div>
                    {attempt.gradeOutOf20 !== null && attempt.gradeOutOf20 !== undefined ? (
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${gradeColor(attempt.gradeOutOf20)}`}>
                          {attempt.gradeOutOf20.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/20</span>
                        </p>
                        <GradeBar grade={attempt.gradeOutOf20} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">—</span>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Subject averages */}
            <h2 className="text-lg font-bold">Par matière</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-2xl animate-pulse" />)}
              </div>
            ) : !hasStats ? (
              <Card className="p-5 text-center">
                <p className="text-sm text-muted-foreground">Les moyennes par matière apparaîtront ici après tes premières séances.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {overview.subjectAverages.slice(0, 6).map((sa: any) => (
                  <Link key={sa.subject} href={`/revision/${subjectToSlug(sa.subject)}`}>
                    <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold truncate flex-1">{sa.subject}</p>
                        <p className={`text-sm font-bold ml-2 shrink-0 ${gradeColor(sa.average)}`}>
                          {sa.average.toFixed(1)}/20
                        </p>
                      </div>
                      <GradeBar grade={sa.average} />
                      <p className="text-xs text-muted-foreground mt-1">{sa.attempts} séance{sa.attempts > 1 ? "s" : ""}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA links */}
            <div className="space-y-2 pt-2">
              <Link href="/revision">
                <Card className="p-4 flex items-center gap-3 cursor-pointer hover:border-yellow-400/50 transition-colors bg-yellow-50/50 dark:bg-yellow-900/10">
                  <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Révision Étude+</p>
                    <p className="text-xs text-muted-foreground">Questions, annales, flashcards</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              </Link>
              <Link href="/student/progress">
                <Card className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                  <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Ma progression</p>
                    <p className="text-xs text-muted-foreground">Historique et analyse</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              </Link>
            </div>

            {/* Grade level reminder */}
            {!gradeLevel && (
              <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Niveau non défini</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      <Link href="/student/settings" className="underline">Configure ton niveau</Link> pour accéder au contenu adapté.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
