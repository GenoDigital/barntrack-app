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
  const [invitationToken, setInvitationToken] = useState('')
  const [isInviteMode, setIsInviteMode] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [voucherCode, setVoucherCode] = useState('')
  const [isTrialMode, setIsTrialMode] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [stripePrices, setStripePrices] = useState<any[]>([])
  const [tokenFromUrl, setTokenFromUrl] = useState(false)

  // Additional fields for farm owners
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Read invitation token from URL on mount
  useEffect(() => {
    const invitationParam = searchParams.get('invitation')
    const emailParam = searchParams.get('email')

    if (invitationParam) {
      setInvitationToken(invitationParam)
      setIsInviteMode(true)
      setTokenFromUrl(true)
    }

    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      // Load plan configurations from database
      const { data: planConfigs, error } = await supabase
        .from('plan_configurations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error) throw error

      // For security, we'll store public pricing in the database and sync it with Stripe via admin panel
      // The signup page will only show the public pricing data from our secure database
      // This avoids exposing Stripe API keys or making unauthorized calls
      
      // Use the database pricing which should be kept in sync with Stripe
      // This is secure and doesn't expose any sensitive information
      const plansWithPricing = planConfigs || []
      
      setPlans(plansWithPricing)
      if (plansWithPricing.length > 0) {
        setSelectedPlan(plansWithPricing[0].plan_name)
      }
    } catch (err) {
      console.error('Error loading plans:', err)
    } finally {
      setPlansLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0)
  }


  const getSelectedPlanConfig = () => {
    return plans.find(p => p.plan_name === selectedPlan)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isInviteMode) {
        // Invitation-based signup
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', invitationToken)
          .eq('email', email)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single()

        if (inviteError || !invitation) {
          setError('Ungültiger oder abgelaufener Einladungstoken')
          setLoading(false)
          return
        }

        // Proceed with signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              display_name: displayName,
              signup_source: 'invitation'  // Invitation signups are always members
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // User record is automatically created by database trigger
        // No need to manually insert into users table

        // Mark invitation as used
        await supabase
          .from('invitations')
          .update({ used_at: new Date().toISOString() })
          .eq('id', invitation.id)
      } else {
        // Direct signup (for farm owners) - secure approach
        const autoDisplayName = displayName || `${firstName} ${lastName}`.trim()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              display_name: autoDisplayName,
              first_name: firstName,
              last_name: lastName,
              company_name: companyName,
              street_address: streetAddress,
              postal_code: postalCode,
              city: city,
              phone_number: phoneNumber,
              signup_source: 'direct'  // Indicates this is a direct signup
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // User record is automatically created by secure database trigger
        // Step 1: User creation only - Stripe setup happens after email verification
        console.log('User created successfully. Email verification required.')
        
        // Store plan preference and trial mode for after email verification
        if (data.user) {
          localStorage.setItem('pendingPlanSelection', JSON.stringify({
            isTrialMode,
            selectedPlan,
            voucherCode: voucherCode.trim(),
            userEmail: data.user.email,
            userName: autoDisplayName
          }))
        }
      }

      // Redirect based on signup type
      if (isInviteMode) {
        router.push('/dashboard')
      } else {
        // For farm owners: redirect to login to complete email verification
        // After verification, they'll go to onboarding for plan selection
        router.push('/login?message=Please check your email and click the verification link to complete your account setup.')
      }
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
                ? 'Verwenden Sie Ihren Einladungstoken' 
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
                  disabled={tokenFromUrl}
                >
                  Mit Einladung
                </Button>
                <Button
                  type="button"
                  variant={!isInviteMode ? "default" : "outline"}
                  onClick={() => setIsInviteMode(false)}
                  className="flex-1"
                  disabled={tokenFromUrl}
                >
                  Stallbesitzer
                </Button>
              </div>
              {tokenFromUrl && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Sie wurden eingeladen, einem Betrieb beizutreten. Bitte füllen Sie die Felder unten aus, um Ihr Konto zu erstellen.
                  </p>
                </div>
              )}
              {isInviteMode && (
                <div className="space-y-2">
                  <Label htmlFor="invitationToken">Einladungstoken</Label>
                  <Input
                    id="invitationToken"
                    type="text"
                    placeholder="Ihr Einladungstoken"
                    value={invitationToken}
                    onChange={(e) => setInvitationToken(e.target.value)}
                    required
                    disabled={loading}
                    readOnly={tokenFromUrl}
                    className={tokenFromUrl ? 'bg-muted' : ''}
                  />
                  {tokenFromUrl && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Einladungstoken wurde automatisch aus dem Link übernommen
                    </p>
                  )}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Firma/Hof (optional)</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Hof Mustermann GmbH"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Straße und Hausnummer *</Label>
                    <Input
                      id="streetAddress"
                      type="text"
                      placeholder="Musterstraße 123"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">PLZ *</Label>
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="12345"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="city">Ort *</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Musterstadt"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Telefonnummer *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+49 123 456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Trial vs Paid Mode Selection */}
                  <div className="space-y-3">
                    <Label>Wie möchten Sie starten?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isTrialMode ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setIsTrialMode(true)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-lg">🚀</div>
                          <h4 className="font-medium">10 Tage kostenlos testen</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Probieren Sie alle Features 10 Tage kostenlos aus
                        </p>
                        <div className="mt-2">
                          <div className="text-lg font-bold text-green-600">€0</div>
                          <div className="text-xs text-muted-foreground">für 10 Tage</div>
                        </div>
                      </div>
                      
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          !isTrialMode ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setIsTrialMode(false)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-lg">💳</div>
                          <h4 className="font-medium">Sofort loslegen</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Direkter Zugang mit Ihrem gewählten Plan
                        </p>
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground">Plan wählen ↓</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plan Selection for Farm Owners */}
                  {!isTrialMode && (
                    <div className="space-y-3">
                      <Label>Plan auswählen</Label>
                    {plansLoading ? (
                      <div className="text-center py-4">Pläne werden geladen...</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {plans.map((plan) => {
                          const isSelected = selectedPlan === plan.plan_name
                          const yearlyPrice = formatPrice(plan.yearly_price_cents)
                          const features = []
                          
                          if (plan.max_farms === -1) features.push('Unbegrenzte Betriebe')
                          else features.push(`${plan.max_farms} Betrieb${plan.max_farms > 1 ? 'e' : ''}`)
                          
                          if (plan.max_users_per_farm === -1) features.push('Unbegrenzte Nutzer')
                          else features.push(`${plan.max_users_per_farm} Nutzer pro Betrieb`)
                          
                          if (plan.can_invite_users) features.push('Nutzer einladen')
                          if (plan.has_advanced_analytics) features.push('Erweiterte Auswertungen')
                          if (plan.has_priority_support) features.push('Priority Support')
                          if (plan.has_bulk_import) features.push('Bulk Import')
                          if (plan.has_custom_reports) features.push('Benutzerdefinierte Berichte')
                          if (plan.has_api_access) features.push('API Zugang')
                          
                          return (
                            <div
                              key={plan.plan_name}
                              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedPlan(plan.plan_name)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{plan.display_name}</h4>
                                    {plan.plan_name === 'professional' && (
                                      <Badge variant="secondary">Beliebt</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {plan.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">€{yearlyPrice}</div>
                                  <div className="text-xs text-muted-foreground">
                                    jährliche Abrechnung
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                {features.slice(0, 4).map((feature, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                              
                              {features.length > 4 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  +{features.length - 4} weitere Features
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    </div>
                  )}
                  
                  {/* Voucher Code - only show in paid mode */}
                  {!isTrialMode && (
                    <div className="space-y-2">
                      <Label htmlFor="voucherCode">Gutscheincode (optional)</Label>
                      <Input
                        id="voucherCode"
                        type="text"
                        placeholder="z.B. WELCOME2024"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Haben Sie einen Gutscheincode? Geben Sie ihn hier ein für Rabatte oder kostenlose Monate.
                      </p>
                    </div>
                  )}
                  
                  {/* Trial Information */}
                  {isTrialMode && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-green-600">✨</div>
                        <h4 className="font-medium text-green-800">10 Tage kostenlos testen</h4>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Zugang zu allen Professional Features</li>
                        <li>• Keine Kreditkarte erforderlich</li>
                        <li>• Jederzeit kündbar</li>
                        <li>• Nach 10 Tagen automatisch zum Starter Plan</li>
                      </ul>
                    </div>
                  )}
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
                  readOnly={tokenFromUrl && email !== ''}
                  className={tokenFromUrl && email !== '' ? 'bg-muted' : ''}
                />
                {tokenFromUrl && email && (
                  <p className="text-xs text-muted-foreground">
                    Diese Einladung ist für diese E-Mail-Adresse bestimmt
                  </p>
                )}
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
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? 'Konto wird erstellt...' 
                  : isTrialMode && !isInviteMode 
                    ? '10 Tage kostenlos starten' 
                    : 'Registrieren'
                }
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