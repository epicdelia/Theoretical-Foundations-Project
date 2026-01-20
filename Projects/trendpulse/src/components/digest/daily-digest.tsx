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
import { DigestTrendCard } from "./digest-trend-card";
import {
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
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

interface DailyDigestProps {
  maxTrends?: number;
}

export function DailyDigest({ maxTrends = 5 }: DailyDigestProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
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

      // Limit to maxTrends
      const limitedTrends = data.data.trends.slice(0, maxTrends);
      setTrends(limitedTrends);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  }, [maxTrends]);

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

      await fetchTrends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score trends");
    } finally {
      setScoring(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Daily Digest
          </h1>
          <p className="text-muted-foreground max-w-md">
            Your top {maxTrends} AI-curated trends in Tech & AI, ranked by
            relevance and momentum
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrends}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            Refresh
          </Button>
          <Button size="sm" onClick={triggerScoring} disabled={scoring || loading}>
            {scoring ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            Score Trends
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && trends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading today&apos;s trends...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && trends.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No Trends Yet</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Click &quot;Score Trends&quot; to analyze recent data from all
              connected sources and generate today&apos;s top trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button onClick={triggerScoring} disabled={scoring} size="lg">
              {scoring ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Today&apos;s Trends
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trends list */}
      {trends.length > 0 && (
        <div className="grid gap-4 sm:gap-6">
          {trends.map((trend) => (
            <DigestTrendCard
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
