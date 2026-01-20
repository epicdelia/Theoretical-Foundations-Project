'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { saveCity, unsaveCity, getSavedCityIds } from '@/lib/saved-cities'
import type { City, CityMatch, CityMetric, DimensionScores } from '@/lib/database'

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

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  career: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  lifestyle: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  cost: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  happiness: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
}

interface CityWithMatchAndMetrics extends City {
  match?: CityMatch
  metrics?: CityMetric[]
}

interface ProCon {
  text: string
  dimension: string
}

// Generate personalized pros and cons based on city data and user's match scores
function generateProsAndCons(
  city: CityWithMatchAndMetrics,
  dimensionScores: DimensionScores | undefined
): { pros: ProCon[]; cons: ProCon[] } {
  const pros: ProCon[] = []
  const cons: ProCon[] = []

  const avgSalary = city.metrics?.find(m => m.metric_type === 'avg_salary')?.value
  const rent = city.metrics?.find(m => m.metric_type === 'rent_1br')?.value
  const techJobs = city.metrics?.find(m => m.metric_type === 'tech_jobs')?.value
  const restaurants = city.metrics?.find(m => m.metric_type === 'restaurants_per_capita')?.value
  const greenSpace = city.metrics?.find(m => m.metric_type === 'green_space_pct')?.value

  // Career-based pros/cons
  if (dimensionScores?.career !== undefined) {
    if (dimensionScores.career >= 75) {
      if (city.career_score >= 85) {
        pros.push({ text: 'Excellent job market aligned with your career goals', dimension: 'career' })
      }
      if (techJobs && techJobs >= 100000) {
        pros.push({ text: `Strong tech presence with ${(techJobs / 1000).toFixed(0)}K+ tech jobs`, dimension: 'career' })
      }
      if (avgSalary && avgSalary >= 70000) {
        pros.push({ text: 'Competitive salary levels in your industry', dimension: 'career' })
      }
    } else if (dimensionScores.career < 50) {
      if (city.career_score < 75) {
        cons.push({ text: 'Job market may not match your career aspirations', dimension: 'career' })
      }
      if (techJobs && techJobs < 50000) {
        cons.push({ text: 'Limited tech industry presence', dimension: 'career' })
      }
    }
  }

  // Lifestyle-based pros/cons
  if (dimensionScores?.lifestyle !== undefined) {
    if (dimensionScores.lifestyle >= 75) {
      if (city.lifestyle_score >= 85) {
        pros.push({ text: 'Vibrant lifestyle scene matching your preferences', dimension: 'lifestyle' })
      }
      if (restaurants && restaurants >= 25) {
        pros.push({ text: 'Excellent dining and entertainment options', dimension: 'lifestyle' })
      }
    } else if (dimensionScores.lifestyle < 50) {
      if (restaurants && restaurants < 20) {
        cons.push({ text: 'Fewer dining and entertainment options than preferred', dimension: 'lifestyle' })
      }
    }
  }

  // Cost-based pros/cons
  if (dimensionScores?.cost !== undefined) {
    if (dimensionScores.cost >= 70) {
      if (city.cost_index <= 60) {
        pros.push({ text: 'Very affordable cost of living', dimension: 'cost' })
      } else if (city.cost_index <= 75) {
        pros.push({ text: 'Reasonable cost of living for the opportunities', dimension: 'cost' })
      }
      if (rent && rent <= 1500) {
        pros.push({ text: 'Affordable housing options available', dimension: 'cost' })
      }
    } else if (dimensionScores.cost < 50) {
      if (city.cost_index >= 80) {
        cons.push({ text: 'High cost of living may strain your budget', dimension: 'cost' })
      }
      if (rent && rent >= 2500) {
        cons.push({ text: 'Housing costs significantly above your preference', dimension: 'cost' })
      }
    }
  }

  // Happiness-based pros/cons
  if (dimensionScores?.happiness !== undefined) {
    if (dimensionScores.happiness >= 70) {
      if (city.happiness_index >= 80) {
        pros.push({ text: 'High quality of life and resident satisfaction', dimension: 'happiness' })
      }
      if (greenSpace && greenSpace >= 20) {
        pros.push({ text: 'Abundant green spaces and nature access', dimension: 'happiness' })
      }
    } else if (dimensionScores.happiness < 50) {
      if (greenSpace && greenSpace < 10) {
        cons.push({ text: 'Limited green spaces compared to your preference', dimension: 'happiness' })
      }
      if (city.happiness_index < 72) {
        cons.push({ text: 'Quality of life metrics below your expectations', dimension: 'happiness' })
      }
    }
  }

  // Add general pros if we don't have enough personalized ones
  if (pros.length < 2) {
    if (city.happiness_index >= 80) {
      pros.push({ text: 'High overall quality of life', dimension: 'happiness' })
    }
    if (city.lifestyle_score >= 85) {
      pros.push({ text: 'Rich cultural and lifestyle offerings', dimension: 'lifestyle' })
    }
  }

  // Add general cons if we don't have enough
  if (cons.length < 1) {
    if (city.cost_index >= 80) {
      cons.push({ text: 'Higher cost of living than average', dimension: 'cost' })
    } else if (city.population > 5000000) {
      cons.push({ text: 'Large city may feel crowded', dimension: 'lifestyle' })
    } else if (city.population < 500000) {
      cons.push({ text: 'Smaller city with fewer amenities', dimension: 'lifestyle' })
    }
  }

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 3) }
}

