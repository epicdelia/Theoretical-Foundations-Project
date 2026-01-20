"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Handshake,
  Scale,
  EyeOff,
  Heart,
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
import type {
  ConflictStyle,
  ConflictStyleInsert,
  ConflictAssessmentJson,
} from "@/lib/database.types";

// ============================================================================
// CONFLICT STYLE DEFINITIONS
// ============================================================================

const conflictStyleInfo: Record<
  ConflictStyle,
  {
    label: string;
    description: string;
    icon: typeof Shield;
    color: string;
    strengths: string[];
    challenges: string[];
  }
> = {
  competing: {
    label: "The Competitor",
    description:
      "You're assertive and confident in pursuing your goals. You stand firm on your position and aren't afraid to advocate for what you believe is right.",
    icon: Shield,
    color: "text-red-500",
    strengths: [
      "Quick decision-making",
      "Strong advocacy skills",
      "Confident under pressure",
    ],
    challenges: [
      "May overlook others' needs",
      "Can damage relationships",
      "Might miss creative solutions",
    ],
  },
  collaborating: {
    label: "The Collaborator",
    description:
      "You seek win-win solutions that satisfy everyone. You value open communication and work together to find creative answers that address all concerns.",
    icon: Handshake,
    color: "text-green-500",
    strengths: [
      "Builds strong relationships",
      "Finds innovative solutions",
      "Creates lasting agreements",
    ],
    challenges: [
      "Takes more time",
      "Requires willing partners",
      "Can be exhausting for small issues",
    ],
  },
  compromising: {
    label: "The Compromiser",
    description:
      "You believe in finding middle ground where everyone gives a little. You're practical and aim for solutions that partially satisfy all parties.",
    icon: Scale,
    color: "text-blue-500",
    strengths: [
      "Efficient resolution",
      "Fair and democratic",
      "Maintains relationships",
    ],
    challenges: [
      "No one fully satisfied",
      "May miss optimal solutions",
      "Can feel like losing",
    ],
  },
  avoiding: {
    label: "The Peacekeeper",
    description:
      "You prefer to sidestep conflict when possible, either postponing issues or withdrawing from tense situations. You value harmony and peace.",
    icon: EyeOff,
    color: "text-purple-500",
    strengths: [
      "Reduces stress",
      "Allows cooling off",
      "Chooses battles wisely",
    ],
    challenges: [
      "Issues may fester",
      "Needs may go unmet",
      "Problems can escalate",
    ],
  },
  accommodating: {
    label: "The Accommodator",
    description:
      "You prioritize relationships and harmony, often putting others' needs before your own. You're generous and value maintaining goodwill.",
    icon: Heart,
    color: "text-pink-500",
    strengths: [
      "Preserves relationships",
      "Shows generosity",
      "Builds goodwill",
    ],
    challenges: [
      "Own needs neglected",
      "May be taken advantage of",
      "Can build resentment",
    ],
  },
};

// ============================================================================
// SCENARIO QUESTIONS
// ============================================================================

