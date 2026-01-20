'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, RotateCcw, Trash2, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import {
  getUserProfile,
  updateCurrentCity,
  clearAssessmentData,
  deleteAccount,
  getEmailPreferences,
  updateEmailPreferences,
  type EmailPreferences,
} from '@/lib/settings'
import type { UserProfile } from '@/lib/database/types'

function SettingSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, signOut } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    city_alerts: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [currentCity, setCurrentCity] = useState('')
  const [isSavingCity, setIsSavingCity] = useState(false)
  const [citySaveSuccess, setCitySaveSuccess] = useState(false)

  const [isClearingAssessment, setIsClearingAssessment] = useState(false)
  const [clearAssessmentOpen, setClearAssessmentOpen] = useState(false)

  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [isSavingEmailPrefs, setIsSavingEmailPrefs] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Auth protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load user data
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [profileResult, prefsResult] = await Promise.all([
          getUserProfile(),
          getEmailPreferences(),
        ])

        if (cancelled) return

        if (!profileResult.success) {
          setError(profileResult.error || 'Failed to load profile')
        } else {
          setProfile(profileResult.profile ?? null)
          setCurrentCity(profileResult.profile?.current_city ?? '')
        }

        if (prefsResult.success && prefsResult.preferences) {
          setEmailPreferences(prefsResult.preferences)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleSaveCity = async () => {
    setIsSavingCity(true)
    setCitySaveSuccess(false)

    const result = await updateCurrentCity(currentCity.trim())

    if (result.success) {
      setCitySaveSuccess(true)
      setTimeout(() => setCitySaveSuccess(false), 3000)
    } else {
      setError(result.error || 'Failed to save city')
    }

    setIsSavingCity(false)
  }

  const handleClearAssessment = async () => {
    setIsClearingAssessment(true)

    const result = await clearAssessmentData()

    if (result.success) {
      setClearAssessmentOpen(false)
      router.push('/assessment/career')
    } else {
      setError(result.error || 'Failed to clear assessment data')
    }

    setIsClearingAssessment(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setIsDeletingAccount(true)

    const result = await deleteAccount()

    if (result.success) {
      setDeleteAccountOpen(false)
      router.push('/')
      router.refresh()
    } else {
      setError(result.error || 'Failed to delete account')
    }

    setIsDeletingAccount(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const handleToggleCityAlerts = async () => {
    const newPrefs = { ...emailPreferences, city_alerts: !emailPreferences.city_alerts }
    setIsSavingEmailPrefs(true)

    const result = await updateEmailPreferences(newPrefs)

    if (result.success) {
      setEmailPreferences(newPrefs)
    } else {
      setError(result.error || 'Failed to update preferences')
    }

    setIsSavingEmailPrefs(false)
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Current City */}
      <SettingSection
        title="Current City"
        description="Where do you currently live? This is for reference only."
        icon={MapPin}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              id="currentCity"
              type="text"
              placeholder="e.g., San Francisco, CA"
              value={currentCity}
              onChange={(e) => setCurrentCity(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSaveCity} disabled={isSavingCity}>
              {isSavingCity ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {citySaveSuccess && (
            <p className="text-sm text-green-600">City saved successfully!</p>
          )}
        </div>
      </SettingSection>

      {/* Assessment Data */}
      <SettingSection
        title="Assessment Data"
        description="Clear your assessment responses and retake from the beginning"
        icon={RotateCcw}
      >
        <div className="space-y-4">
          {profile?.assessment_complete ? (
            <p className="text-sm text-muted-foreground">
              You have completed the assessment. You can clear your data and start fresh.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t completed the assessment yet.
            </p>
          )}

          <Dialog open={clearAssessmentOpen} onOpenChange={setClearAssessmentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Clear &amp; Retake Assessment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Assessment Data?</DialogTitle>
                <DialogDescription>
                  This will delete all your assessment responses and city match scores.
                  You&apos;ll be redirected to start the assessment again. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setClearAssessmentOpen(false)}
                  disabled={isClearingAssessment}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearAssessment}
                  disabled={isClearingAssessment}
                >
                  {isClearingAssessment ? 'Clearing...' : 'Clear & Retake'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SettingSection>

      {/* Email Preferences */}
      <SettingSection
        title="Email Preferences"
        description="Manage what emails you receive from us"
        icon={Bell}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cityAlerts">City Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when cities matching your preferences have updates
              </p>
            </div>
            <button
              id="cityAlerts"
              role="switch"
              aria-checked={emailPreferences.city_alerts}
              onClick={handleToggleCityAlerts}
              disabled={isSavingEmailPrefs}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                emailPreferences.city_alerts ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  emailPreferences.city_alerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Coming soon: More notification options
          </p>
        </div>
      </SettingSection>

      {/* Logout */}
      <SettingSection
        title="Sign Out"
        description="Sign out of your account on this device"
        icon={LogOut}
      >
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </SettingSection>

      {/* Delete Account */}
      <SettingSection
        title="Delete Account"
        description="Permanently delete your account and all data"
        icon={Trash2}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account?</DialogTitle>
                <DialogDescription>
                  This will permanently delete your account and all associated data including:
                </DialogDescription>
              </DialogHeader>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                <li>Your profile information</li>
                <li>Assessment responses</li>
                <li>City matches and scores</li>
                <li>Saved cities and notes</li>
              </ul>
              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  id="deleteConfirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteAccountOpen(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SettingSection>
    </div>
  )
}
