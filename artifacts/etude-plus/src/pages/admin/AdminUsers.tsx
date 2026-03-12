import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { useListUsers } from "@workspace/api-client-react";

export function AdminUsers() {
  const { data } = useListUsers();
  
  const users = data?.users || [
    { id: 1, fullName: "Admin System", email: "admin@etude.tn", role: "admin", createdAt: "2023-01-01" },
    { id: 2, fullName: "Sami Trabelsi", email: "prof@etude.tn", role: "professor", createdAt: "2023-05-15" },
    { id: 3, fullName: "Amira Ben Ali", email: "student@etude.tn", role: "student", createdAt: "2023-09-01" }
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Utilisateurs" description="Gestion de tous les comptes de la plateforme." />
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Nom</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Rôle</th>
                <th className="px-6 py-4 font-semibold">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-bold">{u.fullName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 capitalize"><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
