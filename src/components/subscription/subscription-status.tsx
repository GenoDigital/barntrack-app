'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Crown, Calendar, Users, Building, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function SubscriptionStatus() {
  const { subscription, loading, getPlanLimits, getPlanName } = useSubscription()
  const [farmCount, setFarmCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get farm count where user is owner
    const { data: farmData } = await supabase
      .from('farm_members')
      .select('farm_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')

    if (farmData) {
      setFarmCount(farmData.length)
    }
  }


  const getStatusColor = () => {
    if (!subscription) return 'gray'
    switch (subscription.status) {
      case 'active': return 'green'
      case 'trialing': return 'blue'
      case 'past_due': return 'yellow'
      case 'canceled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = () => {
    if (!subscription) return 'Unbekannt'
    switch (subscription.status) {
      case 'active': return 'Aktiv'
      case 'trialing': return 'Testphase'
      case 'past_due': return 'Überfällig'
      case 'canceled': return 'Gekündigt'
      default: return subscription.status
    }
  }

  const isNearLimit = (current: number, max: number) => {
    if (max === -1) return false // unlimited
    return current >= max * 0.8 // 80% threshold
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abo-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Lädt...</p>
        </CardContent>
      </Card>
    )
  }

  const limits = getPlanLimits()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Abo-Status
            </span>
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Aktueller Plan: {getPlanName()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4" />
                <span>Ställe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{farmCount}</span>
                <span className="text-muted-foreground">/ {limits?.maxFarms ?? '-'}</span>
                {isNearLimit(farmCount, subscription?.max_farms || 0) && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              {subscription?.max_farms !== -1 && farmCount >= (subscription?.max_farms || 0) && (
                <p className="text-xs text-red-600">Limit erreicht</p>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>Max. Benutzer/Stall</span>
              </div>
              <div className="font-semibold">{limits?.maxUsersPerFarm ?? '-'}</div>
            </div>
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Plan-Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {subscription.current_period_end && (
                  <div>
                    <span className="text-muted-foreground">Nächste Abrechnung:</span>
                    <div className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
                {subscription.trial_end && subscription.status === 'trialing' && (
                  <div>
                    <span className="text-muted-foreground">Testphase endet:</span>
                    <div className="font-medium">
                      {new Date(subscription.trial_end).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
                {subscription.created_at && (
                  <div>
                    <span className="text-muted-foreground">Plan seit:</span>
                    <div className="font-medium">
                      {new Date(subscription.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
                {subscription.stripe_customer_id && typeof subscription.stripe_customer_id === 'string' && (
                  <div>
                    <span className="text-muted-foreground">Kunden-ID:</span>
                    <div className="font-mono text-xs">
                      {subscription.stripe_customer_id.substring(0, 12)}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium">Verfügbare Features</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {subscription?.can_invite_users ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
                <span>Benutzer einladen</span>
              </div>
              <div className="flex items-center gap-2">
                {subscription?.has_advanced_analytics ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
                <span>Erweiterte Analysen</span>
              </div>
              <div className="flex items-center gap-2">
                {subscription?.has_api_access ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
                <span>API-Zugang</span>
              </div>
              <div className="flex items-center gap-2">
                {subscription?.has_priority_support ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
                <span>Prioritäts-Support</span>
              </div>
            </div>
          </div>

          {/* Trial Info */}
          {subscription?.status === 'trialing' && subscription.trial_end && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Ihre Testphase endet am {new Date(subscription.trial_end).toLocaleDateString('de-DE')}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">
                Plan ändern
              </Link>
            </Button>
          </div>

        </CardContent>
      </Card>

    </>
  )
}