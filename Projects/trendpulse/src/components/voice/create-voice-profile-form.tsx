"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Loader2, Plus, X, Info } from "lucide-react";
import type { PlatformType } from "@/lib/voice";

interface CreateVoiceProfileFormProps {
  onSubmit: (data: {
    name: string;
    platform: PlatformType;
    sample_posts: string[];
    is_default: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreateVoiceProfileForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: CreateVoiceProfileFormProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("linkedin");
  const [isDefault, setIsDefault] = useState(false);
  const [sampleText, setSampleText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseSamplePosts = (text: string): string[] => {
    // Split by double newlines or "---" separators
    return text
      .split(/\n\s*\n|---/)
      .map((post) => post.trim())
      .filter((post) => post.length > 0);
  };

  const samplePosts = parseSamplePosts(sampleText);
  const postCount = samplePosts.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a profile name");
      return;
    }

    if (postCount < 10) {
      setError(`Please add at least 10 sample posts. You currently have ${postCount}.`);
      return;
    }

    if (postCount > 30) {
      setError(`Maximum 30 sample posts allowed. You currently have ${postCount}.`);
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        platform,
        sample_posts: samplePosts,
        is_default: isDefault,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Voice Profile
        </CardTitle>
        <CardDescription>
          Paste 10-30 of your best posts to analyze your writing style
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                placeholder="e.g., My LinkedIn Voice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                disabled={isSubmitting}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter/X</option>
                <option value="instagram">Instagram</option>
              </Select>
            </div>
          </div>

          {/* Sample Posts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="samples">Sample Posts</Label>
              <span
                className={`text-sm ${
                  postCount < 10
                    ? "text-destructive"
                    : postCount > 30
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {postCount}/10-30 posts
              </span>
            </div>

            <div className="rounded-md bg-muted/50 p-3 mb-2">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Paste your posts below, separated by blank lines or{" "}
                  <code className="bg-muted px-1 rounded">---</code>. Include
                  posts that represent your typical writing style.
                </span>
              </p>
            </div>

            <Textarea
              id="samples"
              placeholder={`Post 1: Your first sample post here...

Post 2: Another example of your writing style...

---

Post 3: You can also use --- to separate posts...`}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Default Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="is_default" className="text-sm font-normal">
              Set as default profile for {platform === "linkedin" ? "LinkedIn" : platform === "twitter" ? "Twitter/X" : "Instagram"}
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
