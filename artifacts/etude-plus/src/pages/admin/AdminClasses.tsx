import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input } from "@/components/ui/Premium";
import { Search, BookOpen, Users, DollarSign, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { getToken } from "@workspace/api-client-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatTND } from "@/lib/utils";

async function adminFetch(path: string, method = "GET", body?: unknown) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

function useAdminClasses(search: string) {
  return useQuery({
    queryKey: ["/api/admin/classes", search],
    queryFn: () => adminFetch(`/api/admin/classes${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
}

function useClassAction(action: "archive" | "unarchive" | "delete") {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (classId: number) =>
      action === "delete"
        ? adminFetch(`/api/admin/classes/${classId}`, "DELETE")
        : adminFetch(`/api/admin/classes/${classId}/${action}`, "POST"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      const labels: Record<string, string> = {
        archive: "Cours archivé",
        unarchive: "Cours restauré",
        delete: "Cours supprimé",
      };
      toast({ title: labels[action] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function AdminClasses() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminClasses(search) as any;
  const classes: any[] = data?.classes ?? [];

  const archiveMutation = useClassAction("archive");
  const unarchiveMutation = useClassAction("unarchive");
  const deleteMutation = useClassAction("delete");

  const published = classes.filter((c: any) => !c.isArchived);
  const totalEnrolled = classes.reduce((s: number, c: any) => s + (c.enrolledCount ?? 0), 0);
  const totalVolume = classes.reduce((s: number, c: any) => s + (c.price * (c.enrolledCount ?? 0)), 0);

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Cours" description="Gestion de tous les cours de la plateforme." />

        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Cours actifs", value: published.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
            { label: "Inscriptions totales", value: totalEnrolled, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Volume inscriptions", value: formatTND(totalVolume), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
          ].map((s, i) => (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input className="pl-10" placeholder="Rechercher un cours..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Cours</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Professeur</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Matière</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Élèves</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Prix/s.</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Statut</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls: any) => (
                    <tr
                      key={cls.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${cls.isArchived ? "opacity-50" : ""}`}
                    >
                      <td className="p-4">
                        <p className="font-semibold">{cls.title}</p>
                        <p className="text-xs text-muted-foreground">{cls.gradeLevel}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{cls.professor?.fullName ?? "—"}</td>
                      <td className="p-4"><Badge variant="secondary">{cls.subject}</Badge></td>
                      <td className="p-4 text-center font-medium">{cls.enrolledCount ?? 0}</td>
                      <td className="p-4 text-right font-bold">{formatTND(cls.price)}</td>
                      <td className="p-4 text-center">
                        {cls.isArchived ? (
                          <Badge variant="destructive">Archivé</Badge>
                        ) : cls.isPublished ? (
                          <Badge variant="success">Publié</Badge>
                        ) : (
                          <Badge variant="secondary">Brouillon</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cls.isArchived ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              disabled={unarchiveMutation.isPending}
                              onClick={() => unarchiveMutation.mutate(cls.id)}
                            >
                              <ArchiveRestore className="w-4 h-4 mr-1" /> Restaurer
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              disabled={archiveMutation.isPending}
                              onClick={() => archiveMutation.mutate(cls.id)}
                            >
                              <Archive className="w-4 h-4 mr-1" /> Archiver
                            </Button>
                          )}
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm(`Supprimer définitivement "${cls.title}" ? Cette action est irréversible.`)) {
                                  deleteMutation.mutate(cls.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {classes.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  <p>{search ? `Aucun résultat pour "${search}".` : "Aucun cours."}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
