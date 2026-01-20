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

// Communication dimension questions with hidden scoring weights
const COMMUNICATION_QUESTIONS = [
  {
    id: "communication_q1",
    question: "How do you typically handle conflict in relationships?",
    options: [
      { value: "direct_immediate", label: "I address issues directly and immediately", weight: 5 },
      { value: "calm_discussion", label: "I prefer to cool down first, then have a calm discussion", weight: 4 },
      { value: "avoid_conflict", label: "I tend to avoid conflict and hope things resolve naturally", weight: 2 },
      { value: "written_communication", label: "I prefer to write out my thoughts before discussing", weight: 3 },
      { value: "mediator_help", label: "I often seek a third party or mediator to help", weight: 3 },
    ],
  },
  {
    id: "communication_q2",
    question: "How comfortable are you expressing your emotions to a partner?",
    options: [
      { value: "very_open", label: "Very open - I share my feelings freely and often", weight: 5 },
      { value: "mostly_open", label: "Mostly open - I share when I feel safe and connected", weight: 4 },
      { value: "selective", label: "Selective - I share deep emotions only after significant trust is built", weight: 3 },
      { value: "reserved", label: "Reserved - I prefer to process emotions privately", weight: 2 },
      { value: "actions_over_words", label: "I show emotions through actions more than words", weight: 3 },
    ],
  },
  {
    id: "communication_q3",
    question: "How much quality time together do you need to feel connected?",
    options: [
      { value: "constant_togetherness", label: "I thrive on spending most of our free time together", weight: 5 },
      { value: "daily_connection", label: "Daily meaningful connection, even if brief", weight: 4 },
      { value: "balanced", label: "A healthy balance of together time and independence", weight: 3 },
      { value: "independent", label: "I need significant personal space and alone time", weight: 2 },
      { value: "quality_over_quantity", label: "Less frequent but deeply focused quality time", weight: 4 },
    ],
  },
  {
    id: "communication_q4",
    question: "How do you prefer to give and receive love?",
    options: [
      { value: "words_affirmation", label: "Words of affirmation - compliments, encouragement, verbal appreciation", weight: 4 },
      { value: "acts_service", label: "Acts of service - helping with tasks, doing things for each other", weight: 4 },
      { value: "receiving_gifts", label: "Thoughtful gifts - symbolic tokens that show you're thinking of them", weight: 3 },
      { value: "physical_touch", label: "Physical touch - hugs, holding hands, physical closeness", weight: 4 },
      { value: "quality_time", label: "Quality time - undivided attention and shared experiences", weight: 4 },
    ],
  },
  {
    id: "communication_q5",
    question: "How do you prefer to discuss important decisions?",
    options: [
      { value: "thorough_analysis", label: "Thorough analysis - I want to discuss all angles and possibilities", weight: 5 },
      { value: "intuitive_quick", label: "Quick and intuitive - I trust gut feelings and prefer fast decisions", weight: 3 },
      { value: "collaborative", label: "Collaborative - I want equal input and consensus before deciding", weight: 4 },
      { value: "research_first", label: "Research first - I need time to gather information independently", weight: 3 },
      { value: "defer_expertise", label: "I prefer to defer to whoever has more expertise on the topic", weight: 2 },
    ],
  },
];

const DIMENSION_ORDER = ["values", "goals", "communication", "lifestyle", "finance"];

export default function CommunicationQuizPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number }>>({});

  // Load any previously saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quiz_communication_answers");
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
      localStorage.setItem("quiz_communication_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const currentQ = COMMUNICATION_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const allQuestionsAnswered = COMMUNICATION_QUESTIONS.every((q) => answers[q.id]);
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
      router.push("/onboarding/quiz/goals");
    }
  }

  function handleNext() {
    if (currentQuestion < COMMUNICATION_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("dimension", "communication");
    formData.set("responses", JSON.stringify(answers));

    const result = await saveValuesQuizResponses(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Clear localStorage after successful save
      localStorage.removeItem("quiz_communication_answers");
      // Navigate to next dimension
      router.push("/onboarding/quiz/lifestyle");
    }
  }

  const currentDimensionIndex = DIMENSION_ORDER.indexOf("communication");
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
          <CardTitle className="text-2xl font-bold">Communication Style</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {COMMUNICATION_QUESTIONS.length}
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
            {COMMUNICATION_QUESTIONS.map((q, idx) => (
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

            {currentQuestion < COMMUNICATION_QUESTIONS.length - 1 ? (
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
                {isLoading ? "Saving..." : "Continue to Lifestyle"}
              </Button>
            )}
          </div>

          {/* Answer count indicator */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {answeredCount} of {COMMUNICATION_QUESTIONS.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
