import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { Calendar as CalendarIcon, Clock, BookOpen } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";

export function StudentCalendar() {
  const today = new Date();
  
  // Mock events
  const events = [
    { id: 1, title: "Mathématiques 101", type: "live", date: addDays(today, 1), time: "14:00", duration: "2h" },
    { id: 2, title: "Physique: Devoir à rendre", type: "assignment", date: addDays(today, 2), time: "23:59" },
    { id: 3, title: "Quiz Chimie", type: "quiz", date: addDays(today, 3), time: "18:00" },
    { id: 4, title: "SVT Live Session", type: "live", date: addDays(today, 4), time: "10:00", duration: "1.5h" },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader 
          title="Mon Calendrier" 
          description="Gérez votre emploi du temps et vos échéances."
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg capitalize">{format(today, "MMMM yyyy", { locale: fr })}</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Sessions Live</Badge>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Devoirs/Quiz</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
              
              {/* Mock Calendar Grid */}
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = i - 2; // Offset for demo
                const isCurrentMonth = dayNum > 0 && dayNum <= 31;
                const currentDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
                const isToday = dayNum === today.getDate();
                
                const dayEvents = isCurrentMonth ? events.filter(e => e.date.getDate() === dayNum) : [];
                
                return (
                  <div key={i} className={`bg-card min-h-[100px] p-2 ${!isCurrentMonth ? 'opacity-50 bg-secondary' : ''} ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                      {isCurrentMonth ? dayNum : ''}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(e => (
                        <div key={e.id} className={`text-[10px] p-1.5 rounded-md leading-tight truncate font-medium ${e.type === 'live' ? 'bg-primary/20 text-primary-foreground border border-primary/30' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                          {e.time} - {e.title}
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
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> À venir bientôt
              </h3>
              <div className="space-y-4">
                {events.slice(0, 3).map(e => (
                  <div key={e.id} className="flex gap-4 p-3 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">{format(e.date, "MMM", { locale: fr })}</span>
                      <span className="text-lg font-bold leading-none text-foreground">{e.date.getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight mb-1">{e.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {e.type === 'live' ? <CalendarIcon className="w-3 h-3"/> : <BookOpen className="w-3 h-3"/>}
                        {e.time} {e.duration ? `(${e.duration})` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
