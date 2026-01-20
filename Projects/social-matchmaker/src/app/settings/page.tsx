"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Camera,
  User,
  Bell,
  Shield,
  Trash2,
  LogOut,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state - use local state for edits, fall back to profile values
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Notification preferences - local state for edits
  const [localNotifyMatchProposals, setLocalNotifyMatchProposals] = useState<boolean | null>(null);
  const [localNotifyMatchResponses, setLocalNotifyMatchResponses] = useState<boolean | null>(null);
  const [localNotifyBetUpdates, setLocalNotifyBetUpdates] = useState<boolean | null>(null);
  const [localNotifyMilestones, setLocalNotifyMilestones] = useState<boolean | null>(null);

  // Privacy settings - local state for edits
  const [localHideFromLeaderboard, setLocalHideFromLeaderboard] = useState<boolean | null>(null);

  // Derived values - use local state if set, otherwise fall back to profile
  const displayName = localDisplayName ?? profile?.display_name ?? "";
  const avatarUrl = localAvatarUrl !== undefined ? localAvatarUrl : profile?.avatar_url ?? null;
  const notifyMatchProposals = localNotifyMatchProposals ?? profile?.notify_match_proposals ?? true;
  const notifyMatchResponses = localNotifyMatchResponses ?? profile?.notify_match_responses ?? true;
  const notifyBetUpdates = localNotifyBetUpdates ?? profile?.notify_bet_updates ?? true;
  const notifyMilestones = localNotifyMilestones ?? profile?.notify_milestones ?? true;
  const hideFromLeaderboard = localHideFromLeaderboard ?? profile?.hide_from_leaderboard ?? false;

  // Setters that update local state
  const setDisplayName = (value: string) => setLocalDisplayName(value);
  const setAvatarUrl = (value: string | null) => setLocalAvatarUrl(value);
  const setNotifyMatchProposals = (value: boolean) => setLocalNotifyMatchProposals(value);
  const setNotifyMatchResponses = (value: boolean) => setLocalNotifyMatchResponses(value);
  const setNotifyBetUpdates = (value: boolean) => setLocalNotifyBetUpdates(value);
  const setNotifyMilestones = (value: boolean) => setLocalNotifyMilestones(value);
  const setHideFromLeaderboard = (value: boolean) => setLocalHideFromLeaderboard(value);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
      setAvatarPreview(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        notify_match_proposals: notifyMatchProposals,
        notify_match_responses: notifyMatchResponses,
        notify_bet_updates: notifyBetUpdates,
        notify_milestones: notifyMilestones,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError("Failed to update notification preferences: " + updateError.message);
    } else {
      setSuccessMessage("Notification preferences saved!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  };

  const handleSavePrivacy = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        hide_from_leaderboard: hideFromLeaderboard,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError("Failed to update privacy settings: " + updateError.message);
    } else {
      setSuccessMessage("Privacy settings saved!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    setError(null);

    // Delete user profile (cascade should handle related records)
    const { error: deleteError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      setError("Failed to delete account: " + deleteError.message);
      setIsDeleting(false);
      return;
    }

    // Sign out and redirect
    await signOut();
    router.push("/");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
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
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
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
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your display name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={avatarPreview || avatarUrl || undefined}
                alt={displayName}
              />
              <AvatarFallback className="text-2xl">
                {getInitials(displayName || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
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
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
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
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyMatchProposals">Match Proposals</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when someone proposes a match for you
              </p>
            </div>
            <Switch
              id="notifyMatchProposals"
              checked={notifyMatchProposals}
              onCheckedChange={setNotifyMatchProposals}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyMatchResponses">Match Responses</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when matches accept or decline proposals
              </p>
            </div>
            <Switch
              id="notifyMatchResponses"
              checked={notifyMatchResponses}
              onCheckedChange={setNotifyMatchResponses}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyBetUpdates">Bet Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about bet outcomes and payouts
              </p>
            </div>
            <Switch
              id="notifyBetUpdates"
              checked={notifyBetUpdates}
              onCheckedChange={setNotifyBetUpdates}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyMilestones">Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when matches reach milestones
              </p>
            </div>
            <Switch
              id="notifyMilestones"
              checked={notifyMilestones}
              onCheckedChange={setNotifyMilestones}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveNotifications} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Notifications"}
          </Button>
        </CardFooter>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>Control your visibility on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hideFromLeaderboard">Hide from Leaderboard</Label>
              <p className="text-sm text-muted-foreground">
                Your profile won&apos;t appear in the public leaderboard
              </p>
            </div>
            <Switch
              id="hideFromLeaderboard"
              checked={hideFromLeaderboard}
              onCheckedChange={setHideFromLeaderboard}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePrivacy} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <p className="font-medium">Log Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div className="space-y-0.5">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deleteConfirm">
                      Type <span className="font-mono font-bold">DELETE</span> to
                      confirm
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
