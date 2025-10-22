'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Ungültiger oder abgelaufener Link')
        setTimeout(() => router.push('/reset-password'), 2000)
      }
    }
    checkSession()
  }, [router, supabase.auth])

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = []
    if (pwd.length < 8) {
      errors.push('Mindestens 8 Zeichen')
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Mindestens ein Großbuchstabe')
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Mindestens ein Kleinbuchstabe')
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Mindestens eine Zahl')
    }
    return errors
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setValidationErrors(validatePassword(value))
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    // Validate password strength
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setError('Passwort erfüllt nicht alle Anforderungen')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      toast.success('Passwort erfolgreich aktualisiert')
      setTimeout(() => {
        router.push('/login?message=Passwort erfolgreich zurückgesetzt. Bitte melden Sie sich an.')
      }, 2000)
    }
  }

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    const errors = validationErrors.length
    if (password.length === 0) return { label: '', color: '', width: '0%' }
    if (errors === 0) return { label: 'Stark', color: 'bg-green-500', width: '100%' }
    if (errors <= 2) return { label: 'Mittel', color: 'bg-yellow-500', width: '66%' }
    return { label: 'Schwach', color: 'bg-red-500', width: '33%' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Neues Passwort festlegen</CardTitle>
            <CardDescription>
              Wählen Sie ein sicheres neues Passwort für Ihr Konto
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              {success ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Passwort erfolgreich aktualisiert!</strong>
                    <p className="mt-2 text-sm">
                      Sie werden in Kürze zur Anmeldeseite weitergeleitet...
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Neues Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Passwortstärke:</span>
                          <span className={`font-medium ${
                            strength.label === 'Stark' ? 'text-green-600' :
                            strength.label === 'Mittel' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: strength.width }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {validationErrors.length > 0 && password.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <p className="font-medium mb-2">Passwortanforderungen:</p>
                        <ul className="text-sm space-y-1">
                          {validationErrors.map((err, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-red-500">✗</span> {err}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!success && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || validationErrors.length > 0 || password !== confirmPassword}
                >
                  {loading ? 'Wird aktualisiert...' : 'Passwort aktualisieren'}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
