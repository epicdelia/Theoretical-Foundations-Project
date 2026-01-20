"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Users,
  Library,
  User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/cohorts", label: "Cohort", icon: Users },
  { href: "/library", label: "Library", icon: Library },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Only apply scroll-based hiding on mobile (handled via CSS media query)
          // Show nav when scrolling up, hide when scrolling down
          if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setIsVisible(false);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-card border-t border-border",
          "transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[64px]",
                  "transition-colors duration-200",
                  active
                    ? "text-purple-600"
                    : "text-muted-foreground hover:text-purple-600"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-600" />
                  )}
                </div>
                <span className={cn("text-xs", active && "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-card" />
      </nav>

      {/* Desktop Side Navigation */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-64 flex-col bg-card border-r border-border">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">HH</span>
          </div>
          <span className="font-semibold text-purple-700">HeartBreak Hub</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "transition-colors duration-200",
                      active
                        ? "bg-purple-50 text-purple-700 font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer area */}
        <div className="px-3 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Your healing journey
          </p>
        </div>
      </aside>

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
