import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatTND } from "@/lib/utils";

export function ProfessorCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["professor-my-sessions"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch("/api/classes/my-sessions", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const calDays = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const firstDayOffset = (getDay(calDays[0]) + 6) % 7; // Mon=0
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const upcomingSessions = sessions
    .filter((s: any) => new Date(s.scheduledAt) >= today && (s.status === "scheduled" || s.status === "live"))
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 8);

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mon Calendrier"
          description="Visualisez toutes vos sessions programmées."
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg capitalize">{format(viewDate, "MMMM yyyy", { locale: fr })}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setViewDate(today)}>Aujourd'hui</Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => (
                <div key={day} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-card/50 min-h-[80px] p-2 opacity-30" />
              ))}
              {calDays.map(day => {
                const isToday = isSameDay(day, today);
                const inMonth = isSameMonth(day, viewDate);
                const daySessions = sessions.filter((s: any) => isSameDay(new Date(s.scheduledAt), day));
                return (
                  <div key={day.toISOString()} className={`bg-card min-h-[80px] p-2 ${isToday ? "bg-primary/5" : ""} ${!inMonth ? "opacity-40" : ""}`}>
                    <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {daySessions.map((s: any) => (
                        <div key={s.id} className={`text-[10px] p-1 rounded truncate font-medium ${
                          s.status === "live" ? "bg-green-500/20 text-green-700 border border-green-500/30" :
                          s.status === "ended" ? "bg-muted text-muted-foreground border border-border" :
                          "bg-primary/20 text-primary border border-primary/30"
                        }`}>
                          {format(new Date(s.scheduledAt), "HH:mm")} {s.className}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Prochaines sessions
              </h3>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  <p className="text-sm">Aucune session programmée.</p>
                  <p className="text-xs mt-1">Créez une session depuis un de vos cours.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((s: any) => (
                    <div key={s.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary font-semibold uppercase">
                          {format(new Date(s.scheduledAt), "MMM", { locale: fr })}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none">
                          {new Date(s.scheduledAt).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm leading-tight mb-1 truncate">{s.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{s.className}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            {format(new Date(s.scheduledAt), "HH:mm")}
                          </p>
                          {s.price > 0 && (
                            <span className="text-xs font-bold text-primary">{formatTND(s.price)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold mb-3">Raccourcis</p>
              <Link href="/professor/classes">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Nouvelle session
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
