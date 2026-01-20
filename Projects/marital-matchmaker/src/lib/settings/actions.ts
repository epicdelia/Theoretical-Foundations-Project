"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsResult =
  | { success: true; message?: string }
  | { error: string };

export async function updateProfile(formData: FormData): Promise<SettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update your profile" };
  }

  const displayName = formData.get("display_name") as string;
  const location = formData.get("location") as string;
  const bio = formData.get("bio") as string;
  const photosStr = formData.get("photos") as string;

  if (!displayName?.trim()) {
    return { error: "Display name is required" };
  }

  if (!location?.trim()) {
    return { error: "Location is required" };
  }

  let photos: Array<{ id: string; url: string }> = [];
  try {
    photos = JSON.parse(photosStr || "[]");
  } catch {
    return { error: "Invalid photo data" };
  }

  if (photos.length === 0) {
    return { error: "At least 1 photo is required" };
  }

  if (bio && bio.length > 500) {
    return { error: "Bio must be 500 characters or less" };
  }

  const { error: updateError } = await supabase
    .from("users_extended")
    .update({
      display_name: displayName.trim(),
      location: location.trim(),
      bio: bio?.trim() || null,
      photos_json: photos,
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Profile update error:", updateError);
    return { error: "Failed to save profile. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated successfully" };
}

export async function updatePreferences(formData: FormData): Promise<SettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update preferences" };
  }

  const minAgeStr = formData.get("min_age") as string;
  const maxAgeStr = formData.get("max_age") as string;
  const preferredLocation = formData.get("preferred_location") as string;
  const dealbreakersStr = formData.get("dealbreakers") as string;

  const minAge = parseInt(minAgeStr, 10);
  const maxAge = parseInt(maxAgeStr, 10);

  if (isNaN(minAge) || minAge < 18 || minAge > 80) {
    return { error: "Minimum age must be between 18 and 80" };
  }

  if (isNaN(maxAge) || maxAge < 18 || maxAge > 80) {
    return { error: "Maximum age must be between 18 and 80" };
  }

  if (minAge > maxAge) {
    return { error: "Minimum age cannot be greater than maximum age" };
  }

  let dealbreakers: string[] = [];
  try {
    dealbreakers = JSON.parse(dealbreakersStr || "[]");
  } catch {
    return { error: "Invalid dealbreakers data" };
  }

  const { error: upsertError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        min_age: minAge,
        max_age: maxAge,
        preferred_location: preferredLocation || null,
        dealbreakers_json: dealbreakers,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("Preferences upsert error:", upsertError);
    return { error: "Failed to save preferences. Please try again." };
  }

  revalidatePath("/settings");
  return { success: true, message: "Preferences updated successfully" };
}

export async function changePassword(formData: FormData): Promise<SettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to change your password" };
  }

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Password update error:", updateError);
    return { error: "Failed to update password. Please try again." };
  }

  return { success: true, message: "Password changed successfully" };
}

export async function deleteAccount(): Promise<SettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete your account" };
  }

  // Delete user data from all tables in order to handle foreign key constraints
  // Delete messages first
  await supabase.from("messages").delete().eq("sender_id", user.id);

  // Delete likes
  await supabase.from("likes").delete().eq("from_user_id", user.id);
  await supabase.from("likes").delete().eq("to_user_id", user.id);

  // Delete blocks
  await supabase.from("blocks").delete().eq("blocker_id", user.id);
  await supabase.from("blocks").delete().eq("blocked_id", user.id);

  // Delete matches
  await supabase.from("matches").delete().eq("user1_id", user.id);
  await supabase.from("matches").delete().eq("user2_id", user.id);

  // Delete quiz responses
  await supabase.from("compatibility_quiz_responses").delete().eq("user_id", user.id);

  // Delete preferences
  await supabase.from("user_preferences").delete().eq("user_id", user.id);

  // Delete intent responses
  await supabase.from("intent_responses").delete().eq("user_id", user.id);

  // Delete user extended profile
  await supabase.from("users_extended").delete().eq("user_id", user.id);

  // Delete profile photos from storage
  const { data: files } = await supabase.storage
    .from("profile-photos")
    .list(user.id);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("profile-photos").remove(filePaths);
  }

  // Sign out the user (the auth user deletion would need admin access)
  await supabase.auth.signOut();

  return { success: true, message: "Account deleted successfully" };
}

export async function clearQuizResponses(): Promise<SettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to retake the quiz" };
  }

  // Delete all quiz responses for this user
  const { error } = await supabase
    .from("compatibility_quiz_responses")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error clearing quiz responses:", error);
    return { error: "Failed to clear quiz responses. Please try again." };
  }

  // Also delete any existing matches so they can be recalculated
  await supabase.from("matches").delete().eq("user1_id", user.id);
  await supabase.from("matches").delete().eq("user2_id", user.id);

  return { success: true };
}

export async function getUserSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
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

  return {
    user,
    profile: profileResult.data,
    preferences: preferencesResult.data,
  };
}
