"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Heart, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  unreadMessages?: number;
  newMatches?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Navigation({ unreadMessages = 0, newMatches = 0 }: NavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Matches",
      href: "/matches",
      icon: Heart,
      badge: newMatches,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      badge: unreadMessages,
    },
    {
      label: "Profile",
      href: `/settings`,
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Side Navigation */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-8">
          <div className="flex h-10 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Matchmaker
              </span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-pink-50 text-pink-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-pink-600"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors duration-200",
                          active
                            ? "text-pink-600"
                            : "text-gray-400 group-hover:text-pink-600"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-semibold text-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                      {active && (
                        <span className="absolute left-0 h-8 w-1 rounded-r-full bg-pink-500" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="border-t border-gray-200 bg-white/95 backdrop-blur-lg">
          <ul className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all duration-200",
                      active
                        ? "text-pink-600"
                        : "text-gray-500 hover:text-pink-600"
                    )}
                  >
                    <div className="relative">
                      <item.icon
                        className={cn(
                          "h-6 w-6 transition-transform duration-200",
                          active && "scale-110"
                        )}
                      />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        active ? "text-pink-600" : "text-gray-500"
                      )}
                    >
                      {item.label}
                    </span>
                    {active && (
                      <span className="absolute -top-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-pink-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </>
  );
}
