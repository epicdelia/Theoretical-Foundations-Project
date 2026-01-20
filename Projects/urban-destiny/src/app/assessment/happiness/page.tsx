'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Heart, SkipForward, Loader2 } from 'lucide-react'

interface HappinessOption {
  value: number
  label: string
  description?: string
  icon?: string
}

interface Question {
  id: string
  text: string
  options: HappinessOption[]
}

const happinessQuestions: Question[] = [
  {
    id: 'community-importance',
    text: 'How important is a sense of community to you?',
    options: [
      { value: 1, label: 'Not Important', description: 'I prefer solitude and independence', icon: '🏠' },
      { value: 2, label: 'Slightly Important', description: 'Occasional social interaction is enough', icon: '👋' },
      { value: 3, label: 'Moderately Important', description: 'I value a balanced social life', icon: '🤝' },
      { value: 4, label: 'Very Important', description: 'Strong community ties are valuable', icon: '👥' },
      { value: 5, label: 'Essential', description: 'Deep community connection is crucial', icon: '❤️' },
    ],
  },
  {
    id: 'safety-priority',
    text: 'How much do you prioritize safety and low crime rates?',
    options: [
      { value: 1, label: 'Not a Priority', description: 'I can adapt to any environment', icon: '🌍' },
      { value: 2, label: 'Slightly Important', description: 'Basic safety measures are enough', icon: '🚶' },
      { value: 3, label: 'Moderately Important', description: 'Reasonable safety is expected', icon: '🏘️' },
      { value: 4, label: 'Very Important', description: 'Low crime rates are a key factor', icon: '🛡️' },
      { value: 5, label: 'Essential', description: 'Safety is my top priority', icon: '🔒' },
    ],
  },
  {
    id: 'work-life-balance',
    text: 'How important is work-life balance culture in your city?',
    options: [
      { value: 1, label: 'Not Important', description: 'I thrive in hustle culture', icon: '💼' },
      { value: 2, label: 'Slightly Important', description: 'Some flexibility is nice', icon: '⚖️' },
      { value: 3, label: 'Moderately Important', description: 'Balanced approach preferred', icon: '🌅' },
      { value: 4, label: 'Very Important', description: 'Strong boundaries between work and life', icon: '🏖️' },
      { value: 5, label: 'Essential', description: 'Prioritizing life over work is crucial', icon: '🧘' },
    ],
  },
  {
    id: 'diversity-value',
    text: 'How much do you value cultural diversity and inclusivity?',
    options: [
      { value: 1, label: 'Not Important', description: 'Cultural makeup is not a factor', icon: '🏛️' },
      { value: 2, label: 'Slightly Important', description: 'Some diversity is appreciated', icon: '🌐' },
      { value: 3, label: 'Moderately Important', description: 'Diverse communities are valued', icon: '🎭' },
      { value: 4, label: 'Very Important', description: 'Rich multicultural environment preferred', icon: '🌈' },
      { value: 5, label: 'Essential', description: 'Maximum diversity and inclusion is a must', icon: '🤗' },
    ],
  },
  {
    id: 'nature-access',
    text: 'How important is easy access to nature and green spaces?',
    options: [
      { value: 1, label: 'Not Important', description: 'Urban environment is fine', icon: '🏢' },
      { value: 2, label: 'Slightly Important', description: 'Occasional parks are enough', icon: '🌳' },
      { value: 3, label: 'Moderately Important', description: 'Regular green spaces nearby', icon: '🌲' },
      { value: 4, label: 'Very Important', description: 'Forests, lakes, or mountains accessible', icon: '🏔️' },
      { value: 5, label: 'Essential', description: 'Daily immersion in nature is crucial', icon: '🌿' },
    ],
  },
]

const NEUTRAL_VALUE = 3

