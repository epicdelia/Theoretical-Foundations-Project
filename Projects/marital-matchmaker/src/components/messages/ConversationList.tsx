"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConversationPreview } from "@/lib/messages/actions";

interface ConversationListProps {
  conversations: ConversationPreview[];
  currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isOwnMessage = conversation.lastMessageSenderId === currentUserId;

        return (
          <Link key={conversation.conversationId} href={`/messages/${conversation.conversationId}`}>
            <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-muted">
                      {conversation.otherUserPhoto ? (
                        <AvatarImage
                          src={conversation.otherUserPhoto}
                          alt={conversation.otherUserName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-muted">
                        {getInitials(conversation.otherUserName) || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-primary text-primary-foreground text-xs"
                      >
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold truncate group-hover:text-primary transition-colors ${conversation.unreadCount > 0 ? "text-foreground" : ""}`}>
                        {conversation.otherUserName}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate mt-0.5 ${
                        conversation.unreadCount > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conversation.lastMessage
                        ? `${isOwnMessage ? "You: " : ""}${conversation.lastMessage}`
                        : "No messages yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
