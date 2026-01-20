"use server";

import { createClient } from "@/lib/supabase/server";
import type { Match, Conversation, UserProfile, CompatibilityScore } from "@/lib/database.types";

export interface LikeResult {
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  conversationId?: string;
  matchedUser?: {
    userId: string;
    displayName: string;
    photoUrl: string | null;
    compatibilityScore: number;
  };
  error?: string;
}

export interface PassResult {
  success: boolean;
  error?: string;
}

export interface MatchWithDetails {
  match: Match;
  otherUser: UserProfile;
  compatibility: CompatibilityScore | null;
  conversation: Conversation | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    isFromCurrentUser: boolean;
  } | null;
}

/**
 * Record a like action from the current user to another user.
 * Checks for mutual like and creates conversation if matched.
 */
export async function likeUser(otherUserId: string): Promise<LikeResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, isMatch: false, error: "Not authenticated" };
    }

    if (user.id === otherUserId) {
      return { success: false, isMatch: false, error: "Cannot like yourself" };
    }

    // Ensure consistent ordering of user IDs
    const [user1Id, user2Id] =
      user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];
    const isCurrentUserFirst = user.id === user1Id;

    // Check if match record already exists
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", user1Id)
      .eq("user2_id", user2Id)
      .single();

    let matchId: string;
    let isMatch = false;

    if (existingMatch) {
      // Update existing match
      const otherLiked = isCurrentUserFirst
        ? existingMatch.user2_liked
        : existingMatch.user1_liked;

      const updateField = isCurrentUserFirst ? "user1_liked" : "user2_liked";
      const updateData: Record<string, boolean | string> = { [updateField]: true };

      // Check if this creates a mutual match
      if (otherLiked === true) {
        isMatch = true;
        updateData.matched_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", existingMatch.id);

      if (updateError) {
        return { success: false, isMatch: false, error: updateError.message };
      }

      matchId = existingMatch.id;
    } else {
      // Create new match record
      const { data: newMatch, error: insertError } = await supabase
        .from("matches")
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          user1_liked: isCurrentUserFirst,
          user2_liked: !isCurrentUserFirst,
        })
        .select()
        .single();

      if (insertError || !newMatch) {
        return { success: false, isMatch: false, error: insertError?.message || "Failed to create match" };
      }

      matchId = newMatch.id;
    }

    // If it's a match, create a conversation
    let conversationId: string | undefined;
    if (isMatch) {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .single();

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({ match_id: matchId })
          .select()
          .single();

        if (!convError && newConversation) {
          conversationId = newConversation.id;
        }
      }

      // Fetch the matched user's details for the notification
      const { data: matchedUserProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", otherUserId)
        .single();

      // Fetch compatibility score
      const { data: compatibilityData } = await supabase
        .from("compatibility_scores")
        .select("overall_score")
        .eq("user1_id", user1Id)
        .eq("user2_id", user2Id)
        .single();

      if (matchedUserProfile) {
        const photos = matchedUserProfile.photos_json || [];
        return {
          success: true,
          isMatch: true,
          matchId,
          conversationId,
          matchedUser: {
            userId: otherUserId,
            displayName: matchedUserProfile.display_name,
            photoUrl: photos[0]?.url || null,
            compatibilityScore: compatibilityData?.overall_score ?? 0,
          },
        };
      }
    }

    return { success: true, isMatch, matchId };
  } catch (error) {
    console.error("Error recording like:", error);
    return {
      success: false,
      isMatch: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Record a pass action from the current user to another user.
 */
export async function passUser(otherUserId: string): Promise<PassResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.id === otherUserId) {
      return { success: false, error: "Cannot pass on yourself" };
    }

    // Ensure consistent ordering
    const [user1Id, user2Id] =
      user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];
    const isCurrentUserFirst = user.id === user1Id;

    // Check if match record already exists
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", user1Id)
      .eq("user2_id", user2Id)
      .single();

    if (existingMatch) {
      const updateField = isCurrentUserFirst ? "user1_liked" : "user2_liked";

      const { error: updateError } = await supabase
        .from("matches")
        .update({ [updateField]: false })
        .eq("id", existingMatch.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase.from("matches").insert({
        user1_id: user1Id,
        user2_id: user2Id,
        user1_liked: isCurrentUserFirst ? false : null,
        user2_liked: isCurrentUserFirst ? null : false,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording pass:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all matches for the current user.
 */
export async function getMatches(): Promise<{
  success: boolean;
  matches: MatchWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, matches: [], error: "Not authenticated" };
    }

    // Fetch all matches where matched_at is set (mutual likes)
    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .not("matched_at", "is", null)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("matched_at", { ascending: false });

    if (matchesError) {
      return { success: false, matches: [], error: matchesError.message };
    }

    if (!matchesData || matchesData.length === 0) {
      return { success: true, matches: [] };
    }

    // Get all other user IDs
    const otherUserIds = matchesData.map((match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .in("user_id", otherUserIds);

    // Fetch conversations
    const matchIds = matchesData.map((m) => m.id);
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .in("match_id", matchIds);

    // Fetch last messages for each conversation
    const conversationIds = conversations?.map((c) => c.id) || [];
    const lastMessages: Record<string, { content: string; createdAt: string; senderId: string }> = {};

    if (conversationIds.length > 0) {
      // Get the most recent message for each conversation
      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messages) {
        // Group by conversation and take the first (most recent) one
        for (const msg of messages) {
          if (!lastMessages[msg.conversation_id]) {
            lastMessages[msg.conversation_id] = {
              content: msg.content,
              createdAt: msg.created_at,
              senderId: msg.sender_id,
            };
          }
        }
      }
    }

    // Fetch compatibility scores
    const compatibilityPromises = matchesData.map(async (match) => {
      const { data } = await supabase
        .from("compatibility_scores")
        .select("*")
        .eq("user1_id", match.user1_id)
        .eq("user2_id", match.user2_id)
        .single();
      return { matchId: match.id, compatibility: data };
    });

    const compatibilityResults = await Promise.all(compatibilityPromises);
    const compatibilityMap = new Map(
      compatibilityResults.map((r) => [r.matchId, r.compatibility])
    );

    // Combine all data
    const matchesWithDetails: MatchWithDetails[] = matchesData.map((match) => {
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      const otherUser = profiles?.find((p) => p.user_id === otherUserId);
      const conversation = conversations?.find((c) => c.match_id === match.id) || null;
      const lastMsg = conversation ? lastMessages[conversation.id] : null;

      return {
        match: match as Match,
        otherUser: otherUser as UserProfile,
        compatibility: compatibilityMap.get(match.id) || null,
        conversation,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              isFromCurrentUser: lastMsg.senderId === user.id,
            }
          : null,
      };
    });

    return { success: true, matches: matchesWithDetails };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return {
      success: false,
      matches: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
