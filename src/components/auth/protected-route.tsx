'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

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
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
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
        console.error('Auth check error:', err)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
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