'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { InitialPlanSelection } from './initial-plan-selection'
import { Crown, Calendar, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react'

interface SubscriptionSetupProps {
  onComplete: () => void
}

export function SubscriptionSetup({ onComplete }: SubscriptionSetupProps) {
  const { subscription, loading, getPlanName } = useSubscription()
  const [needsPayment, setNeedsPayment] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (subscription) {
      // Check if user needs to set up payment
      const hasFreeCoupon = subscription.status === 'active' && 
                           subscription.stripe_coupon_id !== null && 
                           subscription.trial_end === null
      const isTrialing = subscription.status === 'trialing'
      
      setNeedsPayment(isTrialing && !hasFreeCoupon)
    }
  }, [subscription])

  const handlePaymentSetup = () => {
    // Redirect to pricing page for payment setup
    window.location.href = '/pricing'
  }

  const handleSkipForNow = () => {
    // Continue with trial
    onComplete()
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Abo wird eingerichtet...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bitte warten Sie einen Moment.</p>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    // No subscription exists - show plan selection
    return <InitialPlanSelection onComplete={onComplete} />
  }

  const isTrialing = subscription.status === 'trialing'
  const hasForeverFree = subscription.status === 'active' && 
                         subscription.stripe_coupon_id !== null && 
                         subscription.trial_end === null

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Willkommen bei barntrack!
          </CardTitle>
          <CardDescription>
            Ihr {getPlanName()} Plan wurde erfolgreich eingerichtet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">{getPlanName()}</h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.max_farms} Ställe • {subscription.max_users_per_farm} Benutzer pro Stall
                </p>
              </div>
            </div>
            <Badge variant={isTrialing ? 'secondary' : 'default'}>
              {hasForeverFree ? 'Kostenlos' : isTrialing ? 'Testphase' : 'Aktiv'}
            </Badge>
          </div>

          {/* Trial Information */}
          {isTrialing && !hasForeverFree && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">🚀 Kostenlose Testphase aktiv</p>
                  <p className="text-sm">
                    Sie können barntrack kostenlos testen und alle Professional Features nutzen.
                    {subscription.trial_end && (
                      <span> Ihre Testphase endet am {new Date(subscription.trial_end).toLocaleDateString('de-DE')}.</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nach der Testphase wird automatisch der Starter Plan aktiviert, oder Sie können jederzeit upgraden.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Forever Free Information */}
          {hasForeverFree && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">🎉 Professional Plan kostenlos aktiviert!</p>
                  <p className="text-sm">
                    Sie haben Zugang zu allen Professional Features ohne monatliche Kosten.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}


          {/* Payment Setup */}
          {needsPayment && (
            <div className="space-y-3">
              <h4 className="font-medium">Zahlungsmethode einrichten</h4>
              <p className="text-sm text-muted-foreground">
                Richten Sie eine Zahlungsmethode ein, damit Ihr Service nach der Testphase nahtlos weiterläuft.
              </p>
              <div className="flex gap-3">
                <Button onClick={handlePaymentSetup} className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Zahlungsmethode hinzufügen
                </Button>
                <Button variant="outline" onClick={handleSkipForNow}>
                  Später einrichten
                </Button>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-medium">Nächste Schritte</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Erstellen Sie Ihren ersten Stall</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Fügen Sie Lieferanten und Futterarten hinzu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Beginnen Sie mit der Verfolgung Ihrer Futterkosten</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button onClick={onComplete} className="w-full" size="lg">
              Zum Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

    </>
  )
}