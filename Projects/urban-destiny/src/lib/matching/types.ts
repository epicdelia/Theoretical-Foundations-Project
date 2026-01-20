/**
 * Types for the city matching algorithm
 */

import type { City, CityMetric, AssessmentResponse, DimensionScores } from '@/lib/database'

export interface UserCategoryScore {
  total: number
  count: number
  weightedTotal: number
  weightSum: number
}

export interface NormalizedUserScores {
  career?: number
  lifestyle?: number
  cost?: number
  happiness?: number
}

export interface CityMatchResult {
  user_id: string
  city_id: string
  overall_score: number
  dimension_scores_json: DimensionScores
}

export interface CityWithMetricsForMatching extends City {
  metrics: CityMetric[]
}

export interface MatchingInput {
  userId: string
  responses: AssessmentResponse[]
  cities: CityWithMetricsForMatching[]
}

export interface TopCityMatch {
  city_id: string
  city_name: string
  city_country: string
  overall_score: number
  dimension_scores: DimensionScores
  city_image_url: string | null
  city_climate: string
  city_population: number
}
