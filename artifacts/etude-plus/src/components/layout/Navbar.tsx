import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Premium";
import { useAuth } from "@/hooks/use-auth";
import { BookPlus, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user, logoutFn } = useAuth();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/";
    return `/${user.role}/dashboard`;
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "glass py-3" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            <BookPlus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight text-foreground">
            Étude<span className="text-primary">+</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          <Link href="/browse" className="text-foreground/80 hover:text-primary transition-colors">Explorer les Cours</Link>
          <Link href="/professors" className="text-foreground/80 hover:text-primary transition-colors">Nos Professeurs</Link>
          <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">À Propos</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href={getDashboardLink()} className="hidden sm:block">
                <Button variant="ghost" className="font-semibold">Mon Espace</Button>
              </Link>
              <div className="flex items-center gap-2 pl-4 border-l border-border">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/20">
                  <User className="w-5 h-5 text-foreground/70" />
                </div>
                <Button variant="ghost" size="sm" onClick={logoutFn} className="px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/select-role">
                <Button>S'inscrire</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
