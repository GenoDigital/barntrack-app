'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Mail } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Passwort zurücksetzen</CardTitle>
            <CardDescription>
              Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen des Passworts zu erhalten
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {success ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>E-Mail versendet!</strong>
                    <p className="mt-2 text-sm">
                      Wir haben Ihnen einen Link zum Zurücksetzen des Passworts an <strong>{email}</strong> gesendet.
                    </p>
                    <p className="mt-2 text-sm">
                      Bitte überprüfen Sie Ihren Posteingang und folgen Sie den Anweisungen in der E-Mail.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@beispiel.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {error && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Der Link zum Zurücksetzen ist 60 Minuten gültig. Falls Sie keine E-Mail erhalten, überprüfen Sie bitte Ihren Spam-Ordner.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!success && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Wird gesendet...' : 'Zurücksetzungslink senden'}
                </Button>
              )}
              <div className="text-sm text-center text-muted-foreground">
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  ← Zurück zur Anmeldung
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
