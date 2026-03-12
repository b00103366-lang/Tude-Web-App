import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { Users } from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";

const roleVariant: Record<string, "default" | "secondary" | "success"> = {
  admin: "default",
  professor: "success",
  student: "secondary",
};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  professor: "Professeur",
  student: "Élève",
};

export function AdminUsers() {
  const { data, isLoading } = useListUsers() as any;
  const users = data?.users ?? [];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Utilisateurs"
          description="Gestion de tous les comptes de la plateforme."
          action={
            <div className="px-4 py-2 bg-muted rounded-xl text-sm font-semibold">
              {users.length} compte{users.length !== 1 ? "s" : ""}
            </div>
          }
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun utilisateur inscrit pour l'instant.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nom</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Ville</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {u.fullName?.charAt(0) ?? "?"}
                        </div>
                        <span className="font-semibold">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={roleVariant[u.role] ?? "secondary"}>
                        {roleLabel[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.city ?? "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
