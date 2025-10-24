'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2, AlertTriangle, Crown, Check } from 'lucide-react'

interface PaidSetupProps {
  onComplete: () => void
}

interface CouponInfo {
  id: string
  name: string | null
  percent_off: number | null
  amount_off: number | null
  currency: string | null
  duration: string
  duration_in_months: number | null
  valid: boolean
  is_full_discount: boolean
}

export function PaidSetup({ onComplete }: PaidSetupProps) {
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [voucherCode, setVoucherCode] = useState('')
  const [validatedCoupon, setValidatedCoupon] = useState<CouponInfo | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadPlans()
  }, [])

  // Handle return from Stripe after adding payment method
  useEffect(() => {
    const paymentMethodAdded = searchParams.get('payment_method_added')
    const pending = localStorage.getItem('pending_onboarding_subscription')

    if (paymentMethodAdded === 'true' && pending) {
      try {
        const { selectedPlan: pendingPlan, voucherCode: pendingVoucher } = JSON.parse(pending)
        localStorage.removeItem('pending_onboarding_subscription')

        // Set the form state and auto-trigger subscription creation
        setSelectedPlan(pendingPlan)
        setVoucherCode(pendingVoucher || '')
        completePendingSubscription(pendingPlan, pendingVoucher)
      } catch (err) {
        console.error('Error parsing pending subscription:', err)
        localStorage.removeItem('pending_onboarding_subscription')
      }
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const completePendingSubscription = async (pendingPlan: string, pendingVoucher: string) => {
    setCreating(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Benutzer nicht gefunden')
      }

      // Get price ID from vault
      const { data: priceIdData, error: priceError } = await supabase
        .rpc('get_stripe_price_id', { plan_name_input: pendingPlan })

      if (priceError || !priceIdData) {
        throw new Error(`Fehler beim Abrufen der Preisinformationen: ${priceError?.message || 'Price ID not found'}`)
      }

      // Create subscription (customer should already exist from previous attempt)
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc('create_subscription_via_wrapper', {
        price_id: priceIdData,
        trial_days: 0,
        coupon_id: pendingVoucher || null
      })

      if (subscriptionError) {
        throw new Error(`Fehler beim Erstellen des Abonnements: ${subscriptionError.message}`)
      }

      if (subscriptionData && !subscriptionData.success) {
        throw new Error(subscriptionData.error || 'Fehler beim Erstellen des Abonnements')
      }

      // Success! Proceed to farm setup
      onComplete()

    } catch (err) {
      console.error('Pending subscription error:', err)
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setCreating(false)
    }
  }

  const loadPlans = async () => {
    try {
      // Fetch prices from Stripe API (single source of truth for pricing)
      const { data: stripePrices, error: pricesError } = await supabase.rpc('get_stripe_prices_for_products')

      if (pricesError) {
        console.error('Error fetching Stripe prices:', pricesError)
        throw new Error('Fehler beim Laden der Preise von Stripe')
      }

      // Fetch plan configurations (features, limits, display info - NOT prices)
      const { data: planConfigs, error: configError } = await supabase
        .from('plan_configurations')
        .select('plan_name, display_name, description, stripe_product_id, max_farms, max_users_per_farm, can_invite_users, has_advanced_analytics, has_priority_support, has_bulk_import, has_custom_reports, has_api_access, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      if (configError) throw configError

      // Match Stripe prices with plan configurations by product_id
      const matchedPlans = planConfigs?.map(config => {
        const stripePrice = stripePrices?.find((p: any) => p.product_id === config.stripe_product_id && p.recurring_interval === 'year')
        return {
          ...config,
          stripe_price_id: stripePrice?.price_id,
          yearly_price_cents: stripePrice?.unit_amount || 0,  // Price from Stripe, not database
        }
      }) || []

      setPlans(matchedPlans)
      if (matchedPlans.length > 0) {
        // Default to professional plan
        const professional = matchedPlans.find(p => p.plan_name === 'professional')
        if (professional) {
          setSelectedPlan(professional.plan_name)
        } else {
          setSelectedPlan(matchedPlans[0].plan_name)
        }
      }
    } catch (err) {
      console.error('Error loading plans:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Pläne')
    } finally {
      setPlansLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0)
  }

  const validateCoupon = async (code: string) => {
    if (!code || code.trim() === '') {
      setValidatedCoupon(null)
      setCouponError(null)
      return
    }

    setValidatingCoupon(true)
    setCouponError(null)

    try {
      const { data, error } = await supabase.rpc('validate_stripe_coupon', {
        coupon_code: code.trim()
      })

      if (error) {
        setCouponError('Fehler beim Validieren des Gutscheincodes')
        setValidatedCoupon(null)
        return
      }

      if (data?.success && data.coupon) {
        setValidatedCoupon(data.coupon)
        setCouponError(null)
      } else {
        setCouponError(data?.error || 'Ungültiger Gutscheincode')
        setValidatedCoupon(null)
      }
    } catch (err) {
      console.error('Error validating coupon:', err)
      setCouponError('Fehler beim Validieren des Gutscheincodes')
      setValidatedCoupon(null)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleCreateSubscription = async () => {
    setCreating(true)
    setError(null)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Benutzer nicht gefunden')
      }

      // Step 1: Create Stripe customer
      console.log('Creating Stripe customer...')
      const { data: customerData, error: customerError } = await supabase.rpc('create_stripe_customer_via_wrapper', {
        customer_email: user.email,
        customer_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        customer_description: 'Paid signup'
      })

      if (customerError) {
        throw new Error(`Fehler beim Erstellen des Stripe-Kunden: ${customerError.message}`)
      }

      console.log('Stripe customer created:', customerData)

      // Step 2: Check if we need payment method
      // Skip payment method requirement if coupon is 100% off
      const needsPaymentMethod = !validatedCoupon?.is_full_discount

      if (needsPaymentMethod) {
        const { data: hasPaymentMethod, error: pmError } = await supabase.rpc('user_has_payment_method')

        if (pmError) {
          console.error('Error checking payment method:', pmError)
          throw new Error('Fehler beim Überprüfen der Zahlungsmethode')
        }

        if (!hasPaymentMethod) {
          // No payment method - redirect to Stripe to add one
          const { data: checkoutData, error: checkoutError } = await supabase.rpc('create_payment_method_checkout_session')

          if (checkoutError || !checkoutData?.checkout_url) {
            console.error('Error creating checkout session:', checkoutError)
            throw new Error('Fehler beim Erstellen der Checkout-Session')
          }

          // Store pending subscription info to complete after payment method is added
          localStorage.setItem('pending_onboarding_subscription', JSON.stringify({
            selectedPlan,
            voucherCode: voucherCode.trim()
          }))

          // Redirect to Stripe to add payment method
          window.location.href = checkoutData.checkout_url
          return
        }
      }

      // Step 3: Get price ID from vault
      console.log('Fetching price ID for plan:', selectedPlan)
      const { data: priceIdData, error: priceError } = await supabase
        .rpc('get_stripe_price_id', { plan_name_input: selectedPlan })

      if (priceError || !priceIdData) {
        throw new Error(`Fehler beim Abrufen der Preisinformationen: ${priceError?.message || 'Price ID not found'}`)
      }

      console.log('Using price ID from vault:', priceIdData)

      // Step 4: Create subscription
      console.log('Creating subscription with voucher:', voucherCode || 'none')
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc('create_subscription_via_wrapper', {
        price_id: priceIdData,
        trial_days: 0,
        coupon_id: voucherCode.trim() || null
      })

      if (subscriptionError) {
        throw new Error(`Fehler beim Erstellen des Abonnements: ${subscriptionError.message}`)
      }

      console.log('Subscription created:', subscriptionData)

      // Check if the RPC function returned success: false
      if (subscriptionData && !subscriptionData.success) {
        throw new Error(subscriptionData.error || 'Fehler beim Erstellen des Abonnements')
      }

      // Success! Proceed to farm setup
      onComplete()

    } catch (err) {
      console.error('Paid setup error:', err)
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setCreating(false)
    }
  }

  if (plansLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Pläne werden geladen...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Crown className="h-6 w-6 text-primary" />
          Wählen Sie Ihren Plan
        </CardTitle>
        <CardDescription>
          Alle Pläne können jederzeit gekündigt werden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Selection */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.plan_name
            const yearlyPrice = formatPrice(plan.yearly_price_cents)
            const monthlyPrice = (plan.yearly_price_cents / 12 / 100).toFixed(2)
            const features = []

            if (plan.max_farms === -1) features.push('Unbegrenzte Betriebe')
            else features.push(`${plan.max_farms} Betrieb${plan.max_farms > 1 ? 'e' : ''}`)

            if (plan.max_users_per_farm === -1) features.push('Unbegrenzte Nutzer')
            else features.push(`${plan.max_users_per_farm} Nutzer/Betrieb`)

            if (plan.can_invite_users) features.push('Nutzer einladen')
            if (plan.has_advanced_analytics) features.push('Erweiterte Auswertungen')
            if (plan.has_priority_support) features.push('Priority Support')
            if (plan.has_bulk_import) features.push('Bulk Import')
            if (plan.has_custom_reports) features.push('Custom Reports')
            if (plan.has_api_access) features.push('API Zugang')

            return (
              <div
                key={plan.plan_name}
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(plan.plan_name)}
              >
                {plan.plan_name === 'professional' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Beliebt</Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold mb-2">{plan.display_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-2">
                    <div className="text-3xl font-bold">€{yearlyPrice}</div>
                    <div className="text-sm text-muted-foreground">pro Jahr</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ca. €{monthlyPrice}/Monat
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ausgewählt</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Voucher Code */}
        <div className="space-y-2">
          <Label htmlFor="voucherCode">Gutscheincode (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="voucherCode"
              type="text"
              placeholder="z.B. WELCOME2024"
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value.toUpperCase())
                setValidatedCoupon(null)
                setCouponError(null)
              }}
              disabled={creating || validatingCoupon}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => validateCoupon(voucherCode)}
              disabled={!voucherCode || creating || validatingCoupon}
            >
              {validatingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Prüfen'
              )}
            </Button>
          </div>

          {/* Coupon validation feedback */}
          {validatedCoupon && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>✓ Gutscheincode gültig!</strong>
                {validatedCoupon.percent_off && (
                  <div className="text-sm mt-1">
                    {validatedCoupon.percent_off}% Rabatt
                    {validatedCoupon.duration === 'forever' && ' für immer'}
                    {validatedCoupon.duration === 'once' && ' für den ersten Monat'}
                    {validatedCoupon.duration === 'repeating' && ` für ${validatedCoupon.duration_in_months} Monate`}
                  </div>
                )}
                {validatedCoupon.is_full_discount && (
                  <div className="text-sm mt-1 font-semibold">
                    🎉 Keine Zahlungsmethode erforderlich!
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {couponError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{couponError}</AlertDescription>
            </Alert>
          )}

          {!validatedCoupon && !couponError && (
            <p className="text-xs text-muted-foreground">
              Haben Sie einen Gutscheincode? Geben Sie ihn hier ein und klicken Sie auf "Prüfen".
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <Button
            onClick={handleCreateSubscription}
            disabled={creating}
            size="lg"
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abonnement wird erstellt...
              </>
            ) : validatedCoupon?.is_full_discount ? (
              <>
                Kostenloses Abonnement aktivieren
              </>
            ) : (
              <>
                Weiter zur Zahlung
              </>
            )}
          </Button>
          {!validatedCoupon?.is_full_discount && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Sie werden zur sicheren Stripe-Zahlungsseite weitergeleitet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
