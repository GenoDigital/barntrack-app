'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react'
import { useSubscription } from '@/lib/hooks/use-subscription'
import Link from 'next/link'

export function TrialStatus() {
  const { 
    subscription, 
    loading, 
    getTrialDaysRemaining, 
    isTrialing, 
    hasForeverFree, 
    needsPaymentSetup,
    getPlanName 
  } = useSubscription()

  if (loading || !subscription) return null

  const trialDays = getTrialDaysRemaining()
  const showTrialWarning = isTrialing() && trialDays !== null && trialDays <= 3

  if (hasForeverFree()) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{getPlanName()} Plan - Kostenlos aktiviert!</span>
              <p className="text-sm mt-1">Sie haben dauerhaft Zugang zu allen Features.</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Kostenlos
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (isTrialing() && trialDays !== null) {
    return (
      <Alert className={showTrialWarning ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}>
        {showTrialWarning ? (
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        ) : (
          <Clock className="h-4 w-4 text-blue-600" />
        )}
        <AlertDescription className={showTrialWarning ? "text-orange-800" : "text-blue-800"}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                {trialDays === 0 
                  ? 'Ihre Testphase endet heute!'
                  : trialDays === 1 
                  ? '1 Tag Testphase verbleibend'
                  : `${trialDays} Tage Testphase verbleibend`
                }
              </span>
              <p className="text-sm mt-1">
                {getPlanName()} Plan • {trialDays <= 3 ? 'Richten Sie jetzt eine Zahlungsmethode ein.' : 'Genießen Sie alle Features kostenlos.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={showTrialWarning ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                {trialDays === 0 ? 'Letzter Tag' : `${trialDays} Tage`}
              </Badge>
              {needsPaymentSetup() && (
                <Button size="sm" asChild>
                  <Link href="/pricing">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Zahlungsmethode
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (subscription.status === 'active') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{getPlanName()} Plan aktiv</span>
              <p className="text-sm mt-1">
                {subscription.current_period_end && 
                  `Nächste Abrechnung: ${new Date(subscription.current_period_end).toLocaleDateString('de-DE')}`
                }
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Aktiv
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (subscription.status === 'past_due') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Zahlung überfällig</span>
              <p className="text-sm mt-1">Bitte aktualisieren Sie Ihre Zahlungsmethode.</p>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link href="/pricing">
                <CreditCard className="h-3 w-3 mr-1" />
                Zahlung aktualisieren
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}