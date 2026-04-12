import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button, Card, FadeIn } from "@/components/ui/Premium";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SelectRole() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // MVP: professor option suppressed — redirect straight to student registration
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-math-pattern opacity-[0.03] pointer-events-none" />
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4 relative z-10">
        <div className="w-full max-w-2xl">
          <FadeIn className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">{t("selectRole.title")}</h1>
            <p className="text-xl text-muted-foreground">{t("selectRole.subtitle")}</p>
          </FadeIn>

          <FadeIn delay={0.1} className="max-w-md mx-auto">
            <Card
              className="p-8 cursor-pointer hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col group relative overflow-hidden"
              onClick={() => setLocation("/register?role=student")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />

              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold mb-3">{t("selectRole.studentTitle")}</h2>
              <p className="text-muted-foreground mb-8 flex-1">
                {t("selectRole.studentDesc")}
              </p>

              <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                {t("selectRole.createStudentAccount")} <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </Card>
          </FadeIn>

          {/* MVP: professor card suppressed
          <FadeIn delay={0.2}>
            <Card className="p-8 cursor-pointer ..." onClick={() => setLocation("/register?role=professor")}>
              ...
            </Card>
          </FadeIn>
          */}

          <FadeIn delay={0.3} className="text-center mt-12">
            <p className="text-muted-foreground">
              {t("selectRole.alreadyAccount")}{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                {t("selectRole.signIn")}
              </Link>
            </p>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
