import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'

export const metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen (AGB) für die Nutzung von barntrack',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-sm text-muted-foreground">
              Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">

          <h2>1. Grundlagen</h2>

          <h3>1.1. Vertragspartner</h3>
          <p>
            Vertragspartner ist Lorenz Schmidt (Schützenstraße 19, 48143 Münster) im Folgenden
            Anbieter genannt und der Geschäftskunde, der nicht als Verbraucher gemäß § 13 BGB gilt.
          </p>

          <h3>1.2. Geltungsbereich und Exklusivität</h3>

          <h4>1.2.1.</h4>
          <p>
            Diese Bedingungen gelten für alle vertraglichen und vorvertraglichen Beziehungen mit
            unseren Geschäftskunden, ungeachtet des Leistungsumfangs. Sie sind ebenfalls Grundlage
            für alle künftigen Lieferungen und Dienstleistungen, selbst wenn sie nicht erneut
            explizit vereinbart werden. Abweichungen können aus spezifischen Vertragsvereinbarungen
            resultieren, die dann Vorrang haben.
          </p>

          <h4>1.2.2.</h4>
          <p>
            Abweichende Geschäftsbedingungen des Geschäftskunden werden nicht anerkannt, es sei
            denn, sie wurden von uns schriftlich bestätigt.
          </p>

          <h4>1.2.3.</h4>
          <p>
            Der Anbieter ist befugt, diese Geschäftsbedingungen sowie die jeweiligen Produkt- oder
            Dienstleistungsbeschreibungen oder Preise nach angemessener Vorankündigung zu ändern.
            Änderungen werden dem Geschäftskunden schriftlich mitgeteilt. Sollten die Änderungen
            den Geschäftskunden benachteiligen, hat dieser ein Sonderkündigungsrecht für den
            betroffenen Vertrag. Der Anbieter informiert den Geschäftskunden über dieses Recht
            sowie darüber, dass die Änderung wirksam wird, wenn der Geschäftskunde nicht innerhalb
            von vier Wochen nach Erhalt der Änderungsmiteilung kündigt.
          </p>

          <h3>1.3. Vertragsabschluss</h3>

          <h4>1.3.1.</h4>
          <p>
            Sofern nicht anders geregelt, erfolgt der Vertragsabschluss durch ein verbindliches
            Angebot vom Anbieter und die Auftragsvergabe durch den Geschäftskunden bzw. den Erhalt
            der Auftragsbestätigung vom Anbieter.
          </p>

          <h4>1.3.2.</h4>
          <p>
            Angebote vom Anbieter sind für 30 Tage bindend, sofern nicht anderweitig vereinbart.
            Das Angebotsdatum ist für die Fristberechnung maßgeblich.
          </p>

          <h3>1.4. Vertragsinhalt</h3>

          <h4>1.4.1.</h4>
          <p>Der Vertragsgegenstand ergibt sich aus dem jeweiligen Einzelvertrag.</p>

          <h4>1.4.2.</h4>
          <p>
            Für die Übernahme einer Garantie für bestimmte Merkmale einer Dienstleistung ist eine
            schriftliche Bestätigung durch den Anbieter erforderlich.
          </p>

          <h3>1.5. Beauftragung von Subunternehmern</h3>
          <p>
            Der Anbieter darf alle vertraglichen Leistungen durch Subunternehmer erbringen. Für
            deren Leistungen haftet Anbieter wie für eigene Tätigkeiten.
          </p>

          <h2>2. Leistungen von Anbieter</h2>
          <p>Die Leistungen vom Anbieter werden in den jeweiligen Einzelverträgen festgelegt.</p>

          <h3>2.1. Bedingungen für Softwareprodukte von Anbieter</h3>
          <p>
            Die folgenden Bedingungen gelten für die Überlassung von Softwareprodukten vom
            Anbieter.
          </p>

          <h4>2.1.1. Dauerhaftes Lizenzmodell</h4>
          <p>
            Bei einmaliger Zahlungsvereinbarung räumt Anbieter dem Geschäftskunden ein einfaches,
            unbefristetes, nicht übertragbares Nutzungsrecht für die in der Rechnung und/oder dem
            Auftrag angegebene Software ein.
          </p>

          <h4>2.1.2. Abo-Lizenzmodell</h4>
          <p>
            Bei der Vereinbarung wiederkehrender Gebühren erhält der Geschäftskunde ein einfaches,
            befristetes und nicht übertragbares Nutzungsrecht für die in der Rechnung und/oder dem
            Auftrag genannte Software.
          </p>

          <h4>2.1.3.</h4>
          <p>
            Äußerungen von Mitarbeitern vom Anbieter oder Dritten sowie Werbeaussagen stellen im
            Zweifel nur dann eine Beschaffenheitsangabe der geschuldeten Leistung dar, wenn der
            Anbieter dies schriftlich bestätigt hat.
          </p>

          <h4>2.1.4.</h4>
          <p>
            Anbieter ist berechtigt, den Inhalt seiner Leistungen einschließlich der
            bereitgestellten Software im Rahmen von nutzeroberflächenbezogenen, technologischen
            oder inhaltlichen Weiterentwicklungen zu verändern und anzupassen, sofern die
            vereinbarten Funktionalitäten der Software hierdurch nicht wesentlich eingeschränkt
            werden.
          </p>

          <h4>2.1.5. Eigentums- und Urheberrechte</h4>
          <p>
            Die dem Geschäftskunden überlassene Software und sämtliche zugehörigen Dokumentationen
            verbleiben im Eigentum vom Anbieter. Jegliche Urheber- und Nutzungsrechte bleiben beim
            Anbieter. Es ist dem Geschäftskunden untersagt, Schutzrechtshinweise zu entfernen oder
            zu verändern. Jegliche nicht ausdrücklich erlaubte Vervielfältigung, Modifikation oder
            Verbreitung ist untersagt. Das Dekompilieren, Rückassemblieren oder Umwandeln der
            Software in lesbaren Code sowie jede nicht ausdrücklich genehmigte Nutzung, Verbreitung
            oder Änderung ist verboten. Jegliche Dokumentation im Zusammenhang mit der Software ist
            urheberrechtlich geschützt und darf nicht ohne explizite Zustimmung vervielfältigt oder
            weitergegeben werden.
          </p>

          <h3>2.2. Bedingungen für Dienstleistungen oder Werkleistungen</h3>

          <h4>2.2.1. Dienstleistungen</h4>
          <p>
            Der Anbieter erbringt Beratungs- und Unterstützungsleistungen für den Kunden. Diese
            Dienstleistungen dienen ausschließlich der Unterstützung des Kunden bei einem
            Vorhaben, das der Kunde in eigener Verantwortung durchführt. Eine Haftung für das
            Erreichen eines bestimmten Ergebnisses seitens des Anbieters ist ausgeschlossen.
          </p>

          <h4>2.2.3. Abnahme bei Werkleistungen</h4>
          <p>
            Der Anbieter stellt dem Kunden die vertragsgemäß hergestellte Leistung bzw. in sich
            abgeschlossene Teile zur Abnahme zur Verfügung. Die Abnahme erfolgt durch den Kunden
            unverzüglich und umfasst Funktionsprüfungen anhand von Testdaten und Testszenarien, die
            der Kunde bereitzustellen hat. Sollten keine erheblichen Mängel festgestellt werden,
            ist die Abnahme als erfolgreich zu betrachten. Nicht wesentliche Abweichungen
            berechtigen den Kunden nicht zur Abnahmeverweigerung, wobei die
            Mängelbeseitigungspflicht von Anbieter unberührt bleibt. Eine Abnahme gilt als erfolgt,
            wenn innerhalb von dreißig Tagen nach Bereitstellung keine erheblichen Mängel gerügt
            wurden oder der Kunde die Arbeitsergebnisse in seinen Produktivbetrieb übernimmt.
          </p>

          <h4>2.2.4. Eigentums- und Nutzungsrechte bei Werkleistung</h4>
          <p>
            Alle Urheberrechts- und Nutzungsrechte an Materialien, die im Rahmen der Werkleistung
            entstehen oder bereits existierten, verbleiben bei Anbieter. Der Kunde erhält, sofern
            nicht anders vertraglich geregelt, ein unwiderrufliches, nicht-exklusives Nutzungsrecht
            zur Verwendung dieser Materialien innerhalb seines Unternehmens sowie für mit ihm
            verbundene Unternehmen gemäß § 15 AktG.
          </p>
          <p>
            Wird dem Kunden ein exklusives Nutzungsrecht eingeräumt und der Vertrag wird vom Kunden
            vor Vollendung der Werkleistung aus Gründen, die Anbieter nicht zu vertreten hat,
            gekündigt, erhält der Kunde nur ein einfaches Nutzungsrecht an den bis dahin
            übergebenen Arbeitsergebnissen.
          </p>

          <h2>3. Kundenverantwortlichkeiten und -pflichten</h2>

          <h3>3.1.</h3>
          <p>
            Der Kunde ist dafür zuständig, auf eigene Kosten alle erforderlichen Bedingungen in
            seinem Betriebsbereich zu schaffen, die für eine sachgemäße Erbringung der
            Dienstleistungen durch Anbieter notwendig sind. Insbesondere obliegt dem Kunden die
            Verantwortung für die Bereitstellung sowie die Richtigkeit und Vollständigkeit aller
            Informationen, Dokumente und Arbeitsmittel, die Anbieter für die Leistungserbringung
            benötigt.
          </p>

          <h3>3.2.</h3>
          <p>
            Wenn der Kunde seine Mitwirkungspflichten nicht erfüllt oder versäumt, diese
            ordnungsgemäß oder rechtzeitig zu erfüllen, und dadurch die Leistungserbringung durch
            Anbieter behindert ist, wird der Anbieter von der Pflicht zur Erbringung der
            betroffenen Leistung und eventuell vereinbarten Fristen und Meilensteinen entbunden. In
            solchen Fällen werden vereinbarte Termine und Fristen angepasst und um einen
            angemessenen Zeitraum verlängert oder verschoben.
          </p>

          <h3>3.3.</h3>
          <p>
            Der Kunde ist verpflichtet, dem Anbieter alle Kosten, Schäden und zusätzlichen Gebühren
            zu erstatten, die durch die Nichterfüllung seiner Mitwirkungspflichten entstehen.
          </p>

          <h2>4. Entgelte und Zahlungsmodalitäten</h2>

          <h3>4.1.</h3>
          <p>Alle angegebenen Preise sind zuzüglich der gesetzlich anfallenden Mehrwertsteuer.</p>

          <h3>4.2.</h3>
          <p>
            Die Preise ergeben sich aus dem jeweiligen Vertrag oder, bei fristgerechter Annahme
            eines Angebots vom Anbieter, aus diesem Angebot. Fehlt eine solche Vereinbarung, gelten
            die zum Zeitpunkt der Auftragsannahme durch Anbieter gültigen Preis- und Produktlisten,
            die dem Angebot beigefügt bzw. enthalten sind. Die Preise verstehen sich, sofern nicht
            anders vereinbart, exklusive Nebenkosten wie Reise-, Transport- und Versicherungskosten.
          </p>

          <h3>4.3.</h3>
          <p>
            Im Vertrag genannte Kostenschätzungen für zeit- und materialbasierte Leistungen sind
            unverbindlich. Sie basieren auf einer nach bestem Wissen und Gewissen durchgeführten
            Beurteilung des benötigten Aufwands. Die Abrechnung erfolgt auf Basis des tatsächlichen
            Arbeitsaufwands, sofern vertraglich nichts anderes festgelegt ist.
          </p>

          <h3>4.4.</h3>
          <p>Einmalige Gebühren werden mit Erbringung der Leistung fällig.</p>

          <h3>4.5.</h3>
          <p>
            Wiederkehrende Gebühren sind jeweils im Voraus für den vereinbarten Abrechnungszeitraum
            (monatlich, jährlich) fällig.
          </p>

          <h3>4.6.</h3>
          <p>
            Für dauerhafte Vertragsverhältnisse erteilt der Kunde Anbieter ein
            SEPA-Lastschriftmandat für den Einzug der laufenden Gebühren.
          </p>

          <h3>4.7.</h3>
          <p>
            Alle Rechnungen sind nach Erhalt innerhalb einer Frist von 10 Tagen vollständig zu
            begleichen. Ein Skonto wird nicht eingeräumt.
          </p>

          <h3>4.8.</h3>
          <p>
            Beanstandungen gegenüber der Rechnungsstellung von Anbieter müssen innerhalb einer
            Frist von 14 Tagen nach Rechnungserhalt schriftlich erfolgen. Unterlassene oder
            versäumte Einwände gelten als Genehmigung. Gesetzliche Ansprüche bei versäumten
            Beanstandungen bleiben unberührt.
          </p>

          <h3>4.9.</h3>
          <p>
            Anbieter behält sich das Recht vor, bei laufender monatlicher oder jährlicher Vergütung
            die Preise während der Vertragslaufzeit zu ändern. Diese Änderungen werden dem Kunden
            mit einer Frist von vier Wochen mitgeteilt und berechtigen diesen zu einer
            außerordentlichen Kündigung innerhalb von zwei Wochen nach Erhalt der Mitteilung.
          </p>

          <h3>4.10.</h3>
          <p>
            Preiserhöhungen für Waren und Dienstleistungen werden dem Kunden kommuniziert und
            werden mit Zugang der Mitteilung wirksam. Der Kunde hat dann das Recht, innerhalb eines
            Monats den Vertrag für den betroffenen Vertragsgegenstand zu kündigen. Preiserhöhungen
            treten nicht in Kraft, wenn zwischen Vertragsschluss und Lieferung weniger als vier
            Monate liegen.
          </p>

          <h3>4.11.</h3>
          <p>
            Bei Nichtbeachtung der Zahlungsbedingungen oder Zahlungsverzug werden alle Forderungen
            von Anbieter sofort fällig. Dies gilt auch, wenn der Kunde bei Ratenzahlungen einen
            rückständigen Betrag hat, der mindestens 10% des gesamten Kaufpreises ausmacht. In
            solchen Fällen kann der Anbieter den Vertrag kündigen und Schadensersatz verlangen.
          </p>

          <h3>4.12.</h3>
          <p>
            Ein Zurückbehaltungsrecht, das nicht auf demselben Vertragsverhältnis beruht, kann vom
            Kunden nicht ausgeübt werden. Aufrechnungen sind nur mit unbestritenen oder
            rechtskräftig festgestellten Forderungen möglich.
          </p>

          <h2>5. Eigentumsvorbehalt</h2>

          <h3>5.1.</h3>
          <p>
            Der Anbieter behält sich das Eigentum bzw. bei Software und IT-Services einzuräumende
            Rechte bis zur vollständigen Bezahlung der geschuldeten Vergütung vor.
          </p>

          <h3>5.2.</h3>
          <p>
            Zuvor sind die eingeräumten Rechte nur vorläufig und durch den Anbieter bzw. die
            Lizenzgeber frei widerruflich eingeräumt. Bei Software erlischt bei Geltendmachung des
            Eigentumsvorbehalts das Recht des Kunden zur Weiterverwendung. Sämtliche vom Kunden
            gefertigten Programmkopien müssen gelöscht werden.
          </p>

          <h3>5.3.</h3>
          <p>
            Verkaufte Ware bleibt bis zur vollständigen Bezahlung sämtlicher Forderungen durch den
            Kunden Eigentum von Anbieter. Der Kunde ist nicht berechtigt, die Ware zu verpfänden
            oder zu übereignen. Bei Zugriffen Dritter auf die Vorbehaltsware wird der Kunde auf das
            Eigentum von Anbieter hinweisen und Anbieter unverzüglich benachrichtigen. Bei
            verschuldeten Zahlungsrückständen des Kunden gilt die Geltendmachung des
            Eigentumsvorbehalts nicht als Rücktritt vom Vertrag. Im Fall der Verletzung der
            vorgenannten Pflichten steht Anbieter nach fruchtlosem Ablauf einer angemessenen
            Nachfrist das Recht zu, vom Vertrag zurückzutreten.
          </p>

          <h2>6. Verzug</h2>

          <h3>6.1.</h3>
          <p>
            In den Vertragsunterlagen etc. genannte Liefer- und Leistungstermine oder -fristen sind
            nur dann verbindlich, wenn diese vom Anbieter schriftlich als verbindlich bezeichnet
            worden sind.
          </p>

          <h3>6.2.</h3>
          <p>
            Gerät der Anbieter bei der Erfüllung einer Leistung in Verzug, kann sich der Kunde von
            dem Vertrag lösen oder Schadensersatz wegen Nichterfüllung verlangen, wenn er zuvor
            schriftlich eine fruchtlos abgelaufene Nachfrist von mindestens vier Wochen gesetzt
            hat.
          </p>

          <h3>6.3.</h3>
          <p>
            Die Vertragslösung erfolgt bei Dauerschuldverhältnissen (z.B. Lizenzvertrag,
            Wartungsvertrag) durch fristlose Kündigung, ansonsten durch einen Rücktritt vom
            Vertrag.
          </p>

          <h3>6.4.</h3>
          <p>
            Darüber hinaus sind Schadensersatzansprüche des Kunden oder der
            Aufwendungsersatzanspruch wegen Nichterfüllung oder verspäteter Erfüllung sowie wegen
            etwaiger Folgeschäden ausgeschlossen, soweit nicht gemäß Ziff. 8 (Haftung) zwingend
            gehaftet wird.
          </p>

          <h2>7. Mängelansprüche</h2>
          <p>
            Der Anbieter bietet Softwareprodukte im Rahmen eines Softwareüberlassungsvertrages an,
            welcher die zeitweise Überlassung von Softwareprodukten als Mietsache regelt. Bei
            angebotenen Werksleistungen oder anderen Leistungen finden die untenstehenden
            Regelungen falls entsprechend und zutreffend Anwendung.
          </p>

          <h3>7.1. Bei Softwareprodukten</h3>

          <h4>7.1.1.</h4>
          <p>
            Bei Mängeln von Softwareprodukten vom Anbieter ist der Anbieter nach seiner Wahl zur
            Beseitigung des Mangels oder zur Lieferung einer mangelfreien Sache verpflichtet
            (Nacherfüllung).
          </p>

          <h4>7.1.2.</h4>
          <p>
            Im Abonnementlizenzmodell hat der Kunde das Recht, soweit und solange die Nutzung der
            Programme durch die Mängel erheblich eingeschränkt ist, die laufende Gebühr angemessen
            zu mindern.
          </p>

          <h4>7.1.3.</h4>
          <p>
            Im zeitlich unbeschränkten Lizenzmodell hat der Kunde nach seiner Wahl ein Minderungs-
            oder Kündigungsrecht, sofern der Anbieter die Nacherfüllung verweigert oder diese
            innerhalb von 3 Monaten nicht gelingt.
          </p>

          <h4>7.1.4.</h4>
          <p>
            Der Kunde darf einen Mangel nur dann selbst beseitigen und kann verlangen, dass insoweit
            entstandene Kosten ersetzt werden, wenn der Mangel nicht innerhalb von drei Monaten
            beseitigt wird und der Anbieter aufgrund einer dann erfolgten Mahnung des Kunden in
            Verzug geraten ist. § 536a Abs. 1 1.Alt. BGB ist ausgeschlossen.
          </p>

          <h4>7.1.5.</h4>
          <p>
            Die Mängelhaftung umfasst nicht die Beseitigung von Fehlern oder hierdurch entstandenen
            Mehraufwand, die durch äußere Einflüsse, Bedienungsfehler und nicht vom Anbieter
            durchgeführte Änderungen bzw. An- und Einbauten verursacht wurden.
          </p>

          <h3>7.2. Bei Werkleistungen</h3>

          <h4>7.2.1.</h4>
          <p>
            Sollte die Ausführung einer Werkleistung erhebliche Mängel aufweisen, die den
            vertraglich vereinbarten Gebrauch signifikant beeinträchtigen, erhält der Kunde nach
            Wahl des Anbieters das Recht auf Nachbesserung oder Ersatzlieferung (Nacherfüllung).
          </p>

          <h4>7.2.2.</h4>
          <p>
            Sofern der Kunde dem Anbieter nach einer ersten Aufforderung eine angemessene Frist von
            mindestens vier Wochen zur Nacherfüllung gesetzt hat und der Anbieter entweder die
            Nacherfüllung verweigert, oder diese fehlschlägt, hat der Kunde das Recht, entweder vom
            Vertrag zurückzutreten oder eine angemessene Minderung der Vergütung zu verlangen. Bei
            geringfügigen Abweichungen der Leistung, die die Funktionstauglichkeit nicht
            beeinträchtigen, kann der Kunde lediglich eine Herabsetzung der Vergütung fordern.
          </p>

          <h4>7.2.3.</h4>
          <p>
            Die Frist für Gewährleistungsansprüche des Kunden beträgt ein Jahr ab der Abnahme der
            jeweiligen Leistung. Im Falle von Teilleistungen beginnt die Frist mit der Abnahme der
            letzten Teilleistung. Sollte der Kunde eine Teilleistung nutzen, beginnt die
            Gewährleistungsfrist für diese Teilleistung mit dem ersten Tag der Nutzung nach der
            Teilabnahme. Davon ausgenommen ist die Gewährleistung für das ordnungsgemäße
            Zusammenspiel aller Teilleistungen und die Erfüllung der vereinbarten
            Leistungsmerkmale des gesamten Werkes.
          </p>

          <h3>7.3. Abwicklung</h3>

          <h4>7.3.1.</h4>
          <p>
            Mängel hat der Kunde dem Anbieter unverzüglich nach Entdeckung zu melden; diese Meldung
            ist mit einer konkreten Mängelbeschreibung zu verbinden. Der Kunde stellt dem Anbieter
            unaufgefordert Unterlagen und Informationen zur Verfügung, die dieser zur Beurteilung
            und Beseitigung benötigt.
          </p>

          <h4>7.3.2.</h4>
          <p>
            Hat der Anbieter nach Meldung eines Mangels Leistungen für eine Mängelsuche erbracht
            und liegt kein Sachmangel vor, so hat der Kunde die hierdurch entstandenen Kosten gemäß
            der allgemein vom Anbieter angewandten Vergütungssätze zu tragen.
          </p>

          <h4>7.3.3.</h4>
          <p>Die Abtretung von Mängelansprüchen an Dritte ist ausgeschlossen.</p>

          <h4>7.3.4.</h4>
          <p>
            Für etwaige Schadensersatzansprüche gelten die Bestimmungen gemäß Ziffer 8.
          </p>

          <h2>8. Haftung</h2>

          <h3>8.1.</h3>
          <p>
            Der Anbieter haftet bei Vorsatz und grober Fahrlässigkeit, nach dem
            Produkthaftungsgesetz sowie bei Personenschäden nach den gesetzlichen Vorschriften.
          </p>

          <h3>8.2.</h3>
          <p>
            Bei leichter Fahrlässigkeit haftet der Anbieter nur, wenn eine wesentliche
            Vertragspflicht ("Kardinalpflicht") verletzt wird oder ein Fall des Verzugs oder der
            Unmöglichkeit vorliegt. Diese Haftung ist bei Sach- und Vermögensschäden auf den
            vertragstypischen und vorhersehbaren Schaden, maximal jedoch auf 20.000,- EUR je
            Schadensfall und Kunde beschränkt. Im Übrigen ist die Haftung ausgeschlossen.
          </p>

          <h2>9. Höhere Gewalt</h2>

          <h3>9.1.</h3>
          <p>
            Eine Haftung des Anbieters im Fall höherer Gewalt ist ausgeschlossen. Dies umfasst
            unter anderem den Ausfall der externen Infrastruktur, Krieg, Unwetterkatastrophen sowie
            Pandemien.
          </p>

          <h3>9.2.</h3>
          <p>
            Ereignisse höherer Gewalt, die dem Anbieter die Leistung wesentlich erschweren oder
            unmöglich machen, berechtigen ihn, die Erfüllung seiner Verpflichtungen um die Dauer
            der Behinderung und um eine angemessene Anlaufzeit hinauszuschieben.
          </p>

          <h2>10. Vertragsdauer/ Kündigung</h2>

          <h3>10.1.</h3>
          <p>
            Verträge mit dem Anbieter über Dauerschuldverhältnisse, wie beispielsweise
            Abonnement-Lizenzmodelle, werden auf unbestimmte Zeit, jedoch mindestens für die im
            Vertrag festgelegte Mindestlaufzeit, abgeschlossen.
          </p>

          <h3>10.2.</h3>
          <p>
            Sofern nicht anders vereinbart, können unbefristete Verträge von jeder Partei mit einer
            Frist von drei Monaten zum Monatsende gekündigt werden. Dies gilt auch für die
            Kündigung einzelner Leistungen oder Verfahren.
          </p>

          <h3>10.3.</h3>
          <p>
            Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt für beide
            Vertragsparteien unberührt.
          </p>

          <h3>10.4.</h3>
          <p>
            Der Anbieter behält sich das Recht vor den Vertrag zu kündigen, falls der Kunde die
            Software nicht gemäß Vertragsbedingungen verwendet. Darunter fallen unerlaubte
            Weitergabe an Dritte oder nicht genehmigte Änderungen an der Software.
          </p>

          <h3>10.5.</h3>
          <p>
            Bei Vertragsbeendigung im Abonnement-Lizenzmodell ist der Kunde verpflichtet, alle
            erhaltenen Materialien, einschließlich Software und Dokumentation, zurückzugeben oder
            unbrauchbar zu machen.
          </p>

          <h3>10.6.</h3>
          <p>
            Der Kunde wird auf Anforderung vom Anbieter eine Bestätigung übergeben, die die
            vollständige und vertragskonforme Erfüllung aller Rückgabeverpflichtungen bescheinigt.
          </p>

          <h2>11. Datenschutz</h2>

          <h3>11.1.</h3>
          <p>
            Der Anbieter weist darauf hin, dass personenbezogene Daten für die Durchführung des
            Vertrages gespeichert werden.
          </p>

          <h3>11.2.</h3>
          <p>
            Der Anbieter darf die Bestandsdaten der Kunden für Beratungszwecke, zur
            bedarfsgerechten Gestaltung seiner Leistungen und für eigene Zwecke verarbeiten und
            nutzen.
          </p>

          <h2>12. Sonstige Bestimmungen</h2>

          <h3>12.1.</h3>
          <p>
            Alle Geschäftsbeziehungen unterliegen dem Recht der Bundesrepublik Deutschland.
            Erfüllungsort und Gerichtsstand ist, sofern nicht anders vereinbart, der Sitz des
            Anbieters.
          </p>

          <h3>12.2.</h3>
          <p>
            Sollten Teile dieser Vertragsbedingungen ungültig sein, bleibt die Gültigkeit der
            übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, ungültige oder
            unvollständige Vertragsbestimmungen durch gesetzlich zulässige Regelungen zu ersetzen.
          </p>

          <h2>Kontakt</h2>
          <p>
            Bei Fragen zu diesen AGB wenden Sie sich bitte an:<br />
            E-Mail: <a href="mailto:legal@barntrack.app" className="text-primary hover:underline">legal@barntrack.app</a>
          </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
