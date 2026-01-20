import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMutualMatches } from "@/lib/matches/actions";
import { MutualMatchCard } from "@/components/matches/MutualMatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { matches, error } = await getMutualMatches();

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
          <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
          Mutual Matches
        </h1>
        <p className="text-muted-foreground mt-1">
          These people liked you back! Start a conversation.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No mutual matches yet</h2>
            <p className="text-muted-foreground mb-4">
              Keep liking profiles! When someone you like also likes you back,
              they&apos;ll appear here.
            </p>
            <Button asChild>
              <Link href="/dashboard">Browse Matches</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>
              You have {matches.length} mutual match
              {matches.length !== 1 ? "es" : ""}
            </span>
          </div>
          {matches.map((match) => (
            <MutualMatchCard key={match.matchedUserId} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
