import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input } from "@/components/ui/Premium";
import { useListClasses } from "@workspace/api-client-react";
import { Search, Star, Clock, MapPin, BookOpen, ChevronDown, X, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { formatTND } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { TUNISIA_CITIES } from "@/lib/constants";
import { getLevelLabel, getClassLevelLabel, getSubjectsForLevel } from "@/lib/educationConfig";

type SortOption = "recent" | "rating_prof" | "rating_course" | "price_asc" | "price_desc";

export function BrowseClasses() {
  const { user } = useAuth();
  const studentGrade: string = (user as any)?.studentProfile?.gradeLevel ?? "";
  const levelSubjects = studentGrade ? getSubjectsForLevel(studentGrade) : [];

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useListClasses({
    search: search || undefined,
    subject: subject || undefined,
    city: city || undefined,
    gradeLevel: studentGrade || undefined,
  } as any);

  const rawClasses: any[] = data?.classes ?? [];

  // Client-side sort
  const classes = [...rawClasses].sort((a, b) => {
    if (sortBy === "rating_prof") return (b.professor?.rating ?? 0) - (a.professor?.rating ?? 0);
    if (sortBy === "rating_course") return (b.courseRating ?? 0) - (a.courseRating ?? 0);
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  const hasFilters = subject || city || sortBy !== "recent";
  const clearFilters = () => { setSubject(""); setCity(""); setSortBy("recent"); };

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Explorer les cours"
          description={studentGrade ? `Cours pour : ${getLevelLabel(studentGrade)}` : "Configurez votre niveau pour accéder aux cours."}
        />

        {/* No level set — prompt */}
        {!studentGrade && (
          <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Complète ton profil pour voir les cours adaptés</h4>
              <p className="text-sm text-amber-700 mb-3">
                Tu n'as pas encore sélectionné ton niveau scolaire. Indique ton niveau pour accéder uniquement aux cours qui te correspondent.
              </p>
              <a href="/student/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 underline">
                Configurer mon niveau →
              </a>
            </div>
          </div>
        )}

        {studentGrade && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl w-fit">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Niveau : <strong>{getLevelLabel(studentGrade)}</strong>
            </span>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une matière, un niveau, un mot-clé..."
                className="pl-12 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className={`shrink-0 bg-card ${hasFilters ? "border-primary text-primary" : ""}`}
              onClick={() => setShowFilters(f => !f)}
            >
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              Filtres {hasFilters && `(${[subject, city, sortBy !== "recent" ? sortBy : ""].filter(Boolean).length})`}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> Effacer
              </Button>
            )}
          </div>

          {showFilters && (
            <Card className="p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Matière</label>
                  <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" value={subject} onChange={e => setSubject(e.target.value)}>
                    <option value="">Toutes les matières</option>
                    {levelSubjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Ville</label>
                  <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" value={city} onChange={e => setCity(e.target.value)}>
                    <option value="">Toutes les villes</option>
                    {TUNISIA_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Trier par</label>
                  <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
                    <option value="recent">Les plus récents</option>
                    <option value="rating_prof">Meilleur professeur ★</option>
                    <option value="rating_course">Meilleur cours ★</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun cours disponible</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {search || hasFilters ? "Aucun résultat pour ces critères." : "Les cours des professeurs vérifiés apparaîtront ici."}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Effacer les filtres</Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{classes.length} cours trouvé{classes.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls: any, i: number) => {
                const profRating = cls.professor?.rating ? Number(cls.professor.rating) : null;
                const courseRating = cls.courseRating ? Number(cls.courseRating) : null;
                return (
                  <FadeIn key={cls.id} delay={i * 0.05}>
                    <Card className="flex flex-col h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                      {/* Header */}
                      <div className="h-40 bg-gradient-to-br from-secondary to-muted p-4 flex flex-col justify-between border-b border-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur font-bold text-primary">
                            {formatTND(cls.price)}
                          </Badge>
                        </div>
                        <Badge className="w-fit">{cls.subject}</Badge>
                        <div>
                          <h3 className="font-serif font-bold text-lg leading-tight text-foreground z-10">{cls.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{getClassLevelLabel(cls.gradeLevel, cls.sectionKey)}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Professor info */}
                        <div className="flex items-center gap-3 mb-3 p-3 bg-secondary/50 rounded-xl">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {cls.professor?.profilePhoto
                              ? <img src={`/api/storage${cls.professor.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                              : cls.professor?.fullName?.charAt(0) ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{cls.professor?.fullName ?? "Professeur"}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              {profRating !== null ? (
                                <>
                                  {[1,2,3,4,5].map(n => (
                                    <Star key={n} className={`w-3 h-3 ${n <= Math.round(profRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                                  ))}
                                  <span className="ml-0.5 font-medium">{profRating.toFixed(1)}</span>
                                </>
                              ) : <span>Nouveau</span>}
                              <span className="mx-1">&bull;</span>
                              <MapPin className="w-3 h-3" /> {cls.city}
                            </div>
                          </div>
                        </div>

                        {/* Course rating row */}
                        {courseRating !== null && (
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="text-xs text-muted-foreground">Cours :</span>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`w-3 h-3 ${n <= Math.round(courseRating) ? "fill-primary text-primary" : "text-gray-300"}`} />
                            ))}
                            <span className="text-xs font-medium">{courseRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({cls.totalCourseReviews})</span>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1">
                          {cls.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {cls.durationHours}h
                            </span>
                            {cls.nextSession && (
                              <span className="text-xs text-green-600 font-semibold">• Session prévue</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/student/browse/${cls.id}`}>
                              <Button size="sm" variant="outline">Aperçu</Button>
                            </Link>
                            <Link href={`/checkout/${cls.id}`}>
                              <Button size="sm">S'inscrire</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </FadeIn>
                );
              })}
            </div>
          </>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
