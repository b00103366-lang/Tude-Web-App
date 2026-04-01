import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Button, FadeIn } from "@/components/ui/Premium";
import { MathBackground } from "@/components/ui/MathBackground";
import { FloatingSymbols } from "@/components/ui/FloatingSymbols";
import {
  ArrowRight, Star, BookOpen, Video, ShieldCheck, Trophy,
  GraduationCap, Users, Zap, Globe, CheckCircle, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

const SUBJECTS = [
  "Mathématiques", "Physique", "Chimie", "SVT", "Arabe",
  "Français", "Anglais", "Histoire-Géo", "Philosophie", "Informatique",
];

export function Landing() {
  const { t } = useTranslation();
  const [liveStats, setLiveStats] = useState<{ totalStudents: number; totalProfessors: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/stats/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLiveStats(data); })
      .catch(() => {});
  }, []);

  const studentCount = useCountUp(liveStats?.totalStudents ?? 0);
  const professorCount = useCountUp(liveStats?.totalProfessors ?? 0);

  const STATS = [
    { value: liveStats ? `${studentCount}` : "…", label: t("landing.stats.students") },
    { value: liveStats ? `${professorCount}` : "…", label: t("landing.stats.professors") },
    { value: "98%",  label: t("landing.stats.successRate") },
    { value: "4.9★", label: t("landing.stats.avgRating") },
  ];

  const FEATURES = [
    {
      icon: Video,
      title: t("landing.features.liveClasses.title"),
      desc: t("landing.features.liveClasses.desc"),
      color: "#f59e0b",
      bg: "bg-amber-50 border-amber-200/60",
      iconBg: "bg-amber-500/10",
    },
    {
      icon: BookOpen,
      title: t("landing.features.resources.title"),
      desc: t("landing.features.resources.desc"),
      color: "#fb923c",
      bg: "bg-orange-50 border-orange-200/60",
      iconBg: "bg-orange-500/10",
    },
    {
      icon: ShieldCheck,
      title: t("landing.features.verifiedProfessors.title"),
      desc: t("landing.features.verifiedProfessors.desc"),
      color: "#10b981",
      bg: "bg-emerald-50 border-emerald-200/60",
      iconBg: "bg-emerald-500/10",
    },
    {
      icon: GraduationCap,
      title: t("landing.features.personalTracking.title"),
      desc: t("landing.features.personalTracking.desc"),
      color: "#3b82f6",
      bg: "bg-blue-50 border-blue-200/60",
      iconBg: "bg-blue-500/10",
    },
    {
      icon: Globe,
      title: t("landing.features.accessAnywhere.title"),
      desc: t("landing.features.accessAnywhere.desc"),
      color: "#8b5cf6",
      bg: "bg-violet-50 border-violet-200/60",
      iconBg: "bg-violet-500/10",
    },
    {
      icon: Zap,
      title: t("landing.features.securePayment.title"),
      desc: t("landing.features.securePayment.desc"),
      color: "#f59e0b",
      bg: "bg-amber-50 border-amber-200/60",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF7] relative overflow-x-hidden">
      {/* Full-page animated math/Greek symbol background */}
      <MathBackground />

      {/* Radial glow — top left */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 0% 10%, rgba(245,158,11,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 100% 90%, rgba(249,115,22,0.07) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      <Navbar />

      <main className="relative" style={{ zIndex: 1 }}>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24">
          {/* Interactive floating symbols — background layer only */}
          <FloatingSymbols />
          <div className="relative grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]" style={{ zIndex: 1 }}>
            {/* Left copy */}
            <FadeIn className="max-w-2xl">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#1a1a2e] leading-[1.08] mb-6 tracking-tight">
                {t("landing.hero.title1")}
                <br />
                {t("landing.hero.title2")}{" "}
                <span
                  className="relative inline-block"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #fb923c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("landing.hero.title3")}
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                {t("landing.hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/select-role">
                  <Button size="lg" className="w-full sm:w-auto text-lg font-bold px-8 group shadow-lg shadow-amber-400/25">
                    {t("landing.hero.cta")}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg bg-white/60 backdrop-blur border-gray-300">
                    {t("landing.hero.learnMore")}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {t("landing.trust.noCommitment")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {t("landing.trust.kycCertified")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {t("landing.trust.paymentTnd")}
                </div>
              </div>
            </FadeIn>

            {/* Right — stats card cluster */}
            <FadeIn delay={0.2} className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-[480px] h-[480px]">
                {/* Central glow */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
                  }}
                />

                {/* Big stat ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-white border-2 border-amber-200 shadow-2xl flex flex-col items-center justify-center"
                  style={{ boxShadow: "0 0 60px rgba(245,158,11,0.15)" }}
                >
                  <Trophy className="w-10 h-10 mb-2" style={{ color: "#f59e0b" }} />
                  <p className="text-4xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-500 font-medium">{t("landing.stats.successRate")}</p>
                </motion.div>

                {/* Orbiting stat cards */}
                {[
                  { label: t("landing.stats.studentsOrbit"), value: liveStats ? `${studentCount}` : "…", angle: -60, icon: Users, color: "#f59e0b" },
                  { label: t("landing.stats.profsOrbit"), value: liveStats ? `${professorCount}` : "…", angle: 60, icon: ShieldCheck, color: "#fb923c" },
                  { label: t("landing.stats.ratingOrbit"), value: "4.9 ★", angle: 180, icon: Star, color: "#f97316" },
                ].map((item, i) => {
                  const rad = (item.angle * Math.PI) / 180;
                  const r = 210;
                  const cx = 240 + r * Math.cos(rad);
                  const cy = 240 + r * Math.sin(rad);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                      className="absolute w-36 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 flex flex-col items-center"
                      style={{ left: cx - 72, top: cy - 44 }}
                    >
                      <item.icon className="w-5 h-5 mb-1" style={{ color: item.color }} />
                      <p className="text-xl font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── SUBJECTS TICKER ──────────────────────────────── */}
        <div className="border-y border-amber-200/60 bg-amber-50/60 py-5 overflow-hidden">
          <div className="flex gap-8 animate-[slide-left_20s_linear_infinite] whitespace-nowrap">
            {[...SUBJECTS, ...SUBJECTS].map((s, i) => (
              <span key={i} className="text-sm font-semibold text-amber-700 flex items-center gap-2 shrink-0">
                <span style={{ color: "#f59e0b" }}>∑</span> {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ROW ─────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <FadeIn key={i} delay={0.1 * i}>
                <div className="text-center">
                  <p
                    className="text-4xl font-bold font-serif mb-1"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #f97316)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {s.value}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── FEATURES GRID ─────────────────────────────────── */}
        <section className="bg-white/70 backdrop-blur-sm py-24 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-3">{t("landing.features.sectionLabel")}</p>
                <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                  {t("landing.features.sectionTitle")}
                </h2>
                <p className="text-lg text-gray-500">
                  {t("landing.features.sectionSubtitle")}
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <FadeIn key={i} delay={0.08 * i}>
                  <div className={`rounded-2xl p-7 border ${f.bg} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                      <f.icon className="w-6 h-6" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-3">{t("landing.howItWorks.sectionLabel")}</p>
              <h2 className="text-4xl font-serif font-bold text-gray-900">{t("landing.howItWorks.sectionTitle")}</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {[
              { step: "01", title: t("landing.howItWorks.step1Title"), desc: t("landing.howItWorks.step1Desc") },
              { step: "02", title: t("landing.howItWorks.step2Title"), desc: t("landing.howItWorks.step2Desc") },
              { step: "03", title: t("landing.howItWorks.step3Title"), desc: t("landing.howItWorks.step3Desc") },
            ].map((step, i) => (
              <FadeIn key={i} delay={0.15 * i}>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center font-bold text-xl"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #f97316)",
                      color: "#fff",
                      boxShadow: "0 8px 24px rgba(245,158,11,0.25)",
                    }}
                  >
                    {step.step}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ────────────────────────────────────── */}
        <section className="mx-4 sm:mx-8 lg:mx-16 mb-20 rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          {/* Symbol overlay on CTA */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none select-none">
            {["Σ","π","∞","∫","Δ","√"].map((c, i) => (
              <span key={i} style={{ position:"absolute", left:`${10 + i * 15}%`, top: i%2===0?"10%":"55%", fontSize: 80, color:"#f59e0b", fontFamily:"serif", fontWeight:700, opacity:0.6 }}>{c}</span>
            ))}
          </div>
          <div className="relative z-10 px-10 py-16 text-center">
            <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">{t("landing.cta.label")}</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-5">
              {t("landing.cta.title")}
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              {t("landing.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/select-role">
                <Button size="lg" className="font-bold px-8 shadow-lg shadow-amber-400/20">
                  {t("landing.cta.register")} <ChevronRight className="ml-1 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  {t("landing.cta.pricing")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/60 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-gray-900">Étude<span style={{ color: "#f59e0b" }}>+</span></span>
            <span className="text-gray-400 text-sm">{t("landing.footer.tagline")}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-amber-600 transition-colors">{t("landing.footer.about")}</Link>
            <Link href="/pricing" className="hover:text-amber-600 transition-colors">{t("landing.footer.pricing")}</Link>
            <Link href="/terms" className="hover:text-amber-600 transition-colors">{t("landing.footer.terms")}</Link>
            <Link href="/privacy" className="hover:text-amber-600 transition-colors">{t("landing.footer.privacy")}</Link>
            <Link href="/cookies" className="hover:text-amber-600 transition-colors">{t("landing.footer.cookies")}</Link>
            <a href="mailto:support@etude-plus.tn" className="hover:text-amber-600 transition-colors">{t("landing.footer.contact")}</a>
            <Link href="/login" className="hover:text-amber-600 transition-colors">{t("landing.footer.login")}</Link>
          </div>
          <p className="text-xs text-gray-400">{t("landing.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
