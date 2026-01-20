"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateCompatibility } from "@/lib/compatibility/scoring";
import type { DimensionName } from "@/lib/supabase/database.types";

export interface ProfileWithCompatibility {
  userId: string;
  displayName: string;
  age: number | null;
  gender: string | null;
  location: string | null;
  bio: string | null;
  photos: { url: string }[];
  compatibilityScore: number;
  dimensionScores: Record<DimensionName, number>;
  isLiked: boolean;
  isMutualLike: boolean;
  isBlocked: boolean;
}

export async function getProfileWithCompatibility(
  targetUserId: string
): Promise<{ profile: ProfileWithCompatibility | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: "Not authenticated" };
  }

  // Fetch target user's profile
  const { data: targetProfile, error: profileError } = await supabase
    .from("users_extended")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (profileError || !targetProfile) {
    return { profile: null, error: "Profile not found" };
  }

  // Calculate compatibility
  const compatibilityResult = await calculateCompatibility(
    user.id,
    targetUserId
  );

  // Check if current user has liked this profile
  const { data: likeFromMe } = await supabase
    .from("likes")
    .select("id")
    .eq("from_user_id", user.id)
    .eq("to_user_id", targetUserId)
    .single();

  // Check if target user has liked current user (for mutual like)
  const { data: likeFromThem } = await supabase
    .from("likes")
    .select("id")
    .eq("from_user_id", targetUserId)
    .eq("to_user_id", user.id)
    .single();

  // Check if blocked
  const { data: block } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId)
    .single();

  const photos = (targetProfile.photos_json as { url: string }[] | null) ?? [];

  return {
    profile: {
      userId: targetProfile.user_id,
      displayName: targetProfile.display_name,
      age: targetProfile.age,
      gender: targetProfile.gender,
      location: targetProfile.location,
      bio: targetProfile.bio,
      photos,
      compatibilityScore: compatibilityResult?.overallScore ?? 0,
      dimensionScores: compatibilityResult?.dimensionScores ?? {
        values: 0,
        goals: 0,
        communication: 0,
        lifestyle: 0,
        finance: 0,
      },
      isLiked: !!likeFromMe,
      isMutualLike: !!likeFromMe && !!likeFromThem,
      isBlocked: !!block,
    },
  };
}

export async function blockUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if already blocked
  const { data: existingBlock } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId)
    .single();

  if (existingBlock) {
    return { success: true }; // Already blocked
  }

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: targetUserId,
  });

  if (error) {
    console.error("Error blocking user:", error);
    return { success: false, error: "Failed to block user" };
  }

  // Also remove any existing likes between the users
  await supabase
    .from("likes")
    .delete()
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`
    );

  return { success: true };
}

export async function unblockUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId);

  if (error) {
    console.error("Error unblocking user:", error);
    return { success: false, error: "Failed to unblock user" };
  }

  return { success: true };
}
