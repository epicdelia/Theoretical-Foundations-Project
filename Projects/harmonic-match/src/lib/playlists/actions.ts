"use server";

import { createClient } from "@/lib/supabase/server";
import type { SharedPlaylist, SharedPlaylistInsert } from "@/lib/database.types";

export interface SharedPlaylistWithTracks extends SharedPlaylist {
  trackCount?: number;
}

/**
 * Create a shared playlist for a match
 */
export async function createSharedPlaylist(
  matchId: string,
  spotifyPlaylistId: string,
  name: string
): Promise<{
  success: boolean;
  playlist?: SharedPlaylist;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is part of this match
    const { data: match } = await supabase
      .from("matches")
      .select("user1_id, user2_id, matched_at")
      .eq("id", matchId)
      .single();

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (!match.matched_at) {
      return { success: false, error: "Users are not matched yet" };
    }

    // Create the shared playlist record
    const playlistData: SharedPlaylistInsert = {
      match_id: matchId,
      spotify_playlist_id: spotifyPlaylistId,
      name,
    };

    const { data: newPlaylist, error: insertError } = await supabase
      .from("shared_playlists")
      .insert(playlistData)
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, playlist: newPlaylist as SharedPlaylist };
  } catch (error) {
    console.error("Error creating shared playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get shared playlists for a match
 */
export async function getSharedPlaylists(matchId: string): Promise<{
  success: boolean;
  playlists: SharedPlaylist[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, playlists: [], error: "Not authenticated" };
    }

    // Verify user is part of this match
    const { data: match } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (!match) {
      return { success: false, playlists: [], error: "Match not found" };
    }

    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return { success: false, playlists: [], error: "Not authorized" };
    }

    const { data: playlists, error: fetchError } = await supabase
      .from("shared_playlists")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return { success: false, playlists: [], error: fetchError.message };
    }

    return { success: true, playlists: (playlists || []) as SharedPlaylist[] };
  } catch (error) {
    console.error("Error fetching shared playlists:", error);
    return {
      success: false,
      playlists: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get shared playlists for a conversation (by conversation ID)
 */
export async function getSharedPlaylistsByConversation(
  conversationId: string
): Promise<{
  success: boolean;
  playlists: SharedPlaylist[];
  matchId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, playlists: [], error: "Not authenticated" };
    }

    // Get the conversation to find the match_id
    const { data: conversation } = await supabase
      .from("conversations")
      .select("match_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return { success: false, playlists: [], error: "Conversation not found" };
    }

    // Verify user is part of this match
    const { data: match } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .eq("id", conversation.match_id)
      .single();

    if (!match) {
      return { success: false, playlists: [], error: "Match not found" };
    }

    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return { success: false, playlists: [], error: "Not authorized" };
    }

    const { data: playlists, error: fetchError } = await supabase
      .from("shared_playlists")
      .select("*")
      .eq("match_id", conversation.match_id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return { success: false, playlists: [], error: fetchError.message };
    }

    return {
      success: true,
      playlists: (playlists || []) as SharedPlaylist[],
      matchId: conversation.match_id,
    };
  } catch (error) {
    console.error("Error fetching shared playlists:", error);
    return {
      success: false,
      playlists: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
