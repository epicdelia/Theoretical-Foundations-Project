"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { savePreferences } from "@/lib/onboarding/actions";

const LOCATION_OPTIONS = [
  { value: "same_city", label: "Same city" },
  { value: "same_region", label: "Same region/state" },
  { value: "anywhere", label: "Anywhere" },
];

const DEALBREAKER_OPTIONS = [
  { value: "smoking", label: "Smoking" },
  { value: "children_mismatch", label: "Children preference mismatch" },
  { value: "religious_differences", label: "Religious differences" },
  { value: "political_differences", label: "Political differences" },
  { value: "long_distance", label: "Long distance relationship" },
  { value: "different_life_goals", label: "Different life goals" },
  { value: "substance_use", label: "Substance use" },
  { value: "financial_instability", label: "Financial instability" },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [minAge, setMinAge] = useState(25);
  const [maxAge, setMaxAge] = useState(40);
  const [locationPreference, setLocationPreference] = useState("same_region");
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);

  function handleDealbreakersToggle(value: string) {
    setDealbreakers((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function handleMinAgeChange(value: number) {
    setMinAge(value);
    if (value > maxAge) {
      setMaxAge(value);
    }
  }

  function handleMaxAgeChange(value: number) {
    setMaxAge(value);
    if (value < minAge) {
      setMinAge(value);
    }
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("min_age", minAge.toString());
    formData.set("max_age", maxAge.toString());
    formData.set("preferred_location", locationPreference);
    formData.set("dealbreakers", JSON.stringify(dealbreakers));

    const result = await savePreferences(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Show "Finding your matches..." state
      setIsComplete(true);
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }

  if (isComplete) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Heart className="w-16 h-16 text-primary animate-pulse" />
              <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mt-6 text-center">
              Finding your matches...
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              We&apos;re analyzing compatibility to find your perfect match
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Partner Preferences</span>
              <span>Final Step</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Your Partner Preferences
          </CardTitle>
          <CardDescription>
            Tell us what you&apos;re looking for in a partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Age Range */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Preferred Age Range</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="min-age" className="text-sm text-muted-foreground">
                      Minimum Age
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        id="min-age"
                        type="range"
                        min={18}
                        max={80}
                        value={minAge}
                        onChange={(e) => handleMinAgeChange(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-sm font-medium w-8 text-center">
                        {minAge}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="max-age" className="text-sm text-muted-foreground">
                      Maximum Age
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        id="max-age"
                        type="range"
                        min={18}
                        max={80}
                        value={maxAge}
                        onChange={(e) => handleMaxAgeChange(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-sm font-medium w-8 text-center">
                        {maxAge}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Looking for ages {minAge} - {maxAge}
                </p>
              </div>
            </div>

            {/* Location Preference */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Location Preference</Label>
              <div className="grid gap-2">
                {LOCATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      locationPreference === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="location_preference"
                      value={option.value}
                      checked={locationPreference === option.value}
                      onChange={(e) => setLocationPreference(e.target.value)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dealbreakers */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Dealbreakers</Label>
              <p className="text-xs text-muted-foreground">
                Select any factors that would be dealbreakers for you
              </p>
              <div className="grid gap-2">
                {DEALBREAKER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      dealbreakers.includes(option.value)
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={dealbreakers.includes(option.value)}
                      onChange={() => handleDealbreakersToggle(option.value)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/onboarding/quiz/finance")}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Complete Onboarding"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
