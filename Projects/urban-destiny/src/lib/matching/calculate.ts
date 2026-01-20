/**
 * City Matching Algorithm
 *
 * Calculates match scores between user assessment responses and city metrics.
 *
 * Scoring dimensions:
 * - Career: industry presence, salary levels, job growth (tech_jobs, avg_salary)
 * - Lifestyle: climate match, size preference, amenities (restaurants_per_capita)
 * - Cost: budget fit with cost_index (rent_1br, cost_index)
 * - Happiness: safety, community, nature access (green_space_pct, happiness_index)
 */

import type { AssessmentResponse, DimensionScores } from '@/lib/database'
import type {
  UserCategoryScore,
  NormalizedUserScores,
  CityMatchResult,
  CityWithMetricsForMatching,
} from './types'

/**
 * Calculate weighted average scores per assessment category
 */
export function calculateCategoryScores(
  responses: AssessmentResponse[]
): Record<string, UserCategoryScore> {
  const categoryScores: Record<string, UserCategoryScore> = {}

  for (const response of responses) {
    const category = response.category
    if (!categoryScores[category]) {
      categoryScores[category] = { total: 0, count: 0, weightedTotal: 0, weightSum: 0 }
    }
    categoryScores[category].total += response.answer_value
    categoryScores[category].count += 1
    categoryScores[category].weightedTotal += response.answer_value * response.weight
    categoryScores[category].weightSum += response.weight
  }

  return categoryScores
}

/**
 * Normalize user scores from 1-5 scale to 0-100 scale
 */
export function normalizeUserScores(
  categoryScores: Record<string, UserCategoryScore>
): NormalizedUserScores {
  const normalized: NormalizedUserScores = {}

  for (const [category, data] of Object.entries(categoryScores)) {
    if (data.weightSum > 0) {
      // Use weighted average
      const avgScore = data.weightedTotal / data.weightSum
      // Convert 1-5 scale to 0-100
      const normalizedScore = ((avgScore - 1) / 4) * 100
      normalized[category as keyof NormalizedUserScores] = normalizedScore
    }
  }

  return normalized
}

/**
 * Calculate career score for a city
 * Factors: industry presence (tech_jobs), salary levels (avg_salary), career_score
 */
function calculateCareerScore(
  userScore: number,
  city: CityWithMetricsForMatching
): number {
  const techJobsMetric = city.metrics.find(m => m.metric_type === 'tech_jobs')
  const avgSalaryMetric = city.metrics.find(m => m.metric_type === 'avg_salary')

  // Base score from city's career_score
  const baseScore = 100 - Math.abs(city.career_score - userScore)

  // Bonus factors from metrics (normalized to 0-20 range for adjustment)
  let metricBonus = 0
  if (techJobsMetric) {
    // Normalize tech jobs: 0-350000 range to 0-10 bonus
    const techJobsNormalized = Math.min(techJobsMetric.value / 350000, 1) * 10
    metricBonus += techJobsNormalized
  }
  if (avgSalaryMetric) {
    // Normalize salary: $0-$120000 range to 0-10 bonus
    const salaryNormalized = Math.min(avgSalaryMetric.value / 120000, 1) * 10
    metricBonus += salaryNormalized
  }

  // Weight: 70% base score, 30% metric bonus (max 20 points)
  const finalScore = baseScore * 0.7 + metricBonus * 1.5

  return Math.min(100, Math.max(0, finalScore))
}

/**
 * Calculate lifestyle score for a city
 * Factors: climate match, amenities (restaurants_per_capita), lifestyle_score
 */
function calculateLifestyleScore(
  userScore: number,
  city: CityWithMetricsForMatching
): number {
  const restaurantsMetric = city.metrics.find(m => m.metric_type === 'restaurants_per_capita')

  // Base score from city's lifestyle_score
  const baseScore = 100 - Math.abs(city.lifestyle_score - userScore)

  // Bonus factors from metrics
  let metricBonus = 0
  if (restaurantsMetric) {
    // Normalize restaurants: 0-45 range to 0-10 bonus
    const restaurantsNormalized = Math.min(restaurantsMetric.value / 45, 1) * 10
    metricBonus += restaurantsNormalized
  }

  // Population size consideration (some prefer big cities, some prefer smaller)
  // Map user score to size preference: high score = prefers more amenities = larger cities
  const populationFactor = city.population / 10000000 // Normalize to 0-1 range for 10M max
  const sizePreference = userScore / 100 // 0-1 range
  // If user wants high lifestyle (lots of amenities), larger cities score better
  const sizeBonus = Math.abs(populationFactor - sizePreference) < 0.3 ? 5 : 0

  // Weight: 70% base score, 30% metric/size bonus
  const finalScore = baseScore * 0.7 + (metricBonus + sizeBonus) * 2

  return Math.min(100, Math.max(0, finalScore))
}

/**
 * Calculate cost score for a city
 * Factors: budget fit with cost_index, rent levels
 * Note: For cost, LOWER user score = more cost-sensitive = prefers lower cost cities
 */
function calculateCostScore(
  userScore: number,
  city: CityWithMetricsForMatching
): number {
  const rentMetric = city.metrics.find(m => m.metric_type === 'rent_1br')

  // Base score: inverse relationship for cost
  // If user has LOW cost tolerance (userScore low), they prefer LOW cost cities
  // If user has HIGH cost tolerance (userScore high), they're okay with HIGH cost cities
  const baseScore = 100 - Math.abs(city.cost_index - userScore)

  // Rent adjustment
  let rentAdjustment = 0
  if (rentMetric) {
    // Normalize rent: $500-$3500 range
    const rentNormalized = (rentMetric.value - 500) / 3000 * 100 // 0-100 scale
    // If user is cost-sensitive (low score), penalize high rent more
    const rentDiff = Math.abs(rentNormalized - userScore)
    rentAdjustment = (100 - rentDiff) * 0.3 // 0-30 adjustment
  }

  // Weight: 70% base score, 30% rent adjustment
  const finalScore = baseScore * 0.7 + rentAdjustment

  return Math.min(100, Math.max(0, finalScore))
}

/**
 * Calculate happiness score for a city
 * Factors: safety (happiness_index), community, nature access (green_space_pct)
 */
function calculateHappinessScore(
  userScore: number,
  city: CityWithMetricsForMatching
): number {
  const greenSpaceMetric = city.metrics.find(m => m.metric_type === 'green_space_pct')

  // Base score from city's happiness_index
  const baseScore = 100 - Math.abs(city.happiness_index - userScore)

  // Nature access bonus
  let naturBonus = 0
  if (greenSpaceMetric) {
    // Normalize green space: 0-50% range to 0-15 bonus
    const greenSpaceNormalized = Math.min(greenSpaceMetric.value / 50, 1) * 15
    // Apply based on user's happiness priority (high happiness = values nature more)
    naturBonus = greenSpaceNormalized * (userScore / 100)
  }

  // Weight: 75% base score, 25% nature bonus
  const finalScore = baseScore * 0.75 + naturBonus * 1.67

  return Math.min(100, Math.max(0, finalScore))
}

/**
 * Calculate dimension scores for a single city
 */
export function calculateDimensionScores(
  normalizedUserScores: NormalizedUserScores,
  city: CityWithMetricsForMatching
): DimensionScores {
  const scores: DimensionScores = {}

  if (normalizedUserScores.career !== undefined) {
    scores.career = calculateCareerScore(normalizedUserScores.career, city)
  }

  if (normalizedUserScores.lifestyle !== undefined) {
    scores.lifestyle = calculateLifestyleScore(normalizedUserScores.lifestyle, city)
  }

  if (normalizedUserScores.cost !== undefined) {
    scores.cost = calculateCostScore(normalizedUserScores.cost, city)
  }

  if (normalizedUserScores.happiness !== undefined) {
    scores.happiness = calculateHappinessScore(normalizedUserScores.happiness, city)
  }

  return scores
}

/**
 * Calculate overall weighted score from dimension scores
 * Uses equal weighting by default (25% each dimension)
 */
export function calculateOverallScore(dimensionScores: DimensionScores): number {
  const scores = Object.values(dimensionScores).filter(
    (score): score is number => score !== undefined
  )

  if (scores.length === 0) return 0

  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round((sum / scores.length) * 100) / 100
}

/**
 * Calculate match results for all cities
 */
export function calculateCityMatches(
  userId: string,
  responses: AssessmentResponse[],
  cities: CityWithMetricsForMatching[]
): CityMatchResult[] {
  // Step 1: Calculate category scores from responses
  const categoryScores = calculateCategoryScores(responses)

  // Step 2: Normalize to 0-100 scale
  const normalizedScores = normalizeUserScores(categoryScores)

  // Step 3: Calculate match for each city
  const matches: CityMatchResult[] = cities.map(city => {
    const dimensionScores = calculateDimensionScores(normalizedScores, city)
    const overallScore = calculateOverallScore(dimensionScores)

    return {
      user_id: userId,
      city_id: city.id,
      overall_score: overallScore,
      dimension_scores_json: dimensionScores,
    }
  })

  return matches
}

/**
 * Get top N matching cities sorted by overall score
 */
export function getTopMatches(
  matches: CityMatchResult[],
  limit: number = 10
): CityMatchResult[] {
  return [...matches]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, limit)
}
