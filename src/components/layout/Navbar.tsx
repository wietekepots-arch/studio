"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  ShieldCheck, 
  User, 
  LogOut,
  Radar
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  
  // Mock auth check - in a real app this would come from context
  const user = { role: 'Admin', displayName: 'Jane Doe' };

  const navItems = [
    { label: "Radar", href: "/", icon: Radar },
    { label: "Add Item", href: "/items/new", icon: PlusCircle, roles: ['Admin', 'Editor'] },
    { label: "Governance", href: "/governance", icon: ShieldCheck, roles: ['Admin'] },
    { label: "Settings", href: "/admin", icon: Settings, roles: ['Admin'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Radar className="w-5 h-5" />
            </div>
            <span>Agency Radar</span>
          </Link>
          
          <div className="hidden md:flex gap-1">
            {filteredNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href ? "secondary" : "ghost"} 
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user.role}</span>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <User className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};