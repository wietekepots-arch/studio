"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Radar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { useAppUser } from "@/components/app/AppUserProvider";

export function Navbar(): React.ReactElement {
  const pathname = usePathname();
  const auth = useAuth();
  const { authUser, hasCompanyAccess, isLoading, profile, role } = useAppUser();

  const navItems = [
    { label: "Radar", href: "/", icon: Radar, requiresAuth: false },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
    },
    {
      label: "Experiences",
      href: "/experiences",
      icon: Sparkles,
      requiresAuth: true,
    },
    {
      label: "Propose Tool",
      href: "/items/new",
      icon: PlusCircle,
      requiresAuth: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    return !item.requiresAuth || hasCompanyAccess;
  });

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="group flex items-center gap-3 font-bold text-xl tracking-tight text-foreground"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all group-hover:scale-110">
              <Radar className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tighter">
                Greenberry
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
                Design for Progress
              </span>
            </div>
          </Link>

          <div className="hidden gap-1 md:flex">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="h-10 gap-2 rounded-full px-5 text-sm font-bold transition-all hover:bg-secondary/80"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && hasCompanyAccess && authUser ? (
            <>
              <div className="hidden text-right sm:flex sm:flex-col">
                <span className="text-sm font-bold tracking-tight">
                  {profile?.displayName || authUser.displayName || "Member"}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  {role}
                </span>
              </div>
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  className="h-10 w-10 rounded-full border-2 border-primary/20"
                  alt="Profile"
                />
              ) : null}
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full border bg-secondary/30"
                onClick={() => signOut(auth)}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild className="rounded-full px-6 font-bold gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
