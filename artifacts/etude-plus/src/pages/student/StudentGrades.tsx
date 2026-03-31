import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn, Badge } from "@/components/ui/Premium";
import { Trophy, Award, LineChart, FileQuestion } from "lucide-react";
import { useGetMyGrades } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

function pct(score: number, total: number) {
  return Math.round((score / total) * 100);
}

function getColor(score: number, total: number) {
  const p = pct(score, total);
  if (p >= 80) return "text-green-600";
  if (p >= 60) return "text-primary";
  if (p >= 40) return "text-orange-500";
  return "text-red-500";
}

export function StudentGrades() {
  const { t } = useTranslation();
  const { data: grades = [], isLoading } = useGetMyGrades() as any;

  const avg = grades.length
    ? grades.reduce((s: number, g: any) => s + (g.score / g.total) * 20, 0) / grades.length
    : null;

  return (
    <DashboardLayout>
      <FadeIn>
        <PageHeader
          title={t("student.grades.title")}
          description={t("student.grades.description")}
        />

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl shadow-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-primary-foreground/80 font-medium">{t("student.grades.average")}</p>
                {avg !== null
                  ? <p className="text-3xl font-bold">{avg.toFixed(1)}<span className="text-lg font-normal opacity-70">/20</span></p>
                  : <p className="text-2xl font-semibold opacity-70">—</p>
                }
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <LineChart className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">{t("student.grades.assessmentsDone")}</p>
                <p className="text-3xl font-bold">{grades.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">{t("student.grades.bestGrade")}</p>
                <p className="text-3xl font-bold">
                  {grades.length ? `${Math.max(...grades.map((g: any) => pct(g.score, g.total)))}%` : "—"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-6">{t("student.grades.history")}</h2>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : grades.length === 0 ? (
          <Card className="p-12 text-center">
            <FileQuestion className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("student.grades.noGrades")}</h3>
            <p className="text-muted-foreground">{t("student.grades.noGradesDesc")}</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {grades.map((g: any, i: number) => (
              <FadeIn key={g.id} delay={i * 0.05}>
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                    <div>
                      <Badge variant="outline" className="mb-2">{g.type ?? t("student.grades.assessment")}</Badge>
                      <h3 className="font-bold text-lg">{g.title}</h3>
                      <p className="text-sm text-muted-foreground">{g.class?.title ?? g.className ?? ""}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getColor(g.score, g.total)}`}>
                        {g.score}<span className="text-sm text-muted-foreground">/{g.total}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <div className={`h-1.5 rounded-full bg-current ${getColor(g.score, g.total)}`} style={{ width: `${pct(g.score, g.total)}%` }} />
                      </div>
                    </div>
                  </div>
                  {g.comment && (
                    <div className="bg-secondary/50 rounded-xl p-4 flex gap-3">
                      <Award className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("student.grades.comment")}</p>
                        <p className="text-sm font-medium italic">"{g.comment}"</p>
                      </div>
                    </div>
                  )}
                </Card>
              </FadeIn>
            ))}
          </div>
        )}
      </FadeIn>
    </DashboardLayout>
  );
}
