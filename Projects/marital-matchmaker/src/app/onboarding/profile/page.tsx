"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { saveProfile } from "@/lib/onboarding/actions";
import { X, Upload, Camera } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const BIO_PROMPTS = [
  "What are you passionate about?",
  "What does your ideal weekend look like?",
  "What are you looking for in a partner?",
];

const MAX_PHOTOS = 6;
const MAX_BIO_LENGTH = 500;

interface PhotoItem {
  id: string;
  file?: File;
  url: string;
  isUploading?: boolean;
}

export default function ProfileCreationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    age: "",
    gender: "",
    location: "",
    bio: "",
  });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const validateAge = (age: string): string | null => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) {
      return "Please enter a valid age";
    }
    if (ageNum < 18) {
      return "You must be at least 18 years old";
    }
    if (ageNum > 120) {
      return "Please enter a valid age";
    }
    return null;
  };

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = MAX_PHOTOS - photos.length;
      if (remainingSlots <= 0) {
        setError(`You can only upload up to ${MAX_PHOTOS} photos`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const supabase = createClient();

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError("Please select only image files");
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError("Each photo must be less than 5MB");
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempUrl = URL.createObjectURL(file);

        // Add temporary photo while uploading
        setPhotos((prev) => [
          ...prev,
          { id: tempId, file, url: tempUrl, isUploading: true },
        ]);
        setUploadingCount((prev) => prev + 1);

        try {
          // Get user ID for folder structure
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setError("You must be logged in to upload photos");
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
            setError("Failed to upload photo. Please try again.");
            setPhotos((prev) => prev.filter((p) => p.id !== tempId));
            setUploadingCount((prev) => prev - 1);
            continue;
          }

          // Get the public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

          // Update the photo with the real URL
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === tempId
                ? { id: fileName, url: publicUrl, isUploading: false }
                : p
            )
          );
          setUploadingCount((prev) => prev - 1);

          // Clean up the temporary URL
          URL.revokeObjectURL(tempUrl);
        } catch {
          setError("Failed to upload photo. Please try again.");
          setPhotos((prev) => prev.filter((p) => p.id !== tempId));
          setUploadingCount((prev) => prev - 1);
        }
      }

      // Reset the file input
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

      // If it's a temporary photo (still uploading), just remove from state
      if (photo.id.startsWith("temp-")) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (photo.url.startsWith("blob:")) {
          URL.revokeObjectURL(photo.url);
        }
        return;
      }

      // Delete from Supabase Storage
      const supabase = createClient();
      const { error: deleteError } = await supabase.storage
        .from("profile-photos")
        .remove([photoId]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        setError("Failed to delete photo. Please try again.");
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    },
    [photos]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!formData.display_name.trim()) {
      setError("Please enter a display name");
      setIsLoading(false);
      return;
    }

    const ageError = validateAge(formData.age);
    if (ageError) {
      setError(ageError);
      setIsLoading(false);
      return;
    }

    if (!formData.gender) {
      setError("Please select your gender");
      setIsLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      setError("Please enter your location");
      setIsLoading(false);
      return;
    }

    // Check for at least 1 photo
    const uploadedPhotos = photos.filter(
      (p) => !p.isUploading && !p.id.startsWith("temp-")
    );
    if (uploadedPhotos.length === 0) {
      setError("Please upload at least 1 photo");
      setIsLoading(false);
      return;
    }

    // Wait for any pending uploads
    if (uploadingCount > 0) {
      setError("Please wait for all photos to finish uploading");
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.set("display_name", formData.display_name.trim());
    data.set("age", formData.age);
    data.set("gender", formData.gender);
    data.set("location", formData.location.trim());
    data.set("bio", formData.bio.trim());
    data.set(
      "photos",
      JSON.stringify(uploadedPhotos.map((p) => ({ id: p.id, url: p.url })))
    );

    const result = await saveProfile(data);

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/onboarding/quiz");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Create Your Profile
          </CardTitle>
          <CardDescription>
            Tell us about yourself. This information will be visible to
            potential matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                        disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-base font-medium">
                Display Name
              </Label>
              <Input
                id="display_name"
                type="text"
                placeholder="How should we call you?"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-medium">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Your age"
                value={formData.age}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, age: e.target.value }))
                }
                disabled={isLoading}
                min={18}
                max={120}
              />
              <p className="text-xs text-muted-foreground">
                You must be at least 18 years old
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Gender</Label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      formData.gender === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-medium">
                Location
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="City, State/Country"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                disabled={isLoading}
                maxLength={255}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">
                Bio{" "}
                <span className="text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell potential matches about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bio: e.target.value.slice(0, MAX_BIO_LENGTH),
                  }))
                }
                disabled={isLoading}
                className="min-h-[120px]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium">Need inspiration?</p>
                  <ul className="list-disc list-inside">
                    {BIO_PROMPTS.map((prompt, i) => (
                      <li key={i}>{prompt}</li>
                    ))}
                  </ul>
                </div>
                <span>
                  {formData.bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !formData.display_name ||
                !formData.age ||
                !formData.gender ||
                !formData.location ||
                photos.filter((p) => !p.isUploading && !p.id.startsWith("temp-"))
                  .length === 0 ||
                uploadingCount > 0
              }
            >
              {isLoading
                ? "Saving..."
                : uploadingCount > 0
                  ? "Uploading photos..."
                  : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
