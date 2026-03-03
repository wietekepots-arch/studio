"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  ShieldCheck, 
  User, 
  Radar
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  
  const user = { role: 'Admin', displayName: 'Jane Doe' };

  const navItems = [
    { label: "Radar", href: "/", icon: Radar },
    { label: "Propose Tool", href: "/items/new", icon: PlusCircle, roles: ['Admin', 'Editor'] },
    { label: "Governance", href: "/governance", icon: ShieldCheck, roles: ['Admin'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));

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
                  variant={pathname === item.href ? "secondary" : "ghost"} 
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
          <div className="hidden sm:flex flex-col items-end mr-2 text-right">
            <span className="text-sm font-bold tracking-tight">{user.displayName}</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-wider">{user.role}</span>
          </div>
          <Button variant="outline" size="icon" className="rounded-full border w-11 h-11 bg-secondary/30">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};