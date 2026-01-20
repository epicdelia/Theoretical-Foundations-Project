'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Mountain, SkipForward } from 'lucide-react'

interface LifestyleOption {
  value: number
  label: string
  description?: string
  icon?: string
}

interface Question {
  id: string
  text: string
  options: LifestyleOption[]
}

const lifestyleQuestions: Question[] = [
  {
    id: 'climate-preference',
    text: 'What climate do you prefer?',
    options: [
      { value: 1, label: 'Tropical', description: 'Warm year-round, humid', icon: '🌴' },
      { value: 2, label: 'Mediterranean', description: 'Mild winters, warm summers', icon: '☀️' },
      { value: 3, label: 'Temperate', description: 'Four distinct seasons', icon: '🍂' },
      { value: 4, label: 'Cold', description: 'Long winters, cool summers', icon: '❄️' },
      { value: 5, label: 'Desert', description: 'Hot and dry', icon: '🏜️' },
    ],
  },
  {
    id: 'city-size',
    text: 'What size city do you prefer?',
    options: [
      { value: 1, label: 'Small Town', description: 'Under 100,000 people', icon: '🏘️' },
      { value: 2, label: 'Mid-size City', description: '100,000 - 500,000 people', icon: '🏙️' },
      { value: 3, label: 'Large City', description: '500,000 - 1 million people', icon: '🌆' },
      { value: 4, label: 'Major Metro', description: '1 - 5 million people', icon: '🌃' },
      { value: 5, label: 'Megacity', description: 'Over 5 million people', icon: '🌇' },
    ],
  },
  {
    id: 'nightlife-importance',
    text: 'How important is nightlife and entertainment to you?',
    options: [
      { value: 1, label: 'Not Important', description: 'I prefer quiet evenings at home', icon: '🏠' },
      { value: 2, label: 'Slightly Important', description: 'Occasional outings are nice', icon: '🎵' },
      { value: 3, label: 'Moderately Important', description: 'I enjoy going out regularly', icon: '🎤' },
      { value: 4, label: 'Very Important', description: 'Active social scene is a must', icon: '🎉' },
      { value: 5, label: 'Essential', description: 'Vibrant nightlife is non-negotiable', icon: '🪩' },
    ],
  },
  {
    id: 'outdoor-activities',
    text: 'How important are outdoor activities and nature access?',
    options: [
      { value: 1, label: 'Not Important', description: 'I prefer indoor activities', icon: '🏢' },
      { value: 2, label: 'Slightly Important', description: 'Occasional parks are enough', icon: '🌳' },
      { value: 3, label: 'Moderately Important', description: 'Regular access to nature', icon: '🚴' },
      { value: 4, label: 'Very Important', description: 'Hiking, beaches, mountains nearby', icon: '🏔️' },
      { value: 5, label: 'Essential', description: 'Daily outdoor lifestyle is crucial', icon: '🏕️' },
    ],
  },
  {
    id: 'cultural-scene',
    text: 'How important is access to arts and cultural activities?',
    options: [
      { value: 1, label: 'Not Important', description: 'Not a priority for me', icon: '📺' },
      { value: 2, label: 'Slightly Important', description: 'Occasional museums or shows', icon: '🎭' },
      { value: 3, label: 'Moderately Important', description: 'Regular cultural engagement', icon: '🎨' },
      { value: 4, label: 'Very Important', description: 'Rich arts scene is valuable', icon: '🎼' },
      { value: 5, label: 'Essential', description: 'World-class culture is a must', icon: '🏛️' },
    ],
  },
]

const NEUTRAL_VALUE = 3

export default function LifestyleAssessmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = lifestyleQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === lifestyleQuestions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0
  const questionProgress = ((currentQuestionIndex + 1) / lifestyleQuestions.length) * 100

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
      router.push('/assessment/career')
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
      category: 'lifestyle',
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
        router.push('/assessment/cost')
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const currentAnswer = answers[currentQuestion.id]
  const canProceed = currentAnswer !== undefined

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Section Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Section 2 of 4</span>
            <span className="font-medium">Lifestyle</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mountain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Lifestyle Preferences</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {lifestyleQuestions.length}
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
                    'Continue to Cost'
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
