"use client";

import Link from "next/link";
import { Heart, Home, Trophy, Wallet, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useAuth } from "@/lib/auth/context";

export function Header() {
  const { user, profile, signOut, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">
              Matchmaker
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/matches">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Matches
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
            <Link href="/wallet">
              <Button variant="ghost" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/matchmaker/me">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{initials || "?"}</AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
