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
  Sparkles,
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
      label: navigation.experiences,
      href: "/experiences",
      icon: Sparkles,
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
            <div className="flex items-center justify-center text-primary transition-transform duration-200 group-hover:scale-105">
              <svg
                width="56"
                height="50"
                viewBox="0 0 56 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-11 w-auto"
                aria-hidden="true"
              >
                <path
                  d="M56.0061 19.2448L52.0567 12.3307H46.6624L49.3885 7.68267L45.2993 0.526611H37.3868L34.7118 5.21212L32.0368 0.533427H23.9606L21.289 5.21894L18.614 0.533427H10.7594L6.67024 7.68948L9.39636 12.3375H4.03613L0.0866699 19.2448L4.09747 26.2407H9.49177L6.76566 30.8649L10.8548 37.9937H16.2355L13.5094 42.6281L17.5134 49.6103H25.351L28.0226 44.9248L30.6976 49.6103H38.6135L42.6141 42.6281L39.888 37.9937H45.2823L49.3715 30.8649L46.6453 26.2373H52.0396L56.0061 19.2448ZM42.3108 7.36576C42.0102 7.36846 41.7155 7.28174 41.4643 7.11661C41.2131 6.95149 41.0166 6.71541 40.8998 6.43838C40.7831 6.16134 40.7513 5.85585 40.8085 5.56071C40.8658 5.26557 41.0094 4.9941 41.2213 4.7808C41.4332 4.56749 41.7036 4.42198 41.9984 4.36274C42.2931 4.3035 42.5988 4.33321 42.8767 4.4481C43.1545 4.56298 43.3919 4.75786 43.5587 5.00797C43.7255 5.25807 43.8142 5.55212 43.8136 5.85276C43.8136 6.25227 43.6556 6.63556 43.3741 6.91901C43.0925 7.20246 42.7103 7.36306 42.3108 7.36576Z"
                  fill="currentColor"
                />
              </svg>
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
                      variant="navbar"
                      className={
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground"
                      }
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
                    variant="navbar"
                    className="h-auto p-1 hover:bg-secondary/60"
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
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl px-3 py-2 font-medium"
                  >
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
            <Button asChild variant="navbar" className="px-6 gap-2">
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
