"use server";

import { createClient } from "@/lib/supabase/server";

export interface ConversationPreview {
  conversationId: string;
  matchId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export async function getConversations(): Promise<{
  conversations: ConversationPreview[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], error: "Not authenticated" };
  }

  // Get all conversations where the current user is part of the match
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      match_id,
      created_at,
      matches!inner (
        id,
        user1_id,
        user2_id
      )
    `
    )
    .or(
      `matches.user1_id.eq.${user.id},matches.user2_id.eq.${user.id}`
    );

  if (conversationsError) {
    console.error("Error fetching conversations:", conversationsError);
    return { conversations: [], error: "Failed to fetch conversations" };
  }

  if (!conversations || conversations.length === 0) {
    return { conversations: [] };
  }

  // Get other user IDs
  const otherUserIds = conversations.map((c) => {
    const match = c.matches as unknown as { id: string; user1_id: string; user2_id: string };
    return match.user1_id === user.id ? match.user2_id : match.user1_id;
  });

  // Get profiles for other users
  const { data: profiles } = await supabase
    .from("users_extended")
    .select("user_id, display_name, photos_json")
    .in("user_id", otherUserIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, p]) ?? []
  );

  // Get latest message for each conversation
  const conversationIds = conversations.map((c) => c.id);

  // Get all messages for these conversations to find latest and unread count
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  // Build message data per conversation
  const conversationMessages = new Map<string, {
    lastMessage: MessageData | null;
    unreadCount: number;
  }>();

  for (const convId of conversationIds) {
    const convMessages = messages?.filter((m) => m.conversation_id === convId) ?? [];
    const lastMsg = convMessages[0] ?? null;
    const unreadCount = convMessages.filter(
      (m) => m.sender_id !== user.id && m.read_at === null
    ).length;

    conversationMessages.set(convId, {
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            conversationId: lastMsg.conversation_id,
            senderId: lastMsg.sender_id,
            content: lastMsg.content,
            readAt: lastMsg.read_at,
            createdAt: lastMsg.created_at,
          }
        : null,
      unreadCount,
    });
  }

  // Build conversation previews
  const conversationPreviews: ConversationPreview[] = conversations.map((c) => {
    const match = c.matches as unknown as { id: string; user1_id: string; user2_id: string };
    const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    const profile = profileMap.get(otherUserId);
    const photos = profile?.photos_json as { url: string }[] | null;
    const photoUrl = photos && photos.length > 0 ? photos[0].url : null;
    const msgData = conversationMessages.get(c.id);

    return {
      conversationId: c.id,
      matchId: c.match_id,
      otherUserId,
      otherUserName: profile?.display_name ?? "Unknown",
      otherUserPhoto: photoUrl,
      lastMessage: msgData?.lastMessage?.content ?? null,
      lastMessageAt: msgData?.lastMessage?.createdAt ?? null,
      lastMessageSenderId: msgData?.lastMessage?.senderId ?? null,
      unreadCount: msgData?.unreadCount ?? 0,
    };
  });

  // Sort by last message time (most recent first)
  conversationPreviews.sort((a, b) => {
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  return { conversations: conversationPreviews };
}

export async function getConversationMessages(
  conversationId: string
): Promise<{
  messages: MessageData[];
  otherUser: { id: string; name: string; photo: string | null } | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], otherUser: null, error: "Not authenticated" };
  }

  // Verify user has access to this conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `
      id,
      matches!inner (
        id,
        user1_id,
        user2_id
      )
    `
    )
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return { messages: [], otherUser: null, error: "Conversation not found" };
  }

  const match = conversation.matches as unknown as { id: string; user1_id: string; user2_id: string };
  if (match.user1_id !== user.id && match.user2_id !== user.id) {
    return { messages: [], otherUser: null, error: "Access denied" };
  }

  const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

  // Get other user profile
  const { data: profile } = await supabase
    .from("users_extended")
    .select("user_id, display_name, photos_json")
    .eq("user_id", otherUserId)
    .single();

  const photos = profile?.photos_json as { url: string }[] | null;
  const photoUrl = photos && photos.length > 0 ? photos[0].url : null;

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    return { messages: [], otherUser: null, error: "Failed to fetch messages" };
  }

  return {
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      readAt: m.read_at,
      createdAt: m.created_at,
    })),
    otherUser: profile
      ? {
          id: profile.user_id,
          name: profile.display_name,
          photo: photoUrl,
        }
      : null,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{
  message: MessageData | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: null, error: "Not authenticated" };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { message: null, error: "Message cannot be empty" };
  }

  // Verify user has access to this conversation
  const { data: conversation } = await supabase
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
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return { message: null, error: "Conversation not found" };
  }

  const match = conversation.matches as unknown as { user1_id: string; user2_id: string };
  if (match.user1_id !== user.id && match.user2_id !== user.id) {
    return { message: null, error: "Access denied" };
  }

  // Insert message
  const { data: newMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmedContent,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error sending message:", insertError);
    return { message: null, error: "Failed to send message" };
  }

  return {
    message: {
      id: newMessage.id,
      conversationId: newMessage.conversation_id,
      senderId: newMessage.sender_id,
      content: newMessage.content,
      readAt: newMessage.read_at,
      createdAt: newMessage.created_at,
    },
  };
}

export async function markMessagesAsRead(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Mark all unread messages in this conversation (sent by others) as read
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking messages as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }

  return { success: true };
}

export async function getOrCreateConversation(
  otherUserId: string
): Promise<{ conversationId: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversationId: null, error: "Not authenticated" };
  }

  // Find the match between these users
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
    )
    .single();

  if (!match) {
    return { conversationId: null, error: "No match found with this user" };
  }

  // Check if conversation exists
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("match_id", match.id)
    .single();

  if (existingConversation) {
    return { conversationId: existingConversation.id };
  }

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({ match_id: match.id })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating conversation:", createError);
    return { conversationId: null, error: "Failed to create conversation" };
  }

  return { conversationId: newConversation.id };
}
