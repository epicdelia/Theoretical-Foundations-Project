"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, User, MessageCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toggleLike } from "@/lib/dashboard/actions";
import type { MutualMatch } from "@/lib/matches/actions";

interface MutualMatchCardProps {
  match: MutualMatch;
}

export function MutualMatchCard({ match }: MutualMatchCardProps) {
  const [isLiked, setIsLiked] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  const handleUnlike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLiking(true);
    const result = await toggleLike(match.matchedUserId);
    if (result.success) {
      setIsLiked(result.isLiked);
    }
    setIsLiking(false);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const initials = match.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/profile/${match.matchedUserId}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          It&apos;s a Match!
          <Sparkles className="h-4 w-4" />
        </div>
        <CardContent className="p-4 pt-10">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-pink-200">
              {match.photoUrl ? (
                <AvatarImage src={match.photoUrl} alt={match.displayName} />
              ) : null}
              <AvatarFallback className="text-lg bg-pink-50 text-pink-600">
                {initials || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                    {match.displayName}
                    {match.age && (
                      <span className="text-muted-foreground font-normal">
                        , {match.age}
                      </span>
                    )}
                  </h3>
                  {match.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {match.location}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Matched {formatMatchDate(match.matchedAt)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`shrink-0 font-bold ${getCompatibilityColor(match.compatibilityScore)}`}
                >
                  {match.compatibilityScore}%
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(match.dimensionScores)
                    .slice(0, 3)
                    .map(([dimension, score]) => (
                      <div
                        key={dimension}
                        className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                        title={`${dimension}: ${score}%`}
                      >
                        {dimension.slice(0, 3)}: {score}%
                      </div>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/messages/${match.matchedUserId}`;
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
                    onClick={handleUnlike}
                    disabled={isLiking}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
