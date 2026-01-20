"use client";

import { useAuth } from "@/lib/auth/context";

export function useUser() {
  const { user, session, isLoading } = useAuth();
  return { user, session, isLoading };
}
