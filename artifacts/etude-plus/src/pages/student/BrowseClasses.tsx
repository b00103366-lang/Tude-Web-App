import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input } from "@/components/ui/Premium";
import { useListClasses } from "@workspace/api-client-react";
import { Search, Filter, Star, Clock, MapPin, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { formatTND } from "@/lib/utils";

export function BrowseClasses() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListClasses({ search });
  const classes = data?.classes ?? [];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Explorer les cours"
          description="Trouvez le professeur idéal pour atteindre vos objectifs."
        />

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une matière, un niveau..."
              className="pl-12 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0 bg-card">
            <Filter className="w-5 h-5 mr-2" /> Filtres
          </Button>
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
              {search ? `Aucun résultat pour "${search}".` : "Les cours des professeurs vérifiés apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls, i) => (
              <FadeIn key={cls.id} delay={i * 0.05}>
                <Card className="flex flex-col h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                  <div className="h-40 bg-gradient-to-br from-secondary to-muted p-4 flex flex-col justify-between border-b border-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur font-bold">
                        {formatTND(cls.price)}/s.
                      </Badge>
                    </div>
                    <Badge className="w-fit">{cls.subject}</Badge>
                    <h3 className="font-serif font-bold text-xl leading-tight mt-auto text-foreground z-10">{cls.title}</h3>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {cls.professor?.fullName?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cls.professor?.fullName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          {cls.professor?.rating ?? "Nouveau"}
                          <span className="mx-1">&bull;</span>
                          <MapPin className="w-3 h-3" /> {cls.city}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                      {cls.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 gap-2">
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" /> {cls.durationHours}h
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/student/classes/${cls.id}`}>
                          <Button size="sm" variant="outline">Détails</Button>
                        </Link>
                        <Link href={`/checkout/${cls.id}`}>
                          <Button size="sm">S'inscrire</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
