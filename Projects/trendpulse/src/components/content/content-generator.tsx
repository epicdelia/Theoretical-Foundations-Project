"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  MessageCircle,
  RefreshCw,
  Copy,
  Check,
  Heart,
  ExternalLink,
} from "lucide-react";
import type { ContentType, ContentAngle } from "@/lib/supabase/types";

interface VoiceProfile {
  id: string;
  name: string;
  platform: string;
}

interface GeneratedContent {
  id: string;
  content: string;
  content_type: ContentType;
  angle: ContentAngle | null;
  is_favorite: boolean;
  metadata: {
    trend_title: string;
    source_urls: string[];
    generation_params?: {
      voice_profile_name?: string;
    };
  };
  created_at: string;
}

interface ContentGeneratorProps {
  trendId: string;
  trendTitle: string;
  sourceUrls: string[];
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "linkedin_post",
    label: "LinkedIn Post",
    icon: <Linkedin className="h-4 w-4" />,
    description: "Long-form, professional",
  },
  {
    value: "twitter_thread",
    label: "Twitter Thread",
    icon: <Twitter className="h-4 w-4" />,
    description: "Hook + 5-8 tweets",
  },
  {
    value: "instagram_reel_script",
    label: "Instagram Reel",
    icon: <Instagram className="h-4 w-4" />,
    description: "30-45s script",
  },
  {
    value: "reply",
    label: "Reply Bank",
    icon: <MessageCircle className="h-4 w-4" />,
    description: "5 spicy replies",
  },
];

const ANGLES: { value: ContentAngle; label: string; emoji: string }[] = [
  { value: "hot_take", label: "Hot Take", emoji: "🔥" },
  { value: "tutorial", label: "Tutorial", emoji: "📚" },
  { value: "founder_story", label: "Founder Story", emoji: "🚀" },
  { value: "meme", label: "Meme", emoji: "😂" },
  { value: "explainer", label: "Explainer", emoji: "💡" },
];

export function ContentGenerator({
  trendId,
  trendTitle,
  sourceUrls,
}: ContentGeneratorProps) {
  const [contentType, setContentType] = useState<ContentType>("linkedin_post");
  const [angle, setAngle] = useState<ContentAngle>("hot_take");
  const [voiceProfileId, setVoiceProfileId] = useState<string>("");
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch voice profiles on mount
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("/api/voice-profiles");
        const data = await response.json();
        if (data.success) {
          setVoiceProfiles(data.data);
        }
      } catch {
        // Voice profiles are optional, so we don't show an error
      }
    }
    fetchProfiles();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trend_id: trendId,
          content_type: contentType,
          angle: contentType !== "reply" ? angle : undefined,
          voice_profile_id: voiceProfileId || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate content");
      }

      setGeneratedContent(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;

    try {
      await navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);

      // Mark as copied in the backend
      await fetch(`/api/content-generation/${generatedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_copied" }),
      });

      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  const handleToggleFavorite = async () => {
    if (!generatedContent) return;

    try {
      const response = await fetch(`/api/content-generation/${generatedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_favorite" }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data.data);
      }
    } catch {
      // Silently fail for favorite toggle
    }
  };

  // Filter voice profiles based on content type
  const filteredProfiles = voiceProfiles.filter((profile) => {
    if (contentType === "linkedin_post") return profile.platform === "linkedin";
    if (contentType === "twitter_thread" || contentType === "reply")
      return profile.platform === "twitter";
    if (contentType === "instagram_reel_script")
      return profile.platform === "instagram";
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate Content
        </CardTitle>
        <CardDescription>
          Create platform-specific content for &quot;{trendTitle}&quot;
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Content Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setContentType(type.value);
                  setVoiceProfileId("");
                }}
                className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                  contentType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {type.icon}
                <span className="text-sm font-medium mt-1">{type.label}</span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Angle Selection (not for reply bank) */}
        {contentType !== "reply" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Content Angle</label>
            <div className="flex flex-wrap gap-2">
              {ANGLES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAngle(a.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    angle === a.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice Profile Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice Profile (Optional)</label>
          <Select
            value={voiceProfileId}
            onChange={(e) => setVoiceProfileId(e.target.value)}
          >
            <option value="">No voice profile</option>
            {filteredProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
          {filteredProfiles.length === 0 && voiceProfiles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              No voice profiles for this platform. Create one in the Voice Profiles tab.
            </p>
          )}
        </div>

        {/* Source URLs Citation Notice */}
        {sourceUrls.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Content will cite these {sourceUrls.length} verified source{sourceUrls.length !== 1 ? "s" : ""}.
              No facts will be hallucinated.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : generatedContent ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Generated Content Display */}
        {generatedContent && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {CONTENT_TYPES.find((t) => t.value === generatedContent.content_type)?.label}
                </Badge>
                {generatedContent.angle && (
                  <Badge variant="secondary">
                    {ANGLES.find((a) => a.value === generatedContent.angle)?.emoji}{" "}
                    {ANGLES.find((a) => a.value === generatedContent.angle)?.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  title={generatedContent.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      generatedContent.is_favorite ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {generatedContent.content}
              </pre>
            </div>

            {generatedContent.metadata.generation_params?.voice_profile_name && (
              <p className="text-xs text-muted-foreground">
                Generated with voice profile: {generatedContent.metadata.generation_params.voice_profile_name}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
