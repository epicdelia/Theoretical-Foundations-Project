'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, ChevronRight, SkipForward } from 'lucide-react'

interface Question {
  id: string
  text: string
  type: 'slider' | 'multiple-choice'
  options?: { value: number; label: string }[]
  minLabel?: string
  maxLabel?: string
}

const careerQuestions: Question[] = [
  {
    id: 'industry',
    text: 'What industry or field are you in or interested in?',
    type: 'multiple-choice',
    options: [
      { value: 1, label: 'Technology / Software' },
      { value: 2, label: 'Finance / Business' },
      { value: 3, label: 'Healthcare / Medical' },
      { value: 4, label: 'Creative / Arts / Media' },
      { value: 5, label: 'Education / Research' },
    ],
  },
  {
    id: 'remote-preference',
    text: 'What is your preferred work environment?',
    type: 'slider',
    minLabel: 'Fully Remote',
    maxLabel: 'Fully In-Office',
  },
  {
    id: 'salary-expectations',
    text: 'What are your salary expectations?',
    type: 'multiple-choice',
    options: [
      { value: 1, label: 'Under $50,000' },
      { value: 2, label: '$50,000 - $75,000' },
      { value: 3, label: '$75,000 - $100,000' },
      { value: 4, label: '$100,000 - $150,000' },
      { value: 5, label: 'Over $150,000' },
    ],
  },
  {
    id: 'career-growth',
    text: 'How important is career growth and advancement to you?',
    type: 'slider',
    minLabel: 'Not Important',
    maxLabel: 'Very Important',
  },
  {
    id: 'company-type',
    text: 'What type of company do you prefer?',
    type: 'multiple-choice',
    options: [
      { value: 1, label: 'Early-stage Startup' },
      { value: 2, label: 'Growth-stage Startup' },
      { value: 3, label: 'Mid-size Company' },
      { value: 4, label: 'Large Corporation' },
      { value: 5, label: 'No Preference' },
    ],
  },
]

const NEUTRAL_VALUE = 3

export default function CareerAssessmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = careerQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === careerQuestions.length - 1
  const questionProgress = ((currentQuestionIndex + 1) / careerQuestions.length) * 100

  const handleSliderChange = (value: number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value[0],
    }))
  }

  const handleMultipleChoiceSelect = (value: number) => {
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

  const saveResponses = async () => {
    if (!user) {
      setError('You must be logged in to save your responses')
      return false
    }

    const supabase = createClient()

    const responses = Object.entries(answers).map(([questionId, answerValue]) => ({
      user_id: user.id,
      category: 'career',
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

      // Ensure current question is answered with neutral if not answered
      if (answers[currentQuestion.id] === undefined) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: NEUTRAL_VALUE,
        }))
      }

      const success = await saveResponses()
      setIsSubmitting(false)

      if (success) {
        router.push('/assessment/lifestyle')
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
            <span className="text-muted-foreground">Section 1 of 4</span>
            <span className="font-medium">Career</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Career Goals</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {careerQuestions.length}
                </CardDescription>
              </div>
            </div>
            {/* Question Progress */}
            <Progress value={questionProgress} className="mt-4 h-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>

            {currentQuestion.type === 'slider' && (
              <div className="space-y-4 pt-4">
                <Slider
                  value={[currentAnswer ?? 3]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={5}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentQuestion.minLabel}</span>
                  <span>{currentQuestion.maxLabel}</span>
                </div>
              </div>
            )}

            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMultipleChoiceSelect(option.value)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                      currentAnswer === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {option.label}
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
              <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                <SkipForward className="mr-2 h-4 w-4" />
                Skip
              </Button>
              <Button onClick={handleNext} disabled={!canProceed || isSubmitting}>
                {isSubmitting ? (
                  'Saving...'
                ) : isLastQuestion ? (
                  'Continue to Lifestyle'
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
