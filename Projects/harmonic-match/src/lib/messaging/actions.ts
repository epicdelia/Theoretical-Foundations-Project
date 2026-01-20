"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Message,
  MessageInsert,
  SongShareJson,
  UserProfile,
  Conversation,
} from "@/lib/database.types";

export interface ConversationWithDetails {
  conversation: Conversation;
  otherUser: UserProfile;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface MessageWithSender {
  message: Message;
  isFromCurrentUser: boolean;
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<{
  success: boolean;
  conversations: ConversationWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, conversations: [], error: "Not authenticated" };
    }

    // Get all matches where the user is involved and matched_at is set
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .not("matched_at", "is", null)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (matchesError) {
      return { success: false, conversations: [], error: matchesError.message };
    }

    if (!matches || matches.length === 0) {
      return { success: true, conversations: [] };
    }

    const matchIds = matches.map((m) => m.id);

    // Get conversations for these matches
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .in("match_id", matchIds);

    if (convError) {
      return { success: false, conversations: [], error: convError.message };
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, conversations: [] };
    }

    // Get other user IDs
    const otherUserIds = matches.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    // Get user profiles
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .in("user_id", otherUserIds);

    // Get last message for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    // Group messages by conversation
    const lastMessageByConversation: Record<string, Message> = {};
    const unreadCountByConversation: Record<string, number> = {};

    if (allMessages) {
      for (const msg of allMessages) {
        // Track last message
        if (!lastMessageByConversation[msg.conversation_id]) {
          lastMessageByConversation[msg.conversation_id] = msg as Message;
        }
        // Track unread count (messages from others that haven't been read)
        if (msg.sender_id !== user.id && !msg.read_at) {
          unreadCountByConversation[msg.conversation_id] =
            (unreadCountByConversation[msg.conversation_id] || 0) + 1;
        }
      }
    }

    // Build conversation details
    const conversationsWithDetails: ConversationWithDetails[] = conversations
      .map((conv): ConversationWithDetails | null => {
        const match = matches.find((m) => m.id === conv.match_id);
        if (!match) return null;

        const otherUserId =
          match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUser = profiles?.find((p) => p.user_id === otherUserId);

        if (!otherUser) return null;

        return {
          conversation: conv as Conversation,
          otherUser: otherUser as UserProfile,
          lastMessage: lastMessageByConversation[conv.id] || null,
          unreadCount: unreadCountByConversation[conv.id] || 0,
        };
      })
      .filter((c): c is ConversationWithDetails => c !== null)
      .sort((a, b) => {
        // Sort by last message time, or conversation creation time
        const aTime = a.lastMessage?.created_at ?? a.conversation.created_at;
        const bTime = b.lastMessage?.created_at ?? b.conversation.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return { success: true, conversations: conversationsWithDetails };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return {
      success: false,
      conversations: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(conversationId: string): Promise<{
  success: boolean;
  messages: MessageWithSender[];
  otherUser: UserProfile | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        messages: [],
        otherUser: null,
        error: "Not authenticated",
      };
    }

    // Get the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return {
        success: false,
        messages: [],
        otherUser: null,
        error: "Conversation not found",
      };
    }

    // Get the match to verify user is part of this conversation
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", conversation.match_id)
      .single();

    if (matchError || !match) {
      return {
        success: false,
        messages: [],
        otherUser: null,
        error: "Match not found",
      };
    }

    // Verify user is part of this conversation
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return {
        success: false,
        messages: [],
        otherUser: null,
        error: "Not authorized to view this conversation",
      };
    }

    // Get other user profile
    const otherUserId =
      match.user1_id === user.id ? match.user2_id : match.user1_id;
    const { data: otherUserProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", otherUserId)
      .single();

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      return {
        success: false,
        messages: [],
        otherUser: null,
        error: msgError.message,
      };
    }

    const messagesWithSender: MessageWithSender[] = (messages || []).map(
      (msg) => ({
        message: msg as Message,
        isFromCurrentUser: msg.sender_id === user.id,
      })
    );

    return {
      success: true,
      messages: messagesWithSender,
      otherUser: otherUserProfile as UserProfile | null,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      messages: [],
      otherUser: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a text message
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  songShare?: SongShareJson
): Promise<{
  success: boolean;
  message?: Message;
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

    // Validate content
    if (!content.trim() && !songShare) {
      return { success: false, error: "Message cannot be empty" };
    }

    if (content.length > 2000) {
      return { success: false, error: "Message too long (max 2000 characters)" };
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("match_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    const { data: match } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .eq("id", conversation.match_id)
      .single();

    if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) {
      return { success: false, error: "Not authorized" };
    }

    // Insert the message
    const messageData: MessageInsert = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim() || (songShare ? "Shared a song" : ""),
      song_share_json: songShare || null,
    };

    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, message: newMessage as Message };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Mark all unread messages from other users as read
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
