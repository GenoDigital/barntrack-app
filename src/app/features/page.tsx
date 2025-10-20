import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Upload, TrendingUp, Calculator, Target, Users, Shield, Database, Zap, Settings, LineChart, BarChart, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container mx-auto px-4 max-w-4xl text-center space-y-5">
            <div className="inline-block">
              <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Funktionsübersicht
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Alle Features für effiziente Futterverwaltung
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Von flexiblen Datenimporten bis zu individuellen Deckungsbeiträgen –
              alles was Sie für fundierte Entscheidungen brauchen
            </p>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl space-y-16">
            {/* Feature 1: Import */}
            <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-4xl font-bold">Flexible Datenimporte</h2>
                <p className="text-lg text-muted-foreground">
                  Importieren Sie Daten aus jedem Fütterungssystem, das Stallbereich/Bucht,
                  Futtertyp/Komponente und Zeitpunkt der Fütterung dokumentiert. CSV/Excel-Export genügt.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Automatische Duplikatserkennung</p>
                      <p className="text-sm text-muted-foreground">Lückenlose Zeitreihen über Jahre hinweg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Intelligente Spaltenerkennung</p>
                      <p className="text-sm text-muted-foreground">System erkennt Datum, Futtertyp, Menge automatisch</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Drag & Drop Upload</p>
                      <p className="text-sm text-muted-foreground">Einfacher CSV/Excel Import mit Live-Vorschau</p>
                    </div>
                  </div>
                </div>
              </div>

            {/* Feature 2: Pricing */}
            <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-4xl font-bold">Preisänderungen jederzeit im Blick</h2>
                <p className="text-lg text-muted-foreground">
                  Verwalten Sie Lieferanten mit zeitabhängigen Preisstaffeln und vergleichen Sie
                  die Futterkosteneffizienz unterschiedlicher Anbieter – ideal für Verhandlungen.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Zeitabhängige Preisstaffeln</p>
                      <p className="text-sm text-muted-foreground">Winter-/Sommerpreise automatisch zuordnen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Lieferantenvergleiche</p>
                      <p className="text-sm text-muted-foreground">Kosteneffizienz auf Knopfdruck analysieren</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Historische Preisdaten</p>
                      <p className="text-sm text-muted-foreground">Verfolgen Sie Preisentwicklungen über Zeit</p>
                    </div>
                  </div>
                </div>
              </div>

            {/* Feature 3: Deckungsbeitrag */}
            <div className="space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-orange-500/10 rounded-2xl">
                  <Calculator className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-4xl font-bold">Individuelle Deckungsbeiträge</h2>
                <p className="text-lg text-muted-foreground">
                  Keine branchenweiten Durchschnittswerte – berechnen Sie Ihre tatsächlichen Kosten
                  pro Durchgang basierend auf echten Verbrauchsdaten.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Durchgangsbezogene Kosten</p>
                      <p className="text-sm text-muted-foreground">Pro Produktionszyklus mit Start-/Enddatum</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Weitere Kostenarten</p>
                      <p className="text-sm text-muted-foreground">Tierarzt, Strom, Stallmiete einfach zuordnen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Durchgangsvergleiche</p>
                      <p className="text-sm text-muted-foreground">Optimieren Sie basierend auf echten Zahlen</p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-4xl md:text-5xl font-bold">Häufige Fragen</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Antworten zu den Features von barntrack
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Welche Datenformate werden unterstützt?</h3>
                <p className="text-muted-foreground">
                  Wir unterstützen CSV- und Excel-Dateien (XLSX). Das System erkennt automatisch die Spalten
                  und ordnet Datum, Futtertyp, Menge und Bereich zu.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Wie sicher sind meine Daten?</h3>
                <p className="text-muted-foreground">
                  Alle Daten werden verschlüsselt in EU-Rechenzentren gespeichert. Wir sind DSGVO-konform
                  und nutzen Row Level Security für strikte Datentrennung zwischen Betrieben.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Kann ich mehrere Betriebe verwalten?</h3>
                <p className="text-muted-foreground">
                  Ja, je nach Plan können Sie einen oder mehrere Betriebe verwalten. Die Daten werden
                  strikt getrennt und Sie können zwischen Betrieben wechseln.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Gibt es Support während der Beta?</h3>
                <p className="text-muted-foreground">
                  Ja, wir bieten E-Mail-Support für alle Nutzer. Als Beta-Tester haben Sie direkten
                  Kontakt zum Entwicklerteam und können Funktionen mitgestalten.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Werden weitere Integrationen geplant?</h3>
                <p className="text-muted-foreground">
                  Ja, wir arbeiten an direkten Integrationen mit führenden Fütterungssystemherstellern.
                  Wenn Sie spezifische Wünsche haben, kontaktieren Sie uns gerne.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Kann ich meine Daten exportieren?</h3>
                <p className="text-muted-foreground">
                  Absolut. Ihre Daten gehören Ihnen. Sie können jederzeit alle Daten als Excel oder CSV
                  exportieren – ohne Einschränkungen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold">
              Werden Sie Early Adopter
            </h2>
            <p className="text-lg text-muted-foreground">
              Testen Sie barntrack 14 Tage kostenlos während der Beta-Phase. Keine Kreditkarte erforderlich.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Kostenlos starten <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="gap-2">
                  Live-Demo buchen
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
