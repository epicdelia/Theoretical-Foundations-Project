'use server'

/**
 * Server actions for browsing/exploring cities
 */

import { createClient } from '@/lib/supabase/server'
import type { City } from '@/lib/database/types'

export type { City } from '@/lib/database/types'

export type SortField = 'name' | 'population' | 'cost_index' | 'happiness_index'
export type SortOrder = 'asc' | 'desc'
export type PopulationSize = 'small' | 'medium' | 'large' | 'mega'
export type CostLevel = 'low' | 'medium' | 'high'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania'

export interface CityFilters {
  search?: string
  continent?: Continent
  populationSize?: PopulationSize
  costLevel?: CostLevel
  climate?: string
}

export interface CitySort {
  field: SortField
  order: SortOrder
}

export interface GetCitiesParams {
  filters?: CityFilters
  sort?: CitySort
  page?: number
  pageSize?: number
}

export interface GetCitiesResult {
  success: boolean
  error?: string
  cities?: City[]
  totalCount?: number
  totalPages?: number
  currentPage?: number
}

// Map countries to continents
const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  // Africa
  'Egypt': 'Africa',
  'South Africa': 'Africa',
  'Kenya': 'Africa',
  'Nigeria': 'Africa',
  'Morocco': 'Africa',
  // Asia
  'Japan': 'Asia',
  'China': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Singapore': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Malaysia': 'Asia',
  'Indonesia': 'Asia',
  'Philippines': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'UAE': 'Asia',
  'Israel': 'Asia',
  // Europe
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'Germany': 'Europe',
  'France': 'Europe',
  'Spain': 'Europe',
  'Italy': 'Europe',
  'Netherlands': 'Europe',
  'Portugal': 'Europe',
  'Sweden': 'Europe',
  'Denmark': 'Europe',
  'Norway': 'Europe',
  'Finland': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Belgium': 'Europe',
  'Ireland': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Greece': 'Europe',
  'Hungary': 'Europe',
  'Romania': 'Europe',
  'Croatia': 'Europe',
  'Estonia': 'Europe',
  // North America
  'USA': 'North America',
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  // South America
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
}

// Population size thresholds
const POPULATION_THRESHOLDS = {
  small: { min: 0, max: 500_000 },
  medium: { min: 500_000, max: 2_000_000 },
  large: { min: 2_000_000, max: 10_000_000 },
  mega: { min: 10_000_000, max: Infinity },
}

// Cost level thresholds (based on cost_index 0-100)
const COST_THRESHOLDS = {
  low: { min: 0, max: 40 },
  medium: { min: 40, max: 70 },
  high: { min: 70, max: 100 },
}

/**
 * Get all cities with optional filtering, sorting, and pagination
 */
export async function getCities(params: GetCitiesParams = {}): Promise<GetCitiesResult> {
  const supabase = await createClient()

  const {
    filters = {},
    sort = { field: 'name', order: 'asc' },
    page = 1,
    pageSize = 12,
  } = params

  // Build base query
  let query = supabase.from('cities').select('*', { count: 'exact' })

  // Apply search filter
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  // Apply climate filter
  if (filters.climate) {
    query = query.eq('climate', filters.climate)
  }

  // Apply population size filter
  if (filters.populationSize) {
    const threshold = POPULATION_THRESHOLDS[filters.populationSize]
    query = query.gte('population', threshold.min)
    if (threshold.max !== Infinity) {
      query = query.lt('population', threshold.max)
    }
  }

  // Apply cost level filter
  if (filters.costLevel) {
    const threshold = COST_THRESHOLDS[filters.costLevel]
    query = query.gte('cost_index', threshold.min).lt('cost_index', threshold.max)
  }

  // Apply sorting
  query = query.order(sort.field, { ascending: sort.order === 'asc' })

  // Apply pagination
  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data: cities, error, count } = await query

  if (error) {
    console.error('Error fetching cities:', error)
    return {
      success: false,
      error: 'Failed to fetch cities',
    }
  }

  // Filter by continent (must be done post-query since it's based on country mapping)
  let filteredCities = cities ?? []
  if (filters.continent) {
    filteredCities = filteredCities.filter(city => {
      const continent = COUNTRY_TO_CONTINENT[city.country]
      return continent === filters.continent
    })
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    success: true,
    cities: filteredCities,
    totalCount,
    totalPages,
    currentPage: page,
  }
}

/**
 * Get unique climate types from all cities
 */
export async function getClimates(): Promise<{ success: boolean; climates?: string[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cities')
    .select('climate')

  if (error) {
    console.error('Error fetching climates:', error)
    return {
      success: false,
      error: 'Failed to fetch climate types',
    }
  }

  const uniqueClimates = [...new Set(data?.map(city => city.climate) ?? [])].sort()

  return {
    success: true,
    climates: uniqueClimates,
  }
}

/**
 * Get all available continents from cities
 */
export async function getContinents(): Promise<{ success: boolean; continents?: Continent[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cities')
    .select('country')

  if (error) {
    console.error('Error fetching countries:', error)
    return {
      success: false,
      error: 'Failed to fetch continents',
    }
  }

  const uniqueContinents = [...new Set(
    data?.map(city => COUNTRY_TO_CONTINENT[city.country]).filter(Boolean) ?? []
  )].sort() as Continent[]

  return {
    success: true,
    continents: uniqueContinents,
  }
}
