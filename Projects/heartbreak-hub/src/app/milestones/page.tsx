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
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { useMilestones } from "@/lib/milestones/context";
import { MILESTONE_DEFINITIONS, calculateRecoveryScore } from "@/lib/milestones/service";
import type { EarnedMilestone } from "@/lib/milestones/types";
import { createClient } from "@/lib/supabase/client";
import type { UserProgress } from "@/lib/supabase/types";
import {
  LogOut,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Trophy,
  BookOpen,
  Flame,
  CalendarCheck,
  HeartHandshake,
  Mountain,
  Check,
  Lock,
} from "lucide-react";

// Icon mapping for milestone icons
const ICON_MAP: Record<string, typeof Trophy> = {
  "book-open": BookOpen,
  flame: Flame,
  "calendar-check": CalendarCheck,
  "heart-handshake": HeartHandshake,
  mountain: Mountain,
  trophy: Trophy,
};

export default function MilestonesPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const { earnedMilestones, setEarnedMilestones } = useMilestones();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || isUserLoading) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);

      // Fetch user profile to get pathway
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile?.pathway_id) {
        router.push("/pathways");
        return;
      }

      // Fetch pathway
      const { data: pathwayData } = await supabase
        .from("pathways")
        .select("*")
        .eq("id", profile.pathway_id)
        .single();

      if (isMounted && pathwayData) {
        // Pathway loaded successfully
      }

      // Fetch user progress
      const { data: progress } = (await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("pathway_id", profile.pathway_id)
        .single()) as { data: UserProgress | null };

      if (isMounted && progress) {
        // Sync earned milestones from database
        const milestonesFromDb = (progress.milestones_json as unknown as EarnedMilestone[]) || [];
        setEarnedMilestones(milestonesFromDb);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, isUserLoading, supabase, router, setEarnedMilestones]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  // Calculate total recovery score from milestones
  const totalRecoveryScore = useMemo(() => {
    return calculateRecoveryScore(earnedMilestones);
  }, [earnedMilestones]);

  // Check if a milestone is earned
  const isMilestoneEarned = (milestoneId: string) => {
    return earnedMilestones.some((m) => m.milestone_id === milestoneId);
  };

  // Get earned date for a milestone
  const getEarnedDate = (milestoneId: string) => {
    const earned = earnedMilestones.find((m) => m.milestone_id === milestoneId);
    if (earned) {
      return new Date(earned.earned_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return null;
  };

  if (isUserLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading your milestones...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

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
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Milestones
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your achievements and celebrate your progress
          </p>
        </div>

        {/* Recovery Score Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                  Total Recovery Score
                </p>
                <p className="text-4xl font-bold text-purple-700 mt-1">
                  {totalRecoveryScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {earnedMilestones.length} of {MILESTONE_DEFINITIONS.length} milestones earned
                </p>
              </div>
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700">Your Milestones</CardTitle>
            <CardDescription>
              Complete activities to unlock milestones and earn recovery points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MILESTONE_DEFINITIONS.map((milestone) => {
                const earned = isMilestoneEarned(milestone.id);
                const IconComponent = ICON_MAP[milestone.icon] || Trophy;
                const earnedDate = getEarnedDate(milestone.id);

                return (
                  <div
                    key={milestone.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      earned
                        ? "bg-gradient-to-br from-purple-50 to-teal-50 border-purple-300"
                        : "bg-muted/30 border-muted grayscale opacity-70"
                    }`}
                  >
                    {/* Earned Checkmark */}
                    {earned && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Lock Icon for Unearned */}
                    {!earned && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                        earned ? "bg-purple-100" : "bg-muted"
                      }`}
                    >
                      <IconComponent
                        className={`h-6 w-6 ${
                          earned ? "text-purple-600" : "text-muted-foreground"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <h3
                      className={`font-semibold mb-1 ${
                        earned ? "text-purple-700" : "text-muted-foreground"
                      }`}
                    >
                      {milestone.name}
                    </h3>
                    <p
                      className={`text-sm mb-2 ${
                        earned ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {earned ? milestone.description : milestone.criteria_hint}
                    </p>

                    {/* Points */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed">
                      <span
                        className={`text-sm font-medium ${
                          earned ? "text-teal-600" : "text-muted-foreground"
                        }`}
                      >
                        +{milestone.points} points
                      </span>
                      {earnedDate && (
                        <span className="text-xs text-muted-foreground">
                          {earnedDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
