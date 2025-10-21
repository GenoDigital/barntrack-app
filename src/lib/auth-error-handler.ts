/**
 * Auth Error Handler
 *
 * Provides utilities for handling authentication errors gracefully,
 * especially during session timeouts or expired tokens.
 */

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Safely get the current user with error handling
 * Returns null on any error and optionally redirects to login
 */
export async function safeGetUser(options?: {
  redirectOnError?: boolean
  onError?: (error: Error) => void
}): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.warn('Auth error in safeGetUser:', error.message)

      // Handle auth-specific errors
      if (isAuthError(error)) {
        handleAuthError(error, options?.redirectOnError)
      }

      if (options?.onError) {
        options.onError(error)
      }

      return null
    }

    return user
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Exception in safeGetUser:', err)

    if (isAuthError(err)) {
      handleAuthError(err, options?.redirectOnError)
    }

    if (options?.onError) {
      options.onError(err)
    }

    return null
  }
}

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: Error | { message?: string }): boolean {
  const message = error.message?.toLowerCase() || ''

  // Common auth error patterns
  const authErrorPatterns = [
    'jwt',
    'token',
    'session',
    'unauthorized',
    'unauthenticated',
    'expired',
    'invalid',
    'not authenticated',
    'no session',
    'auth'
  ]

  return authErrorPatterns.some(pattern => message.includes(pattern))
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: Error | { message?: string }, shouldRedirect = true) {
  console.warn('Auth error detected:', error.message)

  if (shouldRedirect && typeof window !== 'undefined') {
    // Clear any stale data
    sessionStorage.clear()

    // Redirect to login with a message
    const currentPath = window.location.pathname
    const returnUrl = currentPath !== '/login' && currentPath !== '/signup'
      ? `?returnUrl=${encodeURIComponent(currentPath)}`
      : ''

    window.location.href = `/login${returnUrl}`
  }
}

/**
 * Setup global error listener for auth errors
 * Call this once in your app layout or root component
 */
export function setupAuthErrorListener() {
  if (typeof window === 'undefined') return

  const supabase = createClient()

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id)

    // Handle sign out
    if (event === 'SIGNED_OUT') {
      console.log('User signed out, redirecting to login...')
      window.location.href = '/login'
    }

    // Handle token refresh errors
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('Token refresh failed, session lost')
      handleAuthError(new Error('Token refresh failed'))
    }

    // Handle user deletion
    if (event === 'USER_DELETED') {
      console.log('User deleted, redirecting to login...')
      window.location.href = '/login'
    }
  })

  return () => subscription.unsubscribe()
}

/**
 * Check if the current session is still valid
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return false
    }

    // Check if session is expired
    const expiresAt = session.expires_at
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Refresh the session if it's about to expire
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return false
    }

    // Refresh if session expires in less than 5 minutes
    const expiresAt = session.expires_at
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt && (expiresAt * 1000 - Date.now()) < fiveMinutes) {
      console.log('Session expiring soon, refreshing...')
      const { error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Failed to refresh session:', refreshError)
        return false
      }

      console.log('Session refreshed successfully')
      return true
    }

    return true
  } catch (error) {
    console.error('Error checking/refreshing session:', error)
    return false
  }
}
