"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Sparkles, Sun, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";

type PathwayRecommendation = "fresh-breakup" | "long-term-healing" | "moving-forward";

interface PathwayInfo {
  id: PathwayRecommendation;
  name: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  features: string[];
}

const PATHWAYS: PathwayInfo[] = [
  {
    id: "fresh-breakup",
    name: "Fresh Breakup",
    description:
      "Immediate coping and stabilization support for when the pain is raw. Focus on getting through each day with practical tools and emotional first aid.",
    duration: "21 days",
    icon: <Heart className="h-8 w-8" />,
    features: [
      "Daily check-ins and emotional support",
      "Coping strategies for acute grief",
      "Self-care routines and reminders",
      "Emergency support resources",
    ],
  },
  {
    id: "long-term-healing",
    name: "Long-term Healing",
    description:
      "Deep processing and growth-focused journey to understand your experience, build resilience, and rediscover yourself through comprehensive healing work.",
    duration: "45 days",
    icon: <Sparkles className="h-8 w-8" />,
    features: [
      "Deep emotional processing exercises",
      "Journaling prompts and reflection",
      "Building new routines and habits",
      "Community support and connection",
    ],
  },
  {
    id: "moving-forward",
    name: "Moving Forward",
    description:
      "Rebuilding and new beginnings focus for when you're ready to embrace what's next. Set new goals and open yourself to future possibilities.",
    duration: "30 days",
    icon: <Sun className="h-8 w-8" />,
    features: [
      "Goal setting and vision planning",
      "Confidence building activities",
      "Social reconnection strategies",
      "Future-focused mindset work",
    ],
  },
];

function getStoredRecommendation(): PathwayRecommendation | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("quiz_results");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.recommendation && PATHWAYS.some((p) => p.id === parsed.recommendation)) {
        return parsed.recommendation;
      }
    } catch {
      // Invalid stored data
    }
  }
  return null;
}

export default function PathwaysPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const recommendation = useMemo(() => {
    // Get recommendation from URL params first
    const urlRecommendation = searchParams.get("recommendation") as PathwayRecommendation | null;

    if (urlRecommendation && PATHWAYS.some((p) => p.id === urlRecommendation)) {
      return urlRecommendation;
    }

    // Try to get from localStorage for anonymous users
    return getStoredRecommendation();
  }, [searchParams]);

  const recommendedPathway = recommendation
    ? PATHWAYS.find((p) => p.id === recommendation)
    : null;

  const otherPathways = PATHWAYS.filter((p) => p.id !== recommendation);

  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectPathway = async (pathwayId: PathwayRecommendation) => {
    if (user) {
      setIsSelecting(true);
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("user_profiles")
          .update({ pathway_id: pathwayId })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving pathway selection:", error);
        }
      } catch (err) {
        console.error("Error saving pathway:", err);
      }
      router.push("/dashboard");
    } else {
      // For anonymous users, prompt to sign up
      router.push(`/signup?pathway=${pathwayId}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">HeartBreak Hub</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {recommendation ? "Your Recommended Pathway" : "Choose Your Healing Pathway"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {recommendation
                ? "Based on your quiz responses, we've found the perfect pathway to support your healing journey."
                : "Select the pathway that best matches where you are in your healing journey."}
            </p>
          </div>

          {/* Recommended Pathway */}
          {recommendedPathway && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-600 uppercase tracking-wide">
                  Recommended for you
                </span>
              </div>
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-50/50 to-teal-50/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      {recommendedPathway.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-1">
                        {recommendedPathway.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {recommendedPathway.duration} program
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-foreground">{recommendedPathway.description}</p>
                  <ul className="grid gap-2">
                    {recommendedPathway.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => handleSelectPathway(recommendedPathway.id)}
                    disabled={isSelecting}
                  >
                    {isSelecting ? "Selecting..." : "Select"}
                    {!isSelecting && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other Pathways */}
          {otherPathways.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {recommendation ? "Other Pathways" : "All Pathways"}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {otherPathways.map((pathway) => (
                  <Card key={pathway.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          {pathway.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{pathway.name}</CardTitle>
                          <CardDescription>{pathway.duration}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground mb-4 flex-1">
                        {pathway.description}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSelectPathway(pathway.id)}
                        disabled={isSelecting}
                      >
                        {isSelecting ? "Selecting..." : "Select"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Retake Quiz Link */}
          {recommendation && (
            <div className="text-center mt-10">
              <p className="text-sm text-muted-foreground">
                Not quite right?{" "}
                <Link href="/quiz" className="text-primary hover:underline">
                  Retake the quiz
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
