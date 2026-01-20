"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreVertical,
  Flag,
  Ban,
  MapPin,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhotoGallery } from "./PhotoGallery";
import { CompatibilityChart } from "./CompatibilityChart";
import { CompatibilityBreakdown } from "./CompatibilityBreakdown";
import { toggleLike } from "@/lib/dashboard/actions";
import { blockUser } from "@/lib/profile/actions";
import type { ProfileWithCompatibility } from "@/lib/profile/actions";

interface ProfileViewProps {
  profile: ProfileWithCompatibility;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const [isLiked, setIsLiked] = useState(profile.isLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(profile.isBlocked);
  const [isBlocking, setIsBlocking] = useState(false);
  const isMutualLike = isLiked && profile.isMutualLike;

  const handleLike = async () => {
    setIsLiking(true);
    const result = await toggleLike(profile.userId);
    if (result.success) {
      setIsLiked(result.isLiked);
    }
    setIsLiking(false);
  };

  const handleBlock = async () => {
    setIsBlocking(true);
    const result = await blockUser(profile.userId);
    if (result.success) {
      setIsBlocked(true);
      setShowMenu(false);
    }
    setIsBlocking(false);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isBlocked) {
    return (
      <div className="container max-w-2xl py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              You have blocked this user.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Photos and Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          {profile.photos.length > 0 ? (
            <PhotoGallery photos={profile.photos} name={profile.displayName} />
          ) : (
            <Card>
              <CardContent className="py-20 flex items-center justify-center">
                <Avatar className="h-32 w-32 border-4 border-secondary">
                  <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                    {initials || <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>
          )}

          {/* Bio and Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile.displayName}
                    {profile.age && (
                      <span className="text-muted-foreground font-normal">
                        , {profile.age}
                      </span>
                    )}
                  </h1>
                  {profile.location && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </p>
                  )}
                  {profile.gender && (
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {profile.gender}
                    </p>
                  )}
                </div>

                {/* Menu Button */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 z-10 bg-background border rounded-md shadow-lg py-1 min-w-[160px]">
                      <button
                        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                        onClick={() => {
                          // Report functionality - placeholder
                          alert("Report functionality coming soon");
                          setShowMenu(false);
                        }}
                      >
                        <Flag className="h-4 w-4" />
                        Report User
                      </button>
                      <button
                        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                        onClick={handleBlock}
                        disabled={isBlocking}
                      >
                        <Ban className="h-4 w-4" />
                        {isBlocking ? "Blocking..." : "Block User"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile.bio ? (
                <p className="text-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  No bio provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Compatibility Breakdown Card */}
          <CompatibilityBreakdown dimensionScores={profile.dimensionScores} />
        </div>

        {/* Right Column - Compatibility Score and Actions */}
        <div className="space-y-6">
          {/* Overall Compatibility Score */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Compatibility Score
              </p>
              <Badge
                variant="outline"
                className={`text-4xl font-bold px-6 py-3 ${getCompatibilityColor(profile.compatibilityScore)}`}
              >
                {profile.compatibilityScore}%
              </Badge>
            </CardContent>
          </Card>

          {/* Compatibility Chart */}
          <CompatibilityChart dimensionScores={profile.dimensionScores} />

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                className={`w-full ${isLiked ? "bg-red-500 hover:bg-red-600" : ""}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart
                  className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`}
                />
                {isLiking ? "..." : isLiked ? "Liked" : "Like"}
              </Button>

              {isMutualLike ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/messages/${profile.userId}`}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Message
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message (Mutual Like Required)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
