"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBreakdown } from "./score-breakdown";
import { ContentGenerator } from "@/components/content";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Layers,
  Sparkles,
} from "lucide-react";
import type { TrendSignals } from "@/lib/trends";

interface TrendCardProps {
  id: string;
  rank: number;
  title: string;
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
}

export function TrendCard({
  id,
  rank,
  title,
  summary,
  whyItMatters,
  sourceUrls,
  signals,
  velocityScore,
  crossPlatformScore,
  relevanceScore,
  noveltyScore,
  totalScore,
  sourceCount,
}: TrendCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {rank}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg leading-tight">{title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {sourceCount} source{sourceCount !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground">|</span>
                <ScoreBreakdown
                  velocity={velocityScore}
                  crossPlatform={crossPlatformScore}
                  relevance={relevanceScore}
                  novelty={noveltyScore}
                  total={totalScore}
                  compact
                />
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {summary && (
          <p className="text-sm text-muted-foreground mb-3">{summary}</p>
        )}

        {whyItMatters && (
          <div className="mb-3 p-2 bg-muted/50 rounded-md">
            <p className="text-sm">
              <span className="font-medium">Why it matters: </span>
              {whyItMatters}
            </p>
          </div>
        )}

        {/* Keywords/Signals */}
        {signals.matchedKeywords && signals.matchedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {signals.matchedKeywords.slice(0, 5).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                <Hash className="h-2.5 w-2.5 mr-0.5" />
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View details
              </>
            )}
          </Button>
          <Button
            variant={showGenerator ? "secondary" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => setShowGenerator(!showGenerator)}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {showGenerator ? "Hide Generator" : "Generate Content"}
          </Button>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Full score breakdown */}
            <ScoreBreakdown
              velocity={velocityScore}
              crossPlatform={crossPlatformScore}
              relevance={relevanceScore}
              novelty={noveltyScore}
              total={totalScore}
            />

            {/* Source URLs */}
            {sourceUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sources</h4>
                <ul className="space-y-1">
                  {sourceUrls.slice(0, 5).map((url, index) => (
                    <li key={index}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signal details */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Mentions (24h): {signals.mentionCount24h}</p>
              <p>Source types: {signals.sourceTypes.join(", ")}</p>
              {signals.daysSinceLastSeen !== null && (
                <p>Days since last seen: {signals.daysSinceLastSeen}</p>
              )}
            </div>
          </div>
        )}

        {/* Content Generator */}
        {showGenerator && (
          <div className="mt-4 pt-4 border-t">
            <ContentGenerator
              trendId={id}
              trendTitle={title}
              sourceUrls={sourceUrls}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
