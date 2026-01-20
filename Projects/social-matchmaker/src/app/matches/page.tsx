"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MatchProposal, UserProfile } from "@/lib/database/types";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";

interface ProposalWithProfiles extends MatchProposal {
  person1_profile?: UserProfile;
  person2_profile?: UserProfile;
}

export default function MatchesPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [proposals, setProposals] = useState<ProposalWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      if (!user) return;

      const { data: proposalsData } = await supabase
        .from("match_proposals")
        .select("*")
        .eq("matchmaker_id", user.id)
        .order("created_at", { ascending: false })
        .returns<MatchProposal[]>();

      if (!proposalsData || proposalsData.length === 0) {
        setProposals([]);
        setIsLoading(false);
        return;
      }

      // Get all unique user IDs
      const userIds = new Set<string>();
      proposalsData.forEach((p) => {
        userIds.add(p.person1_id);
        userIds.add(p.person2_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("*")
        .in("user_id", Array.from(userIds))
        .returns<UserProfile[]>();

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const proposalsWithProfiles: ProposalWithProfiles[] = proposalsData.map(
        (p) => ({
          ...p,
          person1_profile: profileMap.get(p.person1_id),
          person2_profile: profileMap.get(p.person2_id),
        })
      );

      setProposals(proposalsWithProfiles);
      setIsLoading(false);
    }

    if (user) {
      fetchProposals();
    }
  }, [user, supabase]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "accepted":
        return <Badge variant="accent">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Matches</h1>
          <p className="text-muted-foreground">
            View and manage your matchmaking proposals
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/matches/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Match
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Matchmaking Stats</CardTitle>
          <CardDescription>Your track record as a matchmaker</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Successful matches: {profile?.successful_matches ?? 0} /{" "}
            {profile?.matches_made ?? 0}
          </p>
        </CardContent>
      </Card>

      {/* Proposals List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading proposals...
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-4">
              Start matchmaking to see your matches here. Connect friends and
              earn rewards!
            </p>
            <Link href="/matches/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {/* Person 1 */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={proposal.person1_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(
                          proposal.person1_profile?.display_name || "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {proposal.person1_profile?.display_name || "Unknown"}
                    </span>
                  </div>

                  {/* Heart icon */}
                  <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />

                  {/* Person 2 */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={proposal.person2_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(
                          proposal.person2_profile?.display_name || "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {proposal.person2_profile?.display_name || "Unknown"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="ml-auto">
                    {getStatusBadge(proposal.status)}
                  </div>
                </div>

                {/* Pitch preview */}
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {proposal.pitch_text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
