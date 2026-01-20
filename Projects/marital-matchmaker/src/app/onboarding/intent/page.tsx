"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveIntentResponses } from "@/lib/onboarding/actions";

const TIMELINE_OPTIONS = [
  { value: "1_year", label: "Within 1 year" },
  { value: "2_3_years", label: "2-3 years" },
  { value: "when_right_person", label: "When I find the right person" },
  { value: "unsure", label: "Unsure" },
];

const RELATIONSHIP_HISTORY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "1_2", label: "1-2" },
  { value: "3_plus", label: "3+" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const SEEKING_OPTIONS = [
  { value: "life_partner", label: "A life partner" },
  {
    value: "serious_exploring",
    label: "A serious relationship exploring marriage",
  },
  { value: "not_sure_yet", label: "Not sure yet" },
];

export default function IntentQuestionnairePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [formData, setFormData] = useState({
    marriage_timeline: "",
    relationship_history: "",
    what_seeking: "",
    marriage_meaning: "",
  });

  function handleSelectionChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Show warning if user selects "unsure" timeline or "not sure yet" seeking
    if (
      (field === "marriage_timeline" && value === "unsure") ||
      (field === "what_seeking" && value === "not_sure_yet")
    ) {
      setShowWarning(true);
    } else if (field === "marriage_timeline" || field === "what_seeking") {
      // Hide warning if they change their selection to something definite
      const otherField =
        field === "marriage_timeline" ? "what_seeking" : "marriage_timeline";
      const otherValue = formData[otherField as keyof typeof formData];
      if (otherValue !== "unsure" && otherValue !== "not_sure_yet") {
        setShowWarning(false);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const data = new FormData();
    data.set("marriage_timeline", formData.marriage_timeline);
    data.set("relationship_history", formData.relationship_history);
    data.set("what_seeking", formData.what_seeking);
    data.set("marriage_meaning", formData.marriage_meaning);

    const result = await saveIntentResponses(data);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/onboarding/profile");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Your Marriage Intent
          </CardTitle>
          <CardDescription>
            Help us understand your relationship goals. Your answers help us
            find compatible matches who share your commitment level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {showWarning && (
            <div className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium">A note about our platform</p>
              <p className="mt-1">
                Marital Matchmaker is designed for those who are serious about
                finding a life partner. While we welcome you to continue, please
                know that our matching algorithm prioritizes users with clear
                marriage intentions.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question 1: Marriage Timeline */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                When do you see yourself getting married?
              </Label>
              <div className="grid gap-2">
                {TIMELINE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      formData.marriage_timeline === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="marriage_timeline"
                      value={option.value}
                      checked={formData.marriage_timeline === option.value}
                      onChange={(e) =>
                        handleSelectionChange("marriage_timeline", e.target.value)
                      }
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 2: Relationship History */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                How many serious relationships have you had?
              </Label>
              <div className="grid gap-2">
                {RELATIONSHIP_HISTORY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      formData.relationship_history === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="relationship_history"
                      value={option.value}
                      checked={formData.relationship_history === option.value}
                      onChange={(e) =>
                        handleSelectionChange(
                          "relationship_history",
                          e.target.value
                        )
                      }
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: What Seeking */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                What are you looking for?
              </Label>
              <div className="grid gap-2">
                {SEEKING_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      formData.what_seeking === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="what_seeking"
                      value={option.value}
                      checked={formData.what_seeking === option.value}
                      onChange={(e) =>
                        handleSelectionChange("what_seeking", e.target.value)
                      }
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 4: Marriage Meaning (Open Text) */}
            <div className="space-y-3">
              <Label htmlFor="marriage_meaning" className="text-base font-medium">
                What does marriage mean to you?{" "}
                <span className="text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="marriage_meaning"
                name="marriage_meaning"
                value={formData.marriage_meaning}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    marriage_meaning: e.target.value,
                  }))
                }
                placeholder="Share your thoughts on what marriage means to you..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !formData.marriage_timeline ||
                !formData.relationship_history ||
                !formData.what_seeking
              }
            >
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
