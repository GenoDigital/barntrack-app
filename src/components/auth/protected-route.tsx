'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { safeGetUser, isAuthError } from '@/lib/auth-error-handler'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresFarm?: boolean
}

export function ProtectedRoute({ children, requiresFarm = false }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use safe getUser that handles auth errors
        const user = await safeGetUser({
          redirectOnError: false, // We'll handle redirect ourselves
          onError: (error) => {
            if (isAuthError(error)) {
              router.push('/login?message=Your session has expired. Please log in again.')
            }
          }
        })

        if (!user) {
          router.push('/login')
          return
        }

        setIsAuthenticated(true)

        if (requiresFarm) {
          // Check if user has farm memberships
          const { data: farmMemberships } = await supabase
            .from('farm_members')
            .select('farm_id')
            .eq('user_id', user.id)
            .limit(1)

          if (!farmMemberships || farmMemberships.length === 0) {
            router.push('/dashboard/setup')
            return
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        if (isAuthError(error)) {
          router.push('/login?message=Your session has expired. Please log in again.')
        } else {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login?message=You have been signed out.')
      }

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        router.push('/login?message=Your session has expired. Please log in again.')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase, requiresFarm])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will redirect
  }

  return <>{children}</>
}