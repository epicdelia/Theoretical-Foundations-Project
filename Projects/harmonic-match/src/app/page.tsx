import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Heart, Brain, Shield, Sparkles } from "lucide-react";

// Audio waveform SVG component for visual design elements
function AudioWaveform({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="15" width="3" height="10" rx="1.5" fill="currentColor" opacity="0.4" />
      <rect x="6" y="10" width="3" height="20" rx="1.5" fill="currentColor" opacity="0.5" />
      <rect x="12" y="5" width="3" height="30" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="18" y="8" width="3" height="24" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="24" y="2" width="3" height="36" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="30" y="12" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="36" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
      <rect x="42" y="10" width="3" height="20" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="48" y="4" width="3" height="32" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="54" y="8" width="3" height="24" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="60" y="12" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="66" y="6" width="3" height="28" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="72" y="10" width="3" height="20" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="78" y="4" width="3" height="32" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="84" y="8" width="3" height="24" rx="1.5" fill="currentColor" />
      <rect x="90" y="14" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.5" />
      <rect x="96" y="16" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

// Spotify logo SVG
function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

// Compatibility meter component for visualization
function CompatibilityMeter({
  label,
  percentage,
  color
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-electric-900/10 to-warmth-900/20" />

        {/* Decorative waveforms */}
        <AudioWaveform className="absolute left-4 top-1/4 h-12 w-32 text-purple-500/20 sm:left-8 sm:h-16 sm:w-48 lg:left-16" />
        <AudioWaveform className="absolute right-4 bottom-1/4 h-12 w-32 text-electric-500/20 sm:right-8 sm:h-16 sm:w-48 lg:right-16 rotate-180" />
        <AudioWaveform className="absolute left-1/4 bottom-8 hidden h-10 w-24 text-warmth-500/15 lg:block" />
        <AudioWaveform className="absolute right-1/4 top-8 hidden h-10 w-24 text-purple-500/15 lg:block rotate-180" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Music className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
            <span className="text-2xl font-bold tracking-tight sm:text-3xl">Harmonic Match</span>
          </div>

          <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Where Your Playlist Meets{" "}
            <span className="bg-gradient-to-r from-purple-500 via-electric-500 to-warmth-500 bg-clip-text text-transparent">
              Your Perfect Match
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Match on music taste, conflict style, and psychology. Because the best
            relationships start with shared rhythms and deeper understanding.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="bg-[#1DB954] hover:bg-[#1ed760] text-white gap-2">
              <Link href="/signup">
                <SpotifyLogo className="h-5 w-5" />
                Sign Up with Spotify
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spotify Integration Visual */}
      <section className="border-y bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <div className="text-center lg:text-left lg:max-w-md">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1DB954]/10 px-4 py-2 text-[#1DB954]">
                <SpotifyLogo className="h-5 w-5" />
                <span className="text-sm font-medium">Powered by Spotify</span>
              </div>
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
                Your Music Profile, Analyzed
              </h2>
              <p className="text-muted-foreground">
                Connect your Spotify account and we&apos;ll analyze your listening history,
                favorite artists, top genres, and musical preferences to build your
                unique sonic fingerprint.
              </p>
            </div>

            {/* Mock Spotify profile card */}
            <Card className="w-full max-w-sm border-[#1DB954]/20 bg-gradient-to-br from-[#191414] to-[#282828] text-white">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]">
                    <Music className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Your Top Genres</p>
                    <p className="text-sm text-gray-400">Last 6 months</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { genre: "Indie Pop", percent: 85 },
                    { genre: "Alternative Rock", percent: 72 },
                    { genre: "Electronic", percent: 58 },
                    { genre: "R&B", percent: 45 },
                  ].map((item) => (
                    <div key={item.genre} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.genre}</span>
                        <span className="text-gray-400">{item.percent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-[#1DB954]"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <AudioWaveform className="h-8 w-full text-[#1DB954]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Three Matching Dimensions */}
      <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Three Dimensions of Compatibility
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We go beyond surface-level matching. Our algorithm considers three
              key dimensions to find truly compatible connections.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Music Dimension */}
            <Card className="border-purple-200 dark:border-purple-800 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Music className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-purple-600 dark:text-purple-400">Music Taste</CardTitle>
                <CardDescription>
                  Your sonic fingerprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  We analyze your Spotify listening history, favorite artists,
                  top genres, and musical energy preferences to understand your
                  unique sound profile.
                </p>
                <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    Matching factors: Genre overlap, artist similarity, tempo
                    preferences, mood patterns, discovery habits
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Conflict Style Dimension */}
            <Card className="border-electric-200 dark:border-electric-800 transition-all hover:shadow-lg hover:shadow-electric-500/10">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-electric-100 dark:bg-electric-900/30">
                  <Shield className="h-6 w-6 text-electric-600 dark:text-electric-400" />
                </div>
                <CardTitle className="text-electric-600 dark:text-electric-400">Conflict Style</CardTitle>
                <CardDescription>
                  How you navigate disagreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Understanding how you handle conflict is crucial for
                  long-term compatibility. We assess your communication
                  patterns and resolution preferences.
                </p>
                <div className="rounded-lg bg-electric-50 p-3 dark:bg-electric-900/20">
                  <p className="text-xs font-medium text-electric-600 dark:text-electric-400">
                    Matching factors: Communication style, resolution approach,
                    emotional expression, compromise tendencies
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personality Dimension */}
            <Card className="border-warmth-200 dark:border-warmth-800 transition-all hover:shadow-lg hover:shadow-warmth-500/10 sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-warmth-100 dark:bg-warmth-900/30">
                  <Brain className="h-6 w-6 text-warmth-600 dark:text-warmth-400" />
                </div>
                <CardTitle className="text-warmth-600 dark:text-warmth-400">Personality</CardTitle>
                <CardDescription>
                  Your psychological profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Based on validated psychological frameworks, we match
                  on personality traits that research shows lead to
                  successful, lasting relationships.
                </p>
                <div className="rounded-lg bg-warmth-50 p-3 dark:bg-warmth-900/20">
                  <p className="text-xs font-medium text-warmth-600 dark:text-warmth-400">
                    Matching factors: Attachment style, values alignment,
                    lifestyle compatibility, growth mindset
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sample Compatibility Visualization */}
      <section className="border-y bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              See Your Compatibility
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get detailed compatibility breakdowns for each potential match,
              showing exactly where you harmonize and where you complement.
            </p>
          </div>

          {/* Sample compatibility card */}
          <Card className="mx-auto max-w-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-electric-500/10 to-warmth-500/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-electric-500 text-2xl font-bold text-white">
                    87
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1DB954]">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle>Strong Match</CardTitle>
                  <CardDescription>Sample compatibility score</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <CompatibilityMeter
                label="Music Taste"
                percentage={92}
                color="bg-purple-500"
              />
              <CompatibilityMeter
                label="Conflict Style"
                percentage={85}
                color="bg-electric-500"
              />
              <CompatibilityMeter
                label="Personality"
                percentage={84}
                color="bg-warmth-500"
              />

              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Top Shared Artists
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["The 1975", "Phoebe Bridgers", "Tame Impala", "Frank Ocean"].map((artist) => (
                    <span
                      key={artist}
                      className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8 overflow-hidden">
        {/* Background waveforms */}
        <AudioWaveform className="absolute left-0 top-1/2 -translate-y-1/2 h-20 w-40 text-purple-500/10" />
        <AudioWaveform className="absolute right-0 top-1/2 -translate-y-1/2 h-20 w-40 text-electric-500/10 rotate-180" />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
            Ready to Find Your{" "}
            <span className="text-primary">Harmonic Match</span>?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Connect your Spotify account and discover matches who truly get your vibe.
            Your perfect duet is waiting.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="bg-[#1DB954] hover:bg-[#1ed760] text-white gap-2">
              <Link href="/signup">
                <SpotifyLogo className="h-5 w-5" />
                Connect Spotify & Sign Up
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Already have an account?
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <span className="font-semibold">Harmonic Match</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Find love through music, understanding, and compatibility.
            </p>
            <AudioWaveform className="h-6 w-24 text-muted-foreground/30" />
          </div>
        </div>
      </footer>
    </div>
  );
}
