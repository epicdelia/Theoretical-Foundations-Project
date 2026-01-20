"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  Users,
  Heart,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type {
  PersonalityAssessmentInsert,
  BigFiveScoresJson,
} from "@/lib/database.types";
import { triggerCompatibilityCalculation } from "@/lib/compatibility/actions";

// ============================================================================
// BIG FIVE PERSONALITY TRAITS
// ============================================================================

type BigFiveTrait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";

interface TraitInfo {
  label: string;
  description: string;
  icon: typeof Brain;
  color: string;
  lowLabel: string;
  highLabel: string;
  lowDescription: string;
  highDescription: string;
}

const traitInfo: Record<BigFiveTrait, TraitInfo> = {
  openness: {
    label: "Openness",
    description:
      "Your appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.",
    icon: Lightbulb,
    color: "text-purple-500",
    lowLabel: "Practical",
    highLabel: "Creative",
    lowDescription:
      "You prefer routine, familiar experiences, and practical solutions.",
    highDescription:
      "You're curious, creative, and drawn to new experiences and ideas.",
  },
  conscientiousness: {
    label: "Conscientiousness",
    description:
      "Your tendency to be organized, dependable, self-disciplined, and goal-oriented.",
    icon: CheckCircle,
    color: "text-blue-500",
    lowLabel: "Flexible",
    highLabel: "Organized",
    lowDescription:
      "You're spontaneous, adaptable, and prefer to go with the flow.",
    highDescription:
      "You're disciplined, organized, and focused on achieving your goals.",
  },
  extraversion: {
    label: "Extraversion",
    description:
      "Your energy level, positive emotions, sociability, and tendency to seek stimulation.",
    icon: Users,
    color: "text-yellow-500",
    lowLabel: "Introverted",
    highLabel: "Extraverted",
    lowDescription:
      "You recharge alone, prefer deep conversations, and enjoy quiet activities.",
    highDescription:
      "You're energized by socializing, outgoing, and thrive in groups.",
  },
  agreeableness: {
    label: "Agreeableness",
    description:
      "Your concern for cooperation and social harmony with others.",
    icon: Heart,
    color: "text-pink-500",
    lowLabel: "Competitive",
    highLabel: "Cooperative",
    lowDescription:
      "You're direct, competitive, and prioritize your own needs.",
    highDescription:
      "You're compassionate, trusting, and value harmony with others.",
  },
  neuroticism: {
    label: "Emotional Stability",
    description:
      "Your tendency to experience emotions like anxiety, anger, or depression.",
    icon: Sparkles,
    color: "text-green-500",
    lowLabel: "Sensitive",
    highLabel: "Resilient",
    lowDescription:
      "You experience emotions deeply and may be more sensitive to stress.",
    highDescription:
      "You're emotionally stable, calm, and handle stress well.",
  },
};

// ============================================================================
// ASSESSMENT QUESTIONS (3 per trait = 15 total)
// ============================================================================

interface Question {
  id: number;
  text: string;
  trait: BigFiveTrait;
  reversed: boolean; // If true, lower score = higher trait
}

