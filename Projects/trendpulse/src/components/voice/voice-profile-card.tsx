"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  RefreshCw,
  Star,
  Loader2,
  MessageSquare,
  Hash,
  Smile,
  Target,
} from "lucide-react";
import type { VoiceProfile } from "@/lib/voice";

interface VoiceProfileCardProps {
  profile: VoiceProfile;
  onDelete: (id: string) => void;
  onReanalyze: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting?: boolean;
  isReanalyzing?: boolean;
}

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  instagram: "Instagram",
};

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-500",
  twitter: "bg-sky-500",
  instagram: "bg-pink-500",
};

export function VoiceProfileCard({
  profile,
  onDelete,
  onReanalyze,
  onSetDefault,
  isDeleting,
  isReanalyzing,
}: VoiceProfileCardProps) {
  return (
    <Card className={profile.is_default ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              {profile.is_default && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Default
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${platformColors[profile.platform]}`}
              />
              {platformLabels[profile.platform]}
              <span className="text-muted-foreground">
                {profile.sample_posts.length} samples
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Voice Analysis Summary */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {profile.tone && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Tone</p>
                <p className="font-medium capitalize">{profile.tone}</p>
              </div>
            </div>
          )}

          {profile.emoji_usage && (
            <div className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Emoji Usage</p>
                <p className="font-medium capitalize">
                  {profile.emoji_usage.split(" ")[0]}
                </p>
              </div>
            </div>
          )}

          {profile.cta_style && (
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">CTA Style</p>
                <p className="font-medium capitalize">{profile.cta_style}</p>
              </div>
            </div>
          )}

          {profile.average_length && (
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Avg Length</p>
                <p className="font-medium">{profile.average_length} chars</p>
              </div>
            </div>
          )}
        </div>

        {/* Common Phrases */}
        {profile.common_phrases.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Common Phrases
            </p>
            <div className="flex flex-wrap gap-1">
              {profile.common_phrases.slice(0, 5).map((phrase, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {phrase}
                </Badge>
              ))}
              {profile.common_phrases.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.common_phrases.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {!profile.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetDefault(profile.id)}
              className="text-xs"
            >
              <Star className="h-3 w-3 mr-1" />
              Set Default
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReanalyze(profile.id)}
            disabled={isReanalyzing}
            className="text-xs"
          >
            {isReanalyzing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Re-analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(profile.id)}
            disabled={isDeleting}
            className="text-xs text-destructive hover:text-destructive ml-auto"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3 mr-1" />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
