"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import type { JournalEntry, UserProgress, Pathway } from "@/lib/supabase/types";
import {
  BookOpen,
  LogOut,
  Loader2,
  Sparkles,
  Save,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Trophy,
} from "lucide-react";

// Mood emoji mapping (1-10 scale)
const MOOD_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😢", label: "Very Sad" },
  2: { emoji: "😔", label: "Sad" },
  3: { emoji: "😞", label: "Down" },
  4: { emoji: "😕", label: "Uneasy" },
  5: { emoji: "😐", label: "Neutral" },
  6: { emoji: "🙂", label: "Okay" },
  7: { emoji: "😊", label: "Good" },
  8: { emoji: "😄", label: "Happy" },
  9: { emoji: "😁", label: "Very Happy" },
  10: { emoji: "🥳", label: "Ecstatic" },
};

// Writing prompt suggestions
const WRITING_PROMPTS = [
  "What emotions am I feeling right now, and what might have triggered them?",
  "What's one small thing I did today that I'm proud of?",
  "If I could tell my past self one thing, what would it be?",
  "What's something I'm looking forward to, no matter how small?",
  "How have I grown since my breakup began?",
  "What boundaries do I need to set or maintain for my healing?",
  "Describe a moment today when you felt at peace, even briefly.",
  "What would my healed self want me to know right now?",
  "List three things that brought you comfort today.",
  "What's one thing I can forgive myself for today?",
];

