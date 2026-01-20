"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  X,
  User,
  MapPin,
  Calendar,
  Camera,
  Plus,
  Settings,
  ArrowLeft,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  Shield,
  LogOut,
  Trash2,
  Key,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import type { GenderType, PhotoJson, MusicProfile } from "@/lib/database.types";

const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const MAX_PHOTOS = 6;

interface PhotoUpload {
  id: string;
  file?: File;
  preview: string;
  uploading: boolean;
  url?: string;
  existingUrl?: string;
}

interface UserPreferences {
  min_age: number;
  max_age: number;
  max_distance: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut, connectSpotify, isSpotifyConnected } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Profile state
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderType | "">("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    min_age: 18,
    max_age: 50,
    max_distance: 50,
  });

  // Account state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // UI state
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isReconnectingSpotify, setIsReconnectingSpotify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user profile and preferences
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          setDisplayName(profileData.display_name || "");
          setAge(profileData.age?.toString() || "");
          setGender(profileData.gender || "");
          setLocation(profileData.location || "");
          setBio(profileData.bio || "");

          // Convert existing photos to PhotoUpload format
          if (profileData.photos_json && profileData.photos_json.length > 0) {
            const existingPhotos: PhotoUpload[] = profileData.photos_json.map(
              (photo: PhotoJson) => ({
                id: crypto.randomUUID(),
                preview: photo.url,
                uploading: false,
                existingUrl: photo.url,
              })
            );
            setPhotos(existingPhotos);
          }
        }

        // Fetch music profile
        const { data: musicData } = await supabase
          .from("music_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (musicData) {
          setMusicProfile(musicData);
        }

        // Fetch preferences (stored in user_preferences table or local storage)
        const storedPrefs = localStorage.getItem(`harmonic_prefs_${user.id}`);
        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs));
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading, supabase]);

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = MAX_PHOTOS - photos.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      const newPhotos: PhotoUpload[] = filesToAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [photos.length]
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.preview && photo.file) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const uploadPhotos = async (): Promise<PhotoJson[]> => {
    if (!user) throw new Error("User not authenticated");

    const uploadedPhotos: PhotoJson[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // If it's an existing photo, just include it
      if (photo.existingUrl) {
        uploadedPhotos.push({
          url: photo.existingUrl,
          order: i,
          is_primary: i === 0,
        });
        continue;
      }

      if (!photo.file) continue;

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, uploading: true } : p))
      );

      const fileExt = photo.file.name.split(".").pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, photo.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        throw new Error(`Failed to upload photo: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

      uploadedPhotos.push({
        url: publicUrl,
        order: i,
        is_primary: i === 0,
      });

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id ? { ...p, uploading: false, url: publicUrl } : p
        )
      );
    }

    return uploadedPhotos;
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setError(null);
    setSuccessMessage(null);
    setIsSavingProfile(true);

    try {
      const uploadedPhotos = await uploadPhotos();

      const profileData = {
        user_id: user.id,
        display_name: displayName.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        photos_json: uploadedPhotos,
      };

      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      setSuccessMessage("Profile saved successfully");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setError(null);
    setSuccessMessage(null);
    setIsSavingPreferences(true);

    try {
      // Store preferences in localStorage for now
      localStorage.setItem(`harmonic_prefs_${user.id}`, JSON.stringify(preferences));
      setSuccessMessage("Preferences saved successfully");
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleReconnectSpotify = () => {
    setIsReconnectingSpotify(true);
    connectSpotify();
  };

  const handleRetakeAssessments = () => {
    router.push("/onboarding/personality");
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setError(null);
    setIsDeletingAccount(true);

    try {
      // Delete user profile first
      await supabase.from("user_profiles").delete().eq("user_id", user.id);
      await supabase.from("music_profiles").delete().eq("user_id", user.id);
      await supabase.from("conflict_styles").delete().eq("user_id", user.id);
      await supabase.from("personality_assessments").delete().eq("user_id", user.id);

      // Note: Full account deletion would require server-side admin privileges
      // For now, we sign out and clear data
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account. Please contact support.");
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Music</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Photo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Your Photos
                </CardTitle>
                <CardDescription>
                  Add up to 6 photos. Your first photo will be your main profile picture.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {photo.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {index === 0 && !photo.uploading && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        disabled={photo.uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-xs">Add Photo</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Basic Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="What should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    min={18}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={gender}
                    onValueChange={(value: GenderType) => setGender(value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  About You
                </CardTitle>
                <CardDescription>
                  Tell potential matches about yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Share something about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveProfile}
              className="w-full"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Spotify Connection
                </CardTitle>
                <CardDescription>
                  {isSpotifyConnected
                    ? "Your Spotify account is connected"
                    : "Connect your Spotify account to find matches based on music"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {musicProfile && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Last synced:{" "}
                      {musicProfile.last_synced_at
                        ? new Date(musicProfile.last_synced_at).toLocaleDateString()
                        : "Never"}
                    </p>
                    {musicProfile.top_genres_json && musicProfile.top_genres_json.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {musicProfile.top_genres_json.slice(0, 5).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleReconnectSpotify}
                  variant={isSpotifyConnected ? "outline" : "default"}
                  className="w-full"
                  disabled={isReconnectingSpotify}
                >
                  {isReconnectingSpotify ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {isSpotifyConnected ? "Reconnect Spotify" : "Connect Spotify"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Personality Assessments
                </CardTitle>
                <CardDescription>
                  Retake your personality and conflict style assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRetakeAssessments}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake Assessments
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Match Preferences
                </CardTitle>
                <CardDescription>
                  Set your age and distance preferences for potential matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Range */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Age Range</Label>
                    <span className="text-sm text-muted-foreground">
                      {preferences.min_age} - {preferences.max_age} years
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Minimum Age</Label>
                      <Slider
                        value={[preferences.min_age]}
                        onValueChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            min_age: value[0],
                            max_age: Math.max(value[0], prev.max_age),
                          }))
                        }
                        min={18}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Maximum Age</Label>
                      <Slider
                        value={[preferences.max_age]}
                        onValueChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            max_age: value[0],
                            min_age: Math.min(value[0], prev.min_age),
                          }))
                        }
                        min={18}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Distance */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Maximum Distance</Label>
                    <span className="text-sm text-muted-foreground">
                      {preferences.max_distance} miles
                    </span>
                  </div>
                  <Slider
                    value={[preferences.max_distance]}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, max_distance: value[0] }))
                    }
                    min={1}
                    max={500}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSavePreferences}
              className="w-full"
              disabled={isSavingPreferences}
            >
              {isSavingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  variant="outline"
                  className="w-full"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </CardTitle>
                <CardDescription>
                  Sign out of your account on this device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-destructive">
                      This action cannot be undone. Type DELETE to confirm.
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="border-destructive"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        variant="destructive"
                        className="flex-1"
                        disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Confirm Delete"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
