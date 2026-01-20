'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, DollarSign, SkipForward } from 'lucide-react'

interface CostOption {
  value: number
  label: string
  description?: string
  icon?: string
}

interface Question {
  id: string
  text: string
  type: 'options' | 'slider'
  options?: CostOption[]
  sliderConfig?: {
    min: number
    max: number
    step: number
    formatValue: (value: number) => string
  }
}

const costQuestions: Question[] = [
  {
    id: 'monthly-budget',
    text: 'What is your monthly budget range for living expenses?',
    type: 'slider',
    sliderConfig: {
      min: 1000,
      max: 10000,
      step: 500,
      formatValue: (value: number) => `$${value.toLocaleString()}`,
    },
  },
  {
    id: 'housing-priority',
    text: 'How important is housing quality and space to you?',
    options: [
      { value: 1, label: 'Not Important', description: 'Minimal space is fine, prioritize savings', icon: '🏠' },
      { value: 2, label: 'Slightly Important', description: 'Basic amenities are sufficient', icon: '🏢' },
      { value: 3, label: 'Moderately Important', description: 'Good balance of space and cost', icon: '🏡' },
      { value: 4, label: 'Very Important', description: 'Quality housing is a priority', icon: '🏘️' },
      { value: 5, label: 'Essential', description: 'Premium housing is non-negotiable', icon: '🏰' },
    ],
    type: 'options',
  },
  {
    id: 'dining-frequency',
    text: 'How often do you dine out or order food delivery?',
    options: [
      { value: 1, label: 'Rarely', description: 'I cook almost all my meals', icon: '🍳' },
      { value: 2, label: 'Occasionally', description: 'A few times a month', icon: '🍽️' },
      { value: 3, label: 'Weekly', description: 'Once or twice a week', icon: '🍕' },
      { value: 4, label: 'Frequently', description: 'Several times a week', icon: '🍜' },
      { value: 5, label: 'Daily', description: 'I eat out most meals', icon: '🍔' },
    ],
    type: 'options',
  },
  {
    id: 'transportation-needs',
    text: 'What are your transportation needs and preferences?',
    options: [
      { value: 1, label: 'Walk/Bike Only', description: 'No car needed, minimal transit', icon: '🚶' },
      { value: 2, label: 'Public Transit', description: 'Rely on buses and trains', icon: '🚇' },
      { value: 3, label: 'Mixed', description: 'Combination of transit and ride-share', icon: '🚌' },
      { value: 4, label: 'Car Occasional', description: 'Own a car but use sparingly', icon: '🚗' },
      { value: 5, label: 'Car Essential', description: 'Need a car for daily commute', icon: '🚙' },
    ],
    type: 'options',
  },
  {
    id: 'savings-goals',
    text: 'How much do you want to save each month?',
    options: [
      { value: 1, label: 'Minimal', description: 'Focus on experiences, save what\'s left', icon: '💫' },
      { value: 2, label: 'Some', description: 'Save 5-10% of income', icon: '💰' },
      { value: 3, label: 'Moderate', description: 'Save 10-20% of income', icon: '📈' },
      { value: 4, label: 'Significant', description: 'Save 20-30% of income', icon: '🏦' },
      { value: 5, label: 'Maximum', description: 'Save as much as possible, 30%+', icon: '💎' },
    ],
    type: 'options',
  },
]

const NEUTRAL_VALUE = 3
const DEFAULT_BUDGET = 3000

function normalizeSliderValue(value: number, config: Question['sliderConfig']): number {
  if (!config) return NEUTRAL_VALUE
  const range = config.max - config.min
  const normalized = ((value - config.min) / range) * 4 + 1
  return Math.round(normalized)
}

export default function CostAssessmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [sliderValue, setSliderValue] = useState(DEFAULT_BUDGET)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = costQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === costQuestions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0
  const questionProgress = ((currentQuestionIndex + 1) / costQuestions.length) * 100

  const handleOptionSelect = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
    const normalizedValue = normalizeSliderValue(value[0], currentQuestion.sliderConfig)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: normalizedValue,
    }))
  }

  const handleSkip = () => {
    if (currentQuestion.type === 'slider') {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: NEUTRAL_VALUE,
      }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: NEUTRAL_VALUE,
      }))
    }
    handleNext()
  }

  const handleBack = () => {
    if (isFirstQuestion) {
      router.push('/assessment/lifestyle')
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
      category: 'cost',
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
        router.push('/assessment/happiness')
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
            <span className="text-muted-foreground">Section 3 of 4</span>
            <span className="font-medium">Cost of Living</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Cost of Living</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {costQuestions.length}
                </CardDescription>
              </div>
            </div>
            {/* Question Progress */}
            <Progress value={questionProgress} className="mt-4 h-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>

            {currentQuestion.type === 'slider' && currentQuestion.sliderConfig && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">
                    {currentQuestion.sliderConfig.formatValue(sliderValue)}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">per month</p>
                </div>
                <div className="px-2">
                  <Slider
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    min={currentQuestion.sliderConfig.min}
                    max={currentQuestion.sliderConfig.max}
                    step={currentQuestion.sliderConfig.step}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>{currentQuestion.sliderConfig.formatValue(currentQuestion.sliderConfig.min)}</span>
                    <span>{currentQuestion.sliderConfig.formatValue(currentQuestion.sliderConfig.max)}</span>
                  </div>
                </div>
              </div>
            )}

            {currentQuestion.type === 'options' && currentQuestion.options && (
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
            )}

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
                    'Continue to Happiness'
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
