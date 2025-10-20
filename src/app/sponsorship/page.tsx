import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Factory, Cpu, Users } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SponsorshipForm } from '@/components/marketing/sponsorship-form'
import { BetaBanner } from '@/components/marketing/beta-banner'

export const metadata = {
  title: 'Partnerschaften',
  description: 'Werden Sie Partner von barntrack - Wir suchen Partner aus der gesamten Wertschöpfungskette',
}

export default function SponsorshipPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Partnerschaften
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Wir sind auf der Suche nach Partnern entlang der gesamten Wertschöpfungskette.
              Gemeinsam gestalten wir die Zukunft der transparenten Kostenverfolgung in der Tierhaltung.
            </p>
          </div>
        </section>

        {/* Target Partners */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Wir suchen Partner</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Aus verschiedenen Bereichen der Wertschöpfungskette
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-background rounded-lg border shadow-sm space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Factory className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Futtermittelhersteller</h3>
                <p className="text-muted-foreground">
                  Hersteller und Lieferanten von Futtermitteln, die ihre Produkte transparent darstellen
                  und direkten Zugang zu Tierhaltern suchen.
                </p>
              </div>

              <div className="p-8 bg-background rounded-lg border shadow-sm space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Fütterungssystemhersteller</h3>
                <p className="text-muted-foreground">
                  Hersteller von Fütterungssystemen und -technologie, die ihre Lösungen
                  nahtlos mit barntrack verbinden möchten.
                </p>
              </div>

              <div className="p-8 bg-background rounded-lg border shadow-sm space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Weitere Akteure</h3>
                <p className="text-muted-foreground">
                  Agrarhändler, Berater, Software-Anbieter und andere Mitglieder der
                  Wertschöpfungskette in der Tierhaltung.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Models */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Flexible Partnerschaftsmodelle
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir stehen für unterschiedliche Partnerschaftsmodelle bereit und sind offen für innovative Ideen
                und Kooperationen. Ob technische Integration, Co-Marketing oder individuelle Vereinbarungen –
                gemeinsam finden wir die passende Lösung.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-8 text-left">
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="text-lg font-semibold">Technische Integration</h3>
                <p className="text-muted-foreground text-sm">
                  API-Schnittstellen, Datenintegration, gemeinsame Produktentwicklung
                </p>
              </div>
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="text-lg font-semibold">Vertriebspartnerschaften</h3>
                <p className="text-muted-foreground text-sm">
                  Co-Marketing, gemeinsame Kundenansprache, Empfehlungsprogramme
                </p>
              </div>
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="text-lg font-semibold">Strategische Kooperationen</h3>
                <p className="text-muted-foreground text-sm">
                  Langfristige Zusammenarbeit, gemeinsame Entwicklungsprojekte
                </p>
              </div>
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="text-lg font-semibold">Individuelle Modelle</h3>
                <p className="text-muted-foreground text-sm">
                  Maßgeschneiderte Lösungen für spezifische Anforderungen und Ziele
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Wir freuen uns über Ihre Kontaktaufnahme
              </h2>
              <p className="text-lg text-muted-foreground">
                Lassen Sie uns gemeinsam die Möglichkeiten einer Partnerschaft besprechen
              </p>
            </div>
            <SponsorshipForm />
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
