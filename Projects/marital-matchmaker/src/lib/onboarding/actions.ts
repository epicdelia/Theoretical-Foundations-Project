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
