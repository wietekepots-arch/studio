"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Settings, 
  ShieldCheck, 
  User, 
  LogOut,
  Radar
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  
  // Mock auth check
  const user = { role: 'Admin', displayName: 'Jane Doe' };

  const navItems = [
    { label: "Radar", href: "/", icon: Radar },
    { label: "Propose Tool", href: "/items/new", icon: PlusCircle, roles: ['Admin', 'Editor'] },
    { label: "Governance", href: "/governance", icon: ShieldCheck, roles: ['Admin'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));

  return (
    <nav className="sticky top-0 z-40 w-full border-b-2 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter text-primary group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:rotate-12">
              <Radar className="w-6 h-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span>GREENBERRY</span>
              <span className="text-xs text-muted-foreground tracking-widest font-black opacity-60">AI RADAR</span>
            </div>
          </Link>
          
          <div className="hidden md:flex gap-2">
            {filteredNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href ? "secondary" : "ghost"} 
                  className="gap-2 rounded-full font-bold uppercase text-[11px] tracking-widest px-5 h-10"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-black uppercase tracking-tight">{user.displayName}</span>
            <span className="text-[9px] text-primary font-black uppercase tracking-widest">Greenberry {user.role}</span>
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-2 w-10 h-10">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
