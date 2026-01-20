"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveValuesQuizResponses } from "@/lib/onboarding/actions";

// Finance dimension questions with hidden scoring weights
const FINANCE_QUESTIONS = [
  {
    id: "finance_q1",
    question: "How would you describe your approach to spending vs saving?",
    options: [
      { value: "aggressive_saver", label: "Aggressive saver - I save most of my income and spend minimally", weight: 5 },
      { value: "balanced_saver", label: "Balanced - I save consistently but enjoy occasional treats", weight: 4 },
      { value: "moderate_spender", label: "Moderate spender - I save some but prioritize enjoying life now", weight: 3 },
      { value: "live_in_moment", label: "Live in the moment - I prefer experiences over savings", weight: 2 },
      { value: "spender", label: "Spender - I enjoy spending and trust things will work out", weight: 1 },
    ],
  },
  {
    id: "finance_q2",
    question: "What are your primary financial goals?",
    options: [
      { value: "early_retirement", label: "Early retirement and financial independence", weight: 5 },
      { value: "homeownership", label: "Homeownership and building equity", weight: 4 },
      { value: "wealth_building", label: "Building wealth through investments", weight: 4 },
      { value: "comfortable_life", label: "Living comfortably without major financial stress", weight: 3 },
      { value: "experiences", label: "Funding experiences and adventures", weight: 2 },
    ],
  },
  {
    id: "finance_q3",
    question: "How do you feel about debt?",
    options: [
      { value: "debt_free", label: "Strongly avoid all debt - I only buy what I can afford in cash", weight: 5 },
      { value: "strategic_debt", label: "Strategic debt only - mortgages and investments are okay", weight: 4 },
      { value: "practical_view", label: "Practical view - some debt is necessary and manageable", weight: 3 },
      { value: "comfortable_debt", label: "Comfortable with debt - it's a tool when used responsibly", weight: 2 },
      { value: "not_concerned", label: "Not overly concerned - debt is part of modern life", weight: 1 },
    ],
  },
  {
    id: "finance_q4",
    question: "How do you think couples should handle income and expenses?",
    options: [
      { value: "fully_joint", label: "Fully joint - all money goes into shared accounts", weight: 5 },
      { value: "mostly_joint", label: "Mostly joint - shared accounts plus small personal allowances", weight: 4 },
      { value: "hybrid", label: "Hybrid - joint account for shared expenses, separate for personal", weight: 3 },
      { value: "mostly_separate", label: "Mostly separate - split bills proportionally, keep rest separate", weight: 2 },
      { value: "fully_separate", label: "Fully separate - each person manages their own finances", weight: 1 },
    ],
  },
  {
    id: "finance_q5",
    question: "What lifestyle expectations do you have for the future?",
    options: [
      { value: "luxury", label: "Luxury lifestyle - designer items, premium experiences, upscale living", weight: 5 },
      { value: "comfortable_upper", label: "Comfortable upper-middle - nice home, good vacations, quality items", weight: 4 },
      { value: "middle_class", label: "Solid middle class - stable, comfortable, with occasional splurges", weight: 3 },
      { value: "modest", label: "Modest and practical - focus on needs over wants", weight: 2 },
      { value: "minimalist", label: "Minimalist - few material needs, prioritize simplicity", weight: 1 },
    ],
  },
];

const DIMENSION_ORDER = ["values", "goals", "communication", "lifestyle", "finance"];

export default function FinanceQuizPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number }>>({});

  // Load any previously saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quiz_finance_answers");
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save answers to localStorage when they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem("quiz_finance_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const currentQ = FINANCE_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const allQuestionsAnswered = FINANCE_QUESTIONS.every((q) => answers[q.id]);
  const answeredCount = Object.keys(answers).length;

  function handleSelect(questionId: string, value: string, weight: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { value, weight },
    }));
  }

  function handleBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      // Go back to previous dimension
      router.push("/onboarding/quiz/lifestyle");
    }
  }

  function handleNext() {
    if (currentQuestion < FINANCE_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("dimension", "finance");
    formData.set("responses", JSON.stringify(answers));

    const result = await saveValuesQuizResponses(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Clear localStorage after successful save
      localStorage.removeItem("quiz_finance_answers");
      // Navigate to preferences page (final step after all quiz dimensions)
      router.push("/onboarding/preferences");
    }
  }

  const currentDimensionIndex = DIMENSION_ORDER.indexOf("finance");
  const progressPercent = ((currentDimensionIndex + 1) / DIMENSION_ORDER.length) * 100;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {/* Progress bar showing dimension progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Compatibility Quiz</span>
              <span>{currentDimensionIndex + 1}/5 dimensions</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Your Financial Values</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {FINANCE_QUESTIONS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Question progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {FINANCE_QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  idx === currentQuestion
                    ? "bg-primary"
                    : answers[q.id]
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
                aria-label={`Go to question ${idx + 1}`}
              />
            ))}
          </div>

          {/* Current question */}
          <div className="space-y-4">
            <Label className="text-base font-medium block">
              {currentQ.question}
            </Label>
            <div className="grid gap-2">
              {currentQ.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                    selectedAnswer?.value === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input"
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQ.id}
                    value={option.value}
                    checked={selectedAnswer?.value === option.value}
                    onChange={() =>
                      handleSelect(currentQ.id, option.value, option.weight)
                    }
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentQuestion < FINANCE_QUESTIONS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!selectedAnswer || isLoading}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || isLoading}
                className="flex-1"
              >
                {isLoading ? "Saving..." : "Complete Quiz"}
              </Button>
            )}
          </div>

          {/* Answer count indicator */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {answeredCount} of {FINANCE_QUESTIONS.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
