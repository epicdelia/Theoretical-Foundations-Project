'use server'

import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/database/types'

export interface SettingsActionResult {
  success: boolean
  error?: string
}

export interface GetUserProfileResult {
  success: boolean
  error?: string
  profile?: UserProfile | null
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(): Promise<GetUserProfileResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user profile:', fetchError)
    return {
      success: false,
      error: 'Failed to fetch profile',
    }
  }

  return {
    success: true,
    profile: profile ?? null,
  }
}

/**
 * Update user's current city
 */
export async function updateCurrentCity(city: string): Promise<SettingsActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        current_city: city || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating current city:', updateError)
      return {
        success: false,
        error: 'Failed to update current city',
      }
    }
  } else {
    // Create new profile
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        current_city: city || null,
        assessment_complete: false,
      })

    if (insertError) {
      console.error('Error creating profile:', insertError)
      return {
        success: false,
        error: 'Failed to create profile',
      }
    }
  }

  return { success: true }
}

/**
 * Clear assessment data and allow user to retake
 */
export async function clearAssessmentData(): Promise<SettingsActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  // Delete assessment responses
  const { error: responsesError } = await supabase
    .from('assessment_responses')
    .delete()
    .eq('user_id', user.id)

  if (responsesError) {
    console.error('Error deleting assessment responses:', responsesError)
    return {
      success: false,
      error: 'Failed to clear assessment data',
    }
  }

  // Delete city matches
  const { error: matchesError } = await supabase
    .from('city_matches')
    .delete()
    .eq('user_id', user.id)

  if (matchesError) {
    console.error('Error deleting city matches:', matchesError)
    return {
      success: false,
      error: 'Failed to clear city matches',
    }
  }

  // Update profile to mark assessment as incomplete
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      assessment_complete: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (profileError) {
    console.error('Error updating profile:', profileError)
    // Don't fail the whole operation if profile update fails
  }

  return { success: true }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(): Promise<SettingsActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  // Delete user data in order (respecting foreign key constraints)
  // 1. Delete saved cities
  await supabase
    .from('saved_cities')
    .delete()
    .eq('user_id', user.id)

  // 2. Delete city matches
  await supabase
    .from('city_matches')
    .delete()
    .eq('user_id', user.id)

  // 3. Delete assessment responses
  await supabase
    .from('assessment_responses')
    .delete()
    .eq('user_id', user.id)

  // 4. Delete user profile
  await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', user.id)

  // 5. Delete auth user (this requires admin privileges or RLS policy)
  // Note: In a production app, you would use Supabase Edge Functions
  // or have a proper admin API to handle user deletion.
  // For now, we just sign the user out after deleting their data.
  const { error: signOutError } = await supabase.auth.signOut()

  if (signOutError) {
    console.error('Error signing out after deletion:', signOutError)
  }

  return { success: true }
}

export interface EmailPreferences {
  city_alerts: boolean
}

export interface GetEmailPreferencesResult {
  success: boolean
  error?: string
  preferences?: EmailPreferences
}

/**
 * Get user's email preferences
 * Note: This is a placeholder for future implementation
 */
export async function getEmailPreferences(): Promise<GetEmailPreferencesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  // For now, return default preferences
  // In the future, this would fetch from a user_preferences table
  return {
    success: true,
    preferences: {
      city_alerts: false,
    },
  }
}

/**
 * Update user's email preferences
 * Note: This is a placeholder for future implementation
 */
export async function updateEmailPreferences(
  preferences: EmailPreferences
): Promise<SettingsActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  // Placeholder - in the future, this would update a user_preferences table
  console.log('Email preferences update requested:', preferences)

  return { success: true }
}
