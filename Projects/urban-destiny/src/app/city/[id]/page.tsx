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
import type { City, CityMatch, DimensionScores } from '@/lib/database'

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

interface CityWithMatch extends City {
  match?: CityMatch
}

export default function CityProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [city, setCity] = useState<CityWithMatch | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

      // Fetch user's match for this city (if exists)
      const { data: matchData } = await supabase
        .from('city_matches')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('city_id', id)
        .single()

      if (cancelled) return

      setCity({ ...cityData, match: matchData || undefined })

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

  return (
    <div className="py-8 space-y-8">
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

      <div className="relative h-64 w-full overflow-hidden rounded-xl md:h-80">
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
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              {city.name}
            </h1>
            <p className="text-xl text-white/90">{city.country}</p>
          </div>
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
                Save City
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {city.match && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Match Score</span>
                <span className="text-3xl text-primary">
                  {Math.round(city.match.overall_score)}%
                </span>
              </CardTitle>
              <CardDescription>
                How well this city matches your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dimensionEntries.map(([dimension, score]) => (
                <div key={dimension} className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">
                        {DIMENSION_LABELS[dimension]}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {DIMENSION_DESCRIPTIONS[dimension]}
                      </p>
                    </div>
                    <span className="font-semibold">{Math.round(score)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${DIMENSION_COLORS[dimension]}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>City Overview</CardTitle>
            <CardDescription>Key facts about {city.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Population</dt>
                <dd className="font-medium">
                  {(city.population / 1_000_000).toFixed(1)}M
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Climate</dt>
                <dd className="font-medium">{city.climate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cost Index</dt>
                <dd className="font-medium">{city.cost_index}/100</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Career Score</dt>
                <dd className="font-medium">{city.career_score}/100</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lifestyle Score</dt>
                <dd className="font-medium">{city.lifestyle_score}/100</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Happiness Index</dt>
                <dd className="font-medium">{city.happiness_index}/100</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
