"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { useMilestones } from "@/lib/milestones/context";
import { createClient } from "@/lib/supabase/client";
import type { CohortMember, UserProgress, Pathway } from "@/lib/supabase/types";
import {
  LogOut,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Trophy,
  Users,
  Heart,
  Flame,
  Calendar,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

// Feed item types
type FeedItemType = "day_completed" | "streak_earned" | "milestone_earned";

interface FeedItem {
  id: string;
  user_id: string;
  anonymous_name: string;
  type: FeedItemType;
  description: string;
  created_at: string;
  encouragement_count: number;
  has_encouraged: boolean;
}

interface CohortMemberWithProgress extends CohortMember {
  user_progress: UserProgress | null;
}

export default function CohortFeedPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const { checkAndAwardMilestones } = useMilestones();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [userCohortMembership, setUserCohortMembership] = useState<CohortMember | null>(null);
  const [cohortPathway, setCohortPathway] = useState<Pathway | null>(null);
  const [encouragingItemId, setEncouragingItemId] = useState<string | null>(null);
  const [encouragementCount, setEncouragementCount] = useState(0);

  // Generate feed items from cohort members' progress
  const generateFeedItems = useCallback(
    async (
      members: CohortMemberWithProgress[],
      cohortId: string,
      currentUserId: string
    ): Promise<FeedItem[]> => {
      const items: FeedItem[] = [];

      for (const member of members) {
        if (!member.user_progress) continue;

        const progress = member.user_progress;
        const isCurrentUser = member.user_id === currentUserId;
        const displayName = isCurrentUser ? "You" : member.anonymous_name;

        // Day completed activity
        if (progress.current_day > 1) {
          const dayCompletedItem: FeedItem = {
            id: `${member.user_id}-day-${progress.current_day - 1}`,
            user_id: member.user_id,
            anonymous_name: displayName,
            type: "day_completed",
            description: `completed Day ${progress.current_day - 1}`,
            created_at: progress.updated_at,
            encouragement_count: 0,
            has_encouraged: false,
          };
          items.push(dayCompletedItem);
        }

        // Streak milestones (7-day streak)
        if (progress.streak_count >= 7 && progress.streak_count % 7 === 0) {
          const streakItem: FeedItem = {
            id: `${member.user_id}-streak-${progress.streak_count}`,
            user_id: member.user_id,
            anonymous_name: displayName,
            type: "streak_earned",
            description: `earned a ${progress.streak_count}-Day Streak`,
            created_at: progress.updated_at,
            encouragement_count: 0,
            has_encouraged: false,
          };
          items.push(streakItem);
        }
      }

      // Fetch encouragement counts for all items
      const itemIds = items.map((item) => `${item.type}-${item.id}`);
      if (itemIds.length > 0) {
        // Get encouragement counts grouped by feed_item_type
        const { data: encouragements } = await supabase
          .from("encouragements")
          .select("to_user_id, feed_item_type, from_user_id")
          .eq("cohort_id", cohortId);

        if (encouragements) {
          // Count encouragements per item and check if current user has encouraged
          const encouragementMap = new Map<
            string,
            { count: number; hasEncouraged: boolean }
          >();

          encouragements.forEach(
            (enc: { to_user_id: string; feed_item_type: string; from_user_id: string }) => {
              const key = enc.feed_item_type;
              const current = encouragementMap.get(key) || {
                count: 0,
                hasEncouraged: false,
              };
              current.count++;
              if (enc.from_user_id === currentUserId) {
                current.hasEncouraged = true;
              }
              encouragementMap.set(key, current);
            }
          );

          // Update items with encouragement data
          items.forEach((item) => {
            const key = `${item.type}-${item.id}`;
            const data = encouragementMap.get(key);
            if (data) {
              item.encouragement_count = data.count;
              item.has_encouraged = data.hasEncouraged;
            }
          });
        }
      }

      // Sort by most recent first
      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return items;
    },
    [supabase]
  );

  // Load cohort feed data
  useEffect(() => {
    let isMounted = true;

    const loadFeedData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Check if user is in an active cohort
      const { data: membership } = await supabase
        .from("cohort_members")
        .select("*, cohorts!inner(*)")
        .eq("user_id", user.id)
        .in("cohorts.status", ["open", "full"])
        .maybeSingle();

      if (!membership) {
        // User not in a cohort, redirect to cohorts page
        router.push("/cohorts");
        return;
      }

      if (isMounted) {
        setUserCohortMembership(membership);
      }

      // Fetch cohort pathway
      const cohortData = membership.cohorts;
      if (cohortData?.pathway_id) {
        const { data: pathway } = await supabase
          .from("pathways")
          .select("*")
          .eq("id", cohortData.pathway_id)
          .single();

        if (isMounted && pathway) {
          setCohortPathway(pathway);
        }
      }

      // Fetch all cohort members with their progress
      const { data: members } = await supabase
        .from("cohort_members")
        .select("*")
        .eq("cohort_id", membership.cohort_id);

      if (members && isMounted) {
        // Fetch progress for each member
        const membersWithProgress: CohortMemberWithProgress[] = await Promise.all(
          members.map(async (member: CohortMember) => {
            const { data: progress } = await supabase
              .from("user_progress")
              .select("*")
              .eq("user_id", member.user_id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...member,
              user_progress: progress || null,
            };
          })
        );

        // Generate feed items
        const items = await generateFeedItems(
          membersWithProgress,
          membership.cohort_id,
          user.id
        );

        if (isMounted) {
          setFeedItems(items);
        }
      }

      // Fetch user's encouragement count for milestone tracking
      const { count: encouragementCnt } = await supabase
        .from("encouragements")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", user.id);

      if (isMounted) {
        setEncouragementCount(encouragementCnt || 0);
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      loadFeedData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isUserLoading, supabase, router, generateFeedItems]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleEncourage = async (item: FeedItem) => {
    if (!user || !userCohortMembership || item.has_encouraged || item.user_id === user.id) {
      return;
    }

    setEncouragingItemId(item.id);

    try {
      // Insert encouragement
      const { error } = await supabase.from("encouragements").insert({
        cohort_id: userCohortMembership.cohort_id,
        from_user_id: user.id,
        to_user_id: item.user_id,
        feed_item_type: `${item.type}-${item.id}`,
      });

      if (!error) {
        // Update local state
        setFeedItems((prev) =>
          prev.map((fi) =>
            fi.id === item.id
              ? {
                  ...fi,
                  encouragement_count: fi.encouragement_count + 1,
                  has_encouraged: true,
                }
              : fi
          )
        );

        // Update encouragement count and check for milestones
        const newEncouragementCount = encouragementCount + 1;
        setEncouragementCount(newEncouragementCount);

        // Check for encouragement milestone
        checkAndAwardMilestones({
          journalCount: 0,
          streakCount: 0,
          currentDay: 1,
          pathwayDuration: cohortPathway?.duration_days || 30,
          encouragementsSent: newEncouragementCount,
        });
      }
    } catch {
      // Silently fail
    } finally {
      setEncouragingItemId(null);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get icon for feed item type
  const getItemIcon = (type: FeedItemType) => {
    switch (type) {
      case "day_completed":
        return <CheckCircle2 className="h-5 w-5 text-teal-500" />;
      case "streak_earned":
        return <Flame className="h-5 w-5 text-orange-500" />;
      case "milestone_earned":
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <Calendar className="h-5 w-5 text-purple-500" />;
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading cohort feed...</p>
        </div>
      </main>
    );
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
            {user && (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Cohort Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            See your cohort&apos;s progress and send encouragement
          </p>
          {userCohortMembership && (
            <p className="text-sm text-purple-600 mt-2">
              You are <span className="font-medium">{userCohortMembership.anonymous_name}</span>
              {cohortPathway && (
                <span className="text-muted-foreground">
                  {" "}
                  in {cohortPathway.name}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Feed */}
        {feedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-lg text-muted-foreground mb-2">
                No activity yet
              </CardTitle>
              <CardDescription>
                Your cohort&apos;s progress will appear here as members complete their
                daily exercises. Be the first to make progress!
              </CardDescription>
              <Button asChild className="mt-6">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => {
              const isOwnActivity = item.anonymous_name === "You";

              return (
                <Card
                  key={item.id}
                  className={`transition-colors ${
                    isOwnActivity
                      ? "border-purple-200 bg-purple-50/50"
                      : "hover:border-teal-200"
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getItemIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">
                          <span
                            className={`font-semibold ${
                              isOwnActivity ? "text-purple-700" : "text-teal-700"
                            }`}
                          >
                            {item.anonymous_name}
                          </span>{" "}
                          {item.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatRelativeTime(item.created_at)}
                        </p>
                      </div>

                      {/* Encouragement Button */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {item.encouragement_count > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {item.encouragement_count}{" "}
                            {item.encouragement_count === 1 ? "cheer" : "cheers"}
                          </span>
                        )}
                        <Button
                          variant={item.has_encouraged ? "secondary" : "outline"}
                          size="sm"
                          disabled={
                            isOwnActivity ||
                            item.has_encouraged ||
                            encouragingItemId === item.id
                          }
                          onClick={() => handleEncourage(item)}
                          className={`${
                            item.has_encouraged
                              ? "text-pink-600 border-pink-200 bg-pink-50"
                              : "hover:text-pink-600 hover:border-pink-200"
                          }`}
                        >
                          {encouragingItemId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart
                              className={`h-4 w-4 ${
                                item.has_encouraged ? "fill-current" : ""
                              }`}
                            />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Link to cohorts page */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/cohorts">
              <Users className="h-4 w-4 mr-2" />
              View All Cohorts
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
