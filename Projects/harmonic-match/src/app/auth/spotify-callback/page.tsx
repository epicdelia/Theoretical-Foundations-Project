"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Music, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SPOTIFY_TOKEN_KEY = "harmonic_spotify_tokens";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresAt = searchParams.get("expires_at");
    const state = searchParams.get("state");

    // Validate state parameter for CSRF protection
    const storedState = sessionStorage.getItem("spotify_auth_state");
    if (state && storedState && state !== storedState) {
      setStatus("error");
      setErrorMessage("Invalid state parameter. Please try again.");
      return;
    }

    // Clear stored state
    sessionStorage.removeItem("spotify_auth_state");

    if (!accessToken || !refreshToken || !expiresAt) {
      setStatus("error");
      setErrorMessage("Missing authentication data. Please try again.");
      return;
    }

    // Store tokens in localStorage
    const tokens = {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt, 10),
    };

    try {
      localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens));
      setStatus("success");

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setStatus("error");
      setErrorMessage("Failed to save authentication data.");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Harmonic Match
              </span>
            </div>
          </div>
          <CardTitle className="text-xl">
            {status === "loading" && "Connecting to Spotify..."}
            {status === "success" && "Spotify Connected!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[#1DB954]" />
              <p className="text-muted-foreground text-center">
                Setting up your music profile...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-[#1DB954]" />
              <p className="text-muted-foreground text-center">
                Your Spotify account has been connected. Redirecting...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground text-center">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
              <Button onClick={() => router.push("/signup")} className="mt-4">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
