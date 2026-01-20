"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateCompatibilityForUser } from "./index";

export async function triggerCompatibilityCalculation(): Promise<{
  success: boolean;
  matchesCalculated: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, matchesCalculated: 0, error: "Not authenticated" };
    }

    const matchesCalculated = await calculateCompatibilityForUser(user.id);

    return { success: true, matchesCalculated };
  } catch (error) {
    console.error("Error triggering compatibility calculation:", error);
    return {
      success: false,
      matchesCalculated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function recalculateAllCompatibility(): Promise<{
  success: boolean;
  totalCalculated: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get all users with complete profiles
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("user_id");

    if (!userProfiles || userProfiles.length === 0) {
      return { success: true, totalCalculated: 0 };
    }

    let totalCalculated = 0;

    for (const profile of userProfiles) {
      const calculated = await calculateCompatibilityForUser(profile.user_id);
      totalCalculated += calculated;
    }

    return { success: true, totalCalculated };
  } catch (error) {
    console.error("Error recalculating all compatibility:", error);
    return {
      success: false,
      totalCalculated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
