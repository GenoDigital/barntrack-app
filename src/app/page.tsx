import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Upload, BarChart, TrendingUp, Calculator, LineChart, Target, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />

          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Moderne Futterkostenverwaltung
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Futterkosten <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">transparent</span> gemacht
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Importieren Sie Daten aus jedem Fütterungssystem. Vergleichen Sie Lieferanten.
                Berechnen Sie individuelle Deckungsbeiträge – keine Durchschnittswerte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-base px-8">
                    Kostenlos starten <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                    Live-Demo buchen
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>14 Tage kostenlos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Keine Kreditkarte</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>DSGVO-konform</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits - Alternating Layout */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl space-y-16">
            {/* Benefit 1 */}
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold">
                  Jedes Fütterungssystem anbindbar
                </h2>
                <p className="text-lg text-muted-foreground">
                  Grundsätzlich jedes System integrierbar, das Stallbereich/Bucht, Futtertyp/Komponente
                  und Zeitpunkt der Fütterung dokumentiert. CSV/Excel-Export genügt.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Automatische Duplikatserkennung für lückenlose Historie</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Intelligente Spaltenerkennung beim Import</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Daten über Jahre hinweg verfügbar</span>
                  </li>
                </ul>
                <Link href="/features">
                  <Button variant="link" className="gap-2 px-0">
                    Mehr zu Datenimporten <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold">
                  Preisänderungen jederzeit im Blick
                </h2>
                <p className="text-lg text-muted-foreground">
                  Ideal aufgestellt für Lieferantenverhandlungen. Vergleichen Sie die Futterkosteneffizienz
                  unterschiedlicher Lieferanten direkt und fundiert.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Zeitabhängige Preisstaffeln pro Lieferant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Automatische Preiszuordnung nach Datum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Kosteneffizienz-Vergleiche auf Knopfdruck</span>
                  </li>
                </ul>
                <Link href="/features">
                  <Button variant="link" className="gap-2 px-0">
                    Mehr zu Analysen <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold">
                  Individuelle Deckungsbeitragsberechnung
                </h2>
                <p className="text-lg text-muted-foreground">
                  Keine branchenweiten Durchschnittswerte – berechnen Sie Ihre tatsächlichen Kosten
                  basierend auf Ihren echten Daten. Weitere Kosten lassen sich einfach durchgangsbezogen zuordnen.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Kosten pro Produktionszyklus/Durchgang</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Zusätzliche Kosten wie Tierarzt, Strom, Stallmiete integrierbar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span>Vergleich zwischen verschiedenen Durchgängen</span>
                  </li>
                </ul>
                <Link href="/features">
                  <Button variant="link" className="gap-2 px-0">
                    Mehr zu Deckungsbeiträgen <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-4xl md:text-5xl font-bold">
                Häufige Fragen
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Antworten auf die wichtigsten Fragen zu barntrack
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Wie funktioniert der Datenimport?</h3>
                <p className="text-muted-foreground">
                  Sie können Daten aus jedem Fütterungssystem importieren, das CSV- oder Excel-Exporte
                  unterstützt. Unser System erkennt die Spalten automatisch und ordnet sie zu.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Welche Fütterungssysteme werden unterstützt?</h3>
                <p className="text-muted-foreground">
                  Grundsätzlich alle Systeme, die Stallbereich/Bucht, Futtertyp/Komponente und Zeitpunkt
                  der Fütterung dokumentieren können. Wir arbeiten an direkten Integrationen mit führenden
                  Herstellern.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Ist barntrack in der Beta-Phase kostenlos?</h3>
                <p className="text-muted-foreground">
                  Ja, während der Beta-Phase können Sie barntrack 14 Tage kostenlos testen. Danach wählen
                  Sie einen Plan, der zu Ihrem Betrieb passt.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Wie kann ich Partner werden?</h3>
                <p className="text-muted-foreground">
                  Wir suchen Partner aus der gesamten Wertschöpfungskette – von Futtermittelherstellern
                  bis zu Systemanbietern. Kontaktieren Sie uns über unsere Partnerschaftsseite.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Was ist das Ziel von barntrack?</h3>
                <p className="text-muted-foreground">
                  Unser Ziel ist es, Tierhaltern transparente Kostenverfolgung, Preisentwicklung und
                  Monitoring relevanter Erfolgskennzahlen zu ermöglichen – einfach und übersichtlich.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Wie sicher sind meine Daten?</h3>
                <p className="text-muted-foreground">
                  Alle Daten werden verschlüsselt in EU-Rechenzentren gespeichert und sind DSGVO-konform.
                  Ihre Daten gehören Ihnen und werden niemals ohne Ihre Zustimmung weitergegeben.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsorship Teaser */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Für Futtermittelhersteller & System-Anbieter
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Werden Sie Partner von barntrack. Profitieren Sie von technischen Integrationen,
                Voucher-Programmen und direktem Zugang zu landwirtschaftlichen Betrieben.
              </p>
              <Link href="/sponsorship">
                <Button size="lg" className="gap-2">
                  Partnerschaft entdecken <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Bereit durchzustarten?
            </h2>
            <p className="text-xl text-muted-foreground">
              Starten Sie noch heute kostenlos. 14 Tage voller Zugriff, keine Kreditkarte erforderlich.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  Kostenlos starten <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  Demo buchen
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Haben Sie Fragen? <Link href="/demo" className="underline hover:text-foreground">Kontaktieren Sie uns</Link>
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
