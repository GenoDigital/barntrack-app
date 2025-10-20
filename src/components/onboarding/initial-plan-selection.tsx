'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Loader2, AlertTriangle } from 'lucide-react'

interface InitialPlanSelectionProps {
  onComplete: () => void
}

export function InitialPlanSelection({ onComplete }: InitialPlanSelectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerCreated, setCustomerCreated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    createStripeCustomer()
  }, [])

  const createStripeCustomer = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Benutzer nicht gefunden')
        return
      }

      // Check if customer already exists
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingSubscription?.stripe_customer_id) {
        // Customer already exists, proceed to plan selection
        setCustomerCreated(true)
        setLoading(false)
        return
      }

      // Create Stripe customer automatically using wrapper
      const { data: customerData, error: customerError } = await supabase.rpc('create_stripe_customer_via_wrapper', {
        customer_email: user.email,
        customer_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        customer_description: null
      })

      if (customerError) {
        console.error('Customer creation error:', customerError)
        setError('Fehler beim Erstellen des Stripe-Kunden')
        return
      }

      if (customerData?.success) {
        console.log('Stripe customer created via wrapper:', customerData.customer_id)

        // Fetch Professional plan price ID from vault
        console.log('Fetching Professional plan price ID from vault...')
        const { data: priceIdData, error: priceError } = await supabase
          .rpc('get_stripe_price_id', { plan_name_input: 'professional' })

        if (priceError || !priceIdData) {
          console.error('Price ID fetch error:', priceError)
          setError('Fehler beim Abrufen der Preisinformationen')
          return
        }

        console.log('Using price ID from vault:', priceIdData)

        // Create default trial subscription (10 days free Professional plan) using wrapper
        console.log('Creating default trial subscription via wrapper...')
        const { data: subscriptionData, error: subscriptionError } = await supabase.rpc('create_subscription_via_wrapper', {
          price_id: priceIdData,
          trial_days: 10,
          coupon_id: null
        })

        if (subscriptionError) {
          console.error('Subscription creation error:', subscriptionError)
          setError('Fehler beim Erstellen der Testversion')
          return
        }

        if (subscriptionData?.success) {
          console.log('Trial subscription created via wrapper:', subscriptionData.subscription_id)
          setCustomerCreated(true)
        } else {
          setError('Fehler beim Aktivieren der Testversion')
        }
      } else {
        setError('Unerwarteter Fehler beim Erstellen des Kunden')
      }

    } catch (err) {
      console.error('Error creating customer:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToSetup = () => {
    // Proceed to farm setup since no subscription exists
    onComplete()
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            Konto wird eingerichtet...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ihr Stripe-Kunde wird automatisch erstellt. Bitte warten Sie einen Moment.</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Fehler bei der Einrichtung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={createStripeCustomer} variant="outline">
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          Willkommen bei barntrack!
        </CardTitle>
        <CardDescription>
          Ihr Stripe-Kunde wurde erfolgreich erstellt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">✅ Konto erfolgreich eingerichtet!</p>
              <p className="text-sm">
                Ihr 10-tägiger Professional-Test wurde aktiviert. Sie haben Zugang zu allen Features ohne Zahlungsmethode.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Nächste Schritte</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-green-500" />
              <span>Stripe-Kunde erstellt</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <span>Erstellen Sie Ihren ersten Stall</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <span>Fügen Sie Lieferanten und Futterarten hinzu</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleContinueToSetup} className="w-full" size="lg">
            Weiter zur Stall-Einrichtung
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}