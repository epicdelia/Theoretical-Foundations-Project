import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConversationMessages, markMessagesAsRead } from "@/lib/messages/actions";
import { ChatView } from "@/components/messages/ChatView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface ChatPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { messages, otherUser, error } = await getConversationMessages(conversationId);

  // Mark messages as read when opening the conversation
  if (!error && messages.length > 0) {
    await markMessagesAsRead(conversationId);
  }

  if (error || !otherUser) {
    return (
      <div className="container max-w-3xl py-8">
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Messages
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "This conversation doesn't exist or you don't have access to it."}
            </p>
            <Button asChild>
              <Link href="/messages">Back to Messages</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={otherUser}
      initialMessages={messages}
    />
  );
}
