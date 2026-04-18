/**
 * FlashcardsTopic — flashcard viewer for a single chapter.
 *
 * URL: /revision/:subject/flashcards/:topic
 *
 * Fetches flashcards filtered by chapter name (topic). If the chapter exists in
 * the curriculum but has no flashcards yet, shows a "En préparation" state.
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Premium";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { subjectToSlug, subjectFromSlug } from "@/lib/educationConfig";
import {
  BookOpen, ChevronRight, ChevronLeft, RotateCcw,
  Layers, Construction,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function FlashcardsTopic() {
  const [, params] = useRoute("/revision/:subject/flashcards/:topic");
  const subject = params?.subject
    ? (subjectFromSlug(params.subject) ?? decodeURIComponent(params.subject))
    : "";
  const topic = params?.topic ? decodeURIComponent(params.topic) : "";
  const slug = subjectToSlug(subject);

  const { user } = useAuth();
  const gradeLevel: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const sectionKey: string | null = (user as any)?.studentProfile?.educationSection ?? null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped]           = useState(false);
  const [mode, setMode]                 = useState<"deck" | "browse">("deck");

  const { data: flashcards = [], isLoading } = useQuery<any[]>({
    queryKey: ["flashcards", subject, gradeLevel, sectionKey, topic],
    queryFn: () =>
      apiFetch(
        `/api/revision/content/flashcards?subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(gradeLevel)}${sectionKey ? `&sectionKey=${encodeURIComponent(sectionKey)}` : ""}&topic=${encodeURIComponent(topic)}`
      ),
    enabled: !!subject && !!gradeLevel && !!topic,
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

        {/* Breadcrumb */}
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href="/revision" className="hover:text-foreground transition-colors">Révision Étude+</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${slug}`} className="hover:text-foreground transition-colors">{subject}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/revision/${slug}/flashcards`} className="hover:text-foreground transition-colors">Flashcards</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{topic}</span>
          </div>
          <h1 className="text-2xl font-bold">{topic}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mémorise les définitions, formules et concepts essentiels.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* Empty — chapter exists but no flashcards yet */}
        {!isLoading && flashcards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Construction className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold">Flashcards en préparation</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Les flashcards pour <strong>{topic}</strong> arrivent bientôt !
            </p>
            <Link
              href={`/revision/${slug}/flashcards`}
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              ← Retour aux chapitres
            </Link>
          </div>
        )}

        {/* Content */}
        {!isLoading && flashcards.length > 0 && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("deck")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  mode === "deck"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                )}
              >
                Mode carte
              </button>
              <button
                onClick={() => setMode("browse")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  mode === "browse"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
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

                <div
                  className={cn(
                    "w-full max-w-lg min-h-56 rounded-3xl border-2 p-8 flex items-center justify-center text-center cursor-pointer transition-all duration-300 select-none",
                    flipped
                      ? "bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-600/20"
                      : "bg-card border-border hover:border-violet-400/50 hover:shadow-md"
                  )}
                  onClick={() => setFlipped(f => !f)}
                >
                  <div>
                    {!flipped ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Question
                        </p>
                        <p className="text-lg font-semibold">{current.front}</p>
                        <p className="text-xs text-muted-foreground mt-4">Cliquer pour voir la réponse</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
                          Réponse
                        </p>
                        <p className="text-lg font-semibold">{current.back}</p>
                      </>
                    )}
                  </div>
                </div>

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

                {/* Progress dots */}
                {flashcards.length <= 20 && (
                  <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
                    {flashcards.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => { setFlipped(false); setCurrentIndex(i); }}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === currentIndex
                            ? "bg-violet-600 scale-125"
                            : "bg-border hover:bg-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Browse mode */}
            {mode === "browse" && (
              <div className="grid sm:grid-cols-2 gap-4">
                {flashcards.map((card: any) => (
                  <Card key={card.id} className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5 text-violet-500" />
                      {card.topic && (
                        <p className="text-xs text-muted-foreground">{card.topic}</p>
                      )}
                    </div>
                    <p className="font-semibold text-sm mb-3">{card.front}</p>
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-3 border border-violet-200 dark:border-violet-800">
                      <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">{card.back}</p>
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
