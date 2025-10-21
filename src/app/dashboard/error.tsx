'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'
import { isAuthError } from '@/lib/auth-error-handler'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if this is an auth error
    if (isAuthError(error)) {
      // Clear session storage and redirect to login
      sessionStorage.clear()
      router.push('/login?message=Your session has expired. Please log in again.')
      return
    }

    // TODO: Log to error monitoring service (e.g., Sentry) in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: { section: 'dashboard' }
    //   })
    // }
  }, [error, router])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Dashboard-Fehler</CardTitle>
              <CardDescription>
                Beim Laden des Dashboards ist ein Fehler aufgetreten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Es tut uns leid, aber ein Problem ist aufgetreten. Dies kann verschiedene Ursachen haben:
          </p>

          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Temporäres Verbindungsproblem</li>
            <li>• Fehlende Berechtigungen</li>
            <li>• Ungültige Daten</li>
          </ul>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs font-semibold mb-2">Entwickler-Info:</p>
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Zum Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Problem besteht weiterhin?{' '}
              <Link href="mailto:support@barntrack.app" className="text-primary hover:underline">
                Support kontaktieren
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
