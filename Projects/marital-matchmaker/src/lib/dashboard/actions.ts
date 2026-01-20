"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateMatchesForUser } from "@/lib/compatibility/scoring";
import type { DimensionName } from "@/lib/supabase/database.types";

export interface MatchWithProfile {
  matchId: string;
  matchedUserId: string;
  displayName: string;
  age: number | null;
  location: string | null;
  photoUrl: string | null;
  compatibilityScore: number;
  dimensionScores: Record<DimensionName, number>;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
}

export type SortOption = "compatibility" | "recent";

export async function getMatchesForDashboard(
  sortBy: SortOption = "compatibility"
): Promise<{ matches: MatchWithProfile[]; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { matches: [], error: "Not authenticated" };
  }

  // Get matches where current user is either user1 or user2
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "pending");

  if (matchesError) {
    console.error("Error fetching matches:", matchesError);
    return { matches: [], error: "Failed to fetch matches" };
  }

  if (!matches || matches.length === 0) {
    return { matches: [] };
  }

  // Get the IDs of matched users (the other person in each match)
  const matchedUserIds = matches.map((m) =>
    m.user1_id === user.id ? m.user2_id : m.user1_id
  );

  // Fetch profiles for all matched users
  const { data: profiles, error: profilesError } = await supabase
    .from("users_extended")
    .select("*")
    .in("user_id", matchedUserIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return { matches: [], error: "Failed to fetch profiles" };
  }

  // Fetch likes from current user
  const { data: likes } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  const likedUserIds = new Set(likes?.map((l) => l.to_user_id) ?? []);

  // Create a map for quick profile lookup
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

  // Build the match list with profile info
  const matchesWithProfiles: MatchWithProfile[] = matches
    .map((match) => {
      const matchedUserId =
        match.user1_id === user.id ? match.user2_id : match.user1_id;
      const profile = profileMap.get(matchedUserId);

      if (!profile) {
        return null;
      }

      const photos = profile.photos_json as { url: string }[] | null;
      const photoUrl = photos && photos.length > 0 ? photos[0].url : null;

      const dimensionScores = (match.dimension_scores_json ?? {}) as Record<
        DimensionName,
        number
      >;

      return {
        matchId: match.id,
        matchedUserId,
        displayName: profile.display_name,
        age: profile.age,
        location: profile.location,
        photoUrl,
        compatibilityScore: match.compatibility_score ?? 0,
        dimensionScores,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        isLiked: likedUserIds.has(matchedUserId),
      };
    })
    .filter((m): m is MatchWithProfile => m !== null);

  // Sort matches
  if (sortBy === "compatibility") {
    matchesWithProfiles.sort(
      (a, b) => b.compatibilityScore - a.compatibilityScore
    );
  } else {
    matchesWithProfiles.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return { matches: matchesWithProfiles };
}

export async function toggleLike(
  toUserId: string
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, isLiked: false, error: "Not authenticated" };
  }

  // Check if like exists
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("from_user_id", user.id)
    .eq("to_user_id", toUserId)
    .single();

  if (existingLike) {
    // Unlike - remove the like
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      console.error("Error removing like:", error);
      return { success: false, isLiked: true, error: "Failed to unlike" };
    }

    return { success: true, isLiked: false };
  } else {
    // Like - add the like
    const { error } = await supabase.from("likes").insert({
      from_user_id: user.id,
      to_user_id: toUserId,
    });

    if (error) {
      console.error("Error adding like:", error);
      return { success: false, isLiked: false, error: "Failed to like" };
    }

    return { success: true, isLiked: true };
  }
}

export async function refreshMatches(): Promise<{
  success: boolean;
  matchesCreated: number;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, matchesCreated: 0, error: "Not authenticated" };
  }

  return calculateMatchesForUser(user.id);
}
