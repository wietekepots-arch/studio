"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  ShieldCheck, 
  Radar,
  Sparkles,
  LogOut,
  LogIn
} from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  // For Greenberry, anyone with the official domain is a member
  const isAdmin = user?.email?.endsWith('@greenberry.nl') || false;

  const navItems = [
    { label: "Radar", href: "/", icon: Radar },
    { label: "Experiences", href: "/experiences", icon: Sparkles },
    { label: "Propose Tool", href: "/items/new", icon: PlusCircle, roles: ['authenticated'] },
    { label: "Governance", href: "/admin", icon: ShieldCheck, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true;
    if (item.roles.includes('authenticated') && !user) return false;
    if (item.roles.includes('admin') && !isAdmin) return false;
    return true;
  });

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight text-foreground group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-all group-hover:scale-110">
              <Radar className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tighter">Greenberry</span>
              <span className="text-[10px] text-muted-foreground tracking-[0.2em] font-bold uppercase opacity-80">Design for Progress</span>
            </div>
          </Link>
          
          <div className="hidden md:flex gap-1">
            {filteredNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? "secondary" : "ghost"} 
                  className="gap-2 rounded-full font-bold text-sm px-5 h-10 transition-all hover:bg-secondary/80"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isUserLoading && (
            user ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2 text-right">
                  <span className="text-sm font-bold tracking-tight">{user.displayName || user.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider">
                    {isAdmin ? 'Agency Member' : 'Guest'}
                  </span>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-primary/20" alt="Profile" />
                )}
                <Button variant="outline" size="icon" className="rounded-full border w-11 h-11 bg-secondary/30" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button asChild variant="default" className="rounded-full px-6 font-bold gap-2">
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};
