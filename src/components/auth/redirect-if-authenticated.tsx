'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode
}

export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowPage, setShouldShowPage] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!error && user) {
          // User is authenticated, check farm memberships
          const { data: farmMemberships } = await supabase
            .from('farm_members')
            .select('farm_id')
            .eq('user_id', user.id)
            .limit(1)

          if (!farmMemberships || farmMemberships.length === 0) {
            router.push('/dashboard/setup')
          } else {
            router.push('/dashboard')
          }
          return
        }

        // User is not authenticated, show the page
        setShouldShowPage(true)
      } catch (err) {
        console.error('Auth check error:', err)
        setShouldShowPage(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shouldShowPage) {
    return null // Router will redirect
  }

  return <>{children}</>
}