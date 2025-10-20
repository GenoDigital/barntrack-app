import { Card, CardContent } from '@/components/ui/card'
import { Badge, Users, TrendingUp, Target, Award, Megaphone, BarChart, Ticket, Zap } from 'lucide-react'

const technicalPartnerBenefits = [
  {
    icon: Zap,
    title: 'API Integration',
    description: 'Professionelle Integration Ihres Fütterungssystems in 4 Wochen. Vollständige technische Dokumentation und Support.',
  },
  {
    icon: Badge,
    title: 'Featured Partner Status',
    description: 'Ihr Logo prominent auf unserer Integrationsseite und in der Anwendung. Erhöhte Sichtbarkeit bei Landwirten.',
  },
  {
    icon: Target,
    title: 'Prioritäts-Support',
    description: 'Ihre Kunden erhalten vorrangigen Support bei Integrationsfragen und technischen Problemen.',
  },
  {
    icon: TrendingUp,
    title: 'Datenbasierte Insights',
    description: 'Anonymisierte Markteinblicke und Nutzungsstatistiken zur Produktoptimierung.',
  },
  {
    icon: Megaphone,
    title: 'Co-Marketing',
    description: 'Gemeinsame Marketing-Aktivitäten, Webinare und Produktvorstellungen.',
  },
  {
    icon: BarChart,
    title: 'Produktfeedback',
    description: 'Direktes Feedback von Anwendern zur Verbesserung Ihrer Systeme.',
  },
]

const voucherPartnerBenefits = [
  {
    icon: Ticket,
    title: 'Gutschein-Programm',
    description: 'Kaufen Sie barntrack-Gutscheine für Ihre Kunden als Mehrwert zu Ihrem Futter-Lieferservice.',
  },
  {
    icon: Users,
    title: 'Kundenbindung',
    description: 'Stärken Sie die Bindung zu Ihren Kunden durch innovative digitale Mehrwertdienste.',
  },
  {
    icon: Badge,
    title: 'Partner-Branding',
    description: 'Ihr Logo und Branding in der Gutschein-Kommunikation und beim Kunden-Onboarding.',
  },
  {
    icon: TrendingUp,
    title: 'Umsatzpotenzial',
    description: 'Zusätzliche Revenue-Quelle durch Gutschein-Verkauf mit attraktiven Mengenrabatten.',
  },
  {
    icon: Target,
    title: 'Wettbewerbsvorteil',
    description: 'Differenzieren Sie sich von der Konkurrenz durch digitale Services.',
  },
  {
    icon: Megaphone,
    title: 'Marketing-Support',
    description: 'Gemeinsame Marketing-Materialien und Unterstützung bei der Kundenansprache.',
  },
]

const technicalPartnerTiers = [
  {
    tier: 'Basic Integration',
    features: [
      'Standard CSV/Excel Import',
      'Logo auf Integrationsseite',
      'Basis-Dokumentation',
      'E-Mail Support',
    ],
  },
  {
    tier: 'Advanced Integration',
    features: [
      'Alles aus Basic',
      'Individuelle Feldmappings',
      'Featured Integration Badge',
      'Quartalsweise Analytics',
      'Prioritäts-Support',
    ],
    popular: true,
  },
  {
    tier: 'Premium Integration',
    features: [
      'Alles aus Advanced',
      'Vollständige API-Integration',
      'Echtzeit-Datensynchronisation',
      'Monatliche Insights & Reports',
      'Gemeinsame Webinare',
      'Dedicated Account Manager',
    ],
  },
]

const voucherPartnerTiers = [
  {
    tier: 'Starter Paket',
    features: [
      '50 Gutscheine / Monat',
      '10% Mengenrabatt',
      'Basis-Branding',
      'E-Mail Support',
    ],
  },
  {
    tier: 'Professional Paket',
    features: [
      '200 Gutscheine / Monat',
      '20% Mengenrabatt',
      'Premium-Branding',
      'Marketing-Materialien',
      'Prioritäts-Support',
      'Quartalsweise Nutzungsstatistik',
    ],
    popular: true,
  },
  {
    tier: 'Enterprise Paket',
    features: [
      'Unbegrenzte Gutscheine',
      '30% Mengenrabatt',
      'Vollständiges Co-Branding',
      'Individuelle Landing Pages',
      'Dedicated Account Manager',
      'Monatliche Business Reviews',
    ],
  },
]

export function SponsorshipBenefits() {
  return (
    <div className="space-y-16">
      {/* Technical Integration Partners */}
      <div>
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold mb-3">
            🤖 Technische Integrations-Partner
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Für Fütterungssystem-Hersteller (GEA, Lely, DeLaval, BVL, Trioliet, etc.)
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {technicalPartnerBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Technical Partner Tiers */}
        <div className="grid md:grid-cols-3 gap-6">
          {technicalPartnerTiers.map((tier) => (
            <Card
              key={tier.tier}
              className={`relative ${tier.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                    Beliebteste Wahl
                  </span>
                </div>
              )}
              <CardContent className="pt-8 space-y-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-2">{tier.tier}</h4>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Voucher Partners */}
      <div className="pt-8 border-t">
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold mb-3">
            🌾 Gutschein-Partner
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Für Futtermittel-Lieferanten (Agrarhändler, Raiffeisen Genossenschaften, etc.)
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {voucherPartnerBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Voucher Partner Tiers */}
        <div className="grid md:grid-cols-3 gap-6">
          {voucherPartnerTiers.map((tier) => (
            <Card
              key={tier.tier}
              className={`relative ${tier.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                    Beliebteste Wahl
                  </span>
                </div>
              )}
              <CardContent className="pt-8 space-y-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-2">{tier.tier}</h4>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8">
        <h3 className="text-2xl font-bold mb-4 text-center">Kombinierbare Partnerschaften</h3>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-6">
          Beide Partnerschaftsmodelle können unabhängig voneinander oder kombiniert genutzt werden.
          Mehrere Partner aus verschiedenen Kategorien sind ausdrücklich erwünscht und stärken das Ökosystem für alle Beteiligten.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-background/50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">✅ Beispiel: System-Hersteller</h4>
            <p className="text-sm text-muted-foreground">
              GEA integriert ihre Systeme und wird Featured Partner. Landwirte können ihre GEA-Daten direkt importieren und profitieren von der nahtlosen Integration.
            </p>
          </div>
          <div className="bg-background/50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">✅ Beispiel: Futter-Lieferant</h4>
            <p className="text-sm text-muted-foreground">
              Raiffeisen kauft Gutscheine und bietet sie Kunden als Mehrwert zur Futterlieferung an. Kunden profitieren von professioneller Kostenkontrolle, Raiffeisen stärkt die Kundenbindung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
