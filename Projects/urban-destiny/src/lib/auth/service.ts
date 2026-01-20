import { createClient } from '@/lib/supabase/client'
import type { AuthError, User, Session } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

export interface SessionResult {
  session: Session | null
  user: User | null
  error: AuthError | null
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  return {
    user: data.user,
    error,
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    user: data.user,
    error,
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  return { error }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<SessionResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getSession()

  return {
    session: data.session,
    user: data.session?.user ?? null,
    error,
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()

  return {
    user: data.user,
    error,
  }
}

/**
 * Reset password - sends email with reset link
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  })

  return { error }
}

/**
 * Update user password (when logged in or with recovery token)
 */
export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return {
    user: data.user,
    error,
  }
}
