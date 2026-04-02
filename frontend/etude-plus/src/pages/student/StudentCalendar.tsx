import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Button } from "@/components/ui/Premium";
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL;

export function StudentCalendar() {
  const { t } = useTranslation();
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["student-enrolled-sessions"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/classes/enrolled-sessions`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const upcomingSessions = sessions
    .filter((s: any) => new Date(s.scheduledAt) >= today && (s.status === "scheduled" || s.status === "live"))
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const calDays = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const firstDayOffset = (getDay(calDays[0]) + 6) % 7; // Mon=0
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title={t("student.calendar.title")}
          description={t("student.calendar.description")}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg capitalize">{format(viewDate, "MMMM yyyy", { locale: fr })}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setViewDate(today)}>{t("student.calendar.today")}</Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {[
                t("student.calendar.mon"),
                t("student.calendar.tue"),
                t("student.calendar.wed"),
                t("student.calendar.thu"),
                t("student.calendar.fri"),
                t("student.calendar.sat"),
                t("student.calendar.sun"),
              ].map(day => (
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
                          <div className={`text-[10px] p-1 rounded truncate font-medium cursor-pointer transition-colors ${
                            s.status === "live"
                              ? "bg-green-500/20 text-green-700 border border-green-500/30 hover:bg-green-500/30"
                              : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                          }`}>
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
                <Clock className="w-5 h-5 text-primary" /> {t("student.calendar.upcomingSessions")}
              </h3>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  <p className="text-sm">{t("student.calendar.noSessions")}</p>
                  <p className="text-xs mt-1">{t("student.calendar.enrollToSee")}</p>
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
                            {s.status === "live" && <span className="ml-1 text-green-600 font-bold">• {t("student.calendar.live")}</span>}
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
