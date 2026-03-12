import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Bell, Info, CheckCircle, AlertTriangle, Calendar as CalIcon } from "lucide-react";
import { useState } from "react";

export function StudentNotifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: "reminder", title: "Session Live demain", message: "La session Mathématiques 101 commence demain à 14h00.", date: "Il y a 2h", read: false },
    { id: 2, type: "success", title: "Note publiée", message: "Dr. Sami a publié la note pour 'Test des prérequis'.", date: "Hier", read: false },
    { id: 3, type: "info", title: "Nouveau support", message: "Un nouveau document PDF a été ajouté à votre cours de Physique.", date: "Il y a 3 jours", read: true },
    { id: 4, type: "warning", title: "Devoir en retard", message: "Vous n'avez pas rendu le devoir de SVT.", date: "La semaine dernière", read: true }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'reminder': return <CalIcon className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case 'reminder': return 'bg-blue-100';
      case 'success': return 'bg-green-100';
      case 'warning': return 'bg-orange-100';
      default: return 'bg-primary/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Notifications" 
          description="Restez informé des nouveautés et de vos rappels."
          action={
            unreadCount > 0 && (
              <Button variant="outline" onClick={markAllRead}>Tout marquer comme lu</Button>
            )
          }
        />

        <Card className="overflow-hidden border border-border">
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className={`p-5 sm:p-6 flex gap-4 transition-colors ${!n.read ? 'bg-primary/5 hover:bg-primary/10' : 'bg-card hover:bg-muted/50'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBg(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-base ${!n.read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                      {n.title}
                    </h4>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-4">{n.date}</span>
                  </div>
                  <p className={`text-sm ${!n.read ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </DashboardLayout>
  );
}