export default function HappinessAssessmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = happinessQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === happinessQuestions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0
  const questionProgress = ((currentQuestionIndex + 1) / happinessQuestions.length) * 100

  const handleOptionSelect = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleSkip = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: NEUTRAL_VALUE,
    }))
    handleNext()
  }

  const handleBack = () => {
    if (isFirstQuestion) {
      router.push('/assessment/cost')
    } else {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const saveResponses = async () => {
    if (!user) {
      setError('You must be logged in to save your responses')
      return false
    }

    const supabase = createClient()

    const responses = Object.entries(answers).map(([questionId, answerValue]) => ({
      user_id: user.id,
      category: 'happiness',
      question_id: questionId,
      answer_value: answerValue,
      weight: answerValue === NEUTRAL_VALUE ? 0.5 : 1,
    }))

    const { error: upsertError } = await supabase
      .from('assessment_responses')
      .upsert(responses, {
        onConflict: 'user_id,question_id',
      })

    if (upsertError) {
      console.error('Error saving responses:', upsertError)
      setError('Failed to save your responses. Please try again.')
      return false
    }

    return true
  }

  const calculateMatches = async () => {
    if (!user) {
      setError('You must be logged in to calculate matches')
      return false
    }

    const supabase = createClient()

    // Fetch all user responses
    const { data: responses, error: responsesError } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('user_id', user.id)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      setError('Failed to fetch your responses. Please try again.')
      return false
    }

    // Calculate average scores per category
    const categoryScores: Record<string, { total: number; count: number; weightedTotal: number }> = {}

    for (const response of responses || []) {
      if (!categoryScores[response.category]) {
        categoryScores[response.category] = { total: 0, count: 0, weightedTotal: 0 }
      }
      categoryScores[response.category].total += response.answer_value
      categoryScores[response.category].count += 1
      categoryScores[response.category].weightedTotal += response.answer_value * response.weight
    }

    // Normalize scores to 0-100 scale
    const normalizedScores: Record<string, number> = {}
    for (const [category, data] of Object.entries(categoryScores)) {
      // Convert 1-5 scale to 0-100
      const avgScore = data.weightedTotal / data.count
      normalizedScores[category] = ((avgScore - 1) / 4) * 100
    }

    // Fetch all cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')

    if (citiesError) {
      console.error('Error fetching cities:', citiesError)
      setError('Failed to fetch cities. Please try again.')
      return false
    }

    // Calculate match scores for each city
    const matches = (cities || []).map((city) => {
      const dimensionScores: Record<string, number> = {}

      // Calculate dimension scores (inverse of difference, scaled)
      if (normalizedScores.career !== undefined) {
        dimensionScores.career = 100 - Math.abs(city.career_score - normalizedScores.career)
      }
      if (normalizedScores.lifestyle !== undefined) {
        dimensionScores.lifestyle = 100 - Math.abs(city.lifestyle_score - normalizedScores.lifestyle)
      }
      if (normalizedScores.cost !== undefined) {
        dimensionScores.cost = 100 - Math.abs(city.cost_index - normalizedScores.cost)
      }
      if (normalizedScores.happiness !== undefined) {
        dimensionScores.happiness = 100 - Math.abs(city.happiness_index - normalizedScores.happiness)
      }

      // Calculate overall score (average of dimension scores)
      const scoreValues = Object.values(dimensionScores)
      const overallScore = scoreValues.length > 0
        ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
        : 0

      return {
        user_id: user.id,
        city_id: city.id,
        overall_score: Math.round(overallScore * 100) / 100,
        dimension_scores_json: dimensionScores,
      }
    })

    // Delete existing matches for user and insert new ones
    const { error: deleteError } = await supabase
      .from('city_matches')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting old matches:', deleteError)
    }

    const { error: insertError } = await supabase
      .from('city_matches')
      .insert(matches)

    if (insertError) {
      console.error('Error inserting matches:', insertError)
      setError('Failed to calculate matches. Please try again.')
      return false
    }

    // Mark assessment as complete
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ assessment_complete: true })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    return true
  }

  const handleNext = async () => {
    if (isLastQuestion) {
      setIsSubmitting(true)
      setError(null)

      if (answers[currentQuestion.id] === undefined) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: NEUTRAL_VALUE,
        }))
      }

      const success = await saveResponses()
      setIsSubmitting(false)

      if (success) {
        setCurrentQuestionIndex((prev) => prev + 1) // Move past last question to show calculate button
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handleCalculateMatches = async () => {
    setIsCalculating(true)
    setError(null)

    const success = await calculateMatches()

    if (success) {
      router.push('/results')
    } else {
      setIsCalculating(false)
    }
  }

  const currentAnswer = answers[currentQuestion?.id]
  const canProceed = currentAnswer !== undefined
  const showCalculateButton = currentQuestionIndex >= happinessQuestions.length

  if (isCalculating) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Finding your perfect cities...</h2>
            <p className="text-muted-foreground">
              We&apos;re analyzing your preferences to find the best matches.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showCalculateButton) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Section Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Section 4 of 4</span>
              <span className="font-medium">Happiness</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
              <CardDescription>
                You&apos;ve answered all questions. Ready to discover your perfect cities?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  onClick={handleCalculateMatches}
                  className="w-full"
                >
                  Calculate Matches
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex(happinessQuestions.length - 1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Section Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Section 4 of 4</span>
            <span className="font-medium">Happiness</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Happiness Factors</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {happinessQuestions.length}
                </CardDescription>
              </div>
            </div>
            {/* Question Progress */}
            <Progress value={questionProgress} className="mt-4 h-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>

            <div className="grid gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                    currentAnswer === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <span className="text-2xl" role="img" aria-label={option.label}>
                        {option.icon}
                      </span>
                    )}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
                <Button onClick={handleNext} disabled={!canProceed || isSubmitting}>
                  {isSubmitting ? (
                    'Saving...'
                  ) : isLastQuestion ? (
                    'Finish Assessment'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
