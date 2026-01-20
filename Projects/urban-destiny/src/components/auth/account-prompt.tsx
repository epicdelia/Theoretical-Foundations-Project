'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

interface AccountPromptProps {
  onDismiss?: () => void
  showDismiss?: boolean
}

export function AccountPrompt({ onDismiss, showDismiss = true }: AccountPromptProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Don't show if user is already logged in
  if (isLoading || user) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-primary/5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Save your results</CardTitle>
        <CardDescription>
          Create a free account to save your city matches, compare options, and
          track your preferences over time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            <span>Save and access your city matches anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            <span>Compare cities side-by-side</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            <span>Track changes in your preferences</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => router.push('/signup')}
        >
          Create free account
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/login')}
        >
          I already have an account
        </Button>
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onDismiss}
          >
            Continue without account
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
