"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserProfile } from "@/lib/database/types";
import { Trophy, TrendingUp, DollarSign, Heart, Medal, Crown } from "lucide-react";

type TimeFilter = "all_time" | "this_month" | "this_week";
type SortBy = "total_earnings" | "success_rate" | "matches_made";

interface LeaderboardEntry extends UserProfile {
  rank: number;
  successRate: number;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-mono w-5 text-center">{rank}</span>;
  }
};

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const [sortBy, setSortBy] = useState<SortBy>("total_earnings");

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);

      // For time-based filtering, we would need to track historical stats
      // For now, we'll use the current stats from user_profiles
      // In a production app, you'd have a separate stats table with timestamps

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .gt("matches_made", 0) // Only show users who have made at least one match
        .order(sortBy === "success_rate" ? "successful_matches" : sortBy, { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const profiles = data as UserProfile[] | null;

      // Calculate success rate and add rank
      const entriesWithRank: LeaderboardEntry[] = (profiles || []).map((p, index) => ({
        ...p,
        rank: index + 1,
        successRate: p.matches_made > 0
          ? Math.round((p.successful_matches / p.matches_made) * 100)
          : 0,
      }));

      // Re-sort by success rate if needed (since we ordered by successful_matches above)
      if (sortBy === "success_rate") {
        entriesWithRank.sort((a, b) => b.successRate - a.successRate);
        // Update ranks after re-sorting
        entriesWithRank.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }

      setLeaderboard(entriesWithRank);
      setIsLoading(false);
    }

    fetchLeaderboard();
  }, [supabase, sortBy, timeFilter]);

  // Check if current user is on the leaderboard
  const currentUserEntry = user
    ? leaderboard.find((entry) => entry.user_id === user.id)
    : null;

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Matchmaker Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top 50 matchmakers competing for glory
          </p>
        </div>
        {user && (
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        )}
      </div>

      {/* Current User Card (if on leaderboard) */}
      {currentUserEntry && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10">
                {getRankIcon(currentUserEntry.rank)}
              </div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUserEntry.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(currentUserEntry.display_name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{currentUserEntry.display_name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>${currentUserEntry.total_earnings.toFixed(2)} earned</span>
                  <span>{currentUserEntry.successRate}% success</span>
                  <span>{currentUserEntry.matches_made} matches</span>
                </div>
              </div>
              <Badge variant="accent">#{currentUserEntry.rank}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Time Filter */}
        <div className="flex gap-2">
          <Button
            variant={timeFilter === "all_time" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("all_time")}
          >
            All Time
          </Button>
          <Button
            variant={timeFilter === "this_month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("this_month")}
          >
            This Month
          </Button>
          <Button
            variant={timeFilter === "this_week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("this_week")}
          >
            This Week
          </Button>
        </div>

        {/* Sort By */}
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant={sortBy === "total_earnings" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSortBy("total_earnings")}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Earnings
          </Button>
          <Button
            variant={sortBy === "success_rate" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSortBy("success_rate")}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Success Rate
          </Button>
          <Button
            variant={sortBy === "matches_made" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSortBy("matches_made")}
          >
            <Heart className="h-4 w-4 mr-1" />
            Matches
          </Button>
        </div>
      </div>

      {/* Leaderboard List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rankings</span>
            <Badge variant="muted">{leaderboard.length} matchmakers</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matchmakers on the leaderboard yet.</p>
              <p className="text-sm">Be the first to make a successful match!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard.map((entry) => {
                const isCurrentUser = user && entry.user_id === user.id;
                return (
                  <Link
                    key={entry.id}
                    href={`/matchmaker/${entry.user_id}`}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      isCurrentUser ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(entry.display_name || "U")}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Stats */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.display_name}
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${entry.total_earnings.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {entry.successRate}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {entry.matches_made}
                        </span>
                      </div>
                    </div>

                    {/* Highlighted Stat */}
                    <div className="text-right">
                      {sortBy === "total_earnings" && (
                        <Badge variant="accent">${entry.total_earnings.toFixed(2)}</Badge>
                      )}
                      {sortBy === "success_rate" && (
                        <Badge variant="accent">{entry.successRate}%</Badge>
                      )}
                      {sortBy === "matches_made" && (
                        <Badge variant="accent">{entry.matches_made} matches</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not on leaderboard message */}
      {user && !currentUserEntry && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              You&apos;re not on the leaderboard yet. Start matchmaking to compete!
            </p>
            <Link href="/matches/new">
              <Button>Create Your First Match</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Not logged in message */}
      {!user && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to track your ranking and compete with other matchmakers!
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
