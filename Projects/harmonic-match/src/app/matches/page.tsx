"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  Heart,
  MessageCircle,
  User,
  Sparkles,
  Search,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getMatches, type MatchWithDetails } from "@/lib/matching";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { PhotoJson } from "@/lib/database.types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCompatibilityColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-orange-500";
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// MATCH CARD COMPONENT
// ============================================================================

interface MatchCardProps {
  match: MatchWithDetails;
  onViewProfile: () => void;
  onSendMessage: () => void;
}

function MatchCard({ match, onViewProfile, onSendMessage }: MatchCardProps) {
  const { otherUser, compatibility, lastMessage, match: matchData } = match;
  const photos = (otherUser.photos_json || []) as PhotoJson[];
  const primaryPhoto = photos[0]?.url;
  const compatibilityScore = compatibility?.overall_score ?? 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        {/* Photo */}
        <button
          onClick={onViewProfile}
          className="relative w-24 h-24 flex-shrink-0 sm:w-28 sm:h-28"
        >
          {primaryPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto}
              alt={otherUser.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {/* Compatibility badge */}
          <div
            className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-background/90 text-xs font-bold ${getCompatibilityColor(compatibilityScore)}`}
          >
            {compatibilityScore}%
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <button
              onClick={onViewProfile}
              className="text-left hover:underline"
            >
              <h3 className="font-semibold text-base truncate">
                {otherUser.display_name}
                {otherUser.age && (
                  <span className="font-normal text-muted-foreground">
                    , {otherUser.age}
                  </span>
                )}
              </h3>
            </button>
            {/* Last message or match date */}
            {lastMessage ? (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {lastMessage.isFromCurrentUser && (
                  <span className="text-primary">You: </span>
                )}
                {lastMessage.content}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Matched {formatRelativeTime(matchData.matched_at!)}
              </p>
            )}
          </div>

          {/* Compatibility breakdown */}
          {compatibility && (
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                {compatibility.music_score ?? 0}% music
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                {compatibility.conflict_score ?? 0}% conflict
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 hidden sm:inline-block">
                {compatibility.personality_score ?? 0}% personality
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center pr-3">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full"
            onClick={onSendMessage}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ onDiscover }: { onDiscover: () => void }) {
  return (
    <Card className="p-8 text-center">
      <div className="h-24 w-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
        <Heart className="h-12 w-12 text-muted-foreground" />
      </div>
      <CardTitle className="mb-2">No Matches Yet</CardTitle>
      <CardDescription className="mb-6 max-w-xs mx-auto">
        Keep swiping to find people who share your music taste, conflict style,
        and personality!
      </CardDescription>
      <Button onClick={onDiscover}>
        <Search className="mr-2 h-4 w-4" />
        Discover People
      </Button>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MatchesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getMatches();

    if (result.success) {
      setMatches(result.matches);
    } else {
      setError(result.error || "Failed to load matches");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      fetchMatches();
    }
  }, [user, authLoading, fetchMatches]);

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleSendMessage = (conversationId: string | null) => {
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    }
  };

  const handleDiscover = () => {
    router.push("/discover");
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-primary bg-clip-text text-transparent">
              Matches
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchMatches}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your matches...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <CardTitle className="mb-2 text-destructive">Error</CardTitle>
            <CardDescription className="mb-4">{error}</CardDescription>
            <Button onClick={fetchMatches}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Card>
        ) : matches.length === 0 ? (
          <EmptyState onDiscover={handleDiscover} />
        ) : (
          <div className="space-y-3">
            {/* Match count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                {matches.length} {matches.length === 1 ? "match" : "matches"}
              </span>
            </div>

            {/* Match list */}
            {matches.map((match) => (
              <MatchCard
                key={match.match.id}
                match={match}
                onViewProfile={() => handleViewProfile(match.otherUser.user_id)}
                onSendMessage={() =>
                  handleSendMessage(match.conversation?.id || null)
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation Hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDiscover}
          className="rounded-full shadow-lg"
        >
          <Music className="mr-2 h-4 w-4" />
          Keep Discovering
        </Button>
      </div>
    </div>
  );
}
