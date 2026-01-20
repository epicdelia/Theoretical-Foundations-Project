"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, Wallet, User } from "lucide-react";
import { useNotifications } from "@/lib/notifications/context";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches", icon: Users, label: "Matches", matchPaths: ["/matches"] },
  { href: "/matches/new", icon: Plus, label: "New Match" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/matchmaker/me", icon: User, label: "Profile", matchPaths: ["/matchmaker", "/settings"] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.matchPaths) {
      return item.matchPaths.some((path) => pathname.startsWith(path));
    }
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const showBadge = item.label === "Matches" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative min-w-[60px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110"
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
