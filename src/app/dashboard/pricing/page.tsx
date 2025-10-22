'use client'

import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { SubscriptionCard } from '@/components/pricing/subscription-card'
import { TrialStatus } from '@/components/pricing/trial-status'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { useAuth } from '@/lib/hooks/use-auth'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { matchPriceToConfig, type PlanConfig } from '@/lib/utils/price-formatting'
import { planConfigs } from '@/lib/config/plan-configs'

// Extended StripePrice interface with sort_order field from database
interface StripePriceWithSort {
  price_id: string
  product_id: string
  product_name: string
  unit_amount: number
  currency: string
  recurring_interval: string
  sort_order: number
}

// Plan configuration from database
interface PlanConfiguration {
  plan_name: string
  display_name: string
  description: string
  stripe_product_id: string
  sort_order: number
}

interface PlanWithConfig extends PlanConfig {
  priceId: string
  price: string
  period: string
}

export default function PricingPage() {
  const [syncing, setSyncing] = useState(false)
  const [plans, setPlans] = useState<PlanWithConfig[]>([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const { subscription, loading, refetch } = useSubscription()
  const { user } = useAuth()
  const supabase = createClient()
  const hasSyncedRef = useRef(false)

  // Fetch prices from Stripe on component mount
  useEffect(() => {
    fetchPricesFromStripe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync subscription status from Stripe on page load (only once)
  useEffect(() => {
    if (user && !loading && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      syncFromStripe()
    }
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchPricesFromStripe = async () => {
    setLoadingPrices(true)
    try {
      // Fetch prices from Stripe
      const { data: pricesData, error: pricesError } = await supabase.rpc('get_stripe_prices_from_wrapper') as { data: StripePriceWithSort[] | null, error: Error | null }

      if (pricesError) {
        console.error('Error fetching prices:', pricesError)
        toast.error('Failed to load current prices')
        return
      }

      // Fetch plan configurations from database
      const { data: planConfigsData, error: planConfigsError } = await supabase
        .from('plan_configurations')
        .select('plan_name, display_name, description, stripe_product_id, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      if (planConfigsError) {
        console.error('Error fetching plan configurations:', planConfigsError)
        toast.error('Failed to load plan configurations')
        return
      }

      if (pricesData && planConfigsData) {
        // Filter for yearly prices only
        const yearlyPrices = pricesData.filter(price => price.recurring_interval === 'year')

        // Match prices with plan configurations by product_id
        const matchedPlans = yearlyPrices.map(price => {
          const planConfig = planConfigsData.find(pc => pc.stripe_product_id === price.product_id)
          if (!planConfig) {
            console.warn(`No configuration found for product ID: ${price.product_id}`)
            return null
          }

          const frontendConfig = planConfigs[planConfig.plan_name] || planConfigs[planConfig.plan_name.toLowerCase()]
          if (!frontendConfig) {
            console.warn(`No frontend config found for plan: ${planConfig.plan_name}`)
            return null
          }

          return {
            name: planConfig.display_name,
            price: `€${(price.unit_amount / 100).toFixed(0)}`,
            period: '/Jahr',
            priceId: price.price_id,
            description: frontendConfig.description,
            badge: frontendConfig.badge,
            features: frontendConfig.features,
            icon: frontendConfig.icon,
            popular: frontendConfig.popular || false
          }
        }).filter((plan): plan is NonNullable<typeof plan> => plan !== null)

        setPlans(matchedPlans)
      }
    } catch (error) {
      console.error('Error calling price function:', error)
      toast.error('Failed to load current prices')
    } finally {
      setLoadingPrices(false)
    }
  }
  
  const syncFromStripe = async () => {
    if (!user) return
    
    setSyncing(true)
    try {
      const { data, error } = await supabase.rpc('sync_subscription_from_stripe') as { 
        data: { success?: boolean; source?: string } | null, 
        error: Error | null 
      }
      
      if (error) {
        console.error('Error syncing from Stripe:', error)
        toast.error('Failed to sync subscription status')
      } else if (data?.success) {
        console.log('Synced from Stripe:', data)
        // Refresh subscription data
        setTimeout(() => {
          if (refetch) refetch()
        }, 500)
        
        if (data.source === 'stripe') {
          toast.success('Subscription status updated from Stripe')
        }
      }
    } catch (error) {
      console.error('Error calling sync function:', error)
      toast.error('Failed to sync subscription status')
    } finally {
      setSyncing(false)
    }
  }
  
  const getCurrentPlanName = () => {
    if (!subscription) return null
    // Get plan type from subscription
    return subscription.plan_type || null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pläne & Preise</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Abonnement und wählen Sie den perfekten Plan für Ihren Betrieb
          </p>
        </div>
      </div>

      {/* Trial Status */}
      {user && !loading && (
        <TrialStatus />
      )}

      {/* Current Plan Benefits */}
      <div className="flex justify-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Keine Einrichtungsgebühren
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Jederzeit kündbar
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Sofortiger Zugang
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {loadingPrices ? (
          // Loading skeleton
          <div className="md:col-span-3 flex justify-center items-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Lade aktuelle Preise...</span>
            </div>
          </div>
        ) : plans.length === 0 ? (
          // No plans found
          <div className="md:col-span-3 flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Keine Pläne verfügbar</p>
              <Button 
                variant="outline" 
                onClick={fetchPricesFromStripe}
                className="mt-4"
              >
                Erneut versuchen
              </Button>
            </div>
          </div>
        ) : (
          // Render plans
          plans.map((plan) => {
            const currentPlan = getCurrentPlanName()
            const isCurrentPlan = currentPlan === plan.name.toLowerCase()
            
            return (
              <SubscriptionCard
                key={plan.priceId}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                badge={plan.badge || undefined}
                priceId={plan.priceId}
                features={plan.features}
                icon={plan.icon}
                popular={plan.popular}
                isCurrentPlan={isCurrentPlan}
                disabled={!user}
              />
            )
          })
        )}
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-8">Häufige Fragen</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-2">Kann ich meinen Plan jederzeit wechseln?</h4>
            <p className="text-muted-foreground">
              Ja, Sie können Ihren Plan jederzeit upgraden oder downgraden. Änderungen werden am nächsten Abrechnungszyklus wirksam.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Was passiert nach der kostenlosen Testphase?</h4>
            <p className="text-muted-foreground">
              Nach 14 Tagen wird automatisch der gewählte Plan aktiviert. Sie können jederzeit vor Ablauf kündigen.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Sind meine Daten sicher?</h4>
            <p className="text-muted-foreground">
              Ja, alle Daten werden verschlüsselt und sicher in der EU gespeichert. Wir entsprechen allen DSGVO-Anforderungen.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Bieten Sie Unterstützung bei der Einrichtung?</h4>
            <p className="text-muted-foreground">
              Professional und Enterprise Kunden erhalten persönliche Unterstützung bei der Einrichtung und Schulungen für das Team.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}