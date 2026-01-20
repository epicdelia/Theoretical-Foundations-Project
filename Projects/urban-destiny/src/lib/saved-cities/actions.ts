'use server'

/**
 * Server actions for saving/bookmarking cities
 */

import { createClient } from '@/lib/supabase/server'

export interface SaveCityResult {
  success: boolean
  error?: string
}

export interface GetSavedCitiesResult {
  success: boolean
  error?: string
  savedCityIds?: string[]
}

/**
 * Save/bookmark a city for the authenticated user
 */
export async function saveCity(cityId: string): Promise<SaveCityResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to save cities',
    }
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_cities')
    .select('id')
    .eq('user_id', user.id)
    .eq('city_id', cityId)
    .single()

  if (existing) {
    return {
      success: true, // Already saved, treat as success
    }
  }

  const { error: insertError } = await supabase
    .from('saved_cities')
    .insert({
      user_id: user.id,
      city_id: cityId,
    })

  if (insertError) {
    console.error('Error saving city:', insertError)
    return {
      success: false,
      error: 'Failed to save city',
    }
  }

  return { success: true }
}

/**
 * Remove a saved/bookmarked city for the authenticated user
 */
export async function unsaveCity(cityId: string): Promise<SaveCityResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to unsave cities',
    }
  }

  const { error: deleteError } = await supabase
    .from('saved_cities')
    .delete()
    .eq('user_id', user.id)
    .eq('city_id', cityId)

  if (deleteError) {
    console.error('Error unsaving city:', deleteError)
    return {
      success: false,
      error: 'Failed to unsave city',
    }
  }

  return { success: true }
}

/**
 * Get all saved city IDs for the authenticated user
 */
export async function getSavedCityIds(): Promise<GetSavedCitiesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to view saved cities',
    }
  }

  const { data: savedCities, error: fetchError } = await supabase
    .from('saved_cities')
    .select('city_id')
    .eq('user_id', user.id)

  if (fetchError) {
    console.error('Error fetching saved cities:', fetchError)
    return {
      success: false,
      error: 'Failed to fetch saved cities',
    }
  }

  return {
    success: true,
    savedCityIds: savedCities?.map(sc => sc.city_id) ?? [],
  }
}
