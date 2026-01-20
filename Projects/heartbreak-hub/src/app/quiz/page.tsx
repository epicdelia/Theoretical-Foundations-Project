"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
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

type BreakupType = "mutual" | "blindsided" | "complicated" | "other";
type TimeSince = "less_than_1_week" | "1_to_4_weeks" | "1_to_3_months" | "3_plus_months";

type PathwayRecommendation = "fresh-breakup" | "long-term-healing" | "moving-forward";

const BREAKUP_OPTIONS: { value: BreakupType; label: string; description: string }[] = [
  {
    value: "mutual",
    label: "Mutual",
    description: "We both agreed it was time to end things",
  },
  {
    value: "blindsided",
    label: "Blindsided",
    description: "I didn't see it coming",
  },
  {
    value: "complicated",
    label: "Complicated",
    description: "It's a long story with many factors",
  },
  {
    value: "other",
    label: "Other",
    description: "My situation is different",
  },
];

const TIME_OPTIONS: { value: TimeSince; label: string; description: string }[] = [
  {
    value: "less_than_1_week",
    label: "Less than 1 week",
    description: "It just happened",
  },
  {
    value: "1_to_4_weeks",
    label: "1-4 weeks",
    description: "Still very fresh",
  },
  {
    value: "1_to_3_months",
    label: "1-3 months",
    description: "Starting to process",
  },
  {
    value: "3_plus_months",
    label: "3+ months",
    description: "Some time has passed",
  },
];

function getRecommendedPathway(
  breakupType: BreakupType,
  timeSince: TimeSince
): PathwayRecommendation {
  // Matching algorithm:
  // - blindsided + <1 month = Fresh Breakup
  // - >3 months = Moving Forward
  // - else = Long-term Healing

  const isLessThanOneMonth = timeSince === "less_than_1_week" || timeSince === "1_to_4_weeks";
  const isMoreThanThreeMonths = timeSince === "3_plus_months";

  if (breakupType === "blindsided" && isLessThanOneMonth) {
    return "fresh-breakup";
  }

  if (isMoreThanThreeMonths) {
    return "moving-forward";
  }

  return "long-term-healing";
}

export default function QuizPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [breakupType, setBreakupType] = useState<BreakupType | null>(null);
  const [timeSince, setTimeSince] = useState<TimeSince | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 2;

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && breakupType) {
      setCurrentStep(2);
    }
  };

  const handleComplete = async () => {
    if (!breakupType || !timeSince) return;

    setIsSubmitting(true);
    setError(null);

    const recommendation = getRecommendedPathway(breakupType, timeSince);

    try {
      if (user) {
        // Save to database for authenticated users
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from("user_profiles")
          .update({
            breakup_type: breakupType,
            time_since: timeSince,
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Save to localStorage for anonymous users
        localStorage.setItem(
          "quiz_results",
          JSON.stringify({
            breakupType,
            timeSince,
            recommendation,
            completedAt: new Date().toISOString(),
          })
        );
      }

      // Redirect to pathways with recommendation
      router.push(`/pathways?recommendation=${recommendation}`);
    } catch (err) {
      console.error("Error saving quiz results:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
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
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">HeartBreak Hub</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {currentStep === 1
                ? "How did the breakup happen?"
                : "How long has it been?"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? "Help us understand your situation"
                : "This helps us recommend the right pathway for you"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {/* Step 1: Breakup Type */}
            {currentStep === 1 && (
              <div className="space-y-3">
                {BREAKUP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBreakupType(option.value)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      breakupType === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Time Since */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeSince(option.value)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      timeSince === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {currentStep === 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!breakupType}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!timeSince || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Saving..." : "See My Pathway"}
                  {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
