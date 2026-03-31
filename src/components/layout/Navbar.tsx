"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Radar,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/firebase";
import { useAppUser } from "@/components/app/AppUserProvider";
import common from "@/content/common.json";

const { navigation, branding, auth: authContent } = common;

type NavbarProps = {
  radarSearchValue?: string;
  radarSearchPlaceholder?: string;
  onRadarSearchChange?: (value: string) => void;
};

export function Navbar({
  radarSearchValue,
  radarSearchPlaceholder,
  onRadarSearchChange,
}: NavbarProps = {}): React.ReactElement {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const auth = useAuth();
  const { authUser, hasCompanyAccess, isLoading, profile, role } = useAppUser();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const showRadarSearch =
    pathname === "/" &&
    radarSearchValue !== undefined &&
    radarSearchPlaceholder !== undefined &&
    onRadarSearchChange !== undefined;
  const isSearchActive =
    showRadarSearch && (isSearchExpanded || radarSearchValue.length > 0);

  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isSearchExpanded]);

  const navItems = [
    { label: navigation.radar, href: "/", icon: Radar, requiresAuth: false },
    {
      label: navigation.dashboard,
      href: "/dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
    },
    {
      label: navigation.proposeBlip,
      href: "/blips/new",
      icon: PlusCircle,
      requiresAuth: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    return !item.requiresAuth || hasCompanyAccess;
  });

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex min-h-20 flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <Link
            href="/"
            className="group flex items-center gap-3 font-bold text-xl tracking-tight text-foreground"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all group-hover:scale-110">
              <Radar className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tighter">
                {branding.companyName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
                AI Radar
              </span>
            </div>
          </Link>

          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div
              className={`flex flex-wrap gap-3 overflow-hidden transition-all duration-300 ease-out md:flex-nowrap ${
                isSearchActive
                  ? "max-h-0 max-w-0 -translate-x-2 opacity-0 md:max-h-12"
                  : "max-h-40 max-w-3xl translate-x-0 opacity-100 md:max-h-12"
              }`}
            >
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

            {showRadarSearch ? (
              <div
                className={`relative overflow-hidden transition-all duration-300 ease-out ${
                  isSearchActive ? "w-full md:w-80" : "w-12"
                }`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute left-0 top-0 z-10 h-12 w-12 rounded-full border-2 border-border bg-secondary/30 transition-all duration-300 ${
                    isSearchActive ? "border-transparent bg-transparent" : ""
                  }`}
                  onClick={() => setIsSearchExpanded(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Input
                  ref={searchInputRef}
                  placeholder={radarSearchPlaceholder}
                  className={`h-12 rounded-full border-2 border-border bg-secondary/30 pl-12 transition-all duration-300 ease-out ${
                    isSearchActive
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                  value={radarSearchValue}
                  onChange={(event) => onRadarSearchChange(event.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => {
                    if (radarSearchValue.length === 0) {
                      setIsSearchExpanded(false);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && hasCompanyAccess && authUser ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto rounded-full p-1 hover:bg-secondary/60"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage
                          src={authUser.photoURL ?? undefined}
                          alt={authContent.profileAlt}
                        />
                        <AvatarFallback className="bg-secondary/40 text-xs font-black uppercase text-muted-foreground">
                          {(
                            profile?.displayName ||
                            authUser.displayName ||
                            authContent.memberFallback
                          ).slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-2">
                    <span className="text-sm font-bold tracking-tight">
                      {profile?.displayName ||
                        authUser.displayName ||
                        authContent.memberFallback}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {role}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 font-medium">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      {navigation.dashboard}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2 font-medium text-destructive focus:text-destructive"
                    onClick={() => signOut(auth)}
                  >
                    <LogOut className="h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="rounded-full px-6 font-bold gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                {navigation.signIn}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