const questions: Question[] = [
  // Openness (3 questions)
  {
    id: 1,
    text: "I enjoy exploring new ideas and concepts, even if they seem unconventional.",
    trait: "openness",
    reversed: false,
  },
  {
    id: 2,
    text: "I appreciate art, music, and creative expression.",
    trait: "openness",
    reversed: false,
  },
  {
    id: 3,
    text: "I prefer trying new restaurants and cuisines over sticking to my favorites.",
    trait: "openness",
    reversed: false,
  },

  // Conscientiousness (3 questions)
  {
    id: 4,
    text: "I like to have a plan and stick to it.",
    trait: "conscientiousness",
    reversed: false,
  },
  {
    id: 5,
    text: "I pay attention to details and strive for accuracy in my work.",
    trait: "conscientiousness",
    reversed: false,
  },
  {
    id: 6,
    text: "I complete tasks thoroughly and on time.",
    trait: "conscientiousness",
    reversed: false,
  },

  // Extraversion (3 questions)
  {
    id: 7,
    text: "I feel energized after spending time with a group of people.",
    trait: "extraversion",
    reversed: false,
  },
  {
    id: 8,
    text: "I enjoy being the center of attention at social events.",
    trait: "extraversion",
    reversed: false,
  },
  {
    id: 9,
    text: "I prefer going out with friends over staying home alone.",
    trait: "extraversion",
    reversed: false,
  },

  // Agreeableness (3 questions)
  {
    id: 10,
    text: "I prioritize others' needs and feelings when making decisions.",
    trait: "agreeableness",
    reversed: false,
  },
  {
    id: 11,
    text: "I avoid arguments and try to keep the peace.",
    trait: "agreeableness",
    reversed: false,
  },
  {
    id: 12,
    text: "I trust people until they give me a reason not to.",
    trait: "agreeableness",
    reversed: false,
  },

  // Neuroticism (3 questions - reversed so higher = more stable)
  {
    id: 13,
    text: "I remain calm under pressure and handle stress well.",
    trait: "neuroticism",
    reversed: true,
  },
  {
    id: 14,
    text: "I bounce back quickly from setbacks and disappointments.",
    trait: "neuroticism",
    reversed: true,
  },
  {
    id: 15,
    text: "I rarely feel anxious or worried about everyday situations.",
    trait: "neuroticism",
    reversed: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

type Step = "intro" | "questions" | "calculating" | "result" | "error";

export default function PersonalityAssessmentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<BigFiveScoresJson | null>(null);

  const calculateScores = (): BigFiveScoresJson => {
    const traitScores: Record<BigFiveTrait, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    // Collect scores for each trait
    questions.forEach((question) => {
      const rawAnswer = answers[question.id] ?? 4; // Default to middle if somehow missing
      // Convert 1-7 scale to 0-100, accounting for reversed questions
      const normalizedScore = question.reversed
        ? ((8 - rawAnswer) / 6) * 100
        : ((rawAnswer - 1) / 6) * 100;
      traitScores[question.trait].push(normalizedScore);
    });

    // Calculate average for each trait
    const scores: BigFiveScoresJson = {
      openness: Math.round(
        traitScores.openness.reduce((a, b) => a + b, 0) /
          traitScores.openness.length
      ),
      conscientiousness: Math.round(
        traitScores.conscientiousness.reduce((a, b) => a + b, 0) /
          traitScores.conscientiousness.length
      ),
      extraversion: Math.round(
        traitScores.extraversion.reduce((a, b) => a + b, 0) /
          traitScores.extraversion.length
      ),
      agreeableness: Math.round(
        traitScores.agreeableness.reduce((a, b) => a + b, 0) /
          traitScores.agreeableness.length
      ),
      neuroticism: Math.round(
        traitScores.neuroticism.reduce((a, b) => a + b, 0) /
          traitScores.neuroticism.length
      ),
    };

    return scores;
  };

  const handleSliderChange = (value: number[]) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestion].id]: value[0] }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // All questions answered, calculate result
      setStep("calculating");
      const calculatedResult = calculateScores();
      setResult(calculatedResult);

      // Small delay for visual feedback
      setTimeout(() => {
        setStep("result");
      }, 1500);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const saveResult = async () => {
    if (!user || !result) return;

    setIsSaving(true);
    setError(null);

    try {
      const assessmentData: PersonalityAssessmentInsert = {
        user_id: user.id,
        framework: "big_five",
        scores_json: result,
      };

      const { error: upsertError } = await supabase
        .from("personality_assessments")
        .upsert(assessmentData, { onConflict: "user_id,framework" });

      if (upsertError) {
        throw upsertError;
      }

      // Trigger compatibility calculation (non-blocking)
      triggerCompatibilityCalculation().catch(console.error);

      // Navigate to discover page (onboarding complete)
      router.push("/discover");
    } catch (err) {
      console.error("Error saving personality assessment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save your results"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getTraitLevel = (score: number): "low" | "medium" | "high" => {
    if (score < 40) return "low";
    if (score > 60) return "high";
    return "medium";
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Intro step
  if (step === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Harmonic Match
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl">Personality Assessment</CardTitle>
            <CardDescription>
              Discover your Big Five personality traits for better matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Brain className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">15 Questions</p>
                  <p className="text-xs text-muted-foreground">
                    Quick slider-based questions about your personality
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">5 Personality Traits</p>
                  <p className="text-xs text-muted-foreground">
                    Openness, Conscientiousness, Extraversion, Agreeableness &
                    Emotional Stability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Heart className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Deeper Connections</p>
                  <p className="text-xs text-muted-foreground">
                    Find matches that complement your personality
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep("questions")}
            >
              Start Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Rate each statement on a scale from 1 (Strongly Disagree) to 7
              (Strongly Agree)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questions step
  if (step === "questions") {
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id] ?? 4;
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const trait = traitInfo[question.trait];

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Harmonic Match
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Trait indicator */}
          <div className="flex items-center justify-center gap-2">
            <trait.icon className={`h-4 w-4 ${trait.color}`} />
            <span className="text-sm font-medium text-muted-foreground">
              {trait.label}
            </span>
          </div>

          {/* Question card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed text-center">
                {question.text}
              </CardTitle>
              <CardDescription className="text-center">
                Move the slider to indicate how much you agree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Slider labels */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>

              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[currentAnswer]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Scale numbers */}
              <div className="flex justify-between px-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <span
                    key={num}
                    className={`text-sm ${
                      currentAnswer === num
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>

              {/* Current value display */}
              <div className="text-center">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                  {currentAnswer}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  See Results
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculating step
  if (step === "calculating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 animate-ping" />
                </div>
                <Brain className="h-16 w-16 relative text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">
              Analyzing your personality...
            </CardTitle>
            <CardDescription>
              Calculating your Big Five trait scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error step
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => {
                setStep("questions");
                setError(null);
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/discover")}
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result step
  if (step === "result" && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Harmonic Match
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold">Your Personality Profile</h1>
            <p className="text-muted-foreground">
              Your Big Five personality traits
            </p>
          </div>

          {/* Trait Cards */}
          {(Object.entries(traitInfo) as [BigFiveTrait, TraitInfo][]).map(
            ([trait, info]) => {
              const score = result[trait];
              const level = getTraitLevel(score);
              const Icon = info.icon;

              return (
                <Card key={trait}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${info.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <CardDescription className="text-xs">
                          {info.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">
                          {score}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /100
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress bar with labels */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{info.lowLabel}</span>
                        <span>{info.highLabel}</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-primary transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Description based on score */}
                    <p className="text-sm text-muted-foreground">
                      {level === "low"
                        ? info.lowDescription
                        : level === "high"
                        ? info.highDescription
                        : `You show a balance between ${info.lowLabel.toLowerCase()} and ${info.highLabel.toLowerCase()} tendencies.`}
                    </p>
                  </CardContent>
                </Card>
              );
            }
          )}

          {/* Summary Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Personality Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(Object.entries(traitInfo) as [BigFiveTrait, TraitInfo][]).map(
                  ([trait, info]) => {
                    const Icon = info.icon;
                    return (
                      <div key={trait} className="text-center">
                        <Icon className={`h-6 w-6 mx-auto ${info.color}`} />
                        <p className="text-xs font-medium mt-1">
                          {info.label.slice(0, 4)}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {result[trait]}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                These traits help us find matches whose personalities complement
                yours, creating more harmonious connections.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={saveResult}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Onboarding
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
