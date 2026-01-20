"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, Pathway, UserProgress } from "@/lib/supabase/types";
import {
  LogOut,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Trophy,
  User,
  Settings,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Trash2,
  X,
  Check,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [pathway, setPathway] = useState<Pathway | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [showDaysCounter, setShowDaysCounter] = useState(true);

  // Modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Fetch user profile
      const { data: profile } = (await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()) as { data: UserProfile | null };

      if (profile && isMounted) {
        setUserProfile(profile);
        setDisplayName(profile.display_name || "");
        setShowDaysCounter(profile.show_days_counter ?? true);

        // Fetch pathway info
        if (profile.pathway_id) {
          const { data: pathwayData } = (await supabase
            .from("pathways")
            .select("*")
            .eq("id", profile.pathway_id)
            .single()) as { data: Pathway | null };

          if (isMounted) {
            setPathway(pathwayData);
          }

          // Fetch user progress
          const { data: progress } = (await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("pathway_id", profile.pathway_id)
            .single()) as { data: UserProgress | null };

          if (isMounted) {
            setUserProgress(progress);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    if (user && !isUserLoading) {
      fetchProfileData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isUserLoading, supabase]);

  const handleSaveDisplayName = async () => {
    if (!user || !userProfile) return;

    setIsSaving(true);

    await supabase
      .from("user_profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("user_id", user.id);

    setUserProfile((prev) =>
      prev ? { ...prev, display_name: displayName.trim() || null } : null
    );

    setIsSaving(false);
  };

  const handleToggleDaysCounter = async () => {
    if (!user || !userProfile) return;

    const newValue = !showDaysCounter;
    setShowDaysCounter(newValue);

    await supabase
      .from("user_profiles")
      .update({ show_days_counter: newValue })
      .eq("user_id", user.id);

    setUserProfile((prev) =>
      prev ? { ...prev, show_days_counter: newValue } : null
    );
  };

  const handleRestartPathway = async () => {
    if (!user || !userProfile?.pathway_id) return;

    setIsRestarting(true);

    // Reset user progress to day 1
    await supabase
      .from("user_progress")
      .update({
        current_day: 1,
        recovery_score: 0,
        streak_count: 0,
        milestones_json: [],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("pathway_id", userProfile.pathway_id);

    setIsRestarting(false);
    setShowRestartModal(false);

    // Redirect to dashboard to see the fresh start
    router.push("/dashboard");
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);

    // Delete all user data from all tables
    // Order matters due to foreign key constraints
    await supabase.from("encouragements").delete().eq("from_user_id", user.id);
    await supabase.from("encouragements").delete().eq("to_user_id", user.id);
    await supabase.from("bookmarks").delete().eq("user_id", user.id);
    await supabase.from("cohort_members").delete().eq("user_id", user.id);
    await supabase.from("journal_entries").delete().eq("user_id", user.id);
    await supabase.from("user_progress").delete().eq("user_id", user.id);
    await supabase.from("user_profiles").delete().eq("user_id", user.id);

    // Sign out and redirect
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (isUserLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const progressPercentage = userProgress && pathway
    ? Math.round((userProgress.current_day / pathway.duration_days) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-purple-700">HeartBreak Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/milestones">
                <Trophy className="h-4 w-4 mr-2" />
                Milestones
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <User className="h-8 w-8" />
            Profile & Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and customize your experience
          </p>
        </div>

        {/* Current Pathway Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              Current Pathway
            </CardTitle>
            <CardDescription>
              Your healing journey progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pathway ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{pathway.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pathway.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Day {userProgress?.current_day || 1} of {pathway.duration_days}
                    </span>
                    <span className="font-medium text-purple-600">
                      {progressPercentage}% complete
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRestartModal(true)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Pathway
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/pathways">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Switch Pathways
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t selected a pathway yet.
                </p>
                <Button asChild>
                  <Link href="/pathways">Choose a Pathway</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display Name Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Settings className="h-5 w-5" />
              Display Settings
            </CardTitle>
            <CardDescription>
              Customize how you appear in the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <p className="text-sm text-muted-foreground">
                This is used as the base for your anonymous name in cohorts.
              </p>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveDisplayName}
                  disabled={isSaving || displayName === (userProfile?.display_name || "")}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Days Counter Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daysCounter">Show days since breakup counter</Label>
                <p className="text-sm text-muted-foreground">
                  Display the counter on your dashboard
                </p>
              </div>
              <Switch
                id="daysCounter"
                checked={showDaysCounter}
                onCheckedChange={handleToggleDaysCounter}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600/70">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
            <p className="text-sm text-red-600/70 mt-2 text-center">
              This will permanently delete all your data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Restart Pathway Confirmation Modal */}
      {showRestartModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowRestartModal(false)}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-700">
                Restart Pathway
              </h2>
              <button
                onClick={() => setShowRestartModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    Are you sure you want to restart?
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    This will reset your progress to Day 1 and clear your streak
                    and recovery score. Your journal entries will be preserved.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRestartModal(false)}
                disabled={isRestarting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRestartPathway}
                disabled={isRestarting}
              >
                {isRestarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Restarting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Pathway
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText("");
          }}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-red-700">
                Delete Account
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete your account and all associated
                    data including your profile, progress, journal entries, and
                    cohort memberships.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">
                  Type <span className="font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== "DELETE"}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