interface Question {
  id: number;
  scenario: string;
  options: {
    text: string;
    style: ConflictStyle;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    scenario:
      "You and your partner disagree about where to go for vacation. They want the beach, you want the mountains.",
    options: [
      {
        text: "Make a strong case for the mountains and try to convince them",
        style: "competing",
      },
      {
        text: "Suggest a place that has both mountains and beach access",
        style: "collaborating",
      },
      {
        text: "Propose alternating - mountains this year, beach next year",
        style: "compromising",
      },
      {
        text: "Say you're fine with either and let them decide",
        style: "avoiding",
      },
      {
        text: "Agree to the beach because their happiness matters more",
        style: "accommodating",
      },
    ],
  },
  {
    id: 2,
    scenario:
      "Your partner forgot an important date you had planned. You're upset about it.",
    options: [
      {
        text: "Tell them directly how disappointed you are and expect an apology",
        style: "competing",
      },
      {
        text: "Discuss what happened and work together to prevent future misunderstandings",
        style: "collaborating",
      },
      {
        text: "Acknowledge they're busy but ask them to set reminders in the future",
        style: "compromising",
      },
      {
        text: "Brush it off - everyone forgets things sometimes",
        style: "avoiding",
      },
      {
        text: "Reassure them it's okay and that you understand they had a lot going on",
        style: "accommodating",
      },
    ],
  },
  {
    id: 3,
    scenario:
      "You're deciding how to split household chores. Your partner thinks the current arrangement is fair, but you don't.",
    options: [
      {
        text: "List exactly why the split is unfair and insist on changes",
        style: "competing",
      },
      {
        text: "Sit down together to understand each other's perspective and create a new system",
        style: "collaborating",
      },
      {
        text: "Suggest swapping a few tasks to make it feel more balanced",
        style: "compromising",
      },
      {
        text: "Keep doing things as is - it's not worth the argument",
        style: "avoiding",
      },
      {
        text: "Take on more tasks yourself to avoid conflict",
        style: "accommodating",
      },
    ],
  },
  {
    id: 4,
    scenario:
      "Your partner wants to make a large purchase you think is unnecessary.",
    options: [
      {
        text: "Firmly explain why it's a bad financial decision and oppose it",
        style: "competing",
      },
      {
        text: "Explore why they want it and brainstorm alternatives that meet both needs",
        style: "collaborating",
      },
      {
        text: "Suggest a smaller version or waiting until you've saved more",
        style: "compromising",
      },
      {
        text: "Avoid bringing it up and hope they change their mind",
        style: "avoiding",
      },
      {
        text: "Support the purchase even though you have reservations",
        style: "accommodating",
      },
    ],
  },
  {
    id: 5,
    scenario:
      "Your partner's family member said something that hurt your feelings. Your partner doesn't think it was a big deal.",
    options: [
      {
        text: "Insist your partner address it with their family member",
        style: "competing",
      },
      {
        text: "Share how you feel and work together on how to handle family situations",
        style: "collaborating",
      },
      {
        text: "Ask your partner to at least acknowledge your feelings even if they disagree",
        style: "compromising",
      },
      {
        text: "Let it go - no point in creating family drama",
        style: "avoiding",
      },
      {
        text: "Accept that maybe you're being too sensitive",
        style: "accommodating",
      },
    ],
  },
  {
    id: 6,
    scenario:
      "You and your partner have different ideas about how much time to spend with friends vs. as a couple.",
    options: [
      {
        text: "Assert your need for more couple time and set boundaries",
        style: "competing",
      },
      {
        text: "Talk about what quality time means to each of you and design a schedule together",
        style: "collaborating",
      },
      {
        text: "Agree on a set number of nights for friends and for each other",
        style: "compromising",
      },
      {
        text: "Go along with whatever happens naturally without discussing it",
        style: "avoiding",
      },
      {
        text: "Adjust your expectations to match their social needs",
        style: "accommodating",
      },
    ],
  },
  {
    id: 7,
    scenario:
      "You discover your partner shared something private about you with their friends.",
    options: [
      {
        text: "Confront them and demand they never do it again",
        style: "competing",
      },
      {
        text: "Have an open conversation about privacy boundaries for both of you",
        style: "collaborating",
      },
      {
        text: "Explain you were hurt but also understand friends confide in each other",
        style: "compromising",
      },
      {
        text: "Pretend you don't know about it",
        style: "avoiding",
      },
      {
        text: "Assume they had good reasons and didn't mean to hurt you",
        style: "accommodating",
      },
    ],
  },
  {
    id: 8,
    scenario:
      "Your partner wants to move to a new city for a job opportunity, but you love where you live.",
    options: [
      {
        text: "Make clear that moving isn't an option and they should look locally",
        style: "competing",
      },
      {
        text: "Explore both your career goals and life priorities to find the best path forward",
        style: "collaborating",
      },
      {
        text: "Propose trying long-distance temporarily or moving somewhere in between",
        style: "compromising",
      },
      {
        text: "Avoid discussing it seriously and hope the opportunity falls through",
        style: "avoiding",
      },
      {
        text: "Agree to move because their career growth is important",
        style: "accommodating",
      },
    ],
  },
  {
    id: 9,
    scenario:
      "You're stressed and need alone time, but your partner feels neglected and wants more attention.",
    options: [
      {
        text: "Firmly state you need space and expect them to understand",
        style: "competing",
      },
      {
        text: "Discuss both your needs openly and find ways to meet in the middle emotionally",
        style: "collaborating",
      },
      {
        text: "Set specific times for togetherness and times for solitude",
        style: "compromising",
      },
      {
        text: "Withdraw more without explaining what you need",
        style: "avoiding",
      },
      {
        text: "Push through your exhaustion to give them the attention they want",
        style: "accommodating",
      },
    ],
  },
  {
    id: 10,
    scenario:
      "Your partner consistently arrives late when you make plans together, and it's becoming frustrating.",
    options: [
      {
        text: "Tell them it's disrespectful and you won't wait anymore",
        style: "competing",
      },
      {
        text: "Understand why they're often late and work together on solutions",
        style: "collaborating",
      },
      {
        text: "Start giving them earlier meeting times to account for their delays",
        style: "compromising",
      },
      {
        text: "Just accept that's who they are and stop being bothered",
        style: "avoiding",
      },
      {
        text: "Reassure them it's fine whenever they arrive",
        style: "accommodating",
      },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

type Step = "intro" | "questions" | "calculating" | "result" | "error";

export default function ConflictAssessmentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, ConflictStyle>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{
    primary: ConflictStyle;
    secondary: ConflictStyle | null;
    scores: ConflictAssessmentJson;
  } | null>(null);

  const calculateStyles = (): {
    primary: ConflictStyle;
    secondary: ConflictStyle | null;
    scores: ConflictAssessmentJson;
  } => {
    const scores: Record<ConflictStyle, number> = {
      competing: 0,
      collaborating: 0,
      compromising: 0,
      avoiding: 0,
      accommodating: 0,
    };

    // Tally up scores
    Object.values(answers).forEach((style) => {
      scores[style] += 1;
    });

    // Convert to assessment JSON format (scores out of 10)
    const assessmentJson: ConflictAssessmentJson = {
      competing_score: scores.competing,
      collaborating_score: scores.collaborating,
      compromising_score: scores.compromising,
      avoiding_score: scores.avoiding,
      accommodating_score: scores.accommodating,
      completed_at: new Date().toISOString(),
    };

    // Find primary and secondary styles
    const sortedStyles = (Object.entries(scores) as [ConflictStyle, number][])
      .sort((a, b) => b[1] - a[1]);

    const primary = sortedStyles[0][0];
    const secondary =
      sortedStyles[1][1] > 0 && sortedStyles[1][0] !== primary
        ? sortedStyles[1][0]
        : null;

    return { primary, secondary, scores: assessmentJson };
  };

  const handleAnswer = (style: ConflictStyle) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: style }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // All questions answered, calculate result
      setStep("calculating");
      const calculatedResult = calculateStyles();
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
      const conflictStyleData: ConflictStyleInsert = {
        user_id: user.id,
        primary_style: result.primary,
        secondary_style: result.secondary,
        assessment_json: result.scores,
      };

      const { error: upsertError } = await supabase
        .from("conflict_styles")
        .upsert(conflictStyleData, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      // Navigate to personality assessment
      router.push("/onboarding/personality");
    } catch (err) {
      console.error("Error saving conflict style:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save your results"
      );
    } finally {
      setIsSaving(false);
    }
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
            <CardTitle className="text-2xl">Conflict Resolution Style</CardTitle>
            <CardDescription>
              Understanding how you handle disagreements helps us find more
              compatible matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Scale className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">10 Scenarios</p>
                  <p className="text-xs text-muted-foreground">
                    Real relationship situations to explore your style
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Handshake className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">5 Conflict Styles</p>
                  <p className="text-xs text-muted-foreground">
                    Discover your primary and secondary styles
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Heart className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Better Matches</p>
                  <p className="text-xs text-muted-foreground">
                    Compatible conflict styles = healthier relationships
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
              There are no right or wrong answers. Answer honestly for the best
              results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questions step
  if (step === "questions") {
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

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

          {/* Question card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed">
                {question.scenario}
              </CardTitle>
              <CardDescription>
                Choose the response that feels most natural to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.style)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:border-primary hover:bg-primary/5 ${
                    answers[currentQuestion] === option.style
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <p className="text-sm">{option.text}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <p className="text-sm text-muted-foreground self-center">
              {Object.keys(answers).length} / {questions.length} answered
            </p>
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
                <Scale className="h-16 w-16 relative text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Analyzing your responses...</CardTitle>
            <CardDescription>
              Determining your conflict resolution style
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
                <Scale className="h-8 w-8 text-destructive" />
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
              onClick={() => router.push("/onboarding/personality")}
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
    const primaryInfo = conflictStyleInfo[result.primary];
    const secondaryInfo = result.secondary
      ? conflictStyleInfo[result.secondary]
      : null;
    const PrimaryIcon = primaryInfo.icon;
    const SecondaryIcon = secondaryInfo?.icon;

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
            <h1 className="text-3xl font-bold">Your Conflict Style</h1>
            <p className="text-muted-foreground">
              Here&apos;s how you navigate disagreements
            </p>
          </div>

          {/* Primary Style Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div
                  className={`h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center`}
                >
                  <PrimaryIcon className={`h-8 w-8 ${primaryInfo.color}`} />
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Primary Style
              </div>
              <CardTitle className="text-2xl">{primaryInfo.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{primaryInfo.description}</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">
                    Strengths
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {primaryInfo.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-2">
                    Challenges
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {primaryInfo.challenges.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Style Card */}
          {secondaryInfo && SecondaryIcon && (
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <SecondaryIcon
                      className={`h-6 w-6 ${secondaryInfo.color}`}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Secondary Style
                </div>
                <CardTitle className="text-xl">{secondaryInfo.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  {secondaryInfo.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Style Breakdown</CardTitle>
              <CardDescription>
                How often you gravitated toward each style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(
                  Object.entries(conflictStyleInfo) as [
                    ConflictStyle,
                    typeof conflictStyleInfo.competing
                  ][]
                ).map(([style, info]) => {
                  const score =
                    result.scores[
                      `${style}_score` as keyof ConflictAssessmentJson
                    ];
                  const percentage =
                    typeof score === "number"
                      ? (score / questions.length) * 100
                      : 0;
                  const Icon = info.icon;

                  return (
                    <div key={style} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${info.color}`} />
                          {info.label}
                        </span>
                        <span className="text-muted-foreground">
                          {score} / {questions.length}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-primary transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  Save and Continue
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
