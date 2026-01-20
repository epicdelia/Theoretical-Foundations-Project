"use server";

import { createClient } from "@/lib/supabase/server";
import type { DimensionName } from "@/lib/supabase/database.types";

export interface MutualMatch {
  matchId: string;
  matchedUserId: string;
  displayName: string;
  age: number | null;
  location: string | null;
  photoUrl: string | null;
  compatibilityScore: number;
  dimensionScores: Record<DimensionName, number>;
  matchedAt: string;
  conversationId: string | null;
}

export async function getMutualMatches(): Promise<{
  matches: MutualMatch[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { matches: [], error: "Not authenticated" };
  }

  // Get all likes from current user
  const { data: myLikes } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  if (!myLikes || myLikes.length === 0) {
    return { matches: [] };
  }

  const myLikedUserIds = myLikes.map((l) => l.to_user_id);

  // Get likes from those users back to me (mutual likes)
  const { data: mutualLikes } = await supabase
    .from("likes")
    .select("from_user_id, created_at")
    .eq("to_user_id", user.id)
    .in("from_user_id", myLikedUserIds);

  if (!mutualLikes || mutualLikes.length === 0) {
    return { matches: [] };
  }

  const mutualUserIds = mutualLikes.map((l) => l.from_user_id);

  // Get profiles for mutual matches
  const { data: profiles, error: profilesError } = await supabase
    .from("users_extended")
    .select("*")
    .in("user_id", mutualUserIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return { matches: [], error: "Failed to fetch profiles" };
  }

  // Get match records for these users
  const { data: matchRecords } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  // Get conversations for these matches
  const matchIds = matchRecords?.map((m) => m.id) ?? [];
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, match_id")
    .in("match_id", matchIds);

  // Create lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
  const matchMap = new Map(
    matchRecords?.map((m) => {
      const otherUserId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      return [otherUserId, m];
    }) ?? []
  );
  const conversationMap = new Map(
    conversations?.map((c) => [c.match_id, c.id]) ?? []
  );
  const mutualLikeDateMap = new Map(
    mutualLikes.map((l) => [l.from_user_id, l.created_at])
  );

  // Build the mutual matches list
  const mutualMatches: MutualMatch[] = mutualUserIds
    .map((userId) => {
      const profile = profileMap.get(userId);
      const match = matchMap.get(userId);

      if (!profile) {
        return null;
      }

      const photos = profile.photos_json as { url: string }[] | null;
      const photoUrl = photos && photos.length > 0 ? photos[0].url : null;

      const dimensionScores = (match?.dimension_scores_json ?? {}) as Record<
        DimensionName,
        number
      >;

      return {
        matchId: match?.id ?? "",
        matchedUserId: userId,
        displayName: profile.display_name,
        age: profile.age,
        location: profile.location,
        photoUrl,
        compatibilityScore: match?.compatibility_score ?? 0,
        dimensionScores,
        matchedAt: mutualLikeDateMap.get(userId) ?? new Date().toISOString(),
        conversationId: match ? conversationMap.get(match.id) ?? null : null,
      };
    })
    .filter((m): m is MutualMatch => m !== null);

  // Sort by most recent match
  mutualMatches.sort(
    (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
  );

  return { matches: mutualMatches };
}

export async function getMutualMatchesCount(): Promise<{
  count: number;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0, error: "Not authenticated" };
  }

  // Get all likes from current user
  const { data: myLikes } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  if (!myLikes || myLikes.length === 0) {
    return { count: 0 };
  }

  const myLikedUserIds = myLikes.map((l) => l.to_user_id);

  // Count mutual likes
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)
    .in("from_user_id", myLikedUserIds);

  if (error) {
    console.error("Error counting mutual matches:", error);
    return { count: 0, error: "Failed to count matches" };
  }

  return { count: count ?? 0 };
}
