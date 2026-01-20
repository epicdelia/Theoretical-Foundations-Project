"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Music, Loader2, CheckCircle, Headphones, Sparkles } from "lucide-react";
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
import {
  getCurrentUser,
  getAllTopArtists,
  getTopTracks,
  getAudioFeatures,
} from "@/lib/spotify/api";
import {
  processArtists,
  extractTopGenres,
  calculateAverageAudioFeatures,
  determineMusicPersonality,
  getMusicPersonalityLabel,
  getMusicPersonalityDescription,
} from "@/lib/spotify/profile";
import type { MusicProfileInsert, TopArtistJson } from "@/lib/database.types";

type Step = "connect" | "loading" | "profile" | "error";

interface MusicProfileData {
  topArtists: TopArtistJson[];
  topGenres: string[];
  audioFeaturesAvg: MusicProfileInsert["audio_features_avg_json"];
  musicPersonality: NonNullable<MusicProfileInsert["music_personality"]>;
  spotifyUserId: string;
}

export default function SpotifyOnboardingPage() {
  const router = useRouter();
  const { user, spotifyTokens, isSpotifyConnected, connectSpotify, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("connect");
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<MusicProfileData | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to Spotify...");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchMusicData = useCallback(async () => {
    if (!spotifyTokens?.accessToken) return;

    setStep("loading");
    setError(null);

    try {
      // Step 1: Get Spotify user
      setLoadingMessage("Connecting to your Spotify account...");
      const spotifyUser = await getCurrentUser(spotifyTokens.accessToken);

      // Step 2: Fetch top artists across all time ranges
      setLoadingMessage("Analyzing your favorite artists...");
      const { short, medium, long } = await getAllTopArtists(spotifyTokens.accessToken);

      // Step 3: Fetch top tracks
      setLoadingMessage("Discovering your top tracks...");
      const tracks = await getTopTracks(spotifyTokens.accessToken, "medium_term", 50);

      // Step 4: Get audio features for tracks
      setLoadingMessage("Understanding your music taste...");
      const trackIds = tracks.map((t) => t.id);
      const audioFeatures = await getAudioFeatures(spotifyTokens.accessToken, trackIds);

      // Step 5: Process all data
      setLoadingMessage("Creating your music profile...");
      const topArtists = processArtists(short, medium, long);
      const topGenres = extractTopGenres(topArtists);
      const audioFeaturesAvg = calculateAverageAudioFeatures(audioFeatures);
      const musicPersonality = determineMusicPersonality(
        topArtists,
        short,
        long,
        audioFeaturesAvg
      );

      setProfileData({
        topArtists,
        topGenres,
        audioFeaturesAvg,
        musicPersonality,
        spotifyUserId: spotifyUser.id,
      });

      setStep("profile");
    } catch (err) {
      console.error("Error fetching music data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch music data");
      setStep("error");
    }
  }, [spotifyTokens?.accessToken]);

  // Auto-fetch when Spotify is connected
  useEffect(() => {
    if (isSpotifyConnected && step === "connect") {
      fetchMusicData();
    }
  }, [isSpotifyConnected, step, fetchMusicData]);

  const saveProfile = async () => {
    if (!user || !profileData) return;

    setIsSaving(true);
    try {
      const musicProfile: MusicProfileInsert = {
        user_id: user.id,
        spotify_connected: true,
        spotify_user_id: profileData.spotifyUserId,
        top_artists_json: profileData.topArtists,
        top_genres_json: profileData.topGenres,
        audio_features_avg_json: profileData.audioFeaturesAvg,
        music_personality: profileData.musicPersonality,
        last_synced_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("music_profiles")
        .upsert(musicProfile, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      // Navigate to next onboarding step or home
      router.push("/");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Connect step
  if (step === "connect") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Harmonic Match
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl">Connect Your Spotify</CardTitle>
            <CardDescription>
              Let us analyze your music taste to find your perfect match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Headphones className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Your Top Artists</p>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll discover who you&apos;ve been listening to
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Music className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Your Music DNA</p>
                  <p className="text-xs text-muted-foreground">
                    Analyze energy, mood, and vibe of your tracks
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Music Personality</p>
                  <p className="text-xs text-muted-foreground">
                    Get your unique music personality type
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white"
              size="lg"
              onClick={connectSpotify}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Connect with Spotify
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We only read your listening data. We never post or modify anything.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading step
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-[#1DB954]/20 animate-ping" />
                </div>
                <svg
                  className="h-16 w-16 relative"
                  viewBox="0 0 24 24"
                  fill="#1DB954"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-xl">{loadingMessage}</CardTitle>
            <CardDescription>This may take a moment...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error step
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Music className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => {
                setStep("connect");
                setError(null);
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile display step
  if (step === "profile" && profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Harmonic Match
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold">Your Music Profile</h1>
            <p className="text-muted-foreground">
              Here&apos;s what your music says about you
            </p>
          </div>

          {/* Music Personality Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {getMusicPersonalityLabel(profileData.musicPersonality)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                {getMusicPersonalityDescription(profileData.musicPersonality)}
              </p>
            </CardContent>
          </Card>

          {/* Top Artists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Your Top Artists
              </CardTitle>
              <CardDescription>Based on your listening history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profileData.topArtists.slice(0, 8).map((artist, index) => (
                  <div key={artist.id} className="text-center space-y-2">
                    <div className="relative">
                      <div className="aspect-square rounded-full overflow-hidden bg-muted">
                        {artist.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-1 -left-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate">{artist.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Genres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Your Top Genres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.topGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audio Features */}
          <Card>
            <CardHeader>
              <CardTitle>Your Music DNA</CardTitle>
              <CardDescription>
                The sonic characteristics of your favorite tracks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AudioFeatureBar
                  label="Energy"
                  value={profileData.audioFeaturesAvg?.energy ?? 0}
                  color="bg-orange-500"
                />
                <AudioFeatureBar
                  label="Danceability"
                  value={profileData.audioFeaturesAvg?.danceability ?? 0}
                  color="bg-pink-500"
                />
                <AudioFeatureBar
                  label="Valence (Happiness)"
                  value={profileData.audioFeaturesAvg?.valence ?? 0}
                  color="bg-yellow-500"
                />
                <AudioFeatureBar
                  label="Acousticness"
                  value={profileData.audioFeaturesAvg?.acousticness ?? 0}
                  color="bg-green-500"
                />
                <AudioFeatureBar
                  label="Instrumentalness"
                  value={profileData.audioFeaturesAvg?.instrumentalness ?? 0}
                  color="bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save and Continue
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function AudioFeatureBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = Math.round(value * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
