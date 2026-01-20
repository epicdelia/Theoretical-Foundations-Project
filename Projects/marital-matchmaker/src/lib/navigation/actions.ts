"use server";

import { createClient } from "@/lib/supabase/server";

export interface NavigationBadgeCounts {
  unreadMessages: number;
  newMatches: number;
}

export async function getNavigationBadgeCounts(): Promise<{
  counts: NavigationBadgeCounts;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { counts: { unreadMessages: 0, newMatches: 0 }, error: "Not authenticated" };
  }

  // Get unread messages count
  // First get all conversation IDs where the user is part of the match
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      id,
      matches!inner (
        user1_id,
        user2_id
      )
    `
    )
    .or(
      `matches.user1_id.eq.${user.id},matches.user2_id.eq.${user.id}`
    );

  let unreadMessages = 0;

  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map((c) => c.id);

    // Count unread messages (not sent by current user and not read)
    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .is("read_at", null);

    unreadMessages = unreadCount ?? 0;
  }

  // Get new matches count (mutual matches that haven't been viewed)
  // For simplicity, we count all mutual matches as "new" for now
  // A more sophisticated implementation would track "last_viewed_matches" timestamp

  // Get all likes from current user
  const { data: myLikes } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  let newMatches = 0;

  if (myLikes && myLikes.length > 0) {
    const myLikedUserIds = myLikes.map((l) => l.to_user_id);

    // Count mutual likes (people who liked back)
    const { count: mutualCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .in("from_user_id", myLikedUserIds);

    newMatches = mutualCount ?? 0;
  }

  return { counts: { unreadMessages, newMatches } };
}
