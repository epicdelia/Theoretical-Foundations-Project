'use client'

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UserMenu } from '@/components/auth'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import type { City, CityMatch, CityMetric, DimensionScores } from '@/lib/database'

function parseInitialCityIds(searchParams: URLSearchParams): [string, string] {
  const citiesParam = searchParams.get('cities')
  if (citiesParam) {
    const cityIds = citiesParam.split(',').filter(Boolean)
    return [cityIds[0] || '', cityIds[1] || '']
  }
  return ['', '']
}

const DIMENSION_LABELS: Record<string, string> = {
  career: 'Career',
  lifestyle: 'Lifestyle',
  cost: 'Cost',
  happiness: 'Happiness',
}

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  career: 'Job market, salary levels, industry presence',
  lifestyle: 'Amenities, entertainment, city size fit',
  cost: 'Budget alignment, rent, living expenses',
  happiness: 'Safety, green spaces, quality of life',
}

const DIMENSION_COLORS: Record<string, string> = {
  career: 'bg-blue-500',
  lifestyle: 'bg-purple-500',
  cost: 'bg-green-500',
  happiness: 'bg-yellow-500',
}

interface CityWithMatchAndMetrics extends City {
  match?: CityMatch
  metrics?: CityMetric[]
}

interface CitySelectOption {
  id: string
  name: string
  country: string
  image_url: string | null
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Parse initial city IDs from URL using useMemo to avoid re-computation
  const initialCityIds = useMemo(() => parseInitialCityIds(searchParams), [searchParams])

