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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Layers,
  Sparkles,
  Copy,
  Check,
  Linkedin,
  Twitter,
  Video,
  Lightbulb,
  FileText,
  Loader2,
  Zap,
} from "lucide-react";
import type { TrendSignals } from "@/lib/trends";
import { CopyPlainTextButton } from "@/components/exports";

interface PlatformDraft {
  content: string;
  loading: boolean;
  error: string | null;
}

interface DigestTrendCardProps {
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

const VIDEO_IDEAS = [
  "60-second explainer with screen recordings",
  "Hot take reaction video",
  "Tutorial breakdown with examples",
  "Industry expert interview format",
  "Meme-style quick recap",
];

export function DigestTrendCard({
  id,
  rank,
  title,
  summary,
  whyItMatters,
  sourceUrls,
  signals,
  totalScore,
  sourceCount,
}: DigestTrendCardProps) {
  const [videoIdeasOpen, setVideoIdeasOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string>("linkedin");
  const [drafts, setDrafts] = useState<Record<string, PlatformDraft>>({
    linkedin: { content: "", loading: false, error: null },
    twitter: { content: "", loading: false, error: null },
    reel: { content: "", loading: false, error: null },
  });
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const generateDraft = async (platform: string) => {
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], loading: true, error: null },
    }));

    try {
      const contentType =
        platform === "linkedin"
          ? "linkedin_post"
          : platform === "twitter"
            ? "twitter_thread"
            : "instagram_reel_script";

      const response = await fetch("/api/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trend_id: id,
          content_type: contentType,
          angle: "hot_take",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate content");
      }

      setDrafts((prev) => ({
        ...prev,
        [platform]: {
          content: data.data.content,
          loading: false,
          error: null,
        },
      }));
    } catch (err) {
      setDrafts((prev) => ({
        ...prev,
        [platform]: {
          content: "",
          loading: false,
          error: err instanceof Error ? err.message : "Failed to generate",
        },
      }));
    }
  };

  const copyToClipboard = async (platform: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "reel":
        return <Video className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
      {/* Rank indicator bar */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${
          rank === 1
            ? "bg-gradient-to-b from-yellow-500 to-yellow-600"
            : rank === 2
              ? "bg-gradient-to-b from-gray-400 to-gray-500"
              : rank === 3
                ? "bg-gradient-to-b from-amber-600 to-amber-700"
                : "bg-gradient-to-b from-primary to-primary/50"
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Rank badge */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                rank === 1
                  ? "bg-yellow-500/10 text-yellow-500 ring-2 ring-yellow-500/30"
                  : rank === 2
                    ? "bg-gray-400/10 text-gray-400 ring-2 ring-gray-400/30"
                    : rank === 3
                      ? "bg-amber-600/10 text-amber-600 ring-2 ring-amber-600/30"
                      : "bg-primary/10 text-primary"
              }`}
            >
              {rank}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl leading-tight">
                {title}
              </CardTitle>
              <CardDescription className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {sourceCount} source{sourceCount !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground">|</span>
                <span
                  className={`flex items-center gap-1 font-medium ${getScoreColor(totalScore)}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Score: {totalScore}/100
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        )}

        {/* Why it matters */}
        {whyItMatters && (
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm">
              <span className="font-semibold text-primary">
                Why it matters:{" "}
              </span>
              {whyItMatters}
            </p>
          </div>
        )}

        {/* Signals/Keywords */}
        {signals.matchedKeywords && signals.matchedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signals.matchedKeywords.slice(0, 6).map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="text-xs font-normal"
              >
                <Hash className="h-2.5 w-2.5 mr-0.5" />
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Source URLs */}
        {sourceUrls.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {sourceUrls.slice(0, 3).map((url, index) => {
                const domain = new URL(url).hostname.replace("www.", "");
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-muted/50 rounded-md hover:bg-muted"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {domain}
                  </a>
                );
              })}
              {sourceUrls.length > 3 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{sourceUrls.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Video Ideas Section */}
        <Collapsible open={videoIdeasOpen} onOpenChange={setVideoIdeasOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-3 py-2 h-auto"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Video Ideas
              </span>
              {videoIdeasOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2 pl-6">
              {VIDEO_IDEAS.map((idea, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{idea}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Drafts Section */}
        <Collapsible open={draftsOpen} onOpenChange={setDraftsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-3 py-2 h-auto"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-blue-500" />
                Content Drafts
              </span>
              {draftsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Tabs value={activePlatform} onValueChange={setActivePlatform}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="linkedin" className="gap-1.5 text-xs sm:text-sm">
                  <Linkedin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </TabsTrigger>
                <TabsTrigger value="twitter" className="gap-1.5 text-xs sm:text-sm">
                  <Twitter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Twitter</span>
                </TabsTrigger>
                <TabsTrigger value="reel" className="gap-1.5 text-xs sm:text-sm">
                  <Video className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reel</span>
                </TabsTrigger>
              </TabsList>

              {["linkedin", "twitter", "reel"].map((platform) => (
                <TabsContent key={platform} value={platform} className="mt-3">
                  {drafts[platform].content ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {drafts[platform].content}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(platform, drafts[platform].content)
                          }
                        >
                          {copiedPlatform === platform ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => generateDraft(platform)}
                          disabled={drafts[platform].loading}
                        >
                          {drafts[platform].loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                        <CopyPlainTextButton
                          content={drafts[platform].content}
                          platform="buffer"
                          label="Buffer/Metricool"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      {drafts[platform].error ? (
                        <div className="space-y-2">
                          <p className="text-sm text-destructive">
                            {drafts[platform].error}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateDraft(platform)}
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => generateDraft(platform)}
                          disabled={drafts[platform].loading}
                          className="gap-2"
                        >
                          {drafts[platform].loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              {getPlatformIcon(platform)}
                              Generate{" "}
                              {platform === "linkedin"
                                ? "LinkedIn"
                                : platform === "twitter"
                                  ? "Twitter"
                                  : "Reel"}{" "}
                              Draft
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
