import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/messages/actions";
import { ConversationList } from "@/components/messages/ConversationList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { conversations, error } = await getConversations();

  return (
    <div className="container max-w-3xl py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-primary" />
          Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Chat with your matches
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground mb-4">
              Match with someone and start a conversation!
            </p>
            <Button asChild>
              <Link href="/matches">View Matches</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ConversationList conversations={conversations} currentUserId={user.id} />
      )}
    </div>
  );
}
