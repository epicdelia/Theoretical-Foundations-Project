'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export function UserMenu() {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {user.email}
      </span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  )
}