  const [allCities, setAllCities] = useState<CitySelectOption[]>([])
  const [city1, setCity1] = useState<CityWithMatchAndMetrics | null>(null)
  const [city2, setCity2] = useState<CityWithMatchAndMetrics | null>(null)
  const [selectedCity1Id, setSelectedCity1Id] = useState<string>(initialCityIds[0])
  const [selectedCity2Id, setSelectedCity2Id] = useState<string>(initialCityIds[1])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDropdown1, setShowDropdown1] = useState(false)
  const [showDropdown2, setShowDropdown2] = useState(false)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')

  // Load all cities for selection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    const loadCities = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, country, image_url')
        .order('name')

      if (citiesError) {
        setError('Failed to load cities')
        setIsLoading(false)
        return
      }

      setAllCities(cities || [])
      setIsLoading(false)
    }

    loadCities()
  }, [user, authLoading, router])

  // Load city details when selection changes
  const loadCityDetails = useCallback(async (cityId: string, setCityFn: (city: CityWithMatchAndMetrics | null) => void) => {
    if (!cityId || !user) {
      setCityFn(null)
      return
    }

    const supabase = createClient()

    // Fetch city data
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !cityData) {
      setCityFn(null)
      return
    }

    // Fetch city metrics
    const { data: metricsData } = await supabase
      .from('city_metrics')
      .select('*')
      .eq('city_id', cityId)

    // Fetch user's match for this city
    const { data: matchData } = await supabase
      .from('city_matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('city_id', cityId)
      .single()

    setCityFn({
      ...cityData,
      match: matchData || undefined,
      metrics: metricsData || undefined,
    })
  }, [user])

  useEffect(() => {
    loadCityDetails(selectedCity1Id, setCity1)
  }, [selectedCity1Id, loadCityDetails])

  useEffect(() => {
    loadCityDetails(selectedCity2Id, setCity2)
  }, [selectedCity2Id, loadCityDetails])

  // Update URL when cities change
  useEffect(() => {
    const cities = [selectedCity1Id, selectedCity2Id].filter(Boolean)
    if (cities.length > 0) {
      const newUrl = `/compare?cities=${cities.join(',')}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [selectedCity1Id, selectedCity2Id])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    }
  }

  const handleSaveComparison = () => {
    // Save to localStorage for persistence
    const comparisons = JSON.parse(localStorage.getItem('savedComparisons') || '[]')
    const newComparison = {
      id: Date.now().toString(),
      city1Id: selectedCity1Id,
      city2Id: selectedCity2Id,
      city1Name: city1?.name,
      city2Name: city2?.name,
      savedAt: new Date().toISOString(),
    }
    comparisons.push(newComparison)
    localStorage.setItem('savedComparisons', JSON.stringify(comparisons))
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const getMetricValue = (city: CityWithMatchAndMetrics | null, metricType: string) => {
    return city?.metrics?.find(m => m.metric_type === metricType)?.value
  }

  const formatMetricValue = (value: number | undefined, type: string) => {
    if (value === undefined) return 'N/A'
    switch (type) {
      case 'avg_salary':
        return `$${(value / 1000).toFixed(0)}K`
      case 'rent_1br':
        return `$${value.toLocaleString()}/mo`
      case 'tech_jobs':
        return `${(value / 1000).toFixed(0)}K+`
      case 'restaurants_per_capita':
        return value.toFixed(1)
      case 'green_space_pct':
        return `${value}%`
      default:
        return value.toString()
    }
  }

  const getWinner = (val1: number | undefined, val2: number | undefined, higherIsBetter: boolean = true): 'city1' | 'city2' | 'tie' | null => {
    if (val1 === undefined || val2 === undefined) return null
    if (val1 === val2) return 'tie'
    if (higherIsBetter) {
      return val1 > val2 ? 'city1' : 'city2'
    }
    return val1 < val2 ? 'city1' : 'city2'
  }

  const getDimensionScores = (city: CityWithMatchAndMetrics | null): DimensionScores | undefined => {
    return city?.match?.dimension_scores_json as DimensionScores | undefined
  }

  const getOverallRecommendation = (): { recommended: 'city1' | 'city2' | null; reason: string } => {
    if (!city1?.match || !city2?.match) {
      return { recommended: null, reason: 'Complete your assessment to see personalized recommendations.' }
    }

    const score1 = city1.match.overall_score
    const score2 = city2.match.overall_score
    const diff = Math.abs(score1 - score2)

    if (diff < 3) {
      return {
        recommended: null,
        reason: 'Both cities are equally well-matched to your preferences. Consider other factors like climate or specific lifestyle needs.'
      }
    }

    const winner = score1 > score2 ? 'city1' : 'city2'
    const winnerCity = winner === 'city1' ? city1 : city2
    const scores = getDimensionScores(winnerCity)

    // Find the strongest dimension
    let strongestDimension = ''
    let highestScore = 0
    if (scores) {
      Object.entries(scores).forEach(([dim, score]) => {
        if (score !== undefined && score > highestScore) {
          highestScore = score
          strongestDimension = dim
        }
      })
    }

    const reason = strongestDimension
      ? `Based on your assessment, ${winnerCity.name} is a ${Math.round(diff)}% better match, especially for ${DIMENSION_LABELS[strongestDimension].toLowerCase()} (${Math.round(highestScore)}%).`
      : `Based on your assessment, ${winnerCity.name} is a ${Math.round(diff)}% better overall match for your preferences.`

    return { recommended: winner, reason }
  }

  const filteredCities1 = allCities.filter(city =>
    city.id !== selectedCity2Id &&
    (city.name.toLowerCase().includes(search1.toLowerCase()) ||
     city.country.toLowerCase().includes(search1.toLowerCase()))
  )

  const filteredCities2 = allCities.filter(city =>
    city.id !== selectedCity1Id &&
    (city.name.toLowerCase().includes(search2.toLowerCase()) ||
     city.country.toLowerCase().includes(search2.toLowerCase()))
  )

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compare Cities</h1>
          </div>
          <UserMenu />
        </div>
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/results">Back to Results</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recommendation = getOverallRecommendation()

  return (
    <div className="py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/results">
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Results
          </Link>
        </Button>
        <UserMenu />
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Cities</h1>
        <p className="text-muted-foreground">
          Compare two cities side by side to find your perfect match
        </p>
      </div>

      {/* City Selectors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* City 1 Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">City 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowDropdown1(!showDropdown1)}
              >
                {city1 ? (
                  <>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full shrink-0">
                      {city1.image_url ? (
                        <Image
                          src={city1.image_url}
                          alt={city1.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{city1.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{city1.country}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a city...</span>
                )}
                <svg className="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {showDropdown1 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-lg">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search cities..."
                      value={search1}
                      onChange={(e) => setSearch1(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCities1.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCity1Id(city.id)
                          setShowDropdown1(false)
                          setSearch1('')
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                      >
                        <div className="relative h-8 w-8 overflow-hidden rounded-full shrink-0">
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{city.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{city.country}</p>
                        </div>
                      </button>
                    ))}
                    {filteredCities1.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">No cities found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* City 2 Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">City 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowDropdown2(!showDropdown2)}
              >
                {city2 ? (
                  <>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full shrink-0">
                      {city2.image_url ? (
                        <Image
                          src={city2.image_url}
                          alt={city2.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{city2.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{city2.country}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a city...</span>
                )}
                <svg className="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {showDropdown2 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-lg">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search cities..."
                      value={search2}
                      onChange={(e) => setSearch2(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCities2.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCity2Id(city.id)
                          setShowDropdown2(false)
                          setSearch2('')
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                      >
                        <div className="relative h-8 w-8 overflow-hidden rounded-full shrink-0">
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{city.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{city.country}</p>
                        </div>
                      </button>
                    ))}
                    {filteredCities2.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">No cities found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only show comparison if both cities selected */}
      {city1 && city2 && (
        <>
          {/* Side-by-side City Photos and Names */}
          <div className="grid gap-6 md:grid-cols-2">
            <Link href={`/city/${city1.id}`}>
              <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]">
                <div className="relative h-48 w-full">
                  {city1.image_url ? (
                    <Image
                      src={city1.image_url}
                      alt={city1.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {recommendation.recommended === 'city1' && (
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-white">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="text-2xl font-bold text-white">{city1.name}</h2>
                    <p className="text-white/90">{city1.country}</p>
                  </div>
                </div>
                {city1.match && (
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-primary">{Math.round(city1.match.overall_score)}%</span>
                      <span className="text-sm text-muted-foreground">Match Score</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>

            <Link href={`/city/${city2.id}`}>
              <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]">
                <div className="relative h-48 w-full">
                  {city2.image_url ? (
                    <Image
                      src={city2.image_url}
                      alt={city2.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {recommendation.recommended === 'city2' && (
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-white">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="text-2xl font-bold text-white">{city2.name}</h2>
                    <p className="text-white/90">{city2.country}</p>
                  </div>
                </div>
                {city2.match && (
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-primary">{Math.round(city2.match.overall_score)}%</span>
                      <span className="text-sm text-muted-foreground">Match Score</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          </div>

          {/* Dimension Scores Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Dimension Scores
              </CardTitle>
              <CardDescription>Compare how each city matches your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['career', 'lifestyle', 'cost', 'happiness'].map((dimension) => {
                  const score1 = getDimensionScores(city1)?.[dimension as keyof DimensionScores]
                  const score2 = getDimensionScores(city2)?.[dimension as keyof DimensionScores]
                  const winner = getWinner(score1, score2)

                  return (
                    <div key={dimension} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${DIMENSION_COLORS[dimension]}`} />
                          <span className="font-medium">{DIMENSION_LABELS[dimension]}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{DIMENSION_DESCRIPTIONS[dimension]}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* City 1 bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={`truncate ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                              {city1.name}
                            </span>
                            <span className={`${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                              {score1 !== undefined ? `${Math.round(score1)}%` : 'N/A'}
                              {winner === 'city1' && ' ✓'}
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${DIMENSION_COLORS[dimension]} transition-all ${winner === 'city1' ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                              style={{ width: `${score1 ?? 0}%` }}
                            />
                          </div>
                        </div>
                        {/* City 2 bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={`truncate ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                              {city2.name}
                            </span>
                            <span className={`${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                              {score2 !== undefined ? `${Math.round(score2)}%` : 'N/A'}
                              {winner === 'city2' && ' ✓'}
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${DIMENSION_COLORS[dimension]} transition-all ${winner === 'city2' ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                              style={{ width: `${score2 ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Detailed Metrics
              </CardTitle>
              <CardDescription>Compare key statistics between cities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">Metric</th>
                      <th className="py-3 text-center font-medium">{city1.name}</th>
                      <th className="py-3 text-center font-medium">{city2.name}</th>
                      <th className="py-3 text-center font-medium">Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* Population */}
                    {(() => {
                      const winner = getWinner(city1.population, city2.population)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Population</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city1.population >= 1_000_000 ? `${(city1.population / 1_000_000).toFixed(1)}M` : `${(city1.population / 1_000).toFixed(0)}K`}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city2.population >= 1_000_000 ? `${(city2.population / 1_000_000).toFixed(1)}M` : `${(city2.population / 1_000).toFixed(0)}K`}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Cost Index - Lower is better */}
                    {(() => {
                      const winner = getWinner(city1.cost_index, city2.cost_index, false)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Cost Index</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city1.cost_index}/100
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city2.cost_index}/100
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Career Score */}
                    {(() => {
                      const winner = getWinner(city1.career_score, city2.career_score)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Career Score</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city1.career_score}/100
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city2.career_score}/100
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Lifestyle Score */}
                    {(() => {
                      const winner = getWinner(city1.lifestyle_score, city2.lifestyle_score)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Lifestyle Score</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city1.lifestyle_score}/100
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city2.lifestyle_score}/100
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Happiness Index */}
                    {(() => {
                      const winner = getWinner(city1.happiness_index, city2.happiness_index)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Happiness Index</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city1.happiness_index}/100
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {city2.happiness_index}/100
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Climate */}
                    <tr>
                      <td className="py-3 text-muted-foreground">Climate</td>
                      <td className="py-3 text-center">{city1.climate}</td>
                      <td className="py-3 text-center">{city2.climate}</td>
                      <td className="py-3 text-center">-</td>
                    </tr>

                    {/* Average Salary */}
                    {(() => {
                      const val1 = getMetricValue(city1, 'avg_salary')
                      const val2 = getMetricValue(city2, 'avg_salary')
                      const winner = getWinner(val1, val2)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Avg. Salary</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val1, 'avg_salary')}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val2, 'avg_salary')}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* 1BR Rent - Lower is better */}
                    {(() => {
                      const val1 = getMetricValue(city1, 'rent_1br')
                      const val2 = getMetricValue(city2, 'rent_1br')
                      const winner = getWinner(val1, val2, false)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">1BR Rent</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val1, 'rent_1br')}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val2, 'rent_1br')}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Tech Jobs */}
                    {(() => {
                      const val1 = getMetricValue(city1, 'tech_jobs')
                      const val2 = getMetricValue(city2, 'tech_jobs')
                      const winner = getWinner(val1, val2)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Tech Jobs</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val1, 'tech_jobs')}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val2, 'tech_jobs')}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Restaurants */}
                    {(() => {
                      const val1 = getMetricValue(city1, 'restaurants_per_capita')
                      const val2 = getMetricValue(city2, 'restaurants_per_capita')
                      const winner = getWinner(val1, val2)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Restaurants per 10K</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val1, 'restaurants_per_capita')}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val2, 'restaurants_per_capita')}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}

                    {/* Green Space */}
                    {(() => {
                      const val1 = getMetricValue(city1, 'green_space_pct')
                      const val2 = getMetricValue(city2, 'green_space_pct')
                      const winner = getWinner(val1, val2)
                      return (
                        <tr>
                          <td className="py-3 text-muted-foreground">Green Space</td>
                          <td className={`py-3 text-center ${winner === 'city1' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val1, 'green_space_pct')}
                          </td>
                          <td className={`py-3 text-center ${winner === 'city2' ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}>
                            {formatMetricValue(val2, 'green_space_pct')}
                          </td>
                          <td className="py-3 text-center">
                            {winner === 'city1' ? city1.name : winner === 'city2' ? city2.name : winner === 'tie' ? 'Tie' : '-'}
                          </td>
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Overall Recommendation */}
          <Card className={`border-2 ${recommendation.recommended ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-primary/20'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Our Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendation.recommended ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl shrink-0">
                    {(recommendation.recommended === 'city1' ? city1 : city2).image_url ? (
                      <Image
                        src={(recommendation.recommended === 'city1' ? city1 : city2).image_url!}
                        alt={(recommendation.recommended === 'city1' ? city1 : city2).name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {(recommendation.recommended === 'city1' ? city1 : city2).name} is your better match!
                    </p>
                    <p className="text-muted-foreground">{recommendation.reason}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{recommendation.reason}</p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleSaveComparison} disabled={saveSuccess}>
              {saveSuccess ? (
                <>
                  <svg className="mr-2 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  Save Comparison
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              {shareSuccess ? (
                <>
                  <svg className="mr-2 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share Comparison
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/results">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                View All Matches
              </Link>
            </Button>
          </div>
        </>
      )}

      {/* Placeholder when no cities selected */}
      {(!city1 || !city2) && (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Select Two Cities</CardTitle>
            <CardDescription>
              Choose two cities above to see a detailed side-by-side comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <svg className="mx-auto h-24 w-24 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
