import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  BookOpen, LayoutDashboard, Calendar, GraduationCap, 
  CreditCard, Bell, Settings, LogOut, Users, CheckSquare,
  Video, DollarSign, ShieldCheck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = {
  student: [
    { icon: LayoutDashboard, label: "Tableau de Bord", href: "/student/dashboard" },
    { icon: BookOpen, label: "Parcourir", href: "/student/browse" },
    { icon: GraduationCap, label: "Mes Cours", href: "/student/classes" },
    { icon: Calendar, label: "Calendrier", href: "/student/calendar" },
    { icon: CheckSquare, label: "Notes", href: "/student/grades" },
    { icon: CreditCard, label: "Paiements", href: "/student/payments" },
    { icon: Bell, label: "Notifications", href: "/student/notifications" },
    { icon: Settings, label: "Paramètres", href: "/student/settings" },
  ],
  professor: [
    { icon: LayoutDashboard, label: "Tableau de Bord", href: "/professor/dashboard" },
    { icon: BookOpen, label: "Mes Cours", href: "/professor/classes" },
    { icon: Calendar, label: "Calendrier", href: "/professor/calendar" },
    { icon: Users, label: "Étudiants", href: "/professor/students" },
    { icon: DollarSign, label: "Revenus", href: "/professor/earnings" },
    { icon: Settings, label: "Paramètres", href: "/professor/settings" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin/dashboard" },
    { icon: Users, label: "Utilisateurs", href: "/admin/users" },
    { icon: CheckSquare, label: "Professeurs & KYC", href: "/admin/professors" },
    { icon: BookOpen, label: "Cours", href: "/admin/classes" },
    { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
  ]
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutFn } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const items = NAV_ITEMS[user.role as keyof typeof NAV_ITEMS] || [];
  const profStatus = (user as any)?.professorProfile?.status;
  const isProfessor = user.role === "professor";
  const isApproved = profStatus === "approved";
  const needsKYC = isProfessor && profStatus && profStatus !== "approved";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden lg:flex flex-col fixed inset-y-0 z-40 shadow-2xl shadow-black/10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            <span className="font-serif font-bold text-xl">É</span>
          </div>
          <span className="text-xl font-serif font-bold tracking-tight">
            Étude<span className="text-sidebar-primary">+</span>
          </span>
        </div>

        <div className="px-6 py-4 flex items-center gap-3 border-y border-sidebar-border/50 bg-sidebar-accent/30">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center border border-sidebar-primary/30 flex-shrink-0">
            <span className="font-bold text-sidebar-primary">{user.fullName.charAt(0)}</span>
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user.fullName}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
          </div>
        </div>

        {/* KYC Alert Banner */}
        {needsKYC && (
          <Link href="/professor/kyc" className="mx-4 mt-4 block">
            <div className={cn(
              "rounded-xl p-3 border flex items-start gap-2 text-xs font-medium transition-colors",
              profStatus === "kyc_submitted"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                : profStatus === "rejected"
                ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            )}>
              {profStatus === "kyc_submitted" ? (
                <CheckSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>
                {profStatus === "kyc_submitted"
                  ? "KYC soumis — en attente de validation"
                  : profStatus === "rejected"
                  ? "KYC refusé — cliquez pour recommencer"
                  : "Vérification KYC requise"}
              </span>
            </div>
          </Link>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  active 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* KYC link always at bottom of professor nav */}
          {isProfessor && (
            <Link
              href="/professor/kyc"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                location.startsWith("/professor/kyc")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              Vérification KYC
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <button 
            onClick={logoutFn}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6 lg:hidden">
          <span className="text-xl font-serif font-bold">Étude+</span>
          {needsKYC && (
            <Link href="/professor/kyc" className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium border border-amber-200">
              KYC requis
            </Link>
          )}
        </header>
        <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
