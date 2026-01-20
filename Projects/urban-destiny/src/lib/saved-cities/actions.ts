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

export interface SavedCityWithDetails {
  id: string
  city_id: string
  notes: string | null
  created_at: string
  city_name: string
  city_country: string
  city_image_url: string | null
  city_climate: string
  city_population: number
  overall_score: number | null
  dimension_scores: {
    career?: number
    lifestyle?: number
    cost?: number
    happiness?: number
  } | null
}

export interface GetSavedCitiesWithDetailsResult {
  success: boolean
  error?: string
  savedCities?: SavedCityWithDetails[]
  lastAssessmentDate?: string | null
}

/**
 * Get all saved cities with full details including match scores
 */
export async function getSavedCitiesWithDetails(): Promise<GetSavedCitiesWithDetailsResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to view saved cities',
    }
  }

  // Fetch saved cities with city details
  const { data: savedCities, error: fetchError } = await supabase
    .from('saved_cities')
    .select(`
      id,
      city_id,
      notes,
      created_at,
      city:cities!inner(name, country, image_url, climate, population)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching saved cities:', fetchError)
    return {
      success: false,
      error: 'Failed to fetch saved cities',
    }
  }

  // Fetch match scores for these cities
  const cityIds = savedCities?.map(sc => sc.city_id) ?? []

  const matchScoresMap = new Map<string, { overall_score: number; dimension_scores: Record<string, number> }>()
  let lastAssessmentDate: string | null = null

  if (cityIds.length > 0) {
    const { data: matches } = await supabase
      .from('city_matches')
      .select('city_id, overall_score, dimension_scores_json, created_at')
      .eq('user_id', user.id)
      .in('city_id', cityIds)

    if (matches) {
      matches.forEach(match => {
        matchScoresMap.set(match.city_id, {
          overall_score: match.overall_score,
          dimension_scores: match.dimension_scores_json ?? {},
        })
      })
    }

    // Get last assessment date from the most recent match
    const { data: latestMatch } = await supabase
      .from('city_matches')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestMatch) {
      lastAssessmentDate = latestMatch.created_at
    }
  }

  const formattedCities: SavedCityWithDetails[] = (savedCities ?? []).map(sc => {
    const matchData = matchScoresMap.get(sc.city_id)
    // Type assertion needed because Supabase returns single relation as object but types it as array
    const city = sc.city as unknown as { name: string; country: string; image_url: string | null; climate: string; population: number }
    return {
      id: sc.id,
      city_id: sc.city_id,
      notes: sc.notes,
      created_at: sc.created_at,
      city_name: city.name,
      city_country: city.country,
      city_image_url: city.image_url,
      city_climate: city.climate,
      city_population: city.population,
      overall_score: matchData?.overall_score ?? null,
      dimension_scores: matchData?.dimension_scores ?? null,
    }
  })

  return {
    success: true,
    savedCities: formattedCities,
    lastAssessmentDate,
  }
}

export interface UpdateNotesResult {
  success: boolean
  error?: string
}

/**
 * Update notes for a saved city
 */
export async function updateSavedCityNotes(
  savedCityId: string,
  notes: string
): Promise<UpdateNotesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to update notes',
    }
  }

  const { error: updateError } = await supabase
    .from('saved_cities')
    .update({ notes })
    .eq('id', savedCityId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating notes:', updateError)
    return {
      success: false,
      error: 'Failed to update notes',
    }
  }

  return { success: true }
}

/**
 * Get last assessment date for the user
 */
export async function getLastAssessmentDate(): Promise<{ success: boolean; date?: string | null; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    }
  }

  const { data: latestMatch } = await supabase
    .from('city_matches')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    success: true,
    date: latestMatch?.created_at ?? null,
  }
}
