"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Users, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchCard } from "./MatchCard";
import {
  refreshMatches,
  getMatchesForDashboard,
  type MatchWithProfile,
  type SortOption,
} from "@/lib/dashboard/actions";

interface DashboardMatchesProps {
  initialMatches: MatchWithProfile[];
}

export function DashboardMatches({ initialMatches }: DashboardMatchesProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [sortBy, setSortBy] = useState<SortOption>("compatibility");
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    startTransition(async () => {
      const result = await getMatchesForDashboard(newSort);
      if (!result.error) {
        setMatches(result.matches);
      }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);

    const result = await refreshMatches();

    if (result.success) {
      if (result.matchesCreated > 0) {
        setRefreshMessage(`Found ${result.matchesCreated} new match${result.matchesCreated > 1 ? "es" : ""}!`);
      } else {
        setRefreshMessage("No new matches found at this time.");
      }
      // Reload matches
      const matchesResult = await getMatchesForDashboard(sortBy);
      if (!matchesResult.error) {
        setMatches(matchesResult.matches);
      }
    } else {
      setRefreshMessage(result.error ?? "Failed to refresh matches.");
    }

    setIsRefreshing(false);

    // Clear message after 5 seconds
    setTimeout(() => setRefreshMessage(null), 5000);
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              We&apos;re looking for compatible matches based on your quiz
              responses. Check back soon or refresh to find new matches.
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Finding matches...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Find matches
                </>
              )}
            </Button>
            {refreshMessage && (
              <p className="mt-4 text-sm text-muted-foreground">
                {refreshMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Top Matches</h2>
          <p className="text-sm text-muted-foreground">
            {matches.length} compatible match{matches.length !== 1 ? "es" : ""}{" "}
            found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={sortBy === "compatibility" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSortChange("compatibility")}
              disabled={isPending}
              className="rounded-r-none"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Compatibility
            </Button>
            <Button
              variant={sortBy === "recent" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSortChange("recent")}
              disabled={isPending}
              className="rounded-l-none border-l"
            >
              Recent
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {refreshMessage && (
        <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-md">
          {refreshMessage}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.matchId} match={match} />
        ))}
      </div>
    </div>
  );
}
