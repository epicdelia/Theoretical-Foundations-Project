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

// Lifestyle dimension questions with hidden scoring weights
const LIFESTYLE_QUESTIONS = [
  {
    id: "lifestyle_q1",
    question: "How would you describe your social preferences?",
    options: [
      { value: "extrovert", label: "I'm an extrovert - I love being around people and gain energy from social interactions", weight: 5 },
      { value: "mostly_extrovert", label: "Mostly extroverted - I enjoy socializing but need some alone time", weight: 4 },
      { value: "ambivert", label: "I'm an ambivert - I enjoy a balance of social time and solitude", weight: 3 },
      { value: "mostly_introvert", label: "Mostly introverted - I prefer small gatherings and need significant alone time", weight: 2 },
      { value: "introvert", label: "I'm an introvert - I recharge through solitude and prefer one-on-one interactions", weight: 1 },
    ],
  },
  {
    id: "lifestyle_q2",
    question: "How important is health and fitness in your daily life?",
    options: [
      { value: "central_priority", label: "Central priority - I work out daily and follow a strict health regimen", weight: 5 },
      { value: "very_important", label: "Very important - I exercise regularly and make healthy choices", weight: 4 },
      { value: "moderately_important", label: "Moderately important - I try to stay active and eat well when I can", weight: 3 },
      { value: "casual", label: "Casual approach - I'm not super focused on fitness but stay reasonably active", weight: 2 },
      { value: "not_priority", label: "Not a priority - I prefer other activities over exercise", weight: 1 },
    ],
  },
  {
    id: "lifestyle_q3",
    question: "How often do you like to travel?",
    options: [
      { value: "frequent_traveler", label: "Frequent traveler - I travel multiple times a year and love exploring", weight: 5 },
      { value: "regular_traveler", label: "Regular traveler - I take a few trips a year and enjoy new experiences", weight: 4 },
      { value: "occasional", label: "Occasional traveler - I travel once or twice a year for vacations", weight: 3 },
      { value: "rare", label: "Rare traveler - I travel only for special occasions or necessity", weight: 2 },
      { value: "homebody", label: "Homebody - I prefer staying close to home and local adventures", weight: 1 },
    ],
  },
  {
    id: "lifestyle_q4",
    question: "What are your preferences regarding pets?",
    options: [
      { value: "love_pets", label: "I love pets and have or want to have pets", weight: 5 },
      { value: "open_to_pets", label: "I'm open to having pets with the right partner", weight: 4 },
      { value: "prefer_no_pets", label: "I prefer not to have pets but can tolerate them", weight: 2 },
      { value: "allergic_opposed", label: "I'm allergic or strongly opposed to having pets", weight: 1 },
      { value: "specific_pets", label: "I only like specific types of pets (e.g., dogs but not cats)", weight: 3 },
    ],
  },
  {
    id: "lifestyle_q5",
    question: "What best describes your daily routine?",
    options: [
      { value: "early_bird", label: "Early bird - I wake up early and am most productive in the morning", weight: 4 },
      { value: "night_owl", label: "Night owl - I stay up late and am most productive at night", weight: 4 },
      { value: "structured", label: "Highly structured - I follow a consistent schedule every day", weight: 5 },
      { value: "flexible", label: "Flexible - I adapt my routine based on what's happening", weight: 3 },
      { value: "spontaneous", label: "Spontaneous - I prefer going with the flow without strict schedules", weight: 2 },
    ],
  },
];

const DIMENSION_ORDER = ["values", "goals", "communication", "lifestyle", "finance"];

export default function LifestyleQuizPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number }>>({});

  // Load any previously saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quiz_lifestyle_answers");
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
      localStorage.setItem("quiz_lifestyle_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const currentQ = LIFESTYLE_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const allQuestionsAnswered = LIFESTYLE_QUESTIONS.every((q) => answers[q.id]);
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
      router.push("/onboarding/quiz/communication");
    }
  }

  function handleNext() {
    if (currentQuestion < LIFESTYLE_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("dimension", "lifestyle");
    formData.set("responses", JSON.stringify(answers));

    const result = await saveValuesQuizResponses(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Clear localStorage after successful save
      localStorage.removeItem("quiz_lifestyle_answers");
      // Navigate to next dimension
      router.push("/onboarding/quiz/finance");
    }
  }

  const currentDimensionIndex = DIMENSION_ORDER.indexOf("lifestyle");
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
          <CardTitle className="text-2xl font-bold">Your Lifestyle</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {LIFESTYLE_QUESTIONS.length}
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
            {LIFESTYLE_QUESTIONS.map((q, idx) => (
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

            {currentQuestion < LIFESTYLE_QUESTIONS.length - 1 ? (
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
                {isLoading ? "Saving..." : "Continue to Finance"}
              </Button>
            )}
          </div>

          {/* Answer count indicator */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {answeredCount} of {LIFESTYLE_QUESTIONS.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
