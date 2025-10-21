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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for URL message parameter
  useEffect(() => {
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(urlMessage)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md px-4">
        <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {message && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
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
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Anmeldung läuft...' : 'Anmelden'}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                  Noch kein Konto?{' '}
                  <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                    Registrieren
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

export default function LoginPage() {
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
        <LoginForm />
      </Suspense>
    </RedirectIfAuthenticated>
  )
}