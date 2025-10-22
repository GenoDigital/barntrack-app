'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

interface TrialSetupProps {
  onComplete: () => void
}

export function TrialSetup({ onComplete }: TrialSetupProps) {
  const [status, setStatus] = useState<'creating_customer' | 'creating_subscription' | 'success' | 'error'>('creating_customer')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setupTrial()
  }, [])

  const setupTrial = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Benutzer nicht gefunden')
      }

      // Step 1: Create Stripe customer
      setStatus('creating_customer')
      console.log('Creating Stripe customer...')

      const { data: customerData, error: customerError } = await supabase.rpc('create_stripe_customer_via_wrapper', {
        customer_email: user.email,
        customer_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        customer_description: 'Trial signup'
      })

      if (customerError) {
        throw new Error(`Fehler beim Erstellen des Stripe-Kunden: ${customerError.message}`)
      }

      console.log('Stripe customer created:', customerData)

      // Step 2: Create trial subscription with Professional plan
      setStatus('creating_subscription')
      console.log('Creating trial subscription...')

      // Fetch Professional plan price ID from vault
      const { data: priceIdData, error: priceError } = await supabase
        .rpc('get_stripe_price_id', { plan_name_input: 'professional' })

      if (priceError || !priceIdData) {
        throw new Error(`Fehler beim Abrufen der Preisinformationen: ${priceError?.message || 'Price ID not found'}`)
      }

      console.log('Using Professional price ID from vault:', priceIdData)

      // Create subscription with 10-day trial
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc('create_subscription_via_wrapper', {
        price_id: priceIdData,
        trial_days: 10,
        coupon_id: null
      })

      if (subscriptionError) {
        throw new Error(`Fehler beim Erstellen der Testversion: ${subscriptionError.message}`)
      }

      console.log('Trial subscription created:', subscriptionData)

      // Success!
      setStatus('success')
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (err) {
      console.error('Trial setup error:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  if (status === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Testversion aktiviert!
          </CardTitle>
          <CardDescription>
            Ihr 10-tägiger Professional-Test wurde erfolgreich eingerichtet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">✨ Sie haben jetzt Zugang zu allen Professional Features:</p>
                <ul className="text-sm space-y-1">
                  <li>• Bis zu 10 Ställe verwalten</li>
                  <li>• Bis zu 5 Benutzer pro Stall einladen</li>
                  <li>• Erweiterte Auswertungen nutzen</li>
                  <li>• Priority Support erhalten</li>
                </ul>
                <p className="text-sm mt-3">
                  Sie werden automatisch zum Farm-Setup weitergeleitet...
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Fehler bei der Einrichtung
          </CardTitle>
          <CardDescription>
            Die Testversion konnte nicht aktiviert werden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support:</p>
            <p className="font-medium">support@barntrack.app</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Testversion wird eingerichtet...
        </CardTitle>
        <CardDescription>
          Bitte warten Sie einen Moment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {status === 'creating_customer' ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <span className={status === 'creating_customer' ? 'font-medium' : 'text-muted-foreground'}>
              Stripe-Kunde wird erstellt
            </span>
          </div>

          <div className="flex items-center gap-3">
            {status === 'creating_subscription' ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : status === 'creating_customer' ? (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <span className={status === 'creating_subscription' ? 'font-medium' : 'text-muted-foreground'}>
              10-Tage-Testversion wird aktiviert
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Hinweis:</strong> Nach der Testphase wechseln Sie automatisch zum Starter Plan.
            Sie können jederzeit upgraden oder kündigen.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
