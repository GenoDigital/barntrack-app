'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ClearSessionPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'clearing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const clearSession = async () => {
    setStatus('clearing')
    setMessage('Clearing session data...')

    try {
      // Clear all Supabase-related storage
      const keysToRemove: string[] = []

      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('Removed from localStorage:', key)
      })

      // Check sessionStorage
      const sessionKeysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionKeysToRemove.push(key)
        }
      }

      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key)
        console.log('Removed from sessionStorage:', key)
      })

      // Sign out via Supabase
      const supabase = createClient()
      await supabase.auth.signOut()

      setStatus('success')
      setMessage(`Cleared ${keysToRemove.length + sessionKeysToRemove.length} items. Redirecting to login...`)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Error clearing session:', error)
      setStatus('error')
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  useEffect(() => {
    // Auto-clear on mount
    clearSession()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'clearing' && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === 'error' && <AlertTriangle className="h-12 w-12 text-red-600" />}
          </div>
          <CardTitle>Session Reset</CardTitle>
          <CardDescription>
            {status === 'clearing' && 'Clearing corrupted session data...'}
            {status === 'success' && 'Session cleared successfully!'}
            {status === 'error' && 'An error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            {message}
          </p>

          {status === 'error' && (
            <Button onClick={clearSession} className="w-full">
              Try Again
            </Button>
          )}

          {status === 'success' && (
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
