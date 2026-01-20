import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Heart, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-electric-900/10 to-warmth-900/20" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Music className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Harmonic <span className="text-primary">Match</span>
            </h1>
          </div>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Find your perfect match through the music you love. Connect with people who share your rhythm, your vibe, your soul.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <Music className="mb-2 h-8 w-8 text-purple-500" />
                <CardTitle>Connect Your Music</CardTitle>
                <CardDescription>
                  Link your Spotify account and let your music taste speak for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We analyze your listening history, favorite artists, and top genres to understand your musical identity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-electric-200 dark:border-electric-800">
              <CardHeader>
                <Heart className="mb-2 h-8 w-8 text-electric-500" />
                <CardTitle>Find Your Match</CardTitle>
                <CardDescription>
                  Discover people whose music taste harmonizes with yours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our algorithm finds matches based on musical compatibility - from shared favorite tracks to complementary genres.
                </p>
              </CardContent>
            </Card>

            <Card className="border-warmth-200 dark:border-warmth-800 sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <Sparkles className="mb-2 h-8 w-8 text-warmth-500" />
                <CardTitle>Make a Connection</CardTitle>
                <CardDescription>
                  Start conversations about the music that moves you both
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share playlists, discuss albums, and let music be the foundation of something beautiful.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>Harmonic Match - Find love through music</p>
        </div>
      </footer>
    </div>
  );
}
