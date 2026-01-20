"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useAuth } from "@/lib/auth/context";

export function MobileHeader() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Matchmaker</span>
        </Link>
        <NotificationsDropdown />
      </div>
    </header>
  );
}
