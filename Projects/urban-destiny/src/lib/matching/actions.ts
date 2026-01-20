'use server'

/**
 * Server actions for city matching
 */

import { createClient } from '@/lib/supabase/server'
import { calculateCityMatches, getTopMatches } from './calculate'
import type { CityWithMetricsForMatching, TopCityMatch } from './types'

export interface CalculateMatchesResult {
  success: boolean
  error?: string
  topMatches?: TopCityMatch[]
}

/**
 * Calculate city matches for the authenticated user
 * - Fetches user's assessment responses
 * - Fetches all cities with their metrics
 * - Calculates match scores for each dimension
 * - Stores results in city_matches table
 * - Returns top 10 matching cities
 */
export async function calculateUserCityMatches(): Promise<CalculateMatchesResult> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to calculate matches',
    }
  }

  // Fetch user's assessment responses
  const { data: responses, error: responsesError } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('user_id', user.id)

  if (responsesError) {
    console.error('Error fetching responses:', responsesError)
    return {
      success: false,
      error: 'Failed to fetch your assessment responses',
    }
  }

  if (!responses || responses.length === 0) {
    return {
      success: false,
      error: 'No assessment responses found. Please complete the assessment first.',
    }
  }

  // Fetch all cities with their metrics
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select(`
      *,
      metrics:city_metrics(*)
    `)

  if (citiesError) {
    console.error('Error fetching cities:', citiesError)
    return {
      success: false,
      error: 'Failed to fetch cities',
    }
  }

  if (!cities || cities.length === 0) {
    return {
      success: false,
      error: 'No cities found in the database',
    }
  }

  // Calculate match scores
  const matches = calculateCityMatches(
    user.id,
    responses,
    cities as CityWithMetricsForMatching[]
  )

  // Delete existing matches for user
  const { error: deleteError } = await supabase
    .from('city_matches')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting old matches:', deleteError)
    // Continue anyway - we'll insert new matches
  }

  // Insert new matches
  const { error: insertError } = await supabase
    .from('city_matches')
    .insert(matches)

  if (insertError) {
    console.error('Error inserting matches:', insertError)
    return {
      success: false,
      error: 'Failed to save match results',
    }
  }

  // Mark assessment as complete
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ assessment_complete: true })
    .eq('user_id', user.id)

  if (profileError) {
    console.error('Error updating profile:', profileError)
    // Non-critical, continue
  }

  // Get top 10 matches with city details
  const topMatches = getTopMatches(matches, 10)

  // Create a map of city data
  const cityMap = new Map(cities.map(c => [c.id, c]))

  // Format response with city details
  const topMatchesWithDetails: TopCityMatch[] = topMatches.map(match => {
    const city = cityMap.get(match.city_id)!
    return {
      city_id: match.city_id,
      city_name: city.name,
      city_country: city.country,
      overall_score: match.overall_score,
      dimension_scores: match.dimension_scores_json,
      city_image_url: city.image_url,
      city_climate: city.climate,
      city_population: city.population,
    }
  })

  return {
    success: true,
    topMatches: topMatchesWithDetails,
  }
}

/**
 * Get the user's top matching cities from stored results
 */
export async function getStoredTopMatches(
  limit: number = 10
): Promise<CalculateMatchesResult> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to view matches',
    }
  }

  // Fetch stored matches with city data
  const { data: matches, error: matchesError } = await supabase
    .from('city_matches')
    .select(`
      *,
      city:cities(*)
    `)
    .eq('user_id', user.id)
    .order('overall_score', { ascending: false })
    .limit(limit)

  if (matchesError) {
    console.error('Error fetching matches:', matchesError)
    return {
      success: false,
      error: 'Failed to fetch your matches',
    }
  }

  if (!matches || matches.length === 0) {
    return {
      success: false,
      error: 'No matches found. Please complete the assessment first.',
    }
  }

  // Format response
  const topMatches: TopCityMatch[] = matches.map(match => ({
    city_id: match.city_id,
    city_name: match.city.name,
    city_country: match.city.country,
    overall_score: match.overall_score,
    dimension_scores: match.dimension_scores_json,
    city_image_url: match.city.image_url,
    city_climate: match.city.climate,
    city_population: match.city.population,
  }))

  return {
    success: true,
    topMatches,
  }
}
