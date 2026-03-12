import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button, Badge, Input, Label } from "@/components/ui/Premium";
import { Video, FileText, Plus, Users, Settings, Clock, Calendar } from "lucide-react";

export function ProfessorClassManagement() {
  const [, params] = useRoute("/professor/classes/:id");
  const [activeTab, setActiveTab] = useState("live");

  const tabs = [
    { id: "live", label: "Sessions Live" },
    { id: "materials", label: "Supports de cours" },
    { id: "students", label: "Élèves (120)" },
    { id: "settings", label: "Paramètres" },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <Link href="/professor/classes" className="text-sm font-medium text-muted-foreground hover:text-primary mb-6 inline-block transition-colors">
          &larr; Retour aux cours
        </Link>
        
        <PageHeader 
          title="Mathématiques 101: Analyse et Algèbre" 
          description="Gestion du cours et contenus"
          action={<Badge variant="success" className="text-sm px-4 py-1">Publié</Badge>}
        />

        <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "live" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Sessions programmées</h3>
              <Button><Plus className="w-4 h-4 mr-2" /> Programmer une session</Button>
            </div>
            
            <Card className="p-6 border-primary/30 shadow-md shadow-primary/5 bg-gradient-to-r from-card to-secondary/30 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <Badge className="bg-red-500/10 text-red-600 border-red-200 mb-3">
                    <Video className="w-3 h-3 mr-1 inline" /> DEMAIN
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Chapitre 3: Les suites réelles</h4>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> 24 Octobre</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> 14:00 (2h)</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4"/> 115 inscrits attendus</span>
                  </div>
                </div>
                <Link href={`/classroom/1`}>
                  <Button size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20 bg-red-600 hover:bg-red-700 text-white">
                    Lancer la salle
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 opacity-60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <Badge variant="secondary" className="mb-3">Terminée</Badge>
                  <h4 className="text-lg font-bold mb-2">Chapitre 2: Nombres complexes</h4>
                  <div className="text-sm font-medium text-muted-foreground">17 Octobre • 118 participants</div>
                </div>
                <Button variant="outline">Voir l'enregistrement</Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === "materials" && (
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Ressources</h3>
              <Button><Plus className="w-4 h-4 mr-2" /> Ajouter un document</Button>
            </div>
            <Card className="divide-y divide-border">
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                  <span className="font-semibold">Support PDF - Chapitre 1</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive">Supprimer</Button>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                  <span className="font-semibold">Série d'exercices corrigés</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive">Supprimer</Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === "students" && (
          <FadeIn>
            <Card className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nom de l'élève</th>
                    <th className="px-6 py-4 font-semibold">Date d'inscription</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Amira Ben Ali</td>
                    <td className="px-6 py-4 text-muted-foreground">01 Sept 2023</td>
                    <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm">Contacter</Button></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Youssef Trabelsi</td>
                    <td className="px-6 py-4 text-muted-foreground">05 Sept 2023</td>
                    <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm">Contacter</Button></td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </FadeIn>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
