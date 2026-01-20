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
import { Textarea } from '@/components/ui/textarea'
import { UserMenu } from '@/components/auth'
import { useAuth } from '@/lib/auth'
import {
  getSavedCitiesWithDetails,
  unsaveCity,
  updateSavedCityNotes,
  type SavedCityWithDetails,
} from '@/lib/saved-cities'

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

function SavedCityCard({
  city,
  onRemove,
  onNotesUpdate,
}: {
  city: SavedCityWithDetails
  onRemove: (cityId: string) => void
  onNotesUpdate: (id: string, notes: string) => void
}) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(city.notes ?? '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRemoving(true)
    try {
      const result = await unsaveCity(city.city_id)
      if (result.success) {
        onRemove(city.city_id)
      }
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      const result = await updateSavedCityNotes(city.id, notes)
      if (result.success) {
        onNotesUpdate(city.id, notes)
        setIsEditingNotes(false)
      }
    } finally {
      setIsSavingNotes(false)
    }
  }

  const dimensionEntries = city.dimension_scores
    ? (Object.entries(city.dimension_scores).filter(
        ([, score]) => score !== undefined
      ) as [string, number][])
    : []

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/city/${city.city_id}`}>
        <div className="relative h-32 w-full">
          {city.city_image_url ? (
            <Image
              src={city.city_image_url}
              alt={city.city_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-lg font-semibold text-white">{city.city_name}</h3>
            <p className="text-sm text-white/80">{city.city_country}</p>
          </div>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 transition-colors hover:bg-white disabled:opacity-50"
            aria-label="Remove from saved"
          >
            <svg
              className="h-5 w-5 fill-red-500 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </button>
        </div>
      </Link>
      <CardContent className="p-4">
        {city.overall_score !== null ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {Math.round(city.overall_score)}%
              </span>
              <span className="text-xs text-muted-foreground">Match Score</span>
            </div>
            <div className="mb-3 space-y-2">
              {dimensionEntries.map(([dimension, score]) => (
                <DimensionScoreBar
                  key={dimension}
                  dimension={dimension}
                  score={score}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">
            Take assessment to see match score
          </p>
        )}

        <div className="border-t pt-3">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this city..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotes(city.notes ?? '')
                    setIsEditingNotes(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="w-full text-left"
            >
              {city.notes ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {city.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Click to add notes...
                </p>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-8 w-8 text-muted-foreground"
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
        </div>
        <CardTitle>No Saved Cities Yet</CardTitle>
        <CardDescription>
          Take the assessment to discover cities that match your lifestyle, then
          save your favorites to track them here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/assessment/career">Take Assessment</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [savedCities, setSavedCities] = useState<SavedCityWithDetails[]>([])
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    let cancelled = false

    const loadSavedCities = async () => {
      setIsLoading(true)
      setError(null)

      const result = await getSavedCitiesWithDetails()

      if (cancelled) return

      if (!result.success) {
        setError(result.error || 'Failed to load saved cities')
        setIsLoading(false)
        return
      }

      setSavedCities(result.savedCities ?? [])
      setLastAssessmentDate(result.lastAssessmentDate ?? null)
      setIsLoading(false)
    }

    loadSavedCities()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, router])

  const handleRemoveCity = (cityId: string) => {
    setSavedCities((prev) => prev.filter((c) => c.city_id !== cityId))
  }

  const handleNotesUpdate = (id: string, notes: string) => {
    setSavedCities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    )
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your saved cities</p>
          </div>
          <UserMenu />
        </div>
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {savedCities.length > 0
              ? `${savedCities.length} saved ${savedCities.length === 1 ? 'city' : 'cities'}`
              : 'Your saved cities'}
          </p>
        </div>
        <UserMenu />
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
            {lastAssessmentDate ? 'Retake Assessment' : 'Take Assessment'}
          </Link>
        </Button>

        {lastAssessmentDate && (
          <span className="text-sm text-muted-foreground">
            Last assessment: {formatDate(lastAssessmentDate)}
          </span>
        )}

        {savedCities.length > 0 && (
          <Button variant="outline" asChild className="ml-auto">
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
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
              View All Matches
            </Link>
          </Button>
        )}
      </div>

      {savedCities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedCities.map((city) => (
            <SavedCityCard
              key={city.id}
              city={city}
              onRemove={handleRemoveCity}
              onNotesUpdate={handleNotesUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
