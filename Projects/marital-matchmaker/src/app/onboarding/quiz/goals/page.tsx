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

// Goals dimension questions with hidden scoring weights
const GOALS_QUESTIONS = [
  {
    id: "goals_q1",
    question: "What are your career ambitions for the next 5-10 years?",
    options: [
      { value: "ambitious_growth", label: "Aggressive growth - I want to reach the top of my field", weight: 5 },
      { value: "steady_progress", label: "Steady progress - I value career advancement but with balance", weight: 4 },
      { value: "maintain_current", label: "Maintain my current position - I'm happy where I am", weight: 3 },
      { value: "career_change", label: "Major career change or entrepreneurship", weight: 4 },
      { value: "reduce_focus", label: "Reduce career focus to prioritize other aspects of life", weight: 2 },
    ],
  },
  {
    id: "goals_q2",
    question: "What are your preferences regarding having children?",
    options: [
      { value: "definitely_want", label: "I definitely want children", weight: 5 },
      { value: "open_to_it", label: "I'm open to having children", weight: 4 },
      { value: "unsure", label: "I'm unsure about having children", weight: 3 },
      { value: "prefer_not", label: "I prefer not to have children", weight: 2 },
      { value: "already_have", label: "I already have children and may or may not want more", weight: 4 },
    ],
  },
  {
    id: "goals_q3",
    question: "Where do you see yourself living long-term?",
    options: [
      { value: "current_location", label: "Stay in my current city/area", weight: 3 },
      { value: "open_relocate", label: "Open to relocating for the right opportunity or partner", weight: 4 },
      { value: "specific_place", label: "I have a specific place in mind I want to move to", weight: 4 },
      { value: "nomadic", label: "I prefer a nomadic lifestyle or frequent travel", weight: 2 },
      { value: "rural_suburban", label: "I want to settle in a rural or suburban area", weight: 3 },
    ],
  },
  {
    id: "goals_q4",
    question: "What's your vision for retirement?",
    options: [
      { value: "early_retire", label: "Retire early and enjoy life", weight: 4 },
      { value: "traditional", label: "Traditional retirement in my 60s", weight: 3 },
      { value: "never_retire", label: "I plan to work in some capacity as long as I can", weight: 4 },
      { value: "flexible", label: "I haven't thought much about retirement yet", weight: 2 },
      { value: "part_time", label: "Transition to part-time work and hobbies", weight: 3 },
    ],
  },
  {
    id: "goals_q5",
    question: "How do you balance adventure versus stability in life decisions?",
    options: [
      { value: "adventure_seeker", label: "I prioritize adventure and new experiences", weight: 5 },
      { value: "mostly_adventure", label: "Mostly adventure with some stability", weight: 4 },
      { value: "balanced", label: "I seek a balance between adventure and stability", weight: 3 },
      { value: "mostly_stable", label: "Mostly stability with occasional adventures", weight: 4 },
      { value: "stability_focused", label: "I prioritize stability and security", weight: 5 },
    ],
  },
];

const DIMENSION_ORDER = ["values", "goals", "communication", "lifestyle", "finance"];

export default function GoalsQuizPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number }>>({});

  // Load any previously saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quiz_goals_answers");
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
      localStorage.setItem("quiz_goals_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const currentQ = GOALS_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const allQuestionsAnswered = GOALS_QUESTIONS.every((q) => answers[q.id]);
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
      router.push("/onboarding/quiz/values");
    }
  }

  function handleNext() {
    if (currentQuestion < GOALS_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("dimension", "goals");
    formData.set("responses", JSON.stringify(answers));

    const result = await saveValuesQuizResponses(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Clear localStorage after successful save
      localStorage.removeItem("quiz_goals_answers");
      // Navigate to next dimension
      router.push("/onboarding/quiz/communication");
    }
  }

  const currentDimensionIndex = DIMENSION_ORDER.indexOf("goals");
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
          <CardTitle className="text-2xl font-bold">Your Life Goals</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {GOALS_QUESTIONS.length}
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
            {GOALS_QUESTIONS.map((q, idx) => (
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

            {currentQuestion < GOALS_QUESTIONS.length - 1 ? (
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
                {isLoading ? "Saving..." : "Continue to Communication"}
              </Button>
            )}
          </div>

          {/* Answer count indicator */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {answeredCount} of {GOALS_QUESTIONS.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
