"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { useMilestones } from "@/lib/milestones/context";
import type { EarnedMilestone } from "@/lib/milestones/types";
import { createClient } from "@/lib/supabase/client";
import type {
  PathwayContent,
  UserProgress,
  UserProfile,
  Pathway,
  JournalEntry,
} from "@/lib/supabase/types";
import { RecoveryScoreDashboard } from "@/components/recovery-score-dashboard";
import {
  Sun,
  BookOpen,
  PenLine,
  ChevronLeft,
  CheckCircle2,
  LogOut,
  Loader2,
  Sparkles,
  Calendar,
  NotebookPen,
  Trophy,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const { setEarnedMilestones, checkAndAwardMilestones } = useMilestones();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [dayContent, setDayContent] = useState<PathwayContent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [reflection, setReflection] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [journalCount, setJournalCount] = useState(0);
  const [encouragementCount, setEncouragementCount] = useState(0);
  const [recentJournalEntries, setRecentJournalEntries] = useState<JournalEntry[]>([]);
  const [showDaysCounter, setShowDaysCounter] = useState(true);
  const [daysSinceBreakup, setDaysSinceBreakup] = useState<number | undefined>(undefined);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch user profile
    const { data: profile } = (await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()) as { data: UserProfile | null };

    if (!profile?.pathway_id) {
      // User hasn't selected a pathway yet
      router.push("/pathways");
      return;
    }

    setUserProfile(profile);
    setShowDaysCounter(profile.show_days_counter ?? true);

    // Calculate days since breakup based on created_at
    if (profile.created_at) {
      const breakupDate = new Date(profile.created_at);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - breakupDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      setDaysSinceBreakup(diffDays);
    }

    // Fetch pathway info
    const { data: pathwayData } = (await supabase
      .from("pathways")
      .select("*")
      .eq("id", profile.pathway_id)
      .single()) as { data: Pathway | null };

    setPathway(pathwayData);

    // Fetch or create user progress
    let { data: progress } = (await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("pathway_id", profile.pathway_id)
      .single()) as { data: UserProgress | null };

    if (!progress) {
      // Create initial progress record
      const { data: newProgress } = (await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          pathway_id: profile.pathway_id,
          current_day: 1,
          recovery_score: 0,
          streak_count: 0,
          milestones_json: [],
        })
        .select()
        .single()) as { data: UserProgress | null };

      progress = newProgress;
    }

    setUserProgress(progress);
    setSelectedDay(progress?.current_day || 1);

    // Sync milestones from database
    if (progress) {
      const milestonesFromDb = (progress.milestones_json as unknown as EarnedMilestone[]) || [];
      setEarnedMilestones(milestonesFromDb);
    }

    // Fetch journal count for milestones
    const { count: journalCnt } = await supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setJournalCount(journalCnt || 0);

    // Fetch recent journal entries for mood graph (last 7 with mood scores)
    const { data: recentEntries } = (await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .not("mood_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(7)) as { data: JournalEntry[] | null };
    setRecentJournalEntries(recentEntries || []);

    // Fetch encouragement count for milestones
    const { count: encouragementCnt } = await supabase
      .from("encouragements")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", user.id);
    setEncouragementCount(encouragementCnt || 0);

    // Fetch content for current day
    if (progress) {
      await fetchDayContent(profile.pathway_id, progress.current_day);
    }

    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, setEarnedMilestones]);

  const fetchDayContent = async (pathwayId: string, dayNumber: number) => {
    const { data: content } = (await supabase
      .from("pathway_content")
      .select("*")
      .eq("pathway_id", pathwayId)
      .eq("day_number", dayNumber)
      .order("type")) as { data: PathwayContent[] | null };

    setDayContent(content || []);

    // Check if day is already completed (if viewing a past day)
    if (userProgress && dayNumber < userProgress.current_day) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  };

  useEffect(() => {
    if (user && !isUserLoading) {
      fetchDashboardData();
    }
  }, [user, isUserLoading, fetchDashboardData]);

  const handleDayChange = async (day: string) => {
    const dayNum = parseInt(day);
    setSelectedDay(dayNum);
    setReflection("");
    if (userProfile?.pathway_id) {
      await fetchDayContent(userProfile.pathway_id, dayNum);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!user || !userProgress || !userProfile?.pathway_id) return;

    setIsSaving(true);

    // Save the reflection as a journal entry
    let newJournalCount = journalCount;
    if (reflection.trim()) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: `Day ${selectedDay} Reflection: ${reflection}`,
        mood_score: null,
      });
      newJournalCount = journalCount + 1;
      setJournalCount(newJournalCount);
    }

    // Update progress to next day
    const nextDay = Math.min(
      userProgress.current_day + 1,
      pathway?.duration_days || 30
    );
    const newStreakCount = userProgress.streak_count + 1;

    // Check for new milestones before updating
    const newMilestones = checkAndAwardMilestones({
      journalCount: newJournalCount,
      streakCount: newStreakCount,
      currentDay: nextDay,
      pathwayDuration: pathway?.duration_days || 30,
      encouragementsSent: encouragementCount,
    });

    // Merge new milestones with existing ones
    const existingMilestones = (userProgress.milestones_json as unknown as EarnedMilestone[]) || [];
    const allMilestones = [...existingMilestones, ...newMilestones];

    const { data: updatedProgress } = (await supabase
      .from("user_progress")
      .update({
        current_day: nextDay,
        streak_count: newStreakCount,
        recovery_score: userProgress.recovery_score + 10,
        milestones_json: allMilestones,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userProgress.id)
      .select()
      .single()) as { data: UserProgress | null };

    if (updatedProgress) {
      setUserProgress(updatedProgress);
      setSelectedDay(nextDay);
      setReflection("");
      setIsCompleted(false);

      // Fetch content for the new day
      await fetchDayContent(userProfile.pathway_id, nextDay);

      // Refresh recent journal entries for mood graph (in case any were added with mood scores)
      const { data: recentEntries } = (await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .not("mood_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(7)) as { data: JournalEntry[] | null };
      setRecentJournalEntries(recentEntries || []);
    }

    setIsSaving(false);
  };

  const handleToggleDaysCounter = async () => {
    if (!user || !userProfile) return;

    const newValue = !showDaysCounter;
    setShowDaysCounter(newValue);

    // Update user preference in database
    await supabase
      .from("user_profiles")
      .update({ show_days_counter: newValue })
      .eq("user_id", user.id);
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
          <p className="text-muted-foreground">Loading your healing journey...</p>
        </div>
      </main>
    );
  }

  // Get content pieces by type
  const quoteContent = dayContent.find((c) => c.type === "quote");
  const articleContent = dayContent.find((c) => c.type === "article");
  const exerciseContent = dayContent.find((c) => c.type === "exercise");

  // Generate array of accessible days
  const accessibleDays = Array.from(
    { length: userProgress?.current_day || 1 },
    (_, i) => i + 1
  );

  const isCurrentDay = selectedDay === userProgress?.current_day;

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
              <Link href="/journal">
                <NotebookPen className="h-4 w-4 mr-2" />
                Journal
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

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700">
                Day {selectedDay} of {pathway?.duration_days || 21}
              </h1>
              <p className="text-muted-foreground mt-1">
                {pathway?.name || "Your Healing Journey"}
              </p>
            </div>

            {/* Previous Days Dropdown */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedDay.toString()}
                onValueChange={handleDayChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleDays.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                      {day === userProgress?.current_day && " (Current)"}
                      {day < (userProgress?.current_day || 1) && " "}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {Math.round(
                  ((userProgress?.current_day || 1) /
                    (pathway?.duration_days || 21)) *
                    100
                )}
                %
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{
                  width: `${
                    ((userProgress?.current_day || 1) /
                      (pathway?.duration_days || 21)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Viewing Past Day Notice */}
        {!isCurrentDay && (
          <Card className="mb-6 border-teal-200 bg-teal-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4 text-teal-600" />
                <p className="text-sm text-teal-700">
                  You&apos;re viewing a past day.{" "}
                  <button
                    onClick={() =>
                      handleDayChange(
                        (userProgress?.current_day || 1).toString()
                      )
                    }
                    className="underline font-medium hover:text-teal-800"
                  >
                    Go to current day
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recovery Score Dashboard Widget */}
        <RecoveryScoreDashboard
          recoveryScore={userProgress?.recovery_score || 0}
          currentDay={userProgress?.current_day || 1}
          totalDays={pathway?.duration_days || 21}
          streakCount={userProgress?.streak_count || 0}
          recentJournalEntries={recentJournalEntries}
          showDaysCounter={showDaysCounter}
          daysSinceBreakup={daysSinceBreakup}
          onToggleDaysCounter={handleToggleDaysCounter}
        />

        {/* Daily Content Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sun className="h-5 w-5" />
              Today&apos;s Inspiration
            </CardTitle>
            <CardDescription>
              Take a moment to reflect on these words
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quoteContent ? (
              <blockquote className="border-l-4 border-purple-300 pl-4 italic text-lg text-foreground">
                {quoteContent.content}
              </blockquote>
            ) : (
              <p className="text-muted-foreground italic">
                &quot;Every day is a new beginning. Take a deep breath, smile, and start again.&quot;
              </p>
            )}
            {quoteContent?.title && (
              <p className="mt-2 text-sm text-muted-foreground">
                — {quoteContent.title}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Article Snippet Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BookOpen className="h-5 w-5" />
              {articleContent?.title || "Daily Reading"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {articleContent?.content ||
                "Healing takes time, and asking for help is a courageous step. Allow yourself to grieve, to feel, and to grow. Remember that this pain is temporary, and you are building resilience with every passing day."}
            </p>
          </CardContent>
        </Card>

        {/* Exercise Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <PenLine className="h-5 w-5" />
              {exerciseContent?.title || "Daily Exercise"}
            </CardTitle>
            <CardDescription>
              Complete this reflection exercise to progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <p className="text-foreground font-medium">
                {exerciseContent?.exercise_prompt ||
                  "Write down three things you're grateful for today, no matter how small. Gratitude helps shift our focus from what we've lost to what we still have."}
              </p>
            </div>

            {isCurrentDay && !isCompleted && (
              <div>
                <label
                  htmlFor="reflection"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Your Reflection
                </label>
                <Textarea
                  id="reflection"
                  placeholder="Write your thoughts here..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-teal-600 bg-teal-50 rounded-lg p-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Day completed!</span>
              </div>
            )}
          </CardContent>

          {isCurrentDay && !isCompleted && (
            <CardFooter>
              <Button
                onClick={handleSaveAndComplete}
                disabled={isSaving || !reflection.trim()}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save & Complete Day
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  );
}
