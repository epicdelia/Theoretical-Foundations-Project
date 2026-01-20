"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile, FriendInvite, FriendConnection } from "@/lib/database/types";
import { UserPlus, Check, AlertCircle } from "lucide-react";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [invite, setInvite] = useState<FriendInvite | null>(null);
  const [inviter, setInviter] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      setIsLoading(true);

      // Fetch the invite
      const { data: inviteData, error: inviteError } = await supabase
        .from("friend_invites")
        .select("*")
        .eq("invite_code", code)
        .single<FriendInvite>();

      if (inviteError || !inviteData) {
        setError("Invalid or expired invite link");
        setIsLoading(false);
        return;
      }

      // Check if invite is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("This invite has expired");
        setIsLoading(false);
        return;
      }

      // Check if invite is already accepted
      if (inviteData.status === "accepted") {
        setError("This invite has already been used");
        setIsLoading(false);
        return;
      }

      setInvite(inviteData);

      // Fetch inviter profile
      const { data: inviterData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", inviteData.inviter_id)
        .single<UserProfile>();

      if (inviterData) {
        setInviter(inviterData);
      }

      setIsLoading(false);
    };

    fetchInvite();
  }, [code, supabase]);

  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    // Don't allow self-invites
    if (user.id === invite.inviter_id) {
      setError("You cannot accept your own invite");
      return;
    }

    setIsAccepting(true);
    setError(null);

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from("friend_connections")
      .select("*")
      .or(
        `and(user_id.eq.${invite.inviter_id},friend_user_id.eq.${user.id}),and(user_id.eq.${user.id},friend_user_id.eq.${invite.inviter_id})`
      )
      .maybeSingle<FriendConnection>();

    if (existingConnection) {
      if (existingConnection.status === "accepted") {
        setError("You are already friends with this user");
        setIsAccepting(false);
        return;
      }
      // If pending, accept it
      await supabase
        .from("friend_connections")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", existingConnection.id);
    } else {
      // Create new connection (already accepted)
      const { error: connectionError } = await supabase
        .from("friend_connections")
        .insert({
          user_id: invite.inviter_id,
          friend_user_id: user.id,
          status: "accepted",
        });

      if (connectionError) {
        setError("Failed to accept invite: " + connectionError.message);
        setIsAccepting(false);
        return;
      }
    }

    // Mark invite as accepted
    await supabase
      .from("friend_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    setSuccess(true);
    setIsAccepting(false);

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/onboarding/profile");
    }, 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Invite Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Check className="h-12 w-12 mx-auto mb-4 text-accent" />
            <CardTitle>Friend Added!</CardTitle>
            <CardDescription>
              You are now connected with {inviter?.display_name}. Redirecting to
              your profile...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Friend Invite</CardTitle>
            <CardDescription>
              {inviter?.display_name || "Someone"} invited you to connect!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Sign up or log in to accept this invite and start matchmaking with
              your friends.
            </p>
          </CardContent>
          <CardFooter className="flex gap-3 justify-center">
            <Link href={`/signup?redirect=/invite/${code}`}>
              <Button>Sign Up</Button>
            </Link>
            <Link href={`/login?redirect=/invite/${code}`}>
              <Button variant="outline">Log In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Friend Invite</CardTitle>
          <CardDescription>
            You&apos;ve been invited to connect!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviter && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={inviter.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {getInitials(inviter.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold">{inviter.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  wants to be your friend
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button onClick={handleAcceptInvite} disabled={isAccepting}>
            {isAccepting ? "Accepting..." : "Accept Invite"}
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Decline</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
