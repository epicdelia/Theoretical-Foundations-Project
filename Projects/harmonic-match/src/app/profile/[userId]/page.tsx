"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Music,
  Loader2,
  ArrowLeft,
  MapPin,
  User,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Handshake,
  Scale,
  EyeOff,
  Brain,
  Lightbulb,
  CheckCircle,
  Users,
  Play,
  Pause,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  UserProfile,
  MusicProfile,
  ConflictStyleRecord,
  PersonalityAssessment,
  CompatibilityScore,
  TopArtistJson,
  PhotoJson,
  BigFiveScoresJson,
  ConflictStyle,
  MusicPersonalityType,
} from "@/lib/database.types";

// ============================================================================
// TYPES
// ============================================================================

interface ProfileData {
  userProfile: UserProfile;
  musicProfile: MusicProfile;
  conflictStyle: ConflictStyleRecord;
  personality: PersonalityAssessment;
  compatibility: CompatibilityScore | null;
}

interface TrackJson {
  id: string;
  name: string;
  artist: string;
  album?: string;
  preview_url?: string;
  album_image_url?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MUSIC_PERSONALITY_LABELS: Record<
  MusicPersonalityType,
  { label: string; description: string }
> = {
  explorer: {
    label: "Indie Explorer",
    description: "Always discovering new artists and genres",
  },
  loyalist: {
    label: "Dedicated Fan",
    description: "Deep connection to favorite artists",
  },
  eclectic: {
    label: "Genre Blender",
    description: "Diverse taste across genres",
  },
  mood_matcher: {
    label: "Mood Curator",
    description: "Music fits the moment",
  },
  social_listener: {
    label: "Pop Enthusiast",
    description: "Finger on the pulse of what's hot",
  },
};

const CONFLICT_STYLE_INFO: Record<
  ConflictStyle,
  {
    label: string;
    description: string;
    icon: typeof Shield;
    color: string;
  }
> = {
  competing: {
    label: "The Competitor",
    description: "Assertive and confident in pursuing goals",
    icon: Shield,
    color: "text-red-500",
  },
  collaborating: {
    label: "The Collaborator",
    description: "Seeks win-win solutions for everyone",
    icon: Handshake,
    color: "text-green-500",
  },
  compromising: {
    label: "The Compromiser",
    description: "Finds middle ground where everyone gives a little",
    icon: Scale,
    color: "text-blue-500",
  },
  avoiding: {
    label: "The Peacekeeper",
    description: "Prefers to sidestep conflict when possible",
    icon: EyeOff,
    color: "text-purple-500",
  },
  accommodating: {
    label: "The Accommodator",
    description: "Prioritizes relationships and harmony",
    icon: Heart,
    color: "text-pink-500",
  },
};

type BigFiveTrait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";

const TRAIT_INFO: Record<
  BigFiveTrait,
  {
    label: string;
    icon: typeof Brain;
    color: string;
    lowLabel: string;
    highLabel: string;
  }
> = {
  openness: {
    label: "Openness",
    icon: Lightbulb,
    color: "text-purple-500",
    lowLabel: "Practical",
    highLabel: "Creative",
  },
  conscientiousness: {
    label: "Conscientiousness",
    icon: CheckCircle,
    color: "text-blue-500",
    lowLabel: "Flexible",
    highLabel: "Organized",
  },
  extraversion: {
    label: "Extraversion",
    icon: Users,
    color: "text-yellow-500",
    lowLabel: "Introverted",
    highLabel: "Extraverted",
  },
  agreeableness: {
    label: "Agreeableness",
    icon: Heart,
    color: "text-pink-500",
    lowLabel: "Competitive",
    highLabel: "Cooperative",
  },
  neuroticism: {
    label: "Emotional Stability",
    icon: Sparkles,
    color: "text-green-500",
    lowLabel: "Sensitive",
    highLabel: "Resilient",
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PhotoGallery({
  photos,
  displayName,
}: {
  photos: PhotoJson[];
  displayName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  if (photos.length === 0) {
    return (
      <div className="aspect-[3/4] bg-muted flex items-center justify-center rounded-xl">
        <User className="h-24 w-24 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[currentIndex]?.url}
        alt={`${displayName} photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Navigation overlays */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 focus:outline-none"
            aria-label="Previous photo"
          />
          <button
            onClick={goToNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 focus:outline-none"
            aria-label="Next photo"
          />

          {/* Photo indicators */}
          <div className="absolute top-3 left-3 right-3 flex gap-1">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Arrow buttons */}
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

function CompatibilityBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "from-green-500 to-emerald-500";
    if (s >= 60) return "from-yellow-500 to-orange-500";
    return "from-orange-500 to-red-500";
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getColor(
        score
      )} text-white shadow-lg`}
    >
      <Sparkles className="h-5 w-5" />
      <span className="text-2xl font-bold">{score}%</span>
      <span className="text-sm opacity-90">match</span>
    </div>
  );
}

function CompatibilityBreakdown({
  compatibility,
}: {
  compatibility: CompatibilityScore;
}) {
  const scores = [
    {
      label: "Music",
      score: compatibility.music_score ?? 0,
      color: "bg-purple-500",
      description: "Based on genres, artists, and audio preferences",
    },
    {
      label: "Conflict",
      score: compatibility.conflict_score ?? 0,
      color: "bg-blue-500",
      description: "How well your conflict styles complement",
    },
    {
      label: "Personality",
      score: compatibility.personality_score ?? 0,
      color: "bg-orange-500",
      description: "Big Five personality trait alignment",
    },
  ];

  return (
    <div className="space-y-4">
      {scores.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{item.label}</span>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <span className="text-xl font-bold">{item.score}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-500`}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicCompatibilitySection({
  currentUserMusic,
  profileMusic,
}: {
  currentUserMusic: MusicProfile | null;
  profileMusic: MusicProfile;
}) {
  const profileGenres = profileMusic.top_genres_json || [];
  const profileArtists = profileMusic.top_artists_json || [];
  const currentGenres = currentUserMusic?.top_genres_json || [];
  const currentArtists = currentUserMusic?.top_artists_json || [];

  // Find shared genres
  const sharedGenres = profileGenres.filter((g) => currentGenres.includes(g));

  // Find shared artists
  const currentArtistIds = new Set(currentArtists.map((a) => a.id));
  const sharedArtists = profileArtists.filter((a) => currentArtistIds.has(a.id));

  const musicPersonality = profileMusic.music_personality;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Music Compatibility
        </CardTitle>
        <CardDescription>
          How your music tastes align
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Music Personality */}
        {musicPersonality && MUSIC_PERSONALITY_LABELS[musicPersonality] && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {MUSIC_PERSONALITY_LABELS[musicPersonality].label}
              </p>
              <p className="text-sm text-muted-foreground">
                {MUSIC_PERSONALITY_LABELS[musicPersonality].description}
              </p>
            </div>
          </div>
        )}

        {/* Shared Genres */}
        {sharedGenres.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Genres You Both Love
            </p>
            <div className="flex flex-wrap gap-2">
              {sharedGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Their Top Genres */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Their Top Genres
          </p>
          <div className="flex flex-wrap gap-2">
            {profileGenres.slice(0, 8).map((genre) => (
              <span
                key={genre}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sharedGenres.includes(genre)
                    ? "bg-green-500/10 text-green-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Shared Artists */}
        {sharedArtists.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Artists You Both Listen To
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {sharedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
                    {artist.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-[80px] truncate">
                    {artist.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Their Top Artists */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Their Top Artists
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {profileArtists.slice(0, 6).map((artist: TopArtistJson) => (
              <div
                key={artist.id}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className={`h-16 w-16 rounded-full overflow-hidden bg-muted ${
                    currentArtistIds.has(artist.id)
                      ? "ring-2 ring-green-500 ring-offset-2"
                      : ""
                  }`}
                >
                  {artist.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px] truncate">
                  {artist.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SoundtrackSection({
  tracks,
}: {
  tracks: TrackJson[];
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const togglePlay = (track: TrackJson) => {
    if (!track.preview_url) return;

    if (playingId === track.id) {
      audio?.pause();
      setPlayingId(null);
      setAudio(null);
    } else {
      audio?.pause();
      const newAudio = new Audio(track.preview_url);
      newAudio.play();
      newAudio.onended = () => {
        setPlayingId(null);
        setAudio(null);
      };
      setAudio(newAudio);
      setPlayingId(track.id);
    }
  };

  useEffect(() => {
    return () => {
      audio?.pause();
    };
  }, [audio]);

  if (tracks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Their Soundtrack
        </CardTitle>
        <CardDescription>Top 5 tracks they&apos;ve been vibing to</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tracks.slice(0, 5).map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                {index + 1}
              </span>
              <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                {track.album_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.album_image_url}
                    alt={track.album || track.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist}
                </p>
              </div>
              {track.preview_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-10 w-10 rounded-full"
                  onClick={() => togglePlay(track)}
                >
                  {playingId === track.id ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConflictStyleSection({
  conflictStyle,
  currentUserConflict,
}: {
  conflictStyle: ConflictStyleRecord;
  currentUserConflict: ConflictStyleRecord | null;
}) {
  const primary = conflictStyle.primary_style;
  const secondary = conflictStyle.secondary_style;
  const info = CONFLICT_STYLE_INFO[primary];
  const PrimaryIcon = info.icon;
  const secondaryInfo = secondary ? CONFLICT_STYLE_INFO[secondary] : null;

  // Determine compatibility message
  let compatibilityMessage = "";
  if (currentUserConflict) {
    const userPrimary = currentUserConflict.primary_style;
    if (userPrimary === "collaborating" && primary === "collaborating") {
      compatibilityMessage = "You both value working together to find solutions!";
    } else if (
      (userPrimary === "accommodating" && primary === "competing") ||
      (userPrimary === "competing" && primary === "accommodating")
    ) {
      compatibilityMessage =
        "Your styles complement each other - one leads, one supports.";
    } else if (userPrimary === primary) {
      compatibilityMessage = "You share the same conflict resolution approach!";
    } else {
      compatibilityMessage =
        "Different styles can bring balance to your relationship.";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Conflict Style
        </CardTitle>
        <CardDescription>How they navigate disagreements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Style */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <div
            className={`h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center`}
          >
            <PrimaryIcon className={`h-6 w-6 ${info.color}`} />
          </div>
          <div>
            <p className="font-semibold">{info.label}</p>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>

        {/* Secondary Style */}
        {secondaryInfo && (
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <secondaryInfo.icon
              className={`h-5 w-5 ${secondaryInfo.color}`}
            />
            <div>
              <p className="text-sm font-medium">
                Secondary: {secondaryInfo.label}
              </p>
            </div>
          </div>
        )}

        {/* Compatibility Message */}
        {compatibilityMessage && (
          <div className="p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">
            <Sparkles className="h-4 w-4 inline mr-2" />
            {compatibilityMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PersonalitySection({
  personality,
  currentUserPersonality,
}: {
  personality: PersonalityAssessment;
  currentUserPersonality: PersonalityAssessment | null;
}) {
  const scores = personality.scores_json as BigFiveScoresJson;
  const currentScores = currentUserPersonality?.scores_json as
    | BigFiveScoresJson
    | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Personality Traits
        </CardTitle>
        <CardDescription>Big Five personality comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(Object.keys(TRAIT_INFO) as BigFiveTrait[]).map((trait) => {
            const info = TRAIT_INFO[trait];
            const theirScore = scores[trait] ?? 50;
            const yourScore = currentScores?.[trait];
            const Icon = info.icon;

            return (
              <div key={trait} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${info.color}`} />
                    <span className="font-medium text-sm">{info.label}</span>
                  </div>
                  <span className="text-sm font-bold">{theirScore}</span>
                </div>
                <div className="relative">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{info.lowLabel}</span>
                    <span>{info.highLabel}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    {/* Their score bar */}
                    <div
                      className={`h-full rounded-full bg-primary transition-all duration-500`}
                      style={{ width: `${theirScore}%` }}
                    />
                    {/* Your score marker */}
                    {yourScore !== undefined && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-green-500 rounded-full"
                        style={{ left: `${yourScore}%` }}
                        title={`You: ${yourScore}`}
                      />
                    )}
                  </div>
                  {yourScore !== undefined && (
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-green-600">
                        You: {yourScore}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {currentScores && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-primary rounded mr-2" /> Their
            score
            <span className="inline-block w-1 h-3 bg-green-500 rounded mx-2 ml-4" />{" "}
            Your score
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<{
    musicProfile: MusicProfile | null;
    conflictStyle: ConflictStyleRecord | null;
    personality: PersonalityAssessment | null;
  } | null>(null);
  const [topTracks, setTopTracks] = useState<TrackJson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch target user's data
      const [userProfileRes, musicProfileRes, conflictStyleRes, personalityRes] =
        await Promise.all([
          supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
          supabase.from("music_profiles").select("*").eq("user_id", userId).single(),
          supabase.from("conflict_styles").select("*").eq("user_id", userId).single(),
          supabase
            .from("personality_assessments")
            .select("*")
            .eq("user_id", userId)
            .eq("framework", "big_five")
            .single(),
        ]);

      if (userProfileRes.error) throw new Error("Profile not found");

      // Fetch compatibility score if viewing someone else's profile
      let compatibility: CompatibilityScore | null = null;
      if (user && !isOwnProfile) {
        const [orderedUser1, orderedUser2] =
          user.id < userId ? [user.id, userId] : [userId, user.id];

        const { data: compatData } = await supabase
          .from("compatibility_scores")
          .select("*")
          .eq("user1_id", orderedUser1)
          .eq("user2_id", orderedUser2)
          .single();

        compatibility = compatData;
      }

      setProfileData({
        userProfile: userProfileRes.data as UserProfile,
        musicProfile: musicProfileRes.data as MusicProfile,
        conflictStyle: conflictStyleRes.data as ConflictStyleRecord,
        personality: personalityRes.data as PersonalityAssessment,
        compatibility,
      });

      // Fetch current user's data for comparison
      if (user && !isOwnProfile) {
        const [currentMusicRes, currentConflictRes, currentPersonalityRes] =
          await Promise.all([
            supabase
              .from("music_profiles")
              .select("*")
              .eq("user_id", user.id)
              .single(),
            supabase
              .from("conflict_styles")
              .select("*")
              .eq("user_id", user.id)
              .single(),
            supabase
              .from("personality_assessments")
              .select("*")
              .eq("user_id", user.id)
              .eq("framework", "big_five")
              .single(),
          ]);

        setCurrentUserData({
          musicProfile: currentMusicRes.data as MusicProfile | null,
          conflictStyle: currentConflictRes.data as ConflictStyleRecord | null,
          personality: currentPersonalityRes.data as PersonalityAssessment | null,
        });
      }

      // For now, we don't have stored top tracks - this would need a new table or Spotify API call
      // Setting empty for now
      setTopTracks([]);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load profile"
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, user, isOwnProfile, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfileData();
    }
  }, [authLoading, fetchProfileData]);

  // Handle like action
  const handleLike = async () => {
    if (!user || !profileData || isOwnProfile || isInteracting) return;

    setIsInteracting(true);

    try {
      const otherUserId = userId;

      // Check if a match record already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
        )
        .single();

      if (existingMatch) {
        const isUser1 = existingMatch.user1_id === user.id;
        const updateField = isUser1 ? "user1_liked" : "user2_liked";
        const otherLiked = isUser1
          ? existingMatch.user2_liked
          : existingMatch.user1_liked;

        const updateData: Record<string, boolean | string> = {
          [updateField]: true,
        };
        if (otherLiked) {
          updateData.matched_at = new Date().toISOString();
        }

        await supabase
          .from("matches")
          .update(updateData)
          .eq("id", existingMatch.id);
      } else {
        const [orderedUser1, orderedUser2] =
          user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];
        const isUser1 = user.id === orderedUser1;

        await supabase.from("matches").insert({
          user1_id: orderedUser1,
          user2_id: orderedUser2,
          user1_liked: isUser1,
          user2_liked: !isUser1,
        });
      }

      // Navigate back to discover
      router.push("/discover");
    } catch (err) {
      console.error("Error recording like:", err);
    } finally {
      setIsInteracting(false);
    }
  };

  // Handle pass action
  const handlePass = async () => {
    if (!user || !profileData || isOwnProfile || isInteracting) return;

    setIsInteracting(true);

    try {
      const otherUserId = userId;

      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
        )
        .single();

      if (existingMatch) {
        const isUser1 = existingMatch.user1_id === user.id;
        const updateField = isUser1 ? "user1_liked" : "user2_liked";

        await supabase
          .from("matches")
          .update({ [updateField]: false })
          .eq("id", existingMatch.id);
      } else {
        const [orderedUser1, orderedUser2] =
          user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];
        const isUser1 = user.id === orderedUser1;

        await supabase.from("matches").insert({
          user1_id: orderedUser1,
          user2_id: orderedUser2,
          user1_liked: isUser1 ? false : null,
          user2_liked: isUser1 ? null : false,
        });
      }

      router.push("/discover");
    } catch (err) {
      console.error("Error recording pass:", err);
    } finally {
      setIsInteracting(false);
    }
  };

  // Show loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error
  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <User className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              {error || "This profile doesn't exist or is no longer available."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/discover")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discover
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { userProfile, musicProfile, conflictStyle, personality, compatibility } =
    profileData;
  const photos = userProfile.photos_json || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Harmonic Match
            </span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-32">
        {/* Photo Gallery */}
        <PhotoGallery photos={photos} displayName={userProfile.display_name} />

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {userProfile.display_name}
                {userProfile.age && (
                  <span className="font-normal text-muted-foreground">
                    , {userProfile.age}
                  </span>
                )}
              </h1>
              {userProfile.location && (
                <p className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  {userProfile.location}
                </p>
              )}
            </div>
            {/* Compatibility Badge */}
            {compatibility && !isOwnProfile && (
              <CompatibilityBadge score={compatibility.overall_score ?? 0} />
            )}
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {userProfile.bio}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Compatibility Breakdown */}
        {compatibility && !isOwnProfile && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Compatibility Breakdown
              </CardTitle>
              <CardDescription>
                How you match across the three dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompatibilityBreakdown compatibility={compatibility} />
            </CardContent>
          </Card>
        )}

        {/* Music Compatibility */}
        {musicProfile && (
          <MusicCompatibilitySection
            currentUserMusic={currentUserData?.musicProfile || null}
            profileMusic={musicProfile}
          />
        )}

        {/* Soundtrack */}
        {topTracks.length > 0 && <SoundtrackSection tracks={topTracks} />}

        {/* Conflict Style */}
        {conflictStyle && (
          <ConflictStyleSection
            conflictStyle={conflictStyle}
            currentUserConflict={currentUserData?.conflictStyle || null}
          />
        )}

        {/* Personality */}
        {personality && (
          <PersonalitySection
            personality={personality}
            currentUserPersonality={currentUserData?.personality || null}
          />
        )}
      </main>

      {/* Fixed Action Buttons */}
      {!isOwnProfile && user && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t">
          <div className="max-w-2xl mx-auto flex justify-center gap-6">
            <Button
              variant="outline"
              size="lg"
              className="h-16 w-16 rounded-full border-2 border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={handlePass}
              disabled={isInteracting}
            >
              <X className="h-8 w-8" />
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
              onClick={handleLike}
              disabled={isInteracting}
            >
              {isInteracting ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Heart className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
