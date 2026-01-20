"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Loader2,
  User,
  RefreshCw,
  Search,
  Music,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getConversations, type ConversationWithDetails } from "@/lib/messaging";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { PhotoJson } from "@/lib/database.types";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  currentUserId,
  onClick,
}: ConversationItemProps) {
  const { otherUser, lastMessage, unreadCount } = conversation;
  const photos = (otherUser.photos_json || []) as PhotoJson[];
  const primaryPhoto = photos[0]?.url;

  const isFromCurrentUser = lastMessage?.sender_id === currentUserId;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {primaryPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto}
              alt={otherUser.display_name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`font-semibold truncate ${hasUnread ? "text-foreground" : "text-foreground"}`}
            >
              {otherUser.display_name}
            </h3>
            {lastMessage && (
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatRelativeTime(lastMessage.created_at)}
              </span>
            )}
          </div>
          {lastMessage ? (
            <p
              className={`text-sm truncate mt-0.5 ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {isFromCurrentUser && (
                <span className="text-primary">You: </span>
              )}
              {lastMessage.song_share_json ? (
                <span className="inline-flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  {lastMessage.song_share_json.track_name}
                </span>
              ) : (
                lastMessage.content
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              Start the conversation
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onDiscover }: { onDiscover: () => void }) {
  return (
    <Card className="p-8 text-center">
      <div className="h-24 w-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
        <MessageCircle className="h-12 w-12 text-muted-foreground" />
      </div>
      <CardTitle className="mb-2">No Conversations Yet</CardTitle>
      <CardDescription className="mb-6 max-w-xs mx-auto">
        Match with someone to start chatting and share your favorite songs!
      </CardDescription>
      <Button onClick={onDiscover}>
        <Search className="mr-2 h-4 w-4" />
        Find Matches
      </Button>
    </Card>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getConversations();

    if (result.success) {
      setConversations(result.conversations);
    } else {
      setError(result.error || "Failed to load conversations");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      fetchConversations();
    }
  }, [user, authLoading, fetchConversations]);

  const handleOpenConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const handleDiscover = () => {
    router.push("/discover");
  };

  const handleBack = () => {
    router.push("/matches");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Messages
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchConversations}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <Card className="p-8 text-center">
              <CardTitle className="mb-2 text-destructive">Error</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={fetchConversations}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Card>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState onDiscover={handleDiscover} />
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.conversation.id}
                conversation={conv}
                currentUserId={user.id}
                onClick={() => handleOpenConversation(conv.conversation.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
