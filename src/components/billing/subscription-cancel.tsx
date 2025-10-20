'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Calendar, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useSubscription } from '@/lib/hooks/use-subscription'

export function SubscriptionCancel() {
  const [canceling, setCanceling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [cancelType, setCancelType] = useState<'immediate' | 'period_end'>('period_end')
  const { subscription, loading, refetch } = useSubscription()
  const supabase = createClient()

  const handleCancelSubscription = async () => {
    console.log('🚀 Starting cancellation process, type:', cancelType)
    setCanceling(true)
    
    try {
      console.log('📞 Calling cancel_user_subscription with params:', {
        cancel_at_period_end: cancelType === 'period_end'
      })
      
      const { data, error } = await supabase.rpc('cancel_user_subscription', {
        cancel_at_period_end: cancelType === 'period_end'
      })

      console.log('📋 Cancel response:', { data, error })

      if (error) {
        console.error('❌ Error canceling subscription:', error)
        toast.error(`Fehler beim Kündigen: ${error.message}`)
        return
      }

      if (data?.success) {
        console.log('✅ Cancellation successful!')
        toast.success(
          cancelType === 'period_end' 
            ? 'Abonnement wird am Ende der Laufzeit gekündigt'
            : 'Abonnement wurde sofort gekündigt'
        )
        // Refresh subscription data
        console.log('🔄 Refreshing subscription data...')
        if (refetch) refetch()
      } else {
        console.error('❌ Cancellation failed:', data)
        toast.error(data?.error || 'Fehler beim Kündigen des Abonnements')
      }
    } catch (err) {
      console.error('💥 Error calling cancel function:', err)
      toast.error(`Unerwarteter Fehler: ${err instanceof Error ? err.message : 'Unbekannt'}`)
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setReactivating(true)
    
    try {
      const { data, error } = await supabase.rpc('reactivate_user_subscription')

      if (error) {
        console.error('Error reactivating subscription:', error)
        toast.error('Fehler beim Reaktivieren des Abonnements')
        return
      }

      if (data?.success) {
        toast.success('Abonnement wurde erfolgreich reaktiviert')
        // Refresh subscription data
        if (refetch) refetch()
      } else {
        toast.error(data?.error || 'Fehler beim Reaktivieren des Abonnements')
      }
    } catch (err) {
      console.error('Error calling reactivate function:', err)
      toast.error('Fehler beim Reaktivieren des Abonnements')
    } finally {
      setReactivating(false)
    }
  }

  const isSubscriptionCanceledAtPeriodEnd = () => {
    // This would need to be determined from Stripe data
    // For now, we'll check if status is active but there's a cancellation scheduled
    return subscription?.status === 'active' && subscription?.cancel_at_period_end
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Abonnement verwalten
          </CardTitle>
          <CardDescription>
            Abonnement kündigen oder reaktivieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Lade Abonnement-Daten...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Abonnement verwalten
          </CardTitle>
          <CardDescription>
            Abonnement kündigen oder reaktivieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kein Abonnement gefunden</h3>
            <p className="text-gray-600">
              Sie haben derzeit kein aktives Abonnement.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCanceled = subscription.status === 'canceled'
  const isScheduledForCancellation = isSubscriptionCanceledAtPeriodEnd()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          Abonnement verwalten
        </CardTitle>
        <CardDescription>
          Abonnement kündigen oder reaktivieren
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Aktueller Status</h3>
            <Badge variant={
              isCanceled ? 'destructive' : 
              isScheduledForCancellation ? 'secondary' : 
              'default'
            }>
              {isCanceled ? 'Gekündigt' : 
               isScheduledForCancellation ? 'Kündigung geplant' : 
               'Aktiv'}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div>Plan: <span className="font-medium">{subscription.plan_type}</span></div>
            {subscription.current_period_end && (
              <div>
                {isScheduledForCancellation ? 'Endet am' : 'Nächste Abrechnung'}: {' '}
                <span className="font-medium">
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Cancellation Warning */}
        {isScheduledForCancellation && (
          <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Kündigung geplant</span>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              Ihr Abonnement wird am {formatDate(subscription.current_period_end!)} automatisch beendet. 
              Sie haben bis dahin weiterhin Zugriff auf alle Features.
            </p>
            <Button
              onClick={handleReactivateSubscription}
              disabled={reactivating}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              {reactivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Kündigung rückgängig machen
            </Button>
          </div>
        )}

        {/* Cancellation Options */}
        {!isCanceled && !isScheduledForCancellation && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Abonnement kündigen</h3>
              <RadioGroup 
                value={cancelType} 
                onValueChange={(value: 'immediate' | 'period_end') => setCancelType(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="period_end" id="period_end" />
                  <Label htmlFor="period_end" className="flex-1 cursor-pointer">
                    <div className="font-medium">Am Ende der Laufzeit kündigen</div>
                    <div className="text-sm text-gray-600">
                      Ihr Abonnement endet am {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'Ende der aktuellen Periode'}. 
                      Sie behalten bis dahin vollen Zugriff.
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                    <div className="font-medium">Sofort kündigen</div>
                    <div className="text-sm text-gray-600">
                      Ihr Abonnement wird sofort beendet. Der Zugriff endet sofort.
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={canceling}
                  className="w-full"
                >
                  {canceling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Abonnement kündigen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Abonnement kündigen</AlertDialogTitle>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Sind Sie sicher, dass Sie Ihr <strong>{subscription.plan_type}</strong> Abonnement kündigen möchten?
                    </p>
                    {cancelType === 'period_end' ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          Ihr Abonnement wird am <strong>{subscription.current_period_end ? formatDate(subscription.current_period_end) : 'Ende der Periode'}</strong> enden. 
                          Sie behalten bis dahin vollen Zugriff auf alle Features.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Achtung:</strong> Ihr Abonnement wird sofort beendet und Sie verlieren den Zugriff auf alle Premium-Features.
                        </p>
                      </div>
                    )}
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Ja, kündigen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Canceled Status */}
        {isCanceled && (
          <div className="text-center py-6">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Abonnement gekündigt</h3>
            <p className="text-gray-600 mb-4">
              Ihr Abonnement wurde gekündigt. Sie können jederzeit ein neues Abonnement abschließen.
            </p>
            <Button variant="outline" asChild>
              <a href="/pricing">Neues Abonnement wählen</a>
            </Button>
          </div>
        )}

        {/* Important Notes */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Wichtige Hinweise</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Nach der Kündigung können Sie weiterhin auf Ihre Daten zugreifen</li>
            <li>• Eine Reaktivierung ist nur vor dem Ende der Laufzeit möglich</li>
            <li>• Bei Fragen kontaktieren Sie unseren Support</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}