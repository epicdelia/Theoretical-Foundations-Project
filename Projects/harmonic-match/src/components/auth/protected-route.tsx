"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSpotify?: boolean;
}

export function ProtectedRoute({
  children,
  requireSpotify = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isSpotifyConnected } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (requireSpotify && !isSpotifyConnected) {
        router.push("/onboarding/spotify");
      }
    }
  }, [user, isLoading, isSpotifyConnected, requireSpotify, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireSpotify && !isSpotifyConnected) {
    return null;
  }

  return <>{children}</>;
}
