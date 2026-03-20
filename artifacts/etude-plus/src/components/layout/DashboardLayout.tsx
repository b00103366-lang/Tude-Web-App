import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpen, LayoutDashboard, Calendar, GraduationCap,
  CreditCard, Bell, Settings, LogOut, Users, CheckSquare,
  DollarSign, ScrollText, Crown,
  TrendingUp, UserCog, ArrowLeftRight, BadgeCheck, AlertCircle, Clock, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Super Admin: 5 purposeful items — full platform control
const SUPER_ADMIN_NAV = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin/dashboard" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users" },
  { icon: TrendingUp, label: "Finances", href: "/admin/finances" },
  { icon: ScrollText, label: "Journal d'audit", href: "/admin/audit-logs" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
];

// Regular Admin: limited — can view dashboard + manage users/KYC, nothing else
const ADMIN_NAV = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin/dashboard" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users" },
];

const NAV_ITEMS: Record<string, { icon: any; label: string; href: string }[]> = {
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
    { icon: BadgeCheck, label: "Qualifications", href: "/professor/qualifications" },
    { icon: Calendar, label: "Calendrier", href: "/professor/calendar" },
    { icon: Users, label: "Étudiants", href: "/professor/students" },
    { icon: DollarSign, label: "Revenus", href: "/professor/earnings" },
    { icon: Settings, label: "Paramètres", href: "/professor/settings" },
  ],
  admin: ADMIN_NAV,
  super_admin: SUPER_ADMIN_NAV,
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutFn, impersonating, exitImpersonation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const items = NAV_ITEMS[user.role as keyof typeof NAV_ITEMS] || [];
  const isSuperAdmin = user.role === "super_admin";
  const isAdmin = user.role === "admin" || isSuperAdmin;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden lg:flex flex-col fixed inset-y-0 z-40 shadow-2xl shadow-black/10">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            <span className="font-serif font-bold text-xl">É</span>
          </div>
          <div>
            <span className="text-xl font-serif font-bold tracking-tight">
              Étude<span className="text-sidebar-primary">+</span>
            </span>
            {isSuperAdmin && (
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">Control Panel</span>
              </div>
            )}
          </div>
        </div>

        {/* User profile — click avatar to go to settings */}
        <Link href={
          isSuperAdmin || user.role === "admin" ? "/admin/settings" :
          user.role === "professor" ? "/professor/settings" : "/student/settings"
        }>
          <div className="px-6 py-4 flex items-center gap-3 border-y border-sidebar-border/50 bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-sidebar-primary/30 flex-shrink-0 bg-sidebar-primary/20">
              {user.profilePhoto ? (
                <img src={`/api/storage${user.profilePhoto}`} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold text-sidebar-primary">{user.fullName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-semibold text-sm truncate group-hover:text-sidebar-primary transition-colors">{user.fullName}</p>
              <p className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                {isSuperAdmin && <Crown className="w-3 h-3 text-yellow-400" />}
                {isSuperAdmin ? "Super Admin" : user.role === "admin" ? "Admin" : user.role === "professor" ? "Professeur" : "Élève"}
              </p>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {/* Section label for admin panels */}
          {isAdmin && (
            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
              {isSuperAdmin ? "Panneau de contrôle" : "Administration"}
            </p>
          )}

          {items.map((item) => {
            const active = location === item.href || location.startsWith(item.href + "/");
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
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}

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
        {/* Impersonation Banner */}
        {impersonating && (
          <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <UserCog className="w-4 h-4 shrink-0" />
              <span>
                Vous agissez en tant que <strong>{impersonating.targetUser.fullName}</strong> ({impersonating.targetUser.email})
                &nbsp;·&nbsp;Connecté en tant que&nbsp;<strong>{impersonating.adminUser.fullName}</strong>
              </span>
            </div>
            <button
              onClick={exitImpersonation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-950/30 text-amber-950 font-bold text-xs transition-colors shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Retour au panneau admin
            </button>
          </div>
        )}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center px-6 lg:hidden">
          <span className="text-xl font-serif font-bold">Étude+</span>
        </header>
        {/* KYC Status Banner — professor only */}
        {user.role === "professor" && (() => {
          const kycStatus = (user as any)?.professorProfile?.kycStatus ?? "not_submitted";
          if (kycStatus === "approved") return null;
          if (kycStatus === "not_submitted") {
            return (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Complétez votre vérification pour publier vos cours</span>
                </div>
                <Link href="/professor/kyc" className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Commencer la vérification →
                </Link>
              </div>
            );
          }
          if (kycStatus === "pending") {
            return (
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center gap-2 text-sm text-blue-800">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Votre dossier est en cours d'examen (24-48h)</span>
              </div>
            );
          }
          if (kycStatus === "rejected") {
            return (
              <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Votre demande a été refusée.</span>
                </div>
                <Link href="/professor/kyc" className="text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Voir les raisons et soumettre à nouveau →
                </Link>
              </div>
            );
          }
          return null;
        })()}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
