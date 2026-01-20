"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveIntentResponses(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to complete the questionnaire" };
  }

  const marriageTimeline = formData.get("marriage_timeline") as string;
  const relationshipHistory = formData.get("relationship_history") as string;
  const whatSeeking = formData.get("what_seeking") as string;
  const marriageMeaning = formData.get("marriage_meaning") as string;

  if (!marriageTimeline || !relationshipHistory || !whatSeeking) {
    return { error: "Please answer all required questions" };
  }

  // Save intent responses (upsert in case user is re-doing the flow)
  const { error: insertError } = await supabase
    .from("intent_responses")
    .upsert(
      {
        user_id: user.id,
        marriage_timeline: marriageTimeline,
        relationship_history: relationshipHistory,
        what_seeking: whatSeeking,
        marriage_meaning: marriageMeaning || null,
      },
      { onConflict: "user_id" }
    );

  if (insertError) {
    return { error: "Failed to save your responses. Please try again." };
  }

  // Check if user already has a users_extended record
  const { data: existingProfile } = await supabase
    .from("users_extended")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingProfile) {
    // Update existing record
    const { error: updateError } = await supabase
      .from("users_extended")
      .update({ intent_verified: true })
      .eq("user_id", user.id);

    if (updateError) {
      return { error: "Failed to verify intent. Please try again." };
    }
  } else {
    // Create new users_extended record with intent_verified
    const { error: createError } = await supabase
      .from("users_extended")
      .insert({
        user_id: user.id,
        display_name: user.email?.split("@")[0] || "User",
        intent_verified: true,
      });

    if (createError) {
      return { error: "Failed to create profile. Please try again." };
    }
  }

  return { success: true };
}

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a profile" };
  }

  const displayName = formData.get("display_name") as string;
  const ageStr = formData.get("age") as string;
  const gender = formData.get("gender") as string;
  const location = formData.get("location") as string;
  const bio = formData.get("bio") as string;
  const photosStr = formData.get("photos") as string;

  // Validate required fields
  if (!displayName?.trim()) {
    return { error: "Display name is required" };
  }

  const age = parseInt(ageStr, 10);
  if (isNaN(age) || age < 18 || age > 120) {
    return { error: "Please enter a valid age (18-120)" };
  }

  if (!gender) {
    return { error: "Gender selection is required" };
  }

  if (!location?.trim()) {
    return { error: "Location is required" };
  }

  // Parse and validate photos
  let photos: Array<{ id: string; url: string }> = [];
  try {
    photos = JSON.parse(photosStr || "[]");
  } catch {
    return { error: "Invalid photo data" };
  }

  if (photos.length === 0) {
    return { error: "At least 1 photo is required" };
  }

  // Validate bio length
  if (bio && bio.length > 500) {
    return { error: "Bio must be 500 characters or less" };
  }

  // Update the users_extended record
  const { error: updateError } = await supabase
    .from("users_extended")
    .update({
      display_name: displayName.trim(),
      age,
      gender,
      location: location.trim(),
      bio: bio?.trim() || null,
      photos_json: photos,
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Profile update error:", updateError);
    return { error: "Failed to save profile. Please try again." };
  }

  return { success: true };
}
