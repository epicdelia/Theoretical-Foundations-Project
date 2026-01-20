"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  UserProfile,
  FriendConnection,
  FriendInvite,
} from "@/lib/database/types";
import {
  Camera,
  Mail,
  Link as LinkIcon,
  UserPlus,
  Check,
  X,
  Copy,
  Users,
  ArrowRight,
} from "lucide-react";

interface FriendWithProfile extends FriendConnection {
  friend_profile?: UserProfile;
  user_profile?: UserProfile;
}

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state - use profile values as fallback, local state for edits
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Use local state if set, otherwise fall back to profile
  const displayName = localDisplayName ?? profile?.display_name ?? "";
  const avatarUrl = localAvatarUrl !== undefined ? localAvatarUrl : profile?.avatar_url ?? null;

  const setDisplayName = (value: string) => setLocalDisplayName(value);
  const setAvatarUrl = (value: string | null) => setLocalAvatarUrl(value);

  // Friends state
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>(
    []
  );
  const [pendingSent, setPendingSent] = useState<FriendInvite[]>([]);
  const [friendsVersion, setFriendsVersion] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const acceptedFriendsCount = friends.filter(
    (f) => f.status === "accepted"
  ).length;
  const canProceed = acceptedFriendsCount >= 2;

  const refreshFriends = useCallback(() => {
    setFriendsVersion((v) => v + 1);
  }, []);

  // Fetch friends data when user is available
  useEffect(() => {
    async function fetchFriendsData() {
      if (!user) return;

      setIsLoading(true);

      // Fetch accepted and pending friend connections where user is the requester
      const { data: sentConnections } = await supabase
        .from("friend_connections")
        .select("*")
        .eq("user_id", user.id)
        .returns<FriendConnection[]>();

      // Fetch pending friend connections where user is the recipient
      const { data: receivedConnections } = await supabase
        .from("friend_connections")
        .select("*")
        .eq("friend_user_id", user.id)
        .returns<FriendConnection[]>();

      // Fetch pending email invites sent by user
      const { data: emailInvites } = await supabase
        .from("friend_invites")
        .select("*")
        .eq("inviter_id", user.id)
        .eq("status", "pending")
        .returns<FriendInvite[]>();

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
      const sentWithProfiles: FriendWithProfile[] = (sentConnections || []).map(
        (c) => ({
          ...c,
          friend_profile: profileMap.get(c.friend_user_id),
        })
      );

      // Process received connections
      const receivedWithProfiles: FriendWithProfile[] = (
        receivedConnections || []
      ).map((c) => ({
        ...c,
        user_profile: profileMap.get(c.user_id),
      }));

      // Separate accepted friends and pending requests
      const acceptedFriends = [
        ...sentWithProfiles.filter((c) => c.status === "accepted"),
        ...receivedWithProfiles.filter((c) => c.status === "accepted"),
      ];

      const pendingReceivedRequests = receivedWithProfiles.filter(
        (c) => c.status === "pending"
      );

      setFriends(acceptedFriends);
      setPendingReceived(pendingReceivedRequests);
      setPendingSent(emailInvites || []);
      setIsLoading(false);
    }

    if (user) {
      fetchFriendsData();
    }
  }, [user, supabase, friendsVersion]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;

    setIsSaving(true);
    setError(null);

    let newAvatarUrl = avatarUrl;

    // Upload avatar if changed
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setError("Failed to upload avatar: " + uploadError.message);
        setIsSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      newAvatarUrl = publicUrl;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName.trim(),
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError("Failed to update profile: " + updateError.message);
    } else {
      setSuccessMessage("Profile saved successfully!");
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleInviteByEmail = async () => {
    if (!user || !inviteEmail.trim()) return;

    setIsInviting(true);
    setError(null);

    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { error: inviteError } = await supabase
      .from("friend_invites")
      .insert({
        inviter_id: user.id,
        invitee_email: inviteEmail.trim().toLowerCase(),
        invite_code: inviteCode,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      setError("Failed to send invite: " + inviteError.message);
    } else {
      setSuccessMessage(`Invite sent to ${inviteEmail}!`);
      setInviteEmail("");
      refreshFriends();
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsInviting(false);
  };

  const handleGenerateShareableLink = async () => {
    if (!user) return;

    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: inviteError } = await supabase.from("friend_invites").insert({
      inviter_id: user.id,
      invitee_email: `link_invite_${inviteCode}@placeholder.local`,
      invite_code: inviteCode,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (inviteError) {
      setError("Failed to generate link: " + inviteError.message);
    } else {
      const link = `${window.location.origin}/invite/${inviteCode}`;
      setInviteLink(link);
      refreshFriends();
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    const { error: updateError } = await supabase
      .from("friend_connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", connectionId);

    if (updateError) {
      setError("Failed to accept request: " + updateError.message);
    } else {
      refreshFriends();
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    const { error: deleteError } = await supabase
      .from("friend_connections")
      .delete()
      .eq("id", connectionId);

    if (deleteError) {
      setError("Failed to decline request: " + deleteError.message);
    } else {
      refreshFriends();
    }
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Set up your profile and connect with at least 2 friends to start
            matchmaking
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant={displayName ? "default" : "outline"}>
            1. Profile
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={canProceed ? "default" : "outline"}>
            2. Friends ({acceptedFriendsCount}/2)
          </Badge>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-accent/10 border border-accent text-accent-foreground px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Details
            </CardTitle>
            <CardDescription>
              Customize your display name and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreview || avatarUrl || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(displayName || "U")}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {avatarUrl || avatarPreview ? "Change Photo" : "Upload Photo"}
              </Button>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !displayName.trim()}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </Card>

        {/* Friends Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connect with Friends
            </CardTitle>
            <CardDescription>
              You need at least 2 friends to start making matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Invite by Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a Friend</DialogTitle>
                    <DialogDescription>
                      Send an invitation to your friend&apos;s email address
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">Friend&apos;s Email</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="friend@example.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleInviteByEmail}
                      disabled={isInviting || !inviteEmail.trim()}
                    >
                      {isInviting ? "Sending..." : "Send Invite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Get Shareable Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Shareable Invite Link</DialogTitle>
                    <DialogDescription>
                      Share this link with friends to connect
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {inviteLink ? (
                      <div className="flex gap-2">
                        <Input value={inviteLink} readOnly />
                        <Button variant="outline" onClick={handleCopyLink}>
                          {linkCopied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleGenerateShareableLink}
                        className="w-full"
                      >
                        Generate Link
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Pending Received Requests */}
            {pendingReceived.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Pending Friend Requests
                </h3>
                <div className="space-y-2">
                  {pendingReceived.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={request.user_profile?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(
                              request.user_profile?.display_name || "U"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {request.user_profile?.display_name || "Unknown User"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Sent Invites */}
            {pendingSent.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Pending Invites Sent
                </h3>
                <div className="space-y-2">
                  {pendingSent.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {invite.invitee_email.startsWith("link_invite_")
                          ? `Link invite (${invite.invite_code})`
                          : invite.invitee_email}
                      </span>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Friends List */}
            {friends.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Connected Friends ({acceptedFriendsCount})
                </h3>
                <div className="space-y-2">
                  {friends.map((friend) => {
                    const friendProfile =
                      friend.friend_profile || friend.user_profile;
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={friendProfile?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(friendProfile?.display_name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {friendProfile?.display_name || "Unknown User"}
                        </span>
                        <Badge variant="accent" className="ml-auto">
                          Connected
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading friends...
              </div>
            ) : (
              friends.length === 0 &&
              pendingReceived.length === 0 &&
              pendingSent.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No friends yet. Start by inviting some friends!</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleContinue}
              disabled={!canProceed}
              className="w-full"
              size="lg"
            >
              {canProceed ? (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                `Add ${2 - acceptedFriendsCount} more friend${2 - acceptedFriendsCount > 1 ? "s" : ""} to continue`
              )}
            </Button>
            {!canProceed && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                You need at least 2 connected friends to make matches
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
