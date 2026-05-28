
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Zap, 
  Activity, 
  Terminal, 
  ShieldAlert, 
  Settings, 
  Globe, 
  ShieldCheck, 
  Beaker,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useSessionToken } from "@/lib/session";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Zap, label: "Active Tunnels", href: "/tunnels" },
  { icon: Globe, label: "Reserved Domains", href: "/domains" },
  { icon: Activity, label: "Live Inspector", href: "/inspector" },
  { icon: ShieldAlert, label: "Failure Analysis", href: "/diagnostics" },
  { icon: Terminal, label: "Script Generator", href: "/scripts" },
  { icon: ShieldCheck, label: "Access Control", href: "/security" },
  { icon: Beaker, label: "Connectivity Sandbox", href: "/sandbox" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { token } = useSessionToken();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-64 h-full border-r bg-card/50 backdrop-blur-xl flex flex-col p-6 space-y-8 shrink-0">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse"></div>
          <div className="h-4 w-24 bg-secondary/40 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r bg-card/50 backdrop-blur-xl flex flex-col p-6 space-y-8 shrink-0">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-blue">
          <Share2 className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-headline font-bold tracking-tight text-foreground">
          Bridge<span className="text-primary">Flux</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 scroll-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-primary" : "group-hover:text-primary"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t space-y-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
            pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium">Settings</span>
        </Link>

        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Avatar className="w-8 h-8 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-[10px]">
                {token?.slice(-1).toUpperCase() || 'G'}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[100px]">
              <p className="text-xs font-bold truncate">Persistent Guest</p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{token?.slice(-6) || '---'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
