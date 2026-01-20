"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AuthContextValue, SpotifyTokens } from "./types";
import { getSpotifyAuthUrl } from "./spotify";

const SPOTIFY_TOKEN_KEY = "harmonic_spotify_tokens";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Load Spotify tokens from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    if (stored) {
      try {
        const tokens = JSON.parse(stored) as SpotifyTokens;
        // Check if tokens are expired
        if (tokens.expiresAt > Date.now()) {
          setSpotifyTokens(tokens);
        } else {
          // Clear expired tokens
          localStorage.removeItem(SPOTIFY_TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(SPOTIFY_TOKEN_KEY);
      }
    }
  }, []);

  // Save Spotify tokens to localStorage
  useEffect(() => {
    if (spotifyTokens) {
      localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(spotifyTokens));
    }
  }, [spotifyTokens]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    },
    [supabase.auth]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error ? new Error(error.message) : null };
    },
    [supabase.auth]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSpotifyTokens(null);
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  }, [supabase.auth]);

  const connectSpotify = useCallback(() => {
    // Generate a state parameter for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem("spotify_auth_state", state);
    window.location.href = getSpotifyAuthUrl(state);
  }, []);

  const refreshSpotifyToken = useCallback(async () => {
    if (!spotifyTokens?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/spotify/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: spotifyTokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newTokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || spotifyTokens.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      setSpotifyTokens(newTokens);
      return newTokens;
    } catch {
      // Clear invalid tokens
      setSpotifyTokens(null);
      localStorage.removeItem(SPOTIFY_TOKEN_KEY);
      return null;
    }
  }, [spotifyTokens]);

  // Auto-refresh Spotify token before expiry
  useEffect(() => {
    if (!spotifyTokens) return;

    const timeUntilExpiry = spotifyTokens.expiresAt - Date.now();
    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime <= 0) {
      refreshSpotifyToken();
      return;
    }

    const timeout = setTimeout(() => {
      refreshSpotifyToken();
    }, refreshTime);

    return () => clearTimeout(timeout);
  }, [spotifyTokens, refreshSpotifyToken]);

  const value: AuthContextValue = {
    user,
    spotifyTokens,
    isLoading,
    isSpotifyConnected: !!spotifyTokens,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    connectSpotify,
    refreshSpotifyToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hook to update Spotify tokens (used by callback route)
export function useSetSpotifyTokens() {
  const [, setSpotifyTokens] = useState<SpotifyTokens | null>(null);

  return useCallback((tokens: SpotifyTokens) => {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens));
    setSpotifyTokens(tokens);
    // Trigger a page reload to update context
    window.location.href = "/";
  }, []);
}
