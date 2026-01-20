"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { Cohort, Pathway, CohortMember } from "@/lib/supabase/types";
import {
  LogOut,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Heart,
  X,
  AlertCircle,
} from "lucide-react";

// Anonymous name generators
const HEALING_ADJECTIVES = [
  "Hopeful",
  "Brave",
  "Resilient",
  "Growing",
  "Rising",
  "Healing",
  "Peaceful",
  "Strong",
  "Gentle",
  "Radiant",
  "Blooming",
  "Renewed",
];

// Extended type for cohort with pathway and member count
type CohortWithDetails = Cohort & {
  pathway: Pathway | null;
  member_count: number;
};

export default function CohortsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [cohorts, setCohorts] = useState<CohortWithDetails[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [selectedPathwayFilter, setSelectedPathwayFilter] = useState<string>("all");
  const [userActiveCohort, setUserActiveCohort] = useState<CohortMember | null>(null);

  // Modal state
  const [selectedCohort, setSelectedCohort] = useState<CohortWithDetails | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Load cohorts and pathways
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);

      // Fetch all pathways for filter dropdown
      const { data: pathwaysData } = await supabase
        .from("pathways")
        .select("*")
        .order("name");

      if (isMounted && pathwaysData) {
        setPathways(pathwaysData);
      }

      // Fetch cohorts with status 'open' (and not past start date)
      const { data: cohortsData } = await supabase
        .from("cohorts")
        .select("*")
        .in("status", ["open", "full"])
        .order("start_date", { ascending: true });

      if (isMounted && cohortsData) {
        // Fetch pathway details and member counts for each cohort
        const cohortsWithDetails: CohortWithDetails[] = await Promise.all(
          cohortsData.map(async (cohort: Cohort) => {
            // Get pathway
            const { data: pathway } = await supabase
              .from("pathways")
              .select("*")
              .eq("id", cohort.pathway_id)
              .single();

            // Get member count
            const { count } = await supabase
              .from("cohort_members")
              .select("*", { count: "exact", head: true })
              .eq("cohort_id", cohort.id);

            return {
              ...cohort,
              pathway: pathway || null,
              member_count: count || 0,
            };
          })
        );

        setCohorts(cohortsWithDetails);
      }

      // Check if user is in an active cohort
      if (user) {
        const { data: userMembership } = await supabase
          .from("cohort_members")
          .select("*, cohorts!inner(*)")
          .eq("user_id", user.id)
          .in("cohorts.status", ["open", "full"])
          .maybeSingle();

        if (isMounted) {
          setUserActiveCohort(userMembership || null);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  // Filter cohorts by pathway
  const filteredCohorts = useMemo(() => {
    if (selectedPathwayFilter === "all") {
      return cohorts;
    }
    return cohorts.filter((cohort) => cohort.pathway_id === selectedPathwayFilter);
  }, [cohorts, selectedPathwayFilter]);

  // Generate anonymous name
  const generateAnonymousName = useCallback((cohortMemberCount: number) => {
    const adjective = HEALING_ADJECTIVES[Math.floor(Math.random() * HEALING_ADJECTIVES.length)];
    const number = cohortMemberCount + 1;
    return `${adjective} Heart #${number}`;
  }, []);

  // Handle join cohort
  const handleJoinCohort = async () => {
    if (!user || !selectedCohort) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      // Double-check user isn't already in an active cohort
      const { data: existingMembership } = await supabase
        .from("cohort_members")
        .select("*, cohorts!inner(*)")
        .eq("user_id", user.id)
        .in("cohorts.status", ["open", "full"])
        .maybeSingle();

      if (existingMembership) {
        setJoinError("You are already in an active cohort. You can only be in one cohort at a time.");
        setIsJoining(false);
        return;
      }

      // Check if cohort is full
      const { count } = await supabase
        .from("cohort_members")
        .select("*", { count: "exact", head: true })
        .eq("cohort_id", selectedCohort.id);

      if (count && count >= selectedCohort.max_members) {
        setJoinError("This cohort is now full. Please choose another cohort.");
        setIsJoining(false);
        return;
      }

      // Generate anonymous name
      const anonymousName = generateAnonymousName(count || 0);

      // Insert membership
      const { error: insertError } = await supabase.from("cohort_members").insert({
        cohort_id: selectedCohort.id,
        user_id: user.id,
        anonymous_name: anonymousName,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint violation
          setJoinError("You are already a member of this cohort.");
        } else {
          setJoinError("Failed to join cohort. Please try again.");
        }
        setIsJoining(false);
        return;
      }

      // Update cohort status if now full
      const newCount = (count || 0) + 1;
      if (newCount >= selectedCohort.max_members) {
        await supabase
          .from("cohorts")
          .update({ status: "full" })
          .eq("id", selectedCohort.id);
      }

      // Update local state
      setCohorts((prev) =>
        prev.map((c) =>
          c.id === selectedCohort.id
            ? {
                ...c,
                member_count: newCount,
                status: newCount >= c.max_members ? "full" : c.status,
              }
            : c
        )
      );

      // Set user as having an active cohort
      setUserActiveCohort({
        id: "",
        cohort_id: selectedCohort.id,
        user_id: user.id,
        anonymous_name: anonymousName,
        joined_at: new Date().toISOString(),
      });

      // Close modal
      setSelectedCohort(null);
    } catch {
      setJoinError("An unexpected error occurred. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate spots remaining
  const getSpotsRemaining = (cohort: CohortWithDetails) => {
    return Math.max(0, cohort.max_members - cohort.member_count);
  };

  if (isUserLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading cohorts...</p>
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
            {!user && (
              <Button variant="default" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Cohorts
          </h1>
          <p className="text-muted-foreground mt-1">
            Join a cohort and recover alongside others in a similar situation
          </p>
        </div>

        {/* Already in cohort message */}
        {userActiveCohort && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-700">
                    You&apos;re already in an active cohort
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your anonymous name: {userActiveCohort.anonymous_name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Section */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Filter by pathway:</label>
          <Select value={selectedPathwayFilter} onValueChange={setSelectedPathwayFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All pathways" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pathways</SelectItem>
              {pathways.map((pathway) => (
                <SelectItem key={pathway.id} value={pathway.id}>
                  {pathway.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cohorts Grid */}
        {filteredCohorts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No cohorts available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCohorts.map((cohort) => {
              const spotsRemaining = getSpotsRemaining(cohort);
              const isFull = spotsRemaining === 0 || cohort.status === "full";
              const isUserInThisCohort = userActiveCohort?.cohort_id === cohort.id;

              return (
                <Card
                  key={cohort.id}
                  className={`flex flex-col ${
                    isFull ? "opacity-75" : ""
                  } ${isUserInThisCohort ? "border-2 border-purple-400" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-purple-700">
                          {cohort.pathway?.name || "Recovery Pathway"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {cohort.pathway?.description || "A healing journey together"}
                        </CardDescription>
                      </div>
                      {isFull && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Full
                        </span>
                      )}
                      {isUserInThisCohort && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                          Your Cohort
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Starts: {formatDate(cohort.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {spotsRemaining} of {cohort.max_members} spots remaining
                        </span>
                      </div>
                      {cohort.breakup_type_match && (
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>For: {cohort.breakup_type_match}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for spots */}
                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? "bg-red-400" : "bg-teal-500"
                          }`}
                          style={{
                            width: `${(cohort.member_count / cohort.max_members) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {!user ? (
                      <Button asChild className="w-full">
                        <Link href="/login">Sign in to Join</Link>
                      </Button>
                    ) : userActiveCohort ? (
                      isUserInThisCohort ? (
                        <Button variant="secondary" className="w-full" disabled>
                          Currently Enrolled
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Already in a Cohort
                        </Button>
                      )
                    ) : isFull ? (
                      <Button variant="outline" className="w-full" disabled>
                        Cohort Full
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setJoinError(null);
                          setSelectedCohort(cohort);
                        }}
                      >
                        Join Cohort
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedCohort && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCohort(null)}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-700">Join Cohort</h2>
              <button
                onClick={() => setSelectedCohort(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                You&apos;re about to join a healing cohort. You&apos;ll receive an anonymous name
                to protect your privacy while connecting with others.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pathway</span>
                  <span className="font-medium">{selectedCohort.pathway?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="font-medium">{formatDate(selectedCohort.start_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {selectedCohort.pathway?.duration_days || 30} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Spots Remaining</span>
                  <span className="font-medium">{getSpotsRemaining(selectedCohort)}</span>
                </div>
                {selectedCohort.breakup_type_match && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Breakup Type</span>
                    <span className="font-medium">{selectedCohort.breakup_type_match}</span>
                  </div>
                )}
              </div>

              {joinError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{joinError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedCohort(null)}
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleJoinCohort} disabled={isJoining}>
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  "Confirm & Join"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
