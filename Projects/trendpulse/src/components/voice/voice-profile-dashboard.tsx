"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceProfileCard } from "./voice-profile-card";
import { CreateVoiceProfileForm } from "./create-voice-profile-form";
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mic,
} from "lucide-react";
import type { VoiceProfile, PlatformType } from "@/lib/voice";

export function VoiceProfileDashboard() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch("/api/voice-profiles");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch voice profiles");
      }

      setProfiles(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfiles();
  };

  const handleCreate = async (data: {
    name: string;
    platform: PlatformType;
    sample_posts: string[];
    is_default: boolean;
  }) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/voice-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create voice profile");
      }

      setShowCreateForm(false);
      await fetchProfiles();
    } catch (err) {
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voice profile?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/voice-profiles/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete voice profile");
      }

      await fetchProfiles();
    } catch (err) {
      console.error("Error deleting profile:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReanalyze = async (id: string) => {
    setReanalyzingId(id);
    try {
      const response = await fetch(`/api/voice-profiles/${id}`, {
        method: "POST",
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to re-analyze voice profile");
      }

      await fetchProfiles();
    } catch (err) {
      console.error("Error re-analyzing profile:", err);
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/voice-profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to set default profile");
      }

      await fetchProfiles();
    } catch (err) {
      console.error("Error setting default profile:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center gap-2 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Voice Profiles</h2>
          <p className="text-muted-foreground">
            Train AI to write in your unique voice for each platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          {!showCreateForm && (
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Profile
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateVoiceProfileForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={isCreating}
        />
      )}

      {/* Profile Grid */}
      {profiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <VoiceProfileCard
              key={profile.id}
              profile={profile}
              onDelete={handleDelete}
              onReanalyze={handleReanalyze}
              onSetDefault={handleSetDefault}
              isDeleting={deletingId === profile.id}
              isReanalyzing={reanalyzingId === profile.id}
            />
          ))}
        </div>
      ) : !showCreateForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mic className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No voice profiles yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Create a voice profile by pasting 10-30 of your best posts. We&apos;ll
              analyze your writing style and use it to generate content that
              sounds like you.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