export default function JournalPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const { setEarnedMilestones, checkAndAwardMilestones } = useMilestones();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [encouragementCount, setEncouragementCount] = useState(0);

  // Generate random prompts
  const generateRandomPrompts = useCallback(() => {
    const shuffled = [...WRITING_PROMPTS].sort(() => Math.random() - 0.5);
    setDisplayedPrompts(shuffled.slice(0, 3));
    setShowPrompts(true);
  }, []);

  // Fetch journal entries and user progress
  useEffect(() => {
    if (!user || isUserLoading) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);

      // Fetch journal entries
      const { data } = (await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })) as { data: JournalEntry[] | null };

      if (isMounted) {
        setEntries(data || []);
      }

      // Fetch user profile and progress for milestones
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile?.pathway_id) {
        // Fetch pathway
        const { data: pathwayData } = await supabase
          .from("pathways")
          .select("*")
          .eq("id", profile.pathway_id)
          .single();

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

        if (isMounted && progress) {
          setUserProgress(progress);
          const milestonesFromDb = (progress.milestones_json as unknown as EarnedMilestone[]) || [];
          setEarnedMilestones(milestonesFromDb);
        }
      }

      // Fetch encouragement count for milestones
      const { count: encouragementCnt } = await supabase
        .from("encouragements")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", user.id);
      if (isMounted) {
        setEncouragementCount(encouragementCnt || 0);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, isUserLoading, supabase, setEarnedMilestones]);

  // Refetch entries function for after saving
  const refetchEntries = useCallback(async () => {
    if (!user) return;

    const { data } = (await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as { data: JournalEntry[] | null };

    setEntries(data || []);
  }, [user, supabase]);

  // Filter entries by selected month
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      const entryMonth = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
      return entryMonth === selectedMonth;
    });
  }, [entries, selectedMonth]);

  // Get available months from entries
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    // Always include current month
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

    entries.forEach((entry) => {
      const date = new Date(entry.created_at);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    });

    return Array.from(months).sort().reverse();
  }, [entries]);

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (direction === "prev" && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!user || !content.trim()) return;

    setIsSaving(true);

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: content.trim(),
      mood_score: selectedMood,
    });

    if (!error) {
      const newJournalCount = entries.length + 1;

      // Check for milestones if we have progress data
      if (userProgress && pathway) {
        const newMilestones = checkAndAwardMilestones({
          journalCount: newJournalCount,
          streakCount: userProgress.streak_count,
          currentDay: userProgress.current_day,
          pathwayDuration: pathway.duration_days,
          encouragementsSent: encouragementCount,
        });

        // Save new milestones to database if any were earned
        if (newMilestones.length > 0) {
          const existingMilestones = (userProgress.milestones_json as unknown as EarnedMilestone[]) || [];
          const allMilestones = [...existingMilestones, ...newMilestones];

          await supabase
            .from("user_progress")
            .update({
              milestones_json: allMilestones as unknown as typeof userProgress.milestones_json,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userProgress.id);

          setUserProgress({
            ...userProgress,
            milestones_json: allMilestones as unknown as typeof userProgress.milestones_json,
          });
        }
      }

      setContent("");
      setSelectedMood(null);
      setShowPrompts(false);
      await refetchEntries();
    }

    setIsSaving(false);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Get content preview (first 100 chars)
  const getContentPreview = (text: string) => {
    if (text.length <= 100) return text;
    return text.substring(0, 100) + "...";
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
          <p className="text-muted-foreground">Loading your journal...</p>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Mood Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your emotional journey and reflect on your healing progress
          </p>
        </div>

        {/* New Entry Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-purple-700">New Entry</CardTitle>
            <CardDescription>
              How are you feeling today? Take a moment to check in with yourself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select your mood (1-10)
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MOOD_EMOJIS).map(([score, { emoji, label }]) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setSelectedMood(parseInt(score))}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all min-w-[60px] ${
                      selectedMood === parseInt(score)
                        ? "border-purple-500 bg-purple-50"
                        : "border-transparent bg-muted hover:border-purple-200"
                    }`}
                    title={label}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs text-muted-foreground mt-1">{score}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <p className="text-sm text-purple-600 mt-2">
                  Mood: {MOOD_EMOJIS[selectedMood].label}
                </p>
              )}
            </div>

            {/* Journal Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Your thoughts
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateRandomPrompts}
                  className="text-purple-600"
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Need a prompt?
                </Button>
              </div>

              {/* Writing Prompts */}
              {showPrompts && (
                <div className="mb-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-700">Writing prompts:</p>
                    <button
                      onClick={() => setShowPrompts(false)}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {displayedPrompts.map((prompt, index) => (
                      <li
                        key={index}
                        className="text-sm text-purple-600 cursor-pointer hover:text-purple-800"
                        onClick={() => {
                          setContent(prompt + "\n\n");
                          setShowPrompts(false);
                        }}
                      >
                        • {prompt}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={generateRandomPrompts}
                    className="text-xs text-purple-500 hover:text-purple-700 mt-2"
                  >
                    Show different prompts
                  </button>
                </div>
              )}

              <Textarea
                placeholder="Write about your day, your feelings, your progress... This is your safe space to express yourself."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[180px]"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveEntry}
              disabled={isSaving || !content.trim()}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Past Entries */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-purple-700">Past Entries</CardTitle>
                <CardDescription>
                  Review your journal history and track your emotional patterns
                </CardDescription>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth("prev")}
                  disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {formatMonth(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth("next")}
                  disabled={availableMonths.indexOf(selectedMonth) <= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No entries for {formatMonth(selectedMonth)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start journaling above to track your healing journey
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Mood Emoji */}
                      <div className="flex-shrink-0 text-2xl">
                        {entry.mood_score ? MOOD_EMOJIS[entry.mood_score]?.emoji : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(entry.created_at)}
                          </p>
                          {entry.mood_score && (
                            <span className="text-xs text-muted-foreground">
                              Mood: {entry.mood_score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {getContentPreview(entry.content)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entry Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {selectedEntry.mood_score
                    ? MOOD_EMOJIS[selectedEntry.mood_score]?.emoji
                    : "📝"}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedEntry.created_at)}
                  </p>
                  {selectedEntry.mood_score && (
                    <p className="text-sm text-muted-foreground">
                      Mood: {MOOD_EMOJIS[selectedEntry.mood_score]?.label} ({selectedEntry.mood_score}/10)
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedEntry.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
