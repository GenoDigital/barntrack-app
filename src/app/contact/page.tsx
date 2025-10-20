import { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { ContactForm } from '@/components/marketing/contact-form'
import { BetaBanner } from '@/components/marketing/beta-banner'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontaktieren Sie das barntrack Team - Wir helfen Ihnen gerne weiter',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1 bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Kontaktieren Sie uns
              </h1>
              <p className="text-xl text-muted-foreground">
                Haben Sie Fragen zu barntrack, unseren Funktionen oder möchten Sie mehr über Partnerschaftsmöglichkeiten erfahren?
                Wir freuen uns auf Ihre Nachricht und melden uns schnellstmöglich bei Ihnen.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-center">
                Weitere Kontaktmöglichkeiten
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">E-Mail</h3>
                  <p className="text-sm text-muted-foreground">
                    Nutzen Sie unser Kontaktformular für schnelle Antworten
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Demo anfragen</h3>
                  <p className="text-sm text-muted-foreground">
                    Interessiert an einer persönlichen Demo?
                    <a href="/demo" className="text-blue-600 hover:underline ml-1">Hier anfragen</a>
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Partnerschaften</h3>
                  <p className="text-sm text-muted-foreground">
                    Interesse an einer Zusammenarbeit?
                    <a href="/sponsorship" className="text-blue-600 hover:underline ml-1">Mehr erfahren</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
