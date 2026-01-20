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

// Values dimension questions with hidden scoring weights
const VALUES_QUESTIONS = [
  {
    id: "values_q1",
    question: "How important is family in your life decisions?",
    options: [
      { value: "central", label: "Family is central to everything I do", weight: 5 },
      { value: "very_important", label: "Very important, but I balance other priorities", weight: 4 },
      { value: "moderately_important", label: "Moderately important", weight: 3 },
      { value: "independent", label: "I prioritize my independence", weight: 2 },
    ],
  },
  {
    id: "values_q2",
    question: "What role do religious or spiritual beliefs play in your life?",
    options: [
      { value: "central_faith", label: "My faith guides all my decisions", weight: 5 },
      { value: "important_practice", label: "Important - I practice regularly", weight: 4 },
      { value: "personal_spiritual", label: "I'm spiritual but not religious", weight: 3 },
      { value: "not_religious", label: "Not a significant part of my life", weight: 2 },
      { value: "secular", label: "I identify as secular/non-religious", weight: 1 },
    ],
  },
  {
    id: "values_q3",
    question: "How do you view honesty in relationships?",
    options: [
      { value: "absolute", label: "Complete honesty, always - no exceptions", weight: 5 },
      { value: "mostly_honest", label: "Honesty with occasional white lies to spare feelings", weight: 4 },
      { value: "contextual", label: "Honesty depends on the situation", weight: 3 },
      { value: "privacy", label: "Some things are better left unsaid", weight: 2 },
    ],
  },
  {
    id: "values_q4",
    question: "What does loyalty mean to you in a partnership?",
    options: [
      { value: "unconditional", label: "Standing by my partner no matter what", weight: 5 },
      { value: "mutual_respect", label: "Loyalty must be earned and reciprocated", weight: 4 },
      { value: "boundaries", label: "Loyalty with healthy boundaries", weight: 3 },
      { value: "flexible", label: "Loyalty can evolve as circumstances change", weight: 2 },
    ],
  },
  {
    id: "values_q5",
    question: "What are your top life priorities right now?",
    options: [
      { value: "family_relationships", label: "Building a family and meaningful relationships", weight: 5 },
      { value: "career_success", label: "Career growth and professional success", weight: 4 },
      { value: "personal_growth", label: "Personal development and self-discovery", weight: 3 },
      { value: "experiences", label: "Enjoying life experiences and adventures", weight: 2 },
      { value: "balanced", label: "Maintaining balance across all areas", weight: 4 },
    ],
  },
];

const DIMENSION_ORDER = ["values", "goals", "communication", "lifestyle", "finance"];

export default function ValuesQuizPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number }>>({});

  // Load any previously saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quiz_values_answers");
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
      localStorage.setItem("quiz_values_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const currentQ = VALUES_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const allQuestionsAnswered = VALUES_QUESTIONS.every((q) => answers[q.id]);
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
      // Go back to profile page
      router.push("/onboarding/profile");
    }
  }

  function handleNext() {
    if (currentQuestion < VALUES_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("dimension", "values");
    formData.set("responses", JSON.stringify(answers));

    const result = await saveValuesQuizResponses(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Clear localStorage after successful save
      localStorage.removeItem("quiz_values_answers");
      // Navigate to next dimension
      router.push("/onboarding/quiz/goals");
    }
  }

  const currentDimensionIndex = DIMENSION_ORDER.indexOf("values");
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
          <CardTitle className="text-2xl font-bold">Your Core Values</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {VALUES_QUESTIONS.length}
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
            {VALUES_QUESTIONS.map((q, idx) => (
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

            {currentQuestion < VALUES_QUESTIONS.length - 1 ? (
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
                {isLoading ? "Saving..." : "Continue to Goals"}
              </Button>
            )}
          </div>

          {/* Answer count indicator */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {answeredCount} of {VALUES_QUESTIONS.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
