"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserProfile, FriendConnection, MatchProposal } from "@/lib/database/types";
import {
  Heart,
  ArrowLeft,
  Check,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface FriendWithProfile extends FriendConnection {
  friend_profile?: UserProfile;
  user_profile?: UserProfile;
}

type Step = "select-person1" | "select-person2" | "pitch" | "preview";

export default function NewMatchPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Friends data
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // Match proposal state
  const [step, setStep] = useState<Step>("select-person1");
  const [person1, setPerson1] = useState<UserProfile | null>(null);
  const [person2, setPerson2] = useState<UserProfile | null>(null);
  const [pitchText, setPitchText] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Existing match proposals to check for duplicates
  const [existingProposals, setExistingProposals] = useState<
    { person1_id: string; person2_id: string }[]
  >([]);

  // Fetch friends and existing proposals
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setIsLoadingFriends(true);

      // Fetch accepted friend connections where user is the requester
      const { data: sentConnections } = await supabase
        .from("friend_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .returns<FriendConnection[]>();

      // Fetch accepted friend connections where user is the recipient
      const { data: receivedConnections } = await supabase
        .from("friend_connections")
        .select("*")
        .eq("friend_user_id", user.id)
        .eq("status", "accepted")
        .returns<FriendConnection[]>();

      // Get all unique user IDs to fetch profiles
      const userIds = new Set<string>();
      sentConnections?.forEach((c) => userIds.add(c.friend_user_id));
      receivedConnections?.forEach((c) => userIds.add(c.user_id));

      // Fetch profiles for all users
      let profiles: UserProfile[] = [];
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("*")
          .in("user_id", Array.from(userIds))
          .returns<UserProfile[]>();
        profiles = profilesData || [];
      }

      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      // Process sent connections
      const sentWithProfiles: FriendWithProfile[] = (
        sentConnections || []
      ).map((c) => ({
        ...c,
        friend_profile: profileMap.get(c.friend_user_id),
      }));

      // Process received connections
      const receivedWithProfiles: FriendWithProfile[] = (
        receivedConnections || []
      ).map((c) => ({
        ...c,
        user_profile: profileMap.get(c.user_id),
      }));

      setFriends([...sentWithProfiles, ...receivedWithProfiles]);

      // Fetch existing proposals from this matchmaker
      const { data: proposals } = await supabase
        .from("match_proposals")
        .select("person1_id, person2_id")
        .eq("matchmaker_id", user.id)
        .in("status", ["pending", "accepted"]);

      setExistingProposals(proposals || []);
      setIsLoadingFriends(false);
    }

    if (user) {
      fetchData();
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

  const getFriendProfile = (friend: FriendWithProfile): UserProfile | null => {
    return friend.friend_profile || friend.user_profile || null;
  };

  const isAlreadyMatched = (userId1: string, userId2: string): boolean => {
    return existingProposals.some(
      (p) =>
        (p.person1_id === userId1 && p.person2_id === userId2) ||
        (p.person1_id === userId2 && p.person2_id === userId1)
    );
  };

  const availableFriendsForPerson2 = friends.filter((f) => {
    const profile = getFriendProfile(f);
    if (!profile || !person1) return false;
    // Exclude person1 and already matched pairs
    return (
      profile.user_id !== person1.user_id &&
      !isAlreadyMatched(person1.user_id, profile.user_id)
    );
  });

  const handleSelectPerson1 = (profile: UserProfile) => {
    setPerson1(profile);
    setPerson2(null); // Reset person2 when changing person1
    setStep("select-person2");
  };

  const handleSelectPerson2 = (profile: UserProfile) => {
    setPerson2(profile);
    setStep("pitch");
  };

  const handleContinueToPreview = () => {
    if (pitchText.trim().length < 10) {
      setError("Please write at least 10 characters explaining why they'd be good together.");
      return;
    }
    setError(null);
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (!user || !person1 || !person2 || !pitchText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    // Double-check for existing match
    if (isAlreadyMatched(person1.user_id, person2.user_id)) {
      setError("These two people have already been matched by you.");
      setIsSubmitting(false);
      return;
    }

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the match proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("match_proposals")
      .insert({
        matchmaker_id: user.id,
        person1_id: person1.user_id,
        person2_id: person2.user_id,
        pitch_text: pitchText.trim(),
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single<MatchProposal>();

    if (proposalError) {
      setError("Failed to create match proposal: " + proposalError.message);
      setIsSubmitting(false);
      return;
    }

    // Create notifications for both people
    const notifications = [
      {
        user_id: person1.user_id,
        type: "match_proposal" as const,
        content: {
          proposal_id: proposal.id,
          matchmaker_name:
            (
              await supabase
                .from("user_profiles")
                .select("display_name")
                .eq("user_id", user.id)
                .single()
            ).data?.display_name || "A friend",
          other_person_name: person2.display_name,
          pitch_text: pitchText.trim(),
        },
        read: false,
      },
      {
        user_id: person2.user_id,
        type: "match_proposal" as const,
        content: {
          proposal_id: proposal.id,
          matchmaker_name:
            (
              await supabase
                .from("user_profiles")
                .select("display_name")
                .eq("user_id", user.id)
                .single()
            ).data?.display_name || "A friend",
          other_person_name: person1.display_name,
          pitch_text: pitchText.trim(),
        },
        read: false,
      },
    ];

    await supabase.from("notifications").insert(notifications);

    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  const handleBackStep = () => {
    switch (step) {
      case "select-person2":
        setStep("select-person1");
        break;
      case "pitch":
        setStep("select-person2");
        break;
      case "preview":
        setStep("pitch");
        break;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {step !== "select-person1" ? (
            <Button variant="ghost" size="icon" onClick={handleBackStep}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/matches">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold">Create Match</h1>
            <p className="text-muted-foreground">
              Connect two friends who might be perfect for each other
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant={step === "select-person1" ? "default" : "outline"}>
          1. Person 1
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge
          variant={
            step === "select-person2"
              ? "default"
              : person2
                ? "outline"
                : "outline"
          }
        >
          2. Person 2
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === "pitch" ? "default" : "outline"}>
          3. Pitch
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === "preview" ? "default" : "outline"}>
          4. Preview
        </Badge>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Step content */}
      {step === "select-person1" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select First Person
            </CardTitle>
            <CardDescription>
              Choose the first person you want to match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFriends ? (
              <div className="text-center text-muted-foreground py-8">
                Loading friends...
              </div>
            ) : friends.length < 2 ? (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>You need at least 2 friends to create a match.</p>
                <Link href="/onboarding/profile">
                  <Button variant="outline" className="mt-4">
                    Add More Friends
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {friends.map((friend) => {
                  const profile = getFriendProfile(friend);
                  if (!profile) return null;
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectPerson1(profile)}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors text-left w-full"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(profile.display_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{profile.display_name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "select-person2" && person1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Second Person
            </CardTitle>
            <CardDescription>
              Choose who you think would be a great match for{" "}
              {person1.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Selected person 1 */}
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent">
              <p className="text-sm text-muted-foreground mb-2">
                Matching with:
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={person1.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(person1.display_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{person1.display_name}</span>
                <Badge variant="accent" className="ml-auto">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              </div>
            </div>

            {availableFriendsForPerson2.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>
                  No available friends to match with {person1.display_name}.
                </p>
                <p className="text-sm mt-2">
                  Either all your friends have already been matched with this
                  person, or you need more friends.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableFriendsForPerson2.map((friend) => {
                  const profile = getFriendProfile(friend);
                  if (!profile) return null;
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectPerson2(profile)}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors text-left w-full"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(profile.display_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{profile.display_name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "pitch" && person1 && person2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Write Your Pitch
            </CardTitle>
            <CardDescription>
              Explain why {person1.display_name} and {person2.display_name}{" "}
              would be great together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected people */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={person1.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(person1.display_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{person1.display_name}</p>
              </div>
              <Heart className="h-8 w-8 text-accent" />
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={person2.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(person2.display_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{person2.display_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch">Why would they be good together?</Label>
              <Textarea
                id="pitch"
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="They both love hiking and have the same sense of humor. I think they'd really hit it off..."
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                {pitchText.length} characters (minimum 10)
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleContinueToPreview}
              disabled={pitchText.trim().length < 10}
              className="w-full"
            >
              Continue to Preview
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "preview" && person1 && person2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Preview Your Match Proposal
            </CardTitle>
            <CardDescription>
              Review before sending to {person1.display_name} and{" "}
              {person2.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Match visual */}
            <div className="flex items-center justify-center gap-4 p-6 rounded-lg bg-gradient-to-r from-pink-500/10 via-red-500/10 to-pink-500/10 border">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2 ring-2 ring-pink-500/50">
                  <AvatarImage src={person1.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(person1.display_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{person1.display_name}</p>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="h-10 w-10 text-pink-500 fill-pink-500" />
                <span className="text-sm text-muted-foreground mt-1">
                  Match
                </span>
              </div>
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2 ring-2 ring-pink-500/50">
                  <AvatarImage src={person2.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(person2.display_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{person2.display_name}</p>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <h3 className="font-medium">Your Pitch</h3>
              <div className="p-4 rounded-lg bg-muted border">
                <p className="whitespace-pre-wrap">{pitchText}</p>
              </div>
            </div>

            {/* Info */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Both people will receive a notification about this match
                proposal
              </p>
              <p>• The proposal will expire in 7 days if not accepted</p>
              <p>
                • You&apos;ll earn rewards if they start dating and hit milestones!
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBackStep}
              className="flex-1"
            >
              Edit Pitch
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Match Proposal"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Match Proposal Sent!
            </DialogTitle>
            <DialogDescription>
              {person1?.display_name} and {person2?.display_name} have been
              notified about your match proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You&apos;ll be notified when they respond. If both accept, you could
              earn matchmaker rewards!
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => router.push("/matches")} className="w-full">
              View My Matches
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
