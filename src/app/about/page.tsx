import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'
import { Target, Users, TrendingUp, Shield } from 'lucide-react'

export const metadata = {
  title: 'Über uns',
  description: 'Erfahren Sie mehr über barntrack und unsere Mission, die Futterkostenverwaltung in der Landwirtschaft zu revolutionieren',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Über barntrack
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Wir digitalisieren die Futterkostenverwaltung für landwirtschaftliche Betriebe
              und schaffen Transparenz für bessere wirtschaftliche Entscheidungen.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-neutral dark:prose-invert mx-auto">
              <h2 className="text-center">Unsere Mission</h2>
              <p className="text-lg text-center">
                barntrack wurde entwickelt, um landwirtschaftlichen Betrieben eine moderne,
                benutzerfreundliche Lösung für die Verwaltung und Analyse ihrer Futterkosten
                zu bieten. Wir glauben daran, dass präzise Daten die Grundlage für erfolgreiche
                betriebswirtschaftliche Entscheidungen sind.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Unsere Werte</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Präzision</h3>
                <p className="text-muted-foreground">
                  Exakte Kostenerfassung für fundierte Entscheidungen
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Nutzerfreundlichkeit</h3>
                <p className="text-muted-foreground">
                  Intuitive Bedienung, die keine Schulung erfordert
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Innovation</h3>
                <p className="text-muted-foreground">
                  Moderne Technologie für traditionelle Landwirtschaft
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Datenschutz</h3>
                <p className="text-muted-foreground">
                  DSGVO-konform mit EU-Servern und Verschlüsselung
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-neutral dark:prose-invert mx-auto">
              <h2 className="text-center">Moderne Technologie</h2>
              <p className="text-center">
                barntrack basiert auf modernster Cloud-Technologie:
              </p>
              <ul className="text-left max-w-2xl mx-auto">
                <li>
                  <strong>Cloud-First Architektur:</strong> Zugriff von überall, jederzeit
                </li>
                <li>
                  <strong>EU-Hosting:</strong> Alle Daten werden ausschließlich auf EU-Servern gespeichert
                </li>
                <li>
                  <strong>Automatische Backups:</strong> Ihre Daten sind sicher und immer verfügbar
                </li>
                <li>
                  <strong>Echtzei-Synchronisation:</strong> Teamarbeit ohne Konflikte
                </li>
                <li>
                  <strong>Mobile-optimiert:</strong> Perfekt nutzbar auf Smartphone und Tablet
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-neutral dark:prose-invert mx-auto">
              <h2 className="text-center">System-Integration</h2>
              <p className="text-center">
                barntrack ist grundsätzlich mit jedem Fütterungssystem kompatibel, das folgende
                Daten bereitstellt:
              </p>
              <ul className="text-left max-w-2xl mx-auto">
                <li>Stallbereich/Bucht</li>
                <li>Futtertyp/Komponente</li>
                <li>Zeitpunkt der Fütterung</li>
                <li>Menge</li>
              </ul>
              <p className="text-center">
                Ein einfacher CSV- oder Excel-Export genügt. Wir arbeiten kontinuierlich an
                direkten Integrationen mit führenden Fütterungssystemen.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">Haben Sie Fragen?</h2>
            <p className="text-lg text-muted-foreground">
              Wir stehen Ihnen gerne für ein persönliches Gespräch zur Verfügung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/demo"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Demo buchen
              </a>
              <a
                href="mailto:info@barntrack.app"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-input hover:bg-accent transition-colors font-medium"
              >
                Kontakt aufnehmen
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
