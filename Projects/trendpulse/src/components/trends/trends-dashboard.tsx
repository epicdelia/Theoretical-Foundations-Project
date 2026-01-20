"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendCard } from "./trend-card";
import { RefreshCw, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import type { TrendSignals } from "@/lib/trends";

interface Trend {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  whyItMatters: string | null;
  sourceUrls: string[];
  signals: TrendSignals;
  velocityScore: number;
  crossPlatformScore: number;
  relevanceScore: number;
  noveltyScore: number;
  totalScore: number;
  sourceCount: number;
  rank: number;
  trendDate: string;
}

interface TrendsDashboardProps {
  initialTrends?: Trend[];
}

export function TrendsDashboard({ initialTrends = [] }: TrendsDashboardProps) {
  const [trends, setTrends] = useState<Trend[]>(initialTrends);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trends/daily");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch trends");
      }

      setTrends(data.data.trends);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerScoring = async () => {
    setScoring(true);
    setError(null);

    try {
      const response = await fetch("/api/trends/score", {
        method: "POST",
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to score trends");
      }

      // Refresh trends after scoring
      await fetchTrends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score trends");
    } finally {
      setScoring(false);
    }
  };

  // Fetch trends on mount if no initial data
  useEffect(() => {
    if (initialTrends.length === 0) {
      fetchTrends();
    } else {
      setLastUpdated(new Date());
    }
  }, [initialTrends.length, fetchTrends]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Today&apos;s Top Trends
          </h2>
          <p className="text-muted-foreground">
            AI-curated trends in Tech & AI, ranked by relevance
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrends}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerScoring}
            disabled={scoring || loading}
          >
            {scoring ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-1" />
            )}
            Score Trends
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && trends.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && trends.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Trends Yet</CardTitle>
            <CardDescription>
              Click &quot;Score Trends&quot; to analyze recent data from all
              connected sources and generate today&apos;s top trends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={triggerScoring} disabled={scoring}>
              {scoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scoring...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Trends
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trends list */}
      {trends.length > 0 && (
        <div className="grid gap-4">
          {trends.map((trend) => (
            <TrendCard
              key={trend.id}
              id={trend.id}
              rank={trend.rank}
              title={trend.title}
              summary={trend.summary}
              whyItMatters={trend.whyItMatters}
              sourceUrls={trend.sourceUrls}
              signals={trend.signals}
              velocityScore={trend.velocityScore}
              crossPlatformScore={trend.crossPlatformScore}
              relevanceScore={trend.relevanceScore}
              noveltyScore={trend.noveltyScore}
              totalScore={trend.totalScore}
              sourceCount={trend.sourceCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