// City photos gallery data (using Unsplash for variety)
function getCityGalleryImages(baseImageUrl: string | null): string[] {
  const baseUrl = baseImageUrl || `https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b`

  // Return different crop/sizes of the main image
  return [
    baseUrl,
    `${baseUrl}?w=800&h=600&fit=crop`,
    `${baseUrl}?w=600&h=800&fit=crop`,
  ]
}

// External resource links
function getCityResources(cityName: string, country: string): { label: string; url: string; icon: React.ReactNode }[] {
  const encodedCity = encodeURIComponent(cityName)
  const encodedLocation = encodeURIComponent(`${cityName}, ${country}`)

  return [
    {
      label: 'Nomad List',
      url: `https://nomadlist.com/${cityName.toLowerCase().replace(/\s+/g, '-')}`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
    {
      label: 'Wikipedia',
      url: `https://en.wikipedia.org/wiki/${encodedCity}`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      label: 'Google Maps',
      url: `https://www.google.com/maps/place/${encodedLocation}`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      label: 'Numbeo Cost of Living',
      url: `https://www.numbeo.com/cost-of-living/in/${encodedCity}`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ]
}

export default function CityProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [city, setCity] = useState<CityWithMatchAndMetrics | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    let cancelled = false

    const loadCity = async () => {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (cancelled) return

      if (!authUser) {
        setError('You must be logged in to view city details')
        setIsLoading(false)
        return
      }

      // Fetch city data
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single()

      if (cancelled) return

      if (cityError || !cityData) {
        setError('City not found')
        setIsLoading(false)
        return
      }

      // Fetch city metrics
      const { data: metricsData } = await supabase
        .from('city_metrics')
        .select('*')
        .eq('city_id', id)

      if (cancelled) return

      // Fetch user's match for this city (if exists)
      const { data: matchData } = await supabase
        .from('city_matches')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('city_id', id)
        .single()

      if (cancelled) return

      setCity({
        ...cityData,
        match: matchData || undefined,
        metrics: metricsData || undefined,
      })

      // Check if city is saved
      const savedResult = await getSavedCityIds()
      if (cancelled) return

      if (savedResult.success && savedResult.savedCityIds) {
        setIsSaved(savedResult.savedCityIds.includes(id))
      }

      setIsLoading(false)
    }

    loadCity()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, router, id])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isSaved) {
        await unsaveCity(id)
        setIsSaved(false)
      } else {
        await saveCity(id)
        setIsSaved(true)
      }
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !city) {
    return (
      <div className="py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">City Profile</h1>
          </div>
          <UserMenu />
        </div>
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'City not found'}</CardDescription>
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

  const dimensionScores = city.match?.dimension_scores_json as DimensionScores | undefined
  const dimensionEntries = dimensionScores
    ? (Object.entries(dimensionScores).filter(
        ([, score]) => score !== undefined
      ) as [string, number][])
    : []

  // Get metrics
  const avgSalary = city.metrics?.find(m => m.metric_type === 'avg_salary')?.value
  const rent = city.metrics?.find(m => m.metric_type === 'rent_1br')?.value
  const techJobs = city.metrics?.find(m => m.metric_type === 'tech_jobs')?.value
  const restaurants = city.metrics?.find(m => m.metric_type === 'restaurants_per_capita')?.value
  const greenSpace = city.metrics?.find(m => m.metric_type === 'green_space_pct')?.value

  // Generate personalized pros and cons
  const { pros, cons } = generateProsAndCons(city, dimensionScores)

  // Get gallery images
  const galleryImages = getCityGalleryImages(city.image_url)

  // Get external resources
  const resources = getCityResources(city.name, city.country)

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

      {/* Hero Section with City Image */}
      <div className="relative h-72 w-full overflow-hidden rounded-xl md:h-96">
        {city.image_url ? (
          <Image
            src={city.image_url}
            alt={city.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              {city.name}
            </h1>
            <p className="mt-1 flex items-center text-xl text-white/90">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {city.country}
            </p>
            {/* Match Score Badge in Hero */}
            {city.match && (
              <div className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-2">
                <span className="text-2xl font-bold text-primary-foreground">
                  {Math.round(city.match.overall_score)}%
                </span>
                <span className="ml-2 text-sm text-primary-foreground/90">Match</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              variant={isSaved ? 'secondary' : 'default'}
              className="shrink-0"
            >
              {isSaved ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
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
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                  Save
                </>
              )}
            </Button>
            <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20" asChild>
              <Link href={`/compare?cities=${id}`}>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Compare
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Match Score Section (if assessed) */}
      {city.match && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Your Match Score
              </span>
              <span className="text-4xl font-bold text-primary">
                {Math.round(city.match.overall_score)}%
              </span>
            </CardTitle>
            <CardDescription>
              Based on your assessment, here&apos;s how {city.name} matches your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {dimensionEntries.map(([dimension, score]) => (
                <div key={dimension} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`rounded-full p-1.5 ${DIMENSION_COLORS[dimension]} text-white`}>
                      {DIMENSION_ICONS[dimension]}
                    </div>
                    <span className="font-medium">{DIMENSION_LABELS[dimension]}</span>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">{Math.round(score)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${DIMENSION_COLORS[dimension]} transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {DIMENSION_DESCRIPTIONS[dimension]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Population</p>
                <p className="text-2xl font-bold">
                  {city.population >= 1_000_000
                    ? `${(city.population / 1_000_000).toFixed(1)}M`
                    : `${(city.population / 1_000).toFixed(0)}K`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Index</p>
                <p className="text-2xl font-bold">{city.cost_index}/100</p>
                <p className="text-xs text-muted-foreground">
                  {city.cost_index >= 80 ? 'High' : city.cost_index >= 60 ? 'Moderate' : 'Affordable'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Salary</p>
                <p className="text-2xl font-bold">
                  {avgSalary ? `$${(avgSalary / 1000).toFixed(0)}K` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">per year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Climate</p>
                <p className="text-lg font-bold">{city.climate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>City Metrics</CardTitle>
            <CardDescription>Detailed statistics about {city.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                  1BR Rent
                </dt>
                <dd className="font-medium">{rent ? `$${rent.toLocaleString()}/mo` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                  Tech Jobs
                </dt>
                <dd className="font-medium">{techJobs ? `${(techJobs / 1000).toFixed(0)}K+` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                  </svg>
                  Restaurants per 10K
                </dt>
                <dd className="font-medium">{restaurants ? restaurants.toFixed(1) : 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                  </svg>
                  Green Space
                </dt>
                <dd className="font-medium">{greenSpace ? `${greenSpace}%` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                  Happiness Index
                </dt>
                <dd className="font-medium">{city.happiness_index}/100</dd>
              </div>
              <div className="flex justify-between items-center py-2">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  Career Score
                </dt>
                <dd className="font-medium">{city.career_score}/100</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Personalized Pros & Cons */}
        <Card>
          <CardHeader>
            <CardTitle>
              {city.match ? 'Personalized Insights' : 'City Highlights'}
            </CardTitle>
            <CardDescription>
              {city.match
                ? `Based on your assessment results for ${city.name}`
                : `Key characteristics of ${city.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pros */}
            <div>
              <h4 className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pros
              </h4>
              <ul className="space-y-2">
                {pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${DIMENSION_COLORS[pro.dimension]}`} />
                    <span>{pro.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h4 className="flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Considerations
              </h4>
              <ul className="space-y-2">
                {cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${DIMENSION_COLORS[con.dimension]}`} />
                    <span>{con.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>Explore {city.name} through images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
              {galleryImages[selectedGalleryImage] ? (
                <Image
                  src={galleryImages[selectedGalleryImage]}
                  alt={`${city.name} - Photo ${selectedGalleryImage + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedGalleryImage(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-all ${
                    selectedGalleryImage === index
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${city.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Learn More</CardTitle>
          <CardDescription>External resources about {city.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <a
                key={resource.label}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {resource.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{resource.label}</p>
                  <p className="text-xs text-muted-foreground">Opens in new tab</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <Button size="lg" onClick={handleSave} disabled={saving} variant={isSaved ? 'secondary' : 'default'}>
          {isSaved ? (
            <>
              <svg className="mr-2 h-5 w-5 fill-current" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              Saved to Favorites
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Save to Favorites
            </>
          )}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={`/compare?cities=${id}`}>
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare with Another City
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/results">
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            View All Matches
          </Link>
        </Button>
      </div>
    </div>
  )
}
