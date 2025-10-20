import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'

export const metadata = {
  title: 'Impressum',
  description: 'Impressum und rechtliche Angaben zu barntrack',
}

export default function ImprintPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl prose prose-neutral dark:prose-invert">
          <h1>Impressum</h1>

          <p className="lead">
            Angaben gemäß § 5 TMG (Telemediengesetz)
          </p>

          <h2>Anbieter</h2>
          <p>
            Lorenz Schmidt<br />
            GENO digital<br />
            Schützenstraße 19<br />
            48143 Münster<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: 0 160 910 144 70<br />
            E-Mail: support@geno-digital.de
          </p>

          <h2>Umsatzsteuer-Identifikationsnummer</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
            DE351745817
          </p>

          <h2>Redaktionell verantwortlich</h2>
          <p>
            Lorenz Schmidt
          </p>

          <h2>Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            {' '}<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftungsausschluss</h2>

          <h3>Haftung für Inhalte</h3>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
            entfernen.
          </p>

          <h3>Haftung für Links</h3>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich.
          </p>
          <p>
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>

          <h3>Urheberrecht</h3>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
          <p>
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
            Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
            wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter
            als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung
            aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>

          <h3>Markenrechtlicher Hinweis</h3>
          <p>
            Die auf dieser Website genannten Marken, Namen und Logos gehören ihren jeweiligen
            Eigentümern. Die Verwendung dieser Marken und Logos dient ausschließlich zur Darstellung
            der technischen Kompatibilität unserer Produkte mit den jeweiligen Softwarelösungen.
            Es besteht keine Partnerschaft, Unterstützung oder anderweitige Beziehung zwischen uns
            und den Eigentümern der genannten Marken, Namen und Logos, es sei denn, dies ist
            ausdrücklich angegeben. Alle Rechte an den genannten Marken, Namen und Logos liegen
            bei den jeweiligen Inhabern.
          </p>

          <p className="text-sm text-muted-foreground mt-12">
            Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
