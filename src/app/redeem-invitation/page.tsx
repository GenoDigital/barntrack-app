'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Gift, AlertTriangle, CheckCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

function RedeemInvitationContent() {
  const router = useRouter()
  const [invitationCode, setInvitationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Sie müssen angemeldet sein')
        setLoading(false)
        return
      }

      // Trim and validate code format
      const code = invitationCode.trim()

      if (!code) {
        setError('Bitte geben Sie einen Einladungscode ein')
        setLoading(false)
        return
      }

      // Call the process_invitation database function with the code
      const { data, error: inviteError } = await supabase
        .rpc('process_invitation', { invitation_token: code })

      if (inviteError) {
        console.error('Invitation error:', inviteError)
        setError(`Fehler beim Einlösen: ${inviteError.message}`)
        setLoading(false)
        return
      }

      const result = data as { success: boolean; error?: string; farm_id?: string; role?: string }

      if (!result.success) {
        setError(result.error || 'Einladungscode konnte nicht eingelöst werden')
        setLoading(false)
        return
      }

      // Success!
      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      console.error('Error redeeming invitation:', err)
      setError(`Unerwarteter Fehler: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Erfolgreich eingelöst!
            </CardTitle>
            <CardDescription>
              Sie wurden erfolgreich zum Betrieb hinzugefügt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                <p className="font-medium">✓ Einladung erfolgreich eingelöst</p>
                <p className="text-sm mt-2">Sie werden zum Dashboard weitergeleitet...</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Einladungscode einlösen
          </CardTitle>
          <CardDescription>
            Geben Sie Ihren Einladungscode ein, um dem Betrieb beizutreten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRedeem} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Einladungscode</Label>
              <Input
                id="code"
                type="text"
                placeholder="z.B. abc123def456..."
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                disabled={loading}
                required
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Sie finden den Code in Ihrer Einladungs-E-Mail
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird eingelöst...
                </>
              ) : (
                'Code einlösen'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Keinen Code erhalten?</strong>
              <br />
              Überprüfen Sie Ihren Spam-Ordner oder kontaktieren Sie den Betriebsinhaber.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RedeemInvitationPage() {
  return (
    <ProtectedRoute>
      <RedeemInvitationContent />
    </ProtectedRoute>
  )
}
