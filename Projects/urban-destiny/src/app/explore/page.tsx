'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserMenu } from '@/components/auth'
import { useAuth } from '@/lib/auth'
import {
  getCities,
  getClimates,
  getContinents,
  type City,
  type CityFilters,
  type CitySort,
  type Continent,
  type PopulationSize,
  type CostLevel,
  type SortField,
  type SortOrder,
} from '@/lib/cities'
import { saveCity, unsaveCity, getSavedCityIds } from '@/lib/saved-cities'

const POPULATION_LABELS: Record<PopulationSize, string> = {
  small: 'Small (<500K)',
  medium: 'Medium (500K-2M)',
  large: 'Large (2M-10M)',
  mega: 'Mega (10M+)',
}

const COST_LABELS: Record<CostLevel, string> = {
  low: 'Low Cost',
  medium: 'Medium Cost',
  high: 'High Cost',
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'population', label: 'Population' },
  { field: 'cost_index', label: 'Cost Index' },
  { field: 'happiness_index', label: 'Happiness Index' },
]

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000) {
    return `${(pop / 1_000_000).toFixed(1)}M`
  }
  if (pop >= 1_000) {
    return `${(pop / 1_000).toFixed(0)}K`
  }
  return pop.toString()
}

function ExploreCityCard({
  city,
  isSaved,
  isLoggedIn,
  onSaveToggle,
}: {
  city: City
  isSaved: boolean
  isLoggedIn: boolean
  onSaveToggle: (cityId: string, saved: boolean) => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) return
    setSaving(true)
    try {
      if (isSaved) {
        await unsaveCity(city.id)
        onSaveToggle(city.id, false)
      } else {
        await saveCity(city.id)
        onSaveToggle(city.id, true)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Link href={`/city/${city.id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="relative h-32 w-full">
          {city.image_url ? (
            <Image
              src={city.image_url}
              alt={city.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-lg font-semibold text-white">{city.name}</h3>
            <p className="text-sm text-white/80">{city.country}</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 transition-colors hover:bg-white disabled:opacity-50"
              aria-label={isSaved ? 'Unsave city' : 'Save city'}
            >
              {isSaved ? (
                <svg
                  className="h-5 w-5 fill-red-500 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Population</span>
              <p className="font-medium">{formatPopulation(city.population)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cost Index</span>
              <p className="font-medium">{city.cost_index}/100</p>
            </div>
            <div>
              <span className="text-muted-foreground">Climate</span>
              <p className="font-medium truncate">{city.climate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Happiness</span>
              <p className="font-medium">{city.happiness_index}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (value: T | undefined) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? (e.target.value as T) : undefined)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ExplorePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [savedCities, setSavedCities] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState<Continent | undefined>()
  const [populationSize, setPopulationSize] = useState<PopulationSize | undefined>()
  const [costLevel, setCostLevel] = useState<CostLevel | undefined>()
  const [climate, setClimate] = useState<string | undefined>()

  // Sort state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Options for filters
  const [climateOptions, setClimateOptions] = useState<string[]>([])
  const [continentOptions, setContinentOptions] = useState<Continent[]>([])

  // Load filter options on mount
  useEffect(() => {
    const loadOptions = async () => {
      const [climatesResult, continentsResult] = await Promise.all([
        getClimates(),
        getContinents(),
      ])

      if (climatesResult.success && climatesResult.climates) {
        setClimateOptions(climatesResult.climates)
      }
      if (continentsResult.success && continentsResult.continents) {
        setContinentOptions(continentsResult.continents)
      }
    }
    loadOptions()
  }, [])

  // Load saved cities if user is logged in
  useEffect(() => {
    if (!user) return

    const loadSavedCities = async () => {
      const result = await getSavedCityIds()
      if (result.success && result.savedCityIds) {
        setSavedCities(new Set(result.savedCityIds))
      }
    }
    loadSavedCities()
  }, [user])

  // Track filter version to trigger data fetching
  const [filterVersion, setFilterVersion] = useState(0)

  // Load cities when filterVersion or page changes
  useEffect(() => {
    let cancelled = false

    const loadCities = async () => {
      setIsLoading(true)
      setError(null)

      const filters: CityFilters = {}
      if (search) filters.search = search
      if (continent) filters.continent = continent
      if (populationSize) filters.populationSize = populationSize
      if (costLevel) filters.costLevel = costLevel
      if (climate) filters.climate = climate

      const sort: CitySort = { field: sortField, order: sortOrder }

      const result = await getCities({
        filters,
        sort,
        page,
        pageSize: 12,
      })

      if (cancelled) return

      if (!result.success) {
        setError(result.error || 'Failed to load cities')
        setIsLoading(false)
        return
      }

      setCities(result.cities ?? [])
      setTotalPages(result.totalPages ?? 1)
      setTotalCount(result.totalCount ?? 0)
      setIsLoading(false)
    }

    loadCities()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVersion, page])

  // Helper to update filters and reset page
  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
    setFilterVersion((v) => v + 1)
  }

  // Trigger reload when page changes (without resetting page)
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setFilterVersion((v) => v + 1)
  }

  const loadCities = () => {
    setFilterVersion((v) => v + 1)
  }

  const handleSaveToggle = (cityId: string, saved: boolean) => {
    setSavedCities((prev) => {
      const next = new Set(prev)
      if (saved) {
        next.add(cityId)
      } else {
        next.delete(cityId)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setContinent(undefined)
    setPopulationSize(undefined)
    setCostLevel(undefined)
    setClimate(undefined)
    setSortField('name')
    setSortOrder('asc')
    setPage(1)
    setFilterVersion((v) => v + 1)
  }

  const hasActiveFilters = search || continent || populationSize || costLevel || climate

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Cities</h1>
          <p className="text-muted-foreground">
            Discover cities around the world
          </p>
        </div>
        {authLoading ? null : user ? (
          <UserMenu />
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>

      {/* CTA for Assessment */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Get Personalized Matches</CardTitle>
          <CardDescription>
            Take our quick assessment to find cities that match your lifestyle preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={user ? '/assessment/career' : '/signup'}>
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                />
              </svg>
              {user ? 'Take Assessment' : 'Get Started'}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search cities..."
            value={search}
            onChange={(e) => updateFilter(setSearch)(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          <FilterSelect
            label="Continent"
            value={continent}
            options={continentOptions.map((c) => ({ value: c, label: c }))}
            onChange={updateFilter(setContinent)}
            placeholder="All Continents"
          />
          <FilterSelect
            label="Population"
            value={populationSize}
            options={Object.entries(POPULATION_LABELS).map(([value, label]) => ({
              value: value as PopulationSize,
              label,
            }))}
            onChange={updateFilter(setPopulationSize)}
            placeholder="Any Size"
          />
          <FilterSelect
            label="Cost Level"
            value={costLevel}
            options={Object.entries(COST_LABELS).map(([value, label]) => ({
              value: value as CostLevel,
              label,
            }))}
            onChange={updateFilter(setCostLevel)}
            placeholder="Any Cost"
          />
          <FilterSelect
            label="Climate"
            value={climate}
            options={climateOptions.map((c) => ({ value: c, label: c }))}
            onChange={updateFilter(setClimate)}
            placeholder="Any Climate"
          />
          <FilterSelect
            label="Sort By"
            value={sortField}
            options={SORT_OPTIONS.map((opt) => ({
              value: opt.field,
              label: opt.label,
            }))}
            onChange={(v) => v && updateFilter(setSortField)(v)}
            placeholder="Name"
          />
        </div>

        {/* Sort Order and Clear */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateFilter(setSortOrder)(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {sortOrder === 'asc' ? (
                <>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                  Ascending
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                  Descending
                </>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Clear all filters
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'city' : 'cities'} found
          </p>
        </div>
      </div>

      {/* Cities Grid */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Error Loading Cities</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadCities}>Try Again</Button>
          </CardContent>
        </Card>
      ) : cities.length === 0 ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>No Cities Found</CardTitle>
            <CardDescription>
              Try adjusting your filters to see more results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cities.map((city) => (
              <ExploreCityCard
                key={city.id}
                city={city}
                isSaved={savedCities.has(city.id)}
                isLoggedIn={!!user}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
