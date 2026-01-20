"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Music, Heart, MessageCircle, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newMatches, setNewMatches] = useState(0);

  const fetchBadgeCounts = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();

    try {
      // Fetch unread message count
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .not("matched_at", "is", null)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matches && matches.length > 0) {
        const matchIds = matches.map((m) => m.id);

        const { data: conversations } = await supabase
          .from("conversations")
          .select("id")
          .in("match_id", matchIds);

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map((c) => c.id);

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", conversationIds)
            .neq("sender_id", user.id)
            .is("read_at", null);

          setUnreadMessages(count || 0);
        }
      }

      // Fetch new matches count (matches from last 24 hours that haven't been viewed)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { count: newMatchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .not("matched_at", "is", null)
        .gte("matched_at", oneDayAgo.toISOString())
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      setNewMatches(newMatchCount || 0);
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchBadgeCounts();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);

    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  // Reset badge when visiting the respective page
  useEffect(() => {
    if (pathname === "/messages") {
      setUnreadMessages(0);
    }
    if (pathname === "/matches") {
      setNewMatches(0);
    }
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      href: "/discover",
      label: "Discover",
      icon: Compass,
    },
    {
      href: "/matches",
      label: "Matches",
      icon: Heart,
      badge: newMatches,
    },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageCircle,
      badge: unreadMessages,
    },
    {
      href: "/settings",
      label: "Profile",
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/discover") {
      return pathname === "/discover" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden",
          "safe-area-bottom",
          className
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active && "scale-110"
                    )}
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col w-64 bg-background border-r",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b">
          <Music className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Harmonic Match
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
