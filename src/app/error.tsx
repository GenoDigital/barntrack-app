'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Global error:', error)

    // TODO: Log to error monitoring service (e.g., Sentry) in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error)
    // }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold">Etwas ist schiefgelaufen</h2>
          <p className="text-muted-foreground">
            Es tut uns leid, aber ein unerwarteter Fehler ist aufgetreten.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Problem besteht weiterhin?{' '}
            <Link href="mailto:support@barntrack.app" className="text-primary hover:underline">
              Kontaktieren Sie den Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
