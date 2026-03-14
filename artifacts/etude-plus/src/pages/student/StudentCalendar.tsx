import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useGetMyEnrollments } from "@workspace/api-client-react";
import { Link } from "wouter";

export function StudentCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const { data: enrollments = [] } = useGetMyEnrollments() as any;

  const activeClasses = (enrollments as any[])
    .filter(e => e.status === "active" || e.status === "paid")
    .map(e => e.class).filter(Boolean);

  const sessions = activeClasses
    .flatMap((cls: any) => cls.nextSession ? [{ ...cls.nextSession, className: cls.title, classId: cls.id }] : [])
    .filter((s: any) => s.status === "scheduled" || s.status === "live");

  const calDays = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const firstDayOffset = (getDay(calDays[0]) + 6) % 7; // Mon=0
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const upcomingSessions = sessions
    .filter((s: any) => new Date(s.scheduledAt) >= today)
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title="Mon Calendrier"
          description="Gérez votre emploi du temps et vos sessions live."
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
                        <Link key={s.id} href={`/classroom/${s.id}`}>
                          <div className="text-[10px] p-1 rounded bg-primary/20 text-primary border border-primary/30 truncate font-medium cursor-pointer hover:bg-primary/30 transition-colors">
                            {format(new Date(s.scheduledAt), "HH:mm")} {s.className}
                          </div>
                        </Link>
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
                  <p className="text-sm">Aucune session à venir.</p>
                  <p className="text-xs mt-1">Inscrivez-vous à un cours pour voir vos sessions ici.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((s: any) => (
                    <Link key={s.id} href={`/classroom/${s.id}`}>
                      <div className="flex gap-3 p-3 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border cursor-pointer">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-primary font-semibold uppercase">
                            {format(new Date(s.scheduledAt), "MMM", { locale: fr })}
                          </span>
                          <span className="text-lg font-bold text-primary leading-none">
                            {new Date(s.scheduledAt).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm leading-tight mb-1 truncate">{s.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{s.className}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Video className="w-3 h-3" />
                            {format(new Date(s.scheduledAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
