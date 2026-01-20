"use client";

import { useEffect, useState, useMemo, use } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserProfile, FriendConnection, Match } from "@/lib/database/types";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Heart,
  Clock,
  Star,
  UserPlus,
  ArrowLeft,
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface MatchmakerProfileData extends UserProfile {
  successRate: number;
  avgMatchDurationMonths: number;
}

interface AnonymizedMatch {
  id: string;
  started_dating_at: string | null;
  relationship_status: string | null;
  durationMonths: number;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDuration = (months: number) => {
  if (months < 1) return "< 1 month";
  if (months === 1) return "1 month";
  if (months < 12) return `${Math.round(months)} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (remainingMonths === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${years}y ${remainingMonths}m`;
};

const getRelationshipStatusBadge = (status: string | null) => {
  switch (status) {
    case "dating":
      return <Badge variant="secondary">Dating</Badge>;
    case "engaged":
      return <Badge variant="accent">Engaged</Badge>;
    case "married":
      return <Badge variant="default">Married</Badge>;
    default:
      return <Badge variant="muted">Active</Badge>;
  }
};

export default function MatchmakerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchmakerId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [matchmaker, setMatchmaker] = useState<MatchmakerProfileData | null>(null);
  const [recentMatches, setRecentMatches] = useState<AnonymizedMatch[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<FriendConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if viewing own profile
  const isOwnProfile = user?.id === matchmakerId;

  useEffect(() => {
    async function fetchMatchmakerData() {
      setIsLoading(true);
      setError(null);

      // Fetch matchmaker profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", matchmakerId)
        .single();

      if (profileError || !profileData) {
        setError("Matchmaker not found");
        setIsLoading(false);
        return;
      }

      const profile = profileData as UserProfile;

      // Fetch proposals made by this matchmaker to calculate avg duration
      const { data: proposalsData } = await supabase
        .from("match_proposals")
        .select("id")
        .eq("matchmaker_id", matchmakerId)
        .eq("status", "accepted");

      const proposalIds = (proposalsData || []).map((p) => p.id);

      // Fetch successful matches for these proposals
      let avgDuration = 0;
      const matchesForDisplay: AnonymizedMatch[] = [];

      if (proposalIds.length > 0) {
        const { data: matchesData } = await supabase
          .from("matches")
          .select("id, proposal_id, started_dating_at, relationship_status, created_at")
          .in("proposal_id", proposalIds)
          .eq("person1_accepted", true)
          .eq("person2_accepted", true)
          .order("started_dating_at", { ascending: false })
          .limit(10);

        if (matchesData && matchesData.length > 0) {
          const now = new Date();
          let totalDuration = 0;
          let matchCount = 0;

          for (const match of matchesData as Match[]) {
            if (match.started_dating_at) {
              const startDate = new Date(match.started_dating_at);
              const durationMonths =
                (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
              totalDuration += durationMonths;
              matchCount++;

              matchesForDisplay.push({
                id: match.id,
                started_dating_at: match.started_dating_at,
                relationship_status: match.relationship_status,
                durationMonths,
              });
            }
          }

          if (matchCount > 0) {
            avgDuration = totalDuration / matchCount;
          }
        }
      }

      // Calculate success rate
      const successRate =
        profile.matches_made > 0
          ? Math.round((profile.successful_matches / profile.matches_made) * 100)
          : 0;

      setMatchmaker({
        ...profile,
        successRate,
        avgMatchDurationMonths: avgDuration,
      });
      setRecentMatches(matchesForDisplay.slice(0, 5));

      // Check friend connection status if logged in and not own profile
      if (user && !isOwnProfile) {
        const { data: connectionData } = await supabase
          .from("friend_connections")
          .select("*")
          .or(
            `and(user_id.eq.${user.id},friend_user_id.eq.${matchmakerId}),and(user_id.eq.${matchmakerId},friend_user_id.eq.${user.id})`
          )
          .single();

        if (connectionData) {
          setConnectionStatus(connectionData as FriendConnection);
        }
      }

      setIsLoading(false);
    }

    fetchMatchmakerData();
  }, [supabase, matchmakerId, user, isOwnProfile]);

  const handleAddFriend = async () => {
    if (!user || isAddingFriend) return;

    setIsAddingFriend(true);

    const { data, error: insertError } = await supabase
      .from("friend_connections")
      .insert({
        user_id: user.id,
        friend_user_id: matchmakerId,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error sending friend request:", insertError);
      setIsAddingFriend(false);
      return;
    }

    setConnectionStatus(data as FriendConnection);
    setIsAddingFriend(false);
  };

  const getConnectionButton = () => {
    if (isOwnProfile) {
      return (
        <Link href="/onboarding/profile">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      );
    }

    if (!user) {
      return (
        <Link href="/login">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Sign in to connect
          </Button>
        </Link>
      );
    }

    if (!connectionStatus) {
      return (
        <Button onClick={handleAddFriend} disabled={isAddingFriend}>
          {isAddingFriend ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Add Friend
        </Button>
      );
    }

    switch (connectionStatus.status) {
      case "pending":
        return (
          <Button variant="outline" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Request Pending
          </Button>
        );
      case "accepted":
        return (
          <Button variant="secondary" disabled>
            <CheckCircle className="h-4 w-4 mr-2" />
            Friends
          </Button>
        );
      case "blocked":
        return null;
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !matchmaker) {
    return (
      <div className="py-8 space-y-6">
        <Link href="/leaderboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboard
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Matchmaker Not Found</p>
            <p className="text-muted-foreground">
              The profile you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Back Button */}
      <Link href="/leaderboard">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leaderboard
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage src={matchmaker.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(matchmaker.display_name || "U")}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{matchmaker.display_name}</h1>
                {isOwnProfile && (
                  <Badge variant="outline" className="w-fit mx-auto sm:mx-0">
                    Your Profile
                  </Badge>
                )}
              </div>

              {/* Matchmaker Score Badge */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-lg">{matchmaker.matchmaker_score}</span>
                <span className="text-muted-foreground text-sm">Matchmaker Score</span>
              </div>

              {/* Connection Button */}
              {getConnectionButton()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Matches Made
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{matchmaker.matches_made}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{matchmaker.successRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${matchmaker.total_earnings.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Match Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {matchmaker.avgMatchDurationMonths > 0
                ? formatDuration(matchmaker.avgMatchDurationMonths)
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matchmaker Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Matchmaker Rating
          </CardTitle>
          <CardDescription>
            Score based on successful matches and relationship longevity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(matchmaker.matchmaker_score, 100)}%` }}
              />
            </div>
            <span className="font-bold text-lg min-w-[3rem] text-right">
              {matchmaker.matchmaker_score}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {matchmaker.matchmaker_score >= 80
              ? "Elite Matchmaker"
              : matchmaker.matchmaker_score >= 60
                ? "Expert Matchmaker"
                : matchmaker.matchmaker_score >= 40
                  ? "Skilled Matchmaker"
                  : matchmaker.matchmaker_score >= 20
                    ? "Rising Matchmaker"
                    : "New Matchmaker"}
          </p>
        </CardContent>
      </Card>

      {/* Recent Successful Matches (Anonymized) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Recent Successful Matches
          </CardTitle>
          <CardDescription>Anonymized for privacy</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No successful matches yet.</p>
              <p className="text-sm">Check back later!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match, index) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        ?
                      </div>
                      <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-medium">
                        ?
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Match #{index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        Together for {formatDuration(match.durationMonths)}
                      </p>
                    </div>
                  </div>
                  {getRelationshipStatusBadge(match.relationship_status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      {!user && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Sign up to become a matchmaker and start earning!
            </p>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
