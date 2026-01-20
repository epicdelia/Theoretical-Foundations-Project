"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  Users,
  Plus,
  Trophy,
  Wallet,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useAuth } from "@/lib/auth/context";
import { useNotifications } from "@/lib/notifications/context";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  matchPaths?: string[];
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches", icon: Users, label: "Matches", matchPaths: ["/matches"] },
  { href: "/matches/new", icon: Plus, label: "New Match" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
];

const secondaryNavItems: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/matchmaker/me", icon: User, label: "Profile", matchPaths: ["/matchmaker"] },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.matchPaths) {
      return item.matchPaths.some((path) => pathname.startsWith(path));
    }
    return false;
  };

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <Heart className="h-7 w-7 text-primary" />
        <span className="font-bold text-xl">Matchmaker</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const showBadge = item.label === "Matches" && unreadCount > 0;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 px-4 transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {item.label}
                {active && (
                  <span className="ml-auto w-1 h-5 bg-primary rounded-full" />
                )}
              </Button>
            </Link>
          );
        })}

        <div className="h-px bg-border my-4" />

        {secondaryNavItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 px-4 transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {active && (
                  <span className="ml-auto w-1 h-5 bg-primary rounded-full" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-4 space-y-3">
        {/* Notifications */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">Notifications</span>
          <NotificationsDropdown />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.display_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              Score: {profile?.matchmaker_score ?? 0}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
