import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge } from "@/components/ui/Premium";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function AdminProfessors() {
  const profs = [
    { id: 1, name: "Dr. Sami Trabelsi", status: "approved", subjects: "Mathématiques" },
    { id: 2, name: "Mme. Rym Jlassi", status: "pending", subjects: "Physique" },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader title="Professeurs & KYC" description="Validez les candidatures des professeurs." />
        <div className="grid gap-6">
          {profs.map(p => (
            <Card key={p.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {p.status === 'approved' ? <ShieldCheck className="w-6 h-6"/> : <ShieldAlert className="w-6 h-6"/>}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-muted-foreground">{p.subjects}</p>
                </div>
              </div>
              <div>
                {p.status === 'approved' ? (
                  <Badge variant="success">Vérifié</Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="text-destructive">Refuser</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">Approuver KYC</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
