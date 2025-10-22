'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { matchPriceToConfig } from '@/lib/utils/price-formatting'
import { planConfigs } from '@/lib/config/plan-configs'

interface StripePriceWithSort {
  price_id: string
  product_id: string
  product_name: string
  unit_amount: number
  currency: string
  recurring_interval: string
  sort_order: number
}

interface PlanConfiguration {
  plan_name: string
  display_name: string
  description: string
  stripe_product_id: string
  sort_order: number
}

interface PlanWithConfig {
  name: string
  price: string
  period: string
  priceId: string
  description: string
  badge?: string | null
  features: string[]
  icon: React.ComponentType<{ className?: string }>
  popular: boolean
  sortOrder?: number
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanWithConfig[]>([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPricesFromStripe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPricesFromStripe = async () => {
    setLoadingPrices(true)
    try {
      // Fetch prices from Stripe
      const { data: pricesData, error: pricesError } = await supabase.rpc('get_stripe_prices_for_products') as {
        data: StripePriceWithSort[] | null,
        error: Error | null
      }

      if (pricesError) {
        console.error('Error fetching prices:', pricesError)
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

          // Capitalize plan name to match planConfigs keys (e.g., 'starter' -> 'Starter')
          const capitalizedPlanName = planConfig.plan_name.charAt(0).toUpperCase() + planConfig.plan_name.slice(1).toLowerCase()
          const frontendConfig = planConfigs[capitalizedPlanName] || planConfigs[planConfig.plan_name]
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
            popular: frontendConfig.popular || false,
            sortOrder: planConfig.sort_order
          }
        }).filter((plan): plan is NonNullable<typeof plan> => plan !== null)

        // Sort by sort_order from plan_configurations (Starter=1, Professional=2, Enterprise=3)
        const sortedPlans = matchedPlans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

        setPlans(sortedPlans as PlanWithConfig[])
      }
    } catch (error) {
      console.error('Error calling price function:', error)
    } finally {
      setLoadingPrices(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <div className="inline-block">
              <span className="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                Beta-Preise – können sich noch ändern
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Transparente Preise
            </h1>
            <p className="text-xl text-muted-foreground">
              Wählen Sie den Plan, der zu Ihrem Betrieb passt. Alle Pläne beinhalten 14 Tage kostenlose Testphase.
            </p>
          </div>
        </section>

        {/* Benefits Banner */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                14 Tage kostenlos testen
              </div>
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
                Keine versteckten Kosten
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            {loadingPrices ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Lade aktuelle Preise...</span>
                </div>
              </div>
            ) : plans.length === 0 ? (
              <div className="flex justify-center items-center py-12">
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
              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                  const IconComponent = plan.icon
                  return (
                    <Card
                      key={plan.name}
                      className={`relative h-full flex flex-col ${
                        plan.popular ? 'border-2 border-primary shadow-xl scale-105' : ''
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground px-4 py-1">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center pb-8">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {plan.description}
                        </CardDescription>
                        <div className="mt-4">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6 flex-1 flex flex-col">
                        <ul className="space-y-3 flex-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-6">
                          <Link href="/signup">
                            <Button
                              className="w-full"
                              size="lg"
                              variant={plan.popular ? 'default' : 'outline'}
                            >
                              Jetzt starten
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Detaillierter Vergleich</h2>
              <p className="text-lg text-muted-foreground">
                Alle Funktionen im Überblick
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-background rounded-lg">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 px-6 text-left font-semibold">Feature</th>
                    <th className="py-4 px-6 text-center font-semibold">Starter</th>
                    <th className="py-4 px-6 text-center font-semibold">Professional</th>
                    <th className="py-4 px-6 text-center font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-6">Anzahl Ställe</td>
                    <td className="py-4 px-6 text-center">1</td>
                    <td className="py-4 px-6 text-center">10</td>
                    <td className="py-4 px-6 text-center">Unbegrenzt</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Anzahl Benutzer</td>
                    <td className="py-4 px-6 text-center">1</td>
                    <td className="py-4 px-6 text-center">3</td>
                    <td className="py-4 px-6 text-center">Unbegrenzt</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Datenimport</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Custom Dashboards</td>
                    <td className="py-4 px-6 text-center">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">API-Zugang</td>
                    <td className="py-4 px-6 text-center">-</td>
                    <td className="py-4 px-6 text-center">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Support</td>
                    <td className="py-4 px-6 text-center">E-Mail</td>
                    <td className="py-4 px-6 text-center">E-Mail (Priorität)</td>
                    <td className="py-4 px-6 text-center">Direkter Kontakt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Häufige Fragen</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Was passiert nach der Beta-Phase?</h3>
                <p className="text-muted-foreground">
                  Die gezeigten Preise sind Beta-Preise und können sich noch ändern. Bestehende Nutzer
                  werden über Änderungen rechtzeitig informiert und profitieren von Bestandsschutz.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Können sich die Preise noch ändern?</h3>
                <p className="text-muted-foreground">
                  Ja, während der Beta-Phase behalten wir uns vor, die Preisstruktur anzupassen.
                  Sie werden frühzeitig über Änderungen informiert.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Welche Zahlungsmethoden werden akzeptiert?</h3>
                <p className="text-muted-foreground">
                  Wir akzeptieren alle gängigen Kreditkarten und SEPA-Lastschrift über unseren
                  Zahlungsdienstleister Stripe.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Kann ich meinen Plan wechseln?</h3>
                <p className="text-muted-foreground">
                  Ja, Sie können Ihren Plan jederzeit upgraden oder downgraden. Änderungen werden
                  zum nächsten Abrechnungszyklus wirksam.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Was ist in der kostenlosen Testphase enthalten?</h3>
                <p className="text-muted-foreground">
                  Während der 14-tägigen Testphase haben Sie vollen Zugriff auf alle Funktionen
                  des gewählten Plans. Keine Kreditkarte erforderlich.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Gibt es Support während der Beta?</h3>
                <p className="text-muted-foreground">
                  Ja, wir bieten E-Mail-Support für alle Pläne. Als Early Adopter profitieren Sie von
                  direktem Kontakt zum Entwicklerteam.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Werden Sie Early Adopter
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Testen Sie barntrack 14 Tage kostenlos während der Beta-Phase. Keine Kreditkarte erforderlich.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Kostenlos testen <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Demo buchen
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
