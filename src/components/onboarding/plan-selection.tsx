'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, CreditCard, CheckCircle, Loader2 } from 'lucide-react'

interface PendingPlanSelection {
  isTrialMode: boolean
  selectedPlan: string
  voucherCode: string
  userEmail: string
  userName: string
}

interface PlanSelectionProps {
  pendingPlan: PendingPlanSelection
  onComplete: () => void
}

export function PlanSelection({ pendingPlan, onComplete }: PlanSelectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleConfirmPlan = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 2: Now that user is authenticated, create Stripe customer
      console.log('Creating Stripe customer for:', pendingPlan.userEmail)
      const { data: customerData, error: customerError } = await supabase.functions.invoke('create-customer', {
        body: { 
          email: pendingPlan.userEmail,
          name: pendingPlan.userName,
          metadata: {
            signup_source: 'direct'
          }
        }
      })

      if (customerError) {
        throw new Error(`Failed to create Stripe customer: ${customerError.message}`)
      }

      console.log('Stripe customer created:', customerData)

      // Step 3: Create subscription based on mode (trial or paid)
      if (pendingPlan.isTrialMode) {
        // Trial mode: Create trial subscription with Professional plan
        console.log('Creating trial subscription with TRIAL10 promotion code')

        // Fetch Professional plan price ID from vault
        const { data: priceIdData, error: priceError } = await supabase
          .rpc('get_stripe_price_id', { plan_name_input: 'professional' })

        if (priceError || !priceIdData) {
          throw new Error(`Failed to fetch Professional plan price ID: ${priceError?.message || 'Price ID not found'}`)
        }

        console.log('Using Professional price ID from vault:', priceIdData)

        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
          body: {
            priceId: priceIdData,
            customerId: customerData.customer_id,
            couponId: 'TRIAL10', // 10-Day Free Trial promotion code
            trialDays: 10
          }
        })

        if (subscriptionError) {
          throw new Error(`Failed to create trial subscription: ${subscriptionError.message}`)
        }

        console.log('Trial subscription created:', subscriptionData)
      } else {
        // Direct paid mode: Create subscription with selected plan
        console.log('Creating paid subscription for plan:', pendingPlan.selectedPlan)

        // Fetch the price ID from vault using database function
        const { data: priceIdData, error: priceError } = await supabase
          .rpc('get_stripe_price_id', { plan_name_input: pendingPlan.selectedPlan })

        if (priceError || !priceIdData) {
          throw new Error(`Failed to fetch price ID from vault: ${priceError?.message || 'Price ID not found'}`)
        }

        console.log('Using price ID from vault:', priceIdData)

        // Create the subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
          body: {
            priceId: priceIdData,
            customerId: customerData.customer_id,
            couponId: pendingPlan.voucherCode || undefined // Apply voucher if provided
          }
        })

        if (subscriptionError) {
          throw new Error(`Failed to create subscription: ${subscriptionError.message}`)
        }

        console.log('Paid subscription created:', subscriptionData)

        // If voucher was applied, log it
        if (pendingPlan.voucherCode) {
          console.log('Voucher code applied:', pendingPlan.voucherCode)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (err) {
      console.error('Plan setup error:', err)
      setError(err instanceof Error ? err.message : 'Fehler bei der Plan-Einrichtung')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Setup erfolgreich!
          </CardTitle>
          <CardDescription>
            Ihr Plan wurde erfolgreich eingerichtet. Sie werden zum Dashboard weitergeleitet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          Plan-Einrichtung abschließen
        </CardTitle>
        <CardDescription>
          Schließen Sie die Einrichtung Ihres gewählten Plans ab
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Plan Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {pendingPlan.isTrialMode ? '🚀' : '💳'}
            </div>
            <div>
              <h3 className="font-medium">
                {pendingPlan.isTrialMode ? '10 Tage kostenlos testen' : 'Direkter Zugang'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {pendingPlan.isTrialMode 
                  ? 'Professional Features für 10 Tage kostenlos'
                  : `${pendingPlan.selectedPlan} Plan`
                }
              </p>
            </div>
          </div>
          <Badge variant={pendingPlan.isTrialMode ? 'secondary' : 'default'}>
            {pendingPlan.isTrialMode ? 'Trial' : 'Bezahlt'}
          </Badge>
        </div>

        {/* Trial Benefits */}
        {pendingPlan.isTrialMode && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">✨ 10 Tage Professional Features kostenlos</p>
                <ul className="text-sm space-y-1">
                  <li>• Bis zu 10 Ställe verwalten</li>
                  <li>• Bis zu 5 Benutzer pro Stall</li>
                  <li>• Erweiterte Auswertungen</li>
                  <li>• Priority Support</li>
                  <li>• Keine Kreditkarte erforderlich</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Voucher Code Info */}
        {pendingPlan.voucherCode && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Gutscheincode:</strong> {pendingPlan.voucherCode}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <Button 
            onClick={handleConfirmPlan} 
            disabled={loading}
            className="w-full" 
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird eingerichtet...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Plan einrichten & fortfahren
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}