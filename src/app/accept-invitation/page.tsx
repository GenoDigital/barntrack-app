'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)
  const [farmId, setFarmId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    processInvitation()
  }, [])

  const processInvitation = async () => {
    try {
      const token = searchParams.get('token')

      if (!token) {
        setError('Kein Einladungstoken gefunden')
        setStatus('error')
        return
      }

      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Sie müssen angemeldet sein, um die Einladung anzunehmen')
        setStatus('error')
        return
      }

      // Call the process_invitation database function
      const { data, error: inviteError } = await supabase
        .rpc('process_invitation', { invitation_token: token })

      if (inviteError) {
        setError(`Fehler beim Verarbeiten der Einladung: ${inviteError.message}`)
        setStatus('error')
        return
      }

      const result = data as { success: boolean; error?: string; farm_id?: string; role?: string }

      if (!result.success) {
        setError(result.error || 'Unbekannter Fehler beim Verarbeiten der Einladung')
        setStatus('error')
        return
      }

      // Success!
      setFarmId(result.farm_id || null)
      setRole(result.role || null)
      setStatus('success')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      setError(`Unerwarteter Fehler: ${err instanceof Error ? err.message : String(err)}`)
      setStatus('error')
    }
  }

  const handleRetry = () => {
    setStatus('processing')
    setError(null)
    processInvitation()
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Einladung wird verarbeitet...
            </CardTitle>
            <CardDescription>
              Bitte warten Sie, während wir Ihre Einladung verarbeiten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                Einladungstoken wird überprüft...
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                Berechtigungen werden konfiguriert...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Fehler bei der Verarbeitung
            </CardTitle>
            <CardDescription>
              Ihre Einladung konnte nicht verarbeitet werden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                Erneut versuchen
              </Button>
              <Button onClick={handleGoToDashboard} className="flex-1">
                Zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Einladung erfolgreich angenommen!
          </CardTitle>
          <CardDescription>
            Sie wurden erfolgreich zum Betrieb hinzugefügt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <UserPlus className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">✓ Sie wurden dem Betrieb hinzugefügt</p>
                {role && (
                  <p className="text-sm">
                    Ihre Rolle: <span className="font-medium capitalize">{role}</span>
                  </p>
                )}
                <p className="text-sm">Sie werden in Kürze zum Dashboard weitergeleitet...</p>
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={handleGoToDashboard} className="w-full">
            Jetzt zum Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Lädt...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <AcceptInvitationContent />
      </Suspense>
    </ProtectedRoute>
  )
}
