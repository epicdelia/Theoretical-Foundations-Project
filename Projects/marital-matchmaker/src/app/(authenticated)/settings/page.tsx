"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Settings,
  Shield,
  ArrowLeft,
  X,
  Upload,
  Camera,
  Loader2,
  Check,
  LogOut,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  updateProfile,
  updatePreferences,
  changePassword,
  deleteAccount,
  clearQuizResponses,
} from "@/lib/settings/actions";
import { signOut } from "@/lib/auth/actions";

type TabType = "profile" | "preferences" | "account";

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

const MAX_PHOTOS = 6;
const MAX_BIO_LENGTH = 500;

interface PhotoItem {
  id: string;
  url: string;
  isUploading?: boolean;
}

interface ProfileData {
  display_name: string;
  location: string;
  bio: string;
}

interface PreferencesData {
  min_age: number;
  max_age: number;
  preferred_location: string;
  dealbreakers: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);

  // Profile data
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: "",
    location: "",
    bio: "",
  });

  // Preferences data
  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    min_age: 25,
    max_age: 40,
    preferred_location: "same_region",
    dealbreakers: [],
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [profileResult, preferencesResult] = await Promise.all([
        supabase
          .from("users_extended")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (profileResult.data) {
        setProfileData({
          display_name: profileResult.data.display_name || "",
          location: profileResult.data.location || "",
          bio: profileResult.data.bio || "",
        });
        const photosJson = profileResult.data.photos_json as
          | { id: string; url: string }[]
          | null;
        if (photosJson && Array.isArray(photosJson)) {
          setPhotos(photosJson.map((p) => ({ id: p.id, url: p.url })));
        }
      }

      if (preferencesResult.data) {
        const dealbreakersJson = preferencesResult.data.dealbreakers_json as
          | string[]
          | null;
        setPreferencesData({
          min_age: preferencesResult.data.min_age || 25,
          max_age: preferencesResult.data.max_age || 40,
          preferred_location:
            preferencesResult.data.preferred_location || "same_region",
          dealbreakers: dealbreakersJson || [],
        });
      }

      setIsLoading(false);
    }

    loadUserData();
  }, [router]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = MAX_PHOTOS - photos.length;
      if (remainingSlots <= 0) {
        setToast({
          type: "error",
          message: `You can only upload up to ${MAX_PHOTOS} photos`,
        });
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const supabase = createClient();

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          setToast({ type: "error", message: "Please select only image files" });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setToast({
            type: "error",
            message: "Each photo must be less than 5MB",
          });
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempUrl = URL.createObjectURL(file);

        setPhotos((prev) => [
          ...prev,
          { id: tempId, url: tempUrl, isUploading: true },
        ]);
        setUploadingCount((prev) => prev + 1);

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setToast({
              type: "error",
              message: "You must be logged in to upload photos",
            });
            setPhotos((prev) => prev.filter((p) => p.id !== tempId));
            setUploadingCount((prev) => prev - 1);
            continue;
          }

          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("profile-photos")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            setToast({
              type: "error",
              message: "Failed to upload photo. Please try again.",
            });
            setPhotos((prev) => prev.filter((p) => p.id !== tempId));
            setUploadingCount((prev) => prev - 1);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === tempId
                ? { id: fileName, url: publicUrl, isUploading: false }
                : p
            )
          );
          setUploadingCount((prev) => prev - 1);
          URL.revokeObjectURL(tempUrl);
        } catch {
          setToast({
            type: "error",
            message: "Failed to upload photo. Please try again.",
          });
          setPhotos((prev) => prev.filter((p) => p.id !== tempId));
          setUploadingCount((prev) => prev - 1);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [photos.length]
  );

  const handleRemovePhoto = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      if (photo.id.startsWith("temp-")) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (photo.url.startsWith("blob:")) {
          URL.revokeObjectURL(photo.url);
        }
        return;
      }

      const supabase = createClient();
      const { error: deleteError } = await supabase.storage
        .from("profile-photos")
        .remove([photoId]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        setToast({
          type: "error",
          message: "Failed to delete photo. Please try again.",
        });
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    },
    [photos]
  );

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const uploadedPhotos = photos.filter(
      (p) => !p.isUploading && !p.id.startsWith("temp-")
    );

    const formData = new FormData();
    formData.set("display_name", profileData.display_name);
    formData.set("location", profileData.location);
    formData.set("bio", profileData.bio);
    formData.set(
      "photos",
      JSON.stringify(uploadedPhotos.map((p) => ({ id: p.id, url: p.url })))
    );

    const result = await updateProfile(formData);
    setIsSaving(false);

    if ("error" in result) {
      setToast({ type: "error", message: result.error });
    } else {
      setToast({ type: "success", message: result.message || "Profile saved" });
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.set("min_age", preferencesData.min_age.toString());
    formData.set("max_age", preferencesData.max_age.toString());
    formData.set("preferred_location", preferencesData.preferred_location);
    formData.set("dealbreakers", JSON.stringify(preferencesData.dealbreakers));

    const result = await updatePreferences(formData);
    setIsSaving(false);

    if ("error" in result) {
      setToast({ type: "error", message: result.error });
    } else {
      setToast({
        type: "success",
        message: result.message || "Preferences saved",
      });
    }
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.set("new_password", passwordData.new_password);
    formData.set("confirm_password", passwordData.confirm_password);

    const result = await changePassword(formData);
    setIsSaving(false);

    if ("error" in result) {
      setToast({ type: "error", message: result.error });
    } else {
      setToast({
        type: "success",
        message: result.message || "Password changed",
      });
      setPasswordData({ new_password: "", confirm_password: "" });
    }
  };

  const handleRetakeQuiz = async () => {
    setIsSaving(true);
    const result = await clearQuizResponses();
    setIsSaving(false);

    if ("error" in result) {
      setToast({ type: "error", message: result.error });
    } else {
      router.push("/onboarding/quiz/values");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsSaving(true);
    const result = await deleteAccount();

    if ("error" in result) {
      setIsSaving(false);
      setToast({ type: "error", message: result.error });
    } else {
      router.push("/login");
    }
  };

  const handleMinAgeChange = (value: number) => {
    setPreferencesData((prev) => ({
      ...prev,
      min_age: value,
      max_age: value > prev.max_age ? value : prev.max_age,
    }));
  };

  const handleMaxAgeChange = (value: number) => {
    setPreferencesData((prev) => ({
      ...prev,
      max_age: value,
      min_age: value < prev.min_age ? value : prev.min_age,
    }));
  };

  const handleDealbreakersToggle = (value: string) => {
    setPreferencesData((prev) => ({
      ...prev,
      dealbreakers: prev.dealbreakers.includes(value)
        ? prev.dealbreakers.filter((v) => v !== value)
        : [...prev.dealbreakers, value],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "preferences" as const, label: "Preferences", icon: Settings },
    { id: "account" as const, label: "Account", icon: Shield },
  ];

  return (
    <div className="py-12">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your profile information visible to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo Upload Section */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Photos{" "}
                    <span className="text-muted-foreground font-normal">
                      (At least 1 required, up to {MAX_PHOTOS})
                    </span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-input bg-muted"
                      >
                        <Image
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          fill
                          className={`object-cover ${photo.isUploading ? "opacity-50" : ""}`}
                        />
                        {photo.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        )}
                        {!photo.isUploading && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-input hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                        disabled={isSaving}
                      >
                        {photos.length === 0 ? (
                          <>
                            <Camera className="h-8 w-8" />
                            <span className="text-xs">Add Photo</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">Add More</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                    disabled={isSaving}
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profileData.display_name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        display_name: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    maxLength={100}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State/Country"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    maxLength={255}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell potential matches about yourself..."
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        bio: e.target.value.slice(0, MAX_BIO_LENGTH),
                      }))
                    }
                    disabled={isSaving}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {profileData.bio.length}/{MAX_BIO_LENGTH}
                  </p>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || uploadingCount > 0}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : uploadingCount > 0 ? (
                    "Uploading photos..."
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle>Partner Preferences</CardTitle>
                <CardDescription>
                  Update what you&apos;re looking for in a partner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Range */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Preferred Age Range
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="min-age"
                          className="text-sm text-muted-foreground"
                        >
                          Minimum Age
                        </Label>
                        <div className="flex items-center gap-3 mt-1">
                          <input
                            id="min-age"
                            type="range"
                            min={18}
                            max={80}
                            value={preferencesData.min_age}
                            onChange={(e) =>
                              handleMinAgeChange(Number(e.target.value))
                            }
                            disabled={isSaving}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="text-sm font-medium w-8 text-center">
                            {preferencesData.min_age}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="max-age"
                          className="text-sm text-muted-foreground"
                        >
                          Maximum Age
                        </Label>
                        <div className="flex items-center gap-3 mt-1">
                          <input
                            id="max-age"
                            type="range"
                            min={18}
                            max={80}
                            value={preferencesData.max_age}
                            onChange={(e) =>
                              handleMaxAgeChange(Number(e.target.value))
                            }
                            disabled={isSaving}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="text-sm font-medium w-8 text-center">
                            {preferencesData.max_age}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Looking for ages {preferencesData.min_age} -{" "}
                      {preferencesData.max_age}
                    </p>
                  </div>
                </div>

                {/* Location Preference */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Location Preference
                  </Label>
                  <div className="grid gap-2">
                    {LOCATION_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                          preferencesData.preferred_location === option.value
                            ? "border-primary bg-primary/5"
                            : "border-input"
                        }`}
                      >
                        <input
                          type="radio"
                          name="location_preference"
                          value={option.value}
                          checked={
                            preferencesData.preferred_location === option.value
                          }
                          onChange={(e) =>
                            setPreferencesData((prev) => ({
                              ...prev,
                              preferred_location: e.target.value,
                            }))
                          }
                          className="sr-only"
                          disabled={isSaving}
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
                          preferencesData.dealbreakers.includes(option.value)
                            ? "border-primary bg-primary/5"
                            : "border-input"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferencesData.dealbreakers.includes(
                            option.value
                          )}
                          onChange={() => handleDealbreakersToggle(option.value)}
                          className="sr-only"
                          disabled={isSaving}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>

                {/* Retake Quiz */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Retake Compatibility Quiz</h4>
                      <p className="text-sm text-muted-foreground">
                        Start fresh and retake the compatibility quiz
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRetakeQuiz}
                      disabled={isSaving}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retake Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          new_password: e.target.value,
                        }))
                      }
                      disabled={isSaving}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      disabled={isSaving}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isSaving ||
                      !passwordData.new_password ||
                      !passwordData.confirm_password
                    }
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
                  <CardTitle>Sign Out</CardTitle>
                  <CardDescription>
                    Sign out of your account on this device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={signOut}>
                    <Button variant="outline" type="submit" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                This action cannot be undone. All your data, matches, and
                conversations will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete_confirm">
                  Type <span className="font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="delete_confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
