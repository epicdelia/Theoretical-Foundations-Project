"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  X,
  Heart,
  MapPin,
  User,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { likeUser, passUser, type LikeResult } from "@/lib/matching";
import { MatchNotification } from "@/components/matching";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type {
  UserProfile,
  MusicProfile,
  CompatibilityScore,
  TopArtistJson,
  MusicPersonalityType,
} from "@/lib/database.types";

// ============================================================================
// TYPES
// ============================================================================

interface DiscoverProfile {
  userProfile: UserProfile;
  musicProfile: MusicProfile;
  compatibility: CompatibilityScore;
}

interface FilterState {
  ageMin: number;
  ageMax: number;
  minCompatibility: number;
}

const DEFAULT_FILTERS: FilterState = {
  ageMin: 18,
  ageMax: 99,
  minCompatibility: 0,
};

// ============================================================================
// MUSIC PERSONALITY LABELS
// ============================================================================

const MUSIC_PERSONALITY_LABELS: Record<MusicPersonalityType, { label: string; description: string }> = {
  explorer: {
    label: "Explorer",
    description: "Always discovering new sounds",
  },
  loyalist: {
    label: "Loyalist",
    description: "Deep connection to favorite artists",
  },
  eclectic: {
    label: "Eclectic",
    description: "Diverse taste across genres",
  },
  mood_matcher: {
    label: "Mood Matcher",
    description: "Music fits the moment",
  },
  social_listener: {
    label: "Social Listener",
    description: "Music brings people together",
  },
};

// ============================================================================
// PROFILE CARD COMPONENT
// ============================================================================

interface ProfileCardProps {
  profile: DiscoverProfile;
  onLike: () => void;
  onPass: () => void;
  onViewProfile: () => void;
  isAnimating: boolean;
  animationDirection: "left" | "right" | null;
}

