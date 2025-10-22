'use client'

import { useEffect } from 'react'

/**
 * Auth Error Boundary
 *
 * Catches and recovers from Supabase authentication errors
 * Redirects to clear-session page to fix corrupted storage
 */
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for Supabase auth errors
    const handleError = (error: ErrorEvent) => {
      const message = error.message || error.toString()

      // Check if it's a Supabase auth error
      if (
        message.includes('Cannot create property') ||
        message.includes('_recoverAndRefresh') ||
        message.includes('SupabaseAuthClient') ||
        message.includes('Invalid Refresh Token')
      ) {
        console.error('Detected Supabase auth error, redirecting to session reset...')

        // Redirect to clear-session page
        window.location.href = '/clear-session'
      }
    }

    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('error', handleError)
    }
  }, [])

  return <>{children}</>
}
