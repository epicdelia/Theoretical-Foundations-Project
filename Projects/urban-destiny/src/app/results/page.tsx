'use client'

import { useEffect, useState } from 'react'
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
import { getStoredTopMatches, type TopCityMatch } from '@/lib/matching'
import { saveCity, unsaveCity, getSavedCityIds } from '@/lib/saved-cities'

const DIMENSION_LABELS: Record<string, string> = {
  career: 'Career',
  lifestyle: 'Lifestyle',
  cost: 'Cost',
  happiness: 'Happiness',
}

const DIMENSION_COLORS: Record<string, string> = {
  career: 'bg-blue-500',
  lifestyle: 'bg-purple-500',
  cost: 'bg-green-500',
  happiness: 'bg-yellow-500',
}

function DimensionScoreBar({
  dimension,
  score,
}: {
  dimension: string
  score: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{DIMENSION_LABELS[dimension]}</span>
        <span className="font-medium">{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${DIMENSION_COLORS[dimension]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function CityCard({
  match,
  isSaved,
  onSaveToggle,
}: {
  match: TopCityMatch
  isSaved: boolean
  onSaveToggle: (cityId: string, saved: boolean) => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaving(true)
    try {
      if (isSaved) {
        await unsaveCity(match.city_id)
        onSaveToggle(match.city_id, false)
      } else {
        await saveCity(match.city_id)
        onSaveToggle(match.city_id, true)
      }
    } finally {
      setSaving(false)
    }
  }

  const dimensionEntries = Object.entries(match.dimension_scores).filter(
    ([, score]) => score !== undefined
  ) as [string, number][]

  return (
    <Link href={`/city/${match.city_id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="relative h-32 w-full">
          {match.city_image_url ? (
            <Image
              src={match.city_image_url}
              alt={match.city_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-lg font-semibold text-white">{match.city_name}</h3>
            <p className="text-sm text-white/80">{match.city_country}</p>
          </div>
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
        </div>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              {Math.round(match.overall_score)}%
            </span>
            <span className="text-xs text-muted-foreground">Match Score</span>
          </div>
          <div className="space-y-2">
            {dimensionEntries.map(([dimension, score]) => (
              <DimensionScoreBar
                key={dimension}
                dimension={dimension}
                score={score}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function TopMatchCard({
  match,
  isSaved,
  onSaveToggle,
}: {
  match: TopCityMatch
  isSaved: boolean
  onSaveToggle: (cityId: string, saved: boolean) => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaving(true)
    try {
      if (isSaved) {
        await unsaveCity(match.city_id)
        onSaveToggle(match.city_id, false)
      } else {
        await saveCity(match.city_id)
        onSaveToggle(match.city_id, true)
      }
    } finally {
      setSaving(false)
    }
  }

  const dimensionEntries = Object.entries(match.dimension_scores).filter(
    ([, score]) => score !== undefined
  ) as [string, number][]

  return (
    <Link href={`/city/${match.city_id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl">
        <div className="relative h-64 w-full md:h-80">
          {match.city_image_url ? (
            <Image
              src={match.city_image_url}
              alt={match.city_name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              #1 Match
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 transition-colors hover:bg-white disabled:opacity-50"
            aria-label={isSaved ? 'Unsave city' : 'Save city'}
          >
            {isSaved ? (
              <svg
                className="h-6 w-6 fill-red-500 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-gray-600"
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
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              {match.city_name}
            </h2>
            <p className="text-lg text-white/90">{match.city_country}</p>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-4xl font-bold text-primary">
                {Math.round(match.overall_score)}%
              </span>
              <span className="ml-2 text-muted-foreground">Match Score</span>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{match.city_climate}</p>
              <p>{(match.city_population / 1_000_000).toFixed(1)}M population</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {dimensionEntries.map(([dimension, score]) => (
              <DimensionScoreBar
                key={dimension}
                dimension={dimension}
                score={score}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [matches, setMatches] = useState<TopCityMatch[]>([])
  const [savedCities, setSavedCities] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    let cancelled = false

    const loadMatches = async () => {
      setIsLoading(true)
      setError(null)

      const [matchesResult, savedResult] = await Promise.all([
        getStoredTopMatches(10),
        getSavedCityIds(),
      ])

      if (cancelled) return

      if (!matchesResult.success || !matchesResult.topMatches) {
        setError(matchesResult.error || 'Failed to load matches')
        setIsLoading(false)
        return
      }

      setMatches(matchesResult.topMatches)

      if (savedResult.success && savedResult.savedCityIds) {
        setSavedCities(new Set(savedResult.savedCityIds))
      }

      setIsLoading(false)
    }

    loadMatches()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, router])

  const handleSaveToggle = (cityId: string, saved: boolean) => {
    setSavedCities(prev => {
      const next = new Set(prev)
      if (saved) {
        next.add(cityId)
      } else {
        next.delete(cityId)
      }
      return next
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
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
            <h1 className="text-3xl font-bold tracking-tight">Your City Matches</h1>
            <p className="text-muted-foreground">
              Discover cities that match your lifestyle
            </p>
          </div>
          <UserMenu />
        </div>
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>No Results Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/assessment/career">Take Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const topMatch = matches[0]
  const otherMatches = matches.slice(1)

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your City Matches</h1>
          <p className="text-muted-foreground">
            Based on your assessment, here are your top matches
          </p>
        </div>
        <UserMenu />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/assessment/career">
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Retake Assessment
          </Link>
        </Button>
        <Button variant="outline" onClick={handleShare}>
          {shareSuccess ? (
            <>
              <svg
                className="mr-2 h-4 w-4 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Copied!
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
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
              Share Results
            </>
          )}
        </Button>
      </div>

      {topMatch && (
        <section>
          <h2 className="sr-only">Your Top Match</h2>
          <TopMatchCard
            match={topMatch}
            isSaved={savedCities.has(topMatch.city_id)}
            onSaveToggle={handleSaveToggle}
          />
        </section>
      )}

      {otherMatches.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">More Great Matches</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherMatches.map((match) => (
              <CityCard
                key={match.city_id}
                match={match}
                isSaved={savedCities.has(match.city_id)}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