function ProfileCard({
  profile,
  onLike,
  onPass,
  onViewProfile,
  isAnimating,
  animationDirection,
}: ProfileCardProps) {
  const { userProfile, musicProfile, compatibility } = profile;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = userProfile.photos_json || [];
  const currentPhoto = photos[currentPhotoIndex]?.url;
  const topArtists = (musicProfile.top_artists_json || []).slice(0, 3);
  const musicPersonality = musicProfile.music_personality;
  const compatibilityScore = compatibility.overall_score ?? 0;

  const nextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div
      className={`absolute inset-0 transition-all duration-300 ${
        isAnimating
          ? animationDirection === "left"
            ? "-translate-x-full rotate-[-20deg] opacity-0"
            : "translate-x-full rotate-[20deg] opacity-0"
          : ""
      }`}
    >
      <Card className="h-full overflow-hidden flex flex-col bg-card">
        {/* Photo Section */}
        <div className="relative flex-1 min-h-0">
          {currentPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto}
                alt={userProfile.display_name}
                className="w-full h-full object-cover"
              />
              {/* Photo navigation overlays */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-0 top-0 bottom-0 w-1/3 focus:outline-none"
                    aria-label="Previous photo"
                  />
                  <button
                    onClick={nextPhoto}
                    className="absolute right-0 top-0 bottom-0 w-1/3 focus:outline-none"
                    aria-label="Next photo"
                  />
                  {/* Photo indicators */}
                  <div className="absolute top-3 left-3 right-3 flex gap-1">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          idx === currentPhotoIndex
                            ? "bg-white"
                            : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="h-24 w-24 text-muted-foreground/50" />
            </div>
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Profile info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">
                  {userProfile.display_name}
                  {userProfile.age && (
                    <span className="font-normal">, {userProfile.age}</span>
                  )}
                </h2>
                {userProfile.location && (
                  <p className="flex items-center gap-1 text-sm text-white/80 mt-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{userProfile.location}</span>
                  </p>
                )}
              </div>
              {/* Compatibility badge */}
              <div className="flex-shrink-0 text-right">
                <div
                  className={`text-3xl font-bold ${getCompatibilityColor(compatibilityScore)}`}
                >
                  {compatibilityScore}%
                </div>
                <p className="text-xs text-white/70">match</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <CardContent className="p-4 space-y-4">
          {/* Music Personality */}
          {musicPersonality && MUSIC_PERSONALITY_LABELS[musicPersonality] && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {MUSIC_PERSONALITY_LABELS[musicPersonality].label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {MUSIC_PERSONALITY_LABELS[musicPersonality].description}
                </p>
              </div>
            </div>
          )}

          {/* Top Artists */}
          {topArtists.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top Artists
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {topArtists.map((artist: TopArtistJson) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted flex-shrink-0"
                  >
                    {artist.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Music className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {artist.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <p className="text-lg font-bold text-purple-500">
                {compatibility.music_score ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Music</p>
            </div>
            <div className="p-2 rounded-lg bg-electric-500/10">
              <p className="text-lg font-bold text-blue-500">
                {compatibility.conflict_score ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Conflict</p>
            </div>
            <div className="p-2 rounded-lg bg-warmth-500/10">
              <p className="text-lg font-bold text-orange-500">
                {compatibility.personality_score ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Personality</p>
            </div>
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewProfile}
          >
            View Full Profile
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>

        {/* Action Buttons */}
        <div className="p-4 pt-0 flex justify-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={onPass}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            onClick={onLike}
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// FILTER PANEL COMPONENT
// ============================================================================

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
  };

  return (
    <Card className="absolute inset-4 z-20 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Refine your potential matches
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Age Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Age Range</Label>
            <span className="text-sm text-muted-foreground">
              {localFilters.ageMin} - {localFilters.ageMax}
            </span>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Minimum Age</Label>
              <Slider
                value={[localFilters.ageMin]}
                onValueChange={([value]) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    ageMin: Math.min(value, prev.ageMax - 1),
                  }))
                }
                min={18}
                max={99}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Maximum Age</Label>
              <Slider
                value={[localFilters.ageMax]}
                onValueChange={([value]) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    ageMax: Math.max(value, prev.ageMin + 1),
                  }))
                }
                min={18}
                max={99}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Minimum Compatibility */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Minimum Compatibility</Label>
            <span className="text-sm text-muted-foreground">
              {localFilters.minCompatibility}%
            </span>
          </div>
          <Slider
            value={[localFilters.minCompatibility]}
            onValueChange={([value]) =>
              setLocalFilters((prev) => ({ ...prev, minCompatibility: value }))
            }
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground">
            Only show profiles with at least this compatibility score
          </p>
        </div>
      </CardContent>
      <div className="p-4 border-t flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
}

function EmptyState({ hasFilters, onResetFilters, onRefresh }: EmptyStateProps) {
  return (
    <Card className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <CardTitle className="mb-2">No More Profiles</CardTitle>
      <CardDescription className="mb-6 max-w-xs">
        {hasFilters
          ? "No profiles match your current filters. Try adjusting them to see more people."
          : "You've seen all available profiles for now. Check back later for new matches!"}
      </CardDescription>
      <div className="flex gap-3">
        {hasFilters && (
          <Button variant="outline" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
        <Button onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN DISCOVER PAGE
// ============================================================================

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"left" | "right" | null>(null);
  const [passedProfiles, setPassedProfiles] = useState<Set<string>>(new Set());
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [matchNotification, setMatchNotification] = useState<LikeResult | null>(null);

  // Fetch profiles with compatibility scores
  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch compatibility scores for the current user
      const { data: compatibilityData, error: compatError } = await supabase
        .from("compatibility_scores")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("overall_score", { ascending: false });

      if (compatError) throw compatError;

      if (!compatibilityData || compatibilityData.length === 0) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Get other user IDs
      const otherUserIds = compatibilityData.map((score) =>
        score.user1_id === user.id ? score.user2_id : score.user1_id
      );

      // Fetch user profiles
      const { data: userProfiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .in("user_id", otherUserIds);

      if (profileError) throw profileError;

      // Fetch music profiles
      const { data: musicProfiles, error: musicError } = await supabase
        .from("music_profiles")
        .select("*")
        .in("user_id", otherUserIds);

      if (musicError) throw musicError;

      // Fetch already liked/passed profiles from matches table
      const { data: existingMatches } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const alreadyInteracted = new Set<string>();
      if (existingMatches) {
        existingMatches.forEach((match) => {
          const isUser1 = match.user1_id === user.id;
          const otherUserId = isUser1 ? match.user2_id : match.user1_id;
          const hasInteracted = isUser1 ? match.user1_liked !== null : match.user2_liked !== null;
          if (hasInteracted) {
            alreadyInteracted.add(otherUserId);
          }
        });
      }

      // Combine data
      const combinedProfiles: DiscoverProfile[] = compatibilityData
        .map((score) => {
          const otherUserId = score.user1_id === user.id ? score.user2_id : score.user1_id;
          const userProfile = userProfiles?.find((p) => p.user_id === otherUserId);
          const musicProfile = musicProfiles?.find((p) => p.user_id === otherUserId);

          if (!userProfile || !musicProfile) return null;

          return {
            userProfile: userProfile as UserProfile,
            musicProfile: musicProfile as MusicProfile,
            compatibility: score as CompatibilityScore,
          };
        })
        .filter((p): p is DiscoverProfile => p !== null)
        .filter((p) => !alreadyInteracted.has(p.userProfile.user_id));

      setProfiles(combinedProfiles);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError("Failed to load profiles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfiles();
    }
  }, [user, authLoading, fetchProfiles]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const { userProfile, compatibility } = profile;

      // Filter by age
      if (userProfile.age !== null) {
        if (userProfile.age < filters.ageMin || userProfile.age > filters.ageMax) {
          return false;
        }
      }

      // Filter by minimum compatibility
      if ((compatibility.overall_score ?? 0) < filters.minCompatibility) {
        return false;
      }

      // Filter out passed and liked profiles
      if (passedProfiles.has(userProfile.user_id) || likedProfiles.has(userProfile.user_id)) {
        return false;
      }

      return true;
    });
  }, [profiles, filters, passedProfiles, likedProfiles]);

  const currentProfile = filteredProfiles[currentIndex];

  const hasActiveFilters = useMemo(() => {
    return (
      filters.ageMin !== DEFAULT_FILTERS.ageMin ||
      filters.ageMax !== DEFAULT_FILTERS.ageMax ||
      filters.minCompatibility !== DEFAULT_FILTERS.minCompatibility
    );
  }, [filters]);

  // Handle like action
  const handleLike = useCallback(async () => {
    if (!currentProfile || !user || isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection("right");

    const otherUserId = currentProfile.userProfile.user_id;

    try {
      const result = await likeUser(otherUserId);

      if (result.success) {
        setLikedProfiles((prev) => new Set([...prev, otherUserId]));

        // Show match notification if it's a match
        if (result.isMatch && result.matchedUser) {
          setMatchNotification(result);
        }
      }
    } catch (err) {
      console.error("Error recording like:", err);
    }

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  }, [currentProfile, user, isAnimating]);

  // Handle pass action
  const handlePass = useCallback(async () => {
    if (!currentProfile || !user || isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection("left");

    const otherUserId = currentProfile.userProfile.user_id;

    try {
      const result = await passUser(otherUserId);

      if (result.success) {
        setPassedProfiles((prev) => new Set([...prev, otherUserId]));
      }
    } catch (err) {
      console.error("Error recording pass:", err);
    }

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  }, [currentProfile, user, isAnimating]);

  // Handle view profile
  const handleViewProfile = useCallback(() => {
    if (!currentProfile) return;
    router.push(`/profile/${currentProfile.userProfile.user_id}`);
  }, [currentProfile, router]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentIndex(0);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setPassedProfiles(new Set());
    setLikedProfiles(new Set());
    fetchProfiles();
  }, [fetchProfiles]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFilters || isAnimating || !currentProfile) return;

      if (e.key === "ArrowLeft") {
        handlePass();
      } else if (e.key === "ArrowRight") {
        handleLike();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFilters, isAnimating, currentProfile, handlePass, handleLike]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Discover
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(true)}
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 relative">
        <div className="max-w-md mx-auto h-full relative" style={{ minHeight: "70vh" }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Finding your matches...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <X className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="mb-2">Something went wrong</CardTitle>
              <CardDescription className="mb-6">{error}</CardDescription>
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Card>
          ) : currentProfile ? (
            <ProfileCard
              profile={currentProfile}
              onLike={handleLike}
              onPass={handlePass}
              onViewProfile={handleViewProfile}
              isAnimating={isAnimating}
              animationDirection={animationDirection}
            />
          ) : (
            <EmptyState
              hasFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              onRefresh={handleRefresh}
            />
          )}

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentIndex(0);
              }}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>
      </main>

      {/* Footer hint */}
      {currentProfile && !showFilters && (
        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd> Pass
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd> Like
            </span>
          </p>
        </footer>
      )}

      {/* Progress indicator */}
      {filteredProfiles.length > 0 && currentProfile && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur border shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {currentIndex + 1} of {filteredProfiles.length} matches
            </span>
          </div>
        </div>
      )}

      {/* Match Notification */}
      {matchNotification?.isMatch && matchNotification.matchedUser && (
        <MatchNotification
          isOpen={true}
          onClose={() => setMatchNotification(null)}
          matchedUser={matchNotification.matchedUser}
          conversationId={matchNotification.conversationId}
        />
      )}
    </div>
  );
}
