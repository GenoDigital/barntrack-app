'use client'

import { useState, useEffect } from 'react'
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

export function PaidSetup({ onComplete }: PaidSetupProps) {
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [voucherCode, setVoucherCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data: planConfigs, error } = await supabase
        .from('plan_configurations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error

      setPlans(planConfigs || [])
      if (planConfigs && planConfigs.length > 0) {
        // Default to professional plan
        const professional = planConfigs.find(p => p.plan_name === 'professional')
        if (professional) {
          setSelectedPlan(professional.plan_name)
        } else {
          setSelectedPlan(planConfigs[0].plan_name)
        }
      }
    } catch (err) {
      console.error('Error loading plans:', err)
      setError('Fehler beim Laden der Pläne')
    } finally {
      setPlansLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0)
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

      // Step 2: Get price ID from vault
      console.log('Fetching price ID for plan:', selectedPlan)
      const { data: priceIdData, error: priceError } = await supabase
        .rpc('get_stripe_price_id', { plan_name_input: selectedPlan })

      if (priceError || !priceIdData) {
        throw new Error(`Fehler beim Abrufen der Preisinformationen: ${priceError?.message || 'Price ID not found'}`)
      }

      console.log('Using price ID from vault:', priceIdData)

      // Step 3: Create subscription
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
          <Input
            id="voucherCode"
            type="text"
            placeholder="z.B. WELCOME2024"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            disabled={creating}
          />
          <p className="text-xs text-muted-foreground">
            Haben Sie einen Gutscheincode? Geben Sie ihn hier ein für Rabatte oder kostenlose Monate.
          </p>
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
            ) : (
              <>
                Weiter zur Zahlung
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Sie werden zur sicheren Stripe-Zahlungsseite weitergeleitet
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
