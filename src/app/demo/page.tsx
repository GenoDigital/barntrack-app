import Link from 'next/link'
import { Phone, Mail, MessageSquare, Calendar } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { DemoForm } from '@/components/marketing/demo-form'
import { BetaBanner } from '@/components/marketing/beta-banner'

export default function DemoPage() {
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
              Lassen Sie sich überzeugen
            </h1>
            <p className="text-xl text-muted-foreground">
              Buchen Sie eine persönliche Demo und erfahren Sie, wie barntrack Ihre Futtermittelverwaltung revolutionieren kann
            </p>
          </div>
        </section>

        {/* What to Expect */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Was Sie erwarten können</h2>
              <p className="text-lg text-muted-foreground">
                In einer 30-minütigen Demo zeigen wir Ihnen alle Funktionen
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-background rounded-lg text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Live-Demo</h3>
                <p className="text-sm text-muted-foreground">
                  Sehen Sie barntrack in Aktion mit echten Daten und Szenarien
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Individuelle Beratung</h3>
                <p className="text-sm text-muted-foreground">
                  Wir gehen auf Ihre spezifischen Anforderungen ein
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Q&A Session</h3>
                <p className="text-sm text-muted-foreground">
                  Stellen Sie alle Ihre Fragen direkt an unser Team
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Onboarding-Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Erhalten Sie einen maßgeschneiderten Implementierungsplan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Form */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Demo anfragen</h2>
              <p className="text-lg text-muted-foreground">
                Füllen Sie das Formular aus und wir melden uns innerhalb von 24 Stunden
              </p>
            </div>
            <DemoForm />
          </div>
        </section>

        {/* Alternative Contact Options */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Weitere Kontaktmöglichkeiten</h2>
              <p className="text-lg text-muted-foreground">
                Wir sind für Sie da
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-background rounded-lg text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Telefon</h3>
                <p className="text-muted-foreground">
                  Rufen Sie uns direkt an
                </p>
                <a href="tel:+49123456789" className="block text-primary hover:underline font-semibold">
                  +49 123 456 789
                </a>
                <p className="text-sm text-muted-foreground">
                  Mo-Fr: 9:00 - 17:00 Uhr
                </p>
              </div>
              <div className="p-8 bg-background rounded-lg text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">E-Mail</h3>
                <p className="text-muted-foreground">
                  Schreiben Sie uns
                </p>
                <a href="mailto:info@barntrack.app" className="block text-primary hover:underline font-semibold">
                  info@barntrack.app
                </a>
                <p className="text-sm text-muted-foreground">
                  Antwort innerhalb von 24h
                </p>
              </div>
              <div className="p-8 bg-background rounded-lg text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Live-Chat</h3>
                <p className="text-muted-foreground">
                  Chatten Sie mit uns
                </p>
                <button className="text-primary hover:underline font-semibold">
                  Chat starten
                </button>
                <p className="text-sm text-muted-foreground">
                  Verfügbar Mo-Fr 9-17 Uhr
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Häufig gestellte Fragen</h2>
            </div>
            <div className="space-y-6">
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Wie lange dauert eine Demo?</h3>
                <p className="text-muted-foreground">
                  Eine Standard-Demo dauert etwa 30 Minuten. Wir passen die Länge aber gerne an Ihre Bedürfnisse an.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Muss ich mich vorher vorbereiten?</h3>
                <p className="text-muted-foreground">
                  Nein, keine Vorbereitung nötig. Hilfreich ist es, wenn Sie Ihre aktuellen Herausforderungen und Anforderungen im Kopf haben.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Kann ich barntrack auch direkt testen?</h3>
                <p className="text-muted-foreground">
                  Ja! Sie können sich jederzeit für eine 14-tägige kostenlose Testphase{' '}
                  <Link href="/signup" className="text-primary hover:underline">
                    registrieren
                  </Link>
                  . Eine Demo hilft Ihnen aber, schneller durchzustarten.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Wie schnell kann ich nach der Demo starten?</h3>
                <p className="text-muted-foreground">
                  Sofort! Nach der Demo können Sie sich direkt registrieren und mit dem Import Ihrer Daten beginnen. Wir unterstützen Sie gerne beim Onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
