'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isInviteMode, setIsInviteMode] = useState(true)

  // Basic fields for farm owners
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  // GDPR Consent
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Read member mode from URL on mount
  useEffect(() => {
    const memberParam = searchParams.get('member')
    const emailParam = searchParams.get('email')

    // Check if this is a member signup (invited user)
    if (memberParam === 'true') {
      setIsInviteMode(true)
    }

    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // GDPR Validation - mandatory consents
    if (!termsAccepted || !privacyAccepted) {
      setError('Bitte akzeptieren Sie die AGB und Datenschutzerklärung, um fortzufahren.')
      setLoading(false)
      return
    }

    try {
      if (isInviteMode) {
        // Member signup (invited user)
        // User will be routed by middleware after email verification
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
            data: {
              display_name: displayName,
              signup_source: 'invitation',  // Invitation signups are always members
              terms_accepted: termsAccepted,
              privacy_accepted: privacyAccepted,
              marketing_consent: marketingConsent
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // User record is automatically created by database trigger
        // User will redeem invitation code after logging in
      } else {
        // Direct signup (for farm owners)
        // User will be routed by middleware after email verification
        const autoDisplayName = displayName || `${firstName} ${lastName}`.trim()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
            data: {
              display_name: autoDisplayName,
              first_name: firstName,
              last_name: lastName,
              signup_source: 'direct',
              terms_accepted: termsAccepted,
              privacy_accepted: privacyAccepted,
              marketing_consent: marketingConsent
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        console.log('User created successfully. Email verification required.')
      }

      // Redirect to login with verification message
      router.push('/login?message=Bitte überprüfen Sie Ihre E-Mail und klicken Sie auf den Bestätigungslink, um Ihr Konto zu aktivieren.')
    } catch (err) {
      console.error('Signup error:', err)
      setError(`Fehler bei der Registrierung: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
            <CardDescription>
              {isInviteMode
                ? 'Registrieren Sie sich als Mitglied - Ihren Einladungscode geben Sie nach der E-Mail-Bestätigung ein'
                : 'Erstellen Sie ein neues Konto als Stallbesitzer'
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={isInviteMode ? "default" : "outline"}
                  onClick={() => setIsInviteMode(true)}
                  className="flex-1"
                >
                  Mit Einladung
                </Button>
                <Button
                  type="button"
                  variant={!isInviteMode ? "default" : "outline"}
                  onClick={() => setIsInviteMode(false)}
                  className="flex-1"
                >
                  Stallbesitzer
                </Button>
              </div>
              {isInviteMode && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ℹ️ Nach der Registrierung und E-Mail-Bestätigung werden Sie aufgefordert, Ihren Einladungscode einzugeben.
                  </p>
                </div>
              )}
              
              {!isInviteMode && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Max"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Mustermann"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="displayName">{isInviteMode ? 'Name' : 'Anzeigename (optional)'}</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={isInviteMode ? 'Max Mustermann' : 'Wird automatisch erstellt'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isInviteMode}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* GDPR Consent Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Datenschutz und Einwilligungen</p>

                  {/* Terms & Conditions - Mandatory */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      disabled={loading}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="terms" className="text-sm">
                      Ich akzeptiere die{' '}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="underline hover:text-primary"
                      >
                        Allgemeinen Geschäftsbedingungen (AGB)
                      </Link>
                      {' '}<span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Privacy Policy - Mandatory */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      disabled={loading}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="privacy" className="text-sm">
                      Ich habe die{' '}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="underline hover:text-primary"
                      >
                        Datenschutzerklärung
                      </Link>
                      {' '}gelesen und akzeptiere sie{' '}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Marketing Consent - Optional */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      disabled={loading}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="marketing" className="text-sm text-muted-foreground">
                      Ich möchte Informationen über neue Funktionen und Angebote per E-Mail erhalten (optional)
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">*</span> Pflichtfeld
                  </p>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Konto wird erstellt...' : 'Registrieren'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Bereits ein Konto?{' '}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Anmelden
                </Link>
              </div>
              <div className="text-sm text-center">
                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                  ← Zurück zur Startseite
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <RedirectIfAuthenticated>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
          <div className="w-full max-w-md px-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Lädt...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </RedirectIfAuthenticated>
  )
}