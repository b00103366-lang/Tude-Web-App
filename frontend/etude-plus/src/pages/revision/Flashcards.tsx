import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";
import { BookOpen, ChevronRight, RotateCcw, ChevronLeft, ChevronDown, Layers, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function Flashcards() {
  const [, params] = useRoute("/revision/:subject/flashcards");
  const subject = params?.subject ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject)) : "";
  const { user } = useAuth();

  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const sectionKey: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"browse" | "deck">("browse");

  const { data: flashcards = [], isLoading } = useQuery<any[]>({
    queryKey: ["flashcards", subject, gradeLevel, sectionKey],
    queryFn: () => apiFetch(
      `/api/revision/content/flashcards?subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(gradeLevel)}${sectionKey ? `&sectionKey=${encodeURIComponent(sectionKey)}` : ""}`
    ),
    enabled: !!subject && !!gradeLevel,
  });

  const current = flashcards[currentIndex];

  function next() {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, flashcards.length - 1)), 150);
  }

  function prev() {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 150);
  }

  function restart() {
    setFlipped(false);
    setCurrentIndex(0);
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">Révision Étude+</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${subjectToSlug(subject)}`} className="hover:text-foreground transition-colors">{subject}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Flashcards</span>
          </div>
          <h1 className="text-2xl font-bold">Flashcards — {subject}</h1>
          <p className="text-muted-foreground mt-1">Mémorise les définitions, formules et concepts essentiels.</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && flashcards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Construction className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold">En cours de préparation</h2>
            <p className="text-muted-foreground max-w-sm">
              Les flashcards pour <strong>{subject}</strong> avec répétition espacée arrivent bientôt !
            </p>
          </div>
        )}

        {!isLoading && flashcards.length > 0 && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("deck")}
                className={cn("px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  mode === "deck" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                )}
              >
                Mode carte
              </button>
              <button
                onClick={() => setMode("browse")}
                className={cn("px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  mode === "browse" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                )}
              >
                Toutes les cartes
              </button>
            </div>

            {/* Deck mode */}
            {mode === "deck" && current && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {flashcards.length}
                </p>

                {/* Flip card */}
                <div
                  className={cn(
                    "w-full max-w-lg min-h-56 rounded-3xl border-2 p-8 flex items-center justify-center text-center cursor-pointer transition-all duration-300 select-none",
                    flipped
                      ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                      : "bg-card border-border hover:border-primary/40 hover:shadow-md"
                  )}
                  onClick={() => setFlipped(f => !f)}
                >
                  <div>
                    {!flipped ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Question</p>
                        <p className="text-lg font-semibold">{current.front}</p>
                        <p className="text-xs text-muted-foreground mt-4">Cliquer pour voir la réponse</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mb-3">Réponse</p>
                        <p className="text-lg font-semibold">{current.back}</p>
                      </>
                    )}
                  </div>
                </div>

                {current.topic && (
                  <p className="text-xs text-muted-foreground">Chapitre : {current.topic}</p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={prev}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={restart}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" /> Recommencer
                  </button>
                  <button
                    onClick={next}
                    disabled={currentIndex === flashcards.length - 1}
                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Browse mode */}
            {mode === "browse" && (
              <div className="grid sm:grid-cols-2 gap-4">
                {flashcards.map((card: any, i: number) => (
                  <Card key={card.id} className="p-5">
                    {card.topic && (
                      <p className="text-xs text-muted-foreground mb-2">{card.topic}</p>
                    )}
                    <p className="font-semibold text-sm mb-3">{card.front}</p>
                    <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-3 border border-primary/20">
                      <p className="text-sm text-primary font-medium">{card.back}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
