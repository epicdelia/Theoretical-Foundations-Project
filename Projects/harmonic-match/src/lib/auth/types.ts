import type { User } from "@supabase/supabase-js";

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  spotifyTokens: SpotifyTokens | null;
  isLoading: boolean;
  isSpotifyConnected: boolean;
}

export interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  connectSpotify: () => void;
  refreshSpotifyToken: () => Promise<SpotifyTokens | null>;
}
