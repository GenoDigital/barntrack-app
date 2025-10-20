import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { BetaBanner } from '@/components/marketing/beta-banner'
import { CookieSettingsButton } from '@/components/cookie-settings-button'

export const metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung für barntrack - Informationen zur Erhebung und Verarbeitung personenbezogener Daten',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <BetaBanner />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl prose prose-neutral dark:prose-invert">
          <h1>Datenschutzerklärung</h1>

          <p className="lead">
            Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung
            informiert Sie darüber, wie wir mit Ihren personenbezogenen Daten umgehen.
          </p>

          <h2>1. Datenschutz auf einen Blick</h2>

          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
            Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
            Text aufgeführten Datenschutzerklärung.
          </p>

          <h3>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
            Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser
            Datenschutzerklärung entnehmen.
          </p>

          <h3>Wie erfassen wir Ihre Daten?</h3>
          <p>
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei
            kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
          </p>
          <p>
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website
            durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B.
            Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser
            Daten erfolgt automatisch, sobald Sie diese Website betreten.
          </p>

          <h3>Wofür nutzen wir Ihre Daten?</h3>
          <p>
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
            gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
          </p>

          <h3>Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
            Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein
            Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
            Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
            jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten
            Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
            verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
            Aufsichtsbehörde zu.
          </p>
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an
            uns wenden.
          </p>

          <h2>2. Hosting</h2>
          <p>
            Die Inhalte unserer Website werden bei einem externen Dienstleister gehostet. Die
            personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern
            des Hosters in EU-Rechenzentren gespeichert. Hierbei kann es sich v.a. um IP-Adressen,
            Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen,
            Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
          </p>
          <p>
            Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren
            potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse
            einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch
            einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
          <p>
            Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner
            Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten
            befolgen. Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des
            oben genannten Dienstes geschlossen.
          </p>

          <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>

          <h3>Datenschutz</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst.
            Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den
            gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>
          <p>
            Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
            Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden
            können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und
            wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
          </p>
          <p>
            Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der
            Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz
            der Daten vor dem Zugriff durch Dritte ist nicht möglich.
          </p>

          <h3>Hinweis zur verantwortlichen Stelle</h3>
          <p>
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p>
            Lorenz Schmidt<br />
            GENO digital<br />
            Schützenstraße 19<br />
            48143 Münster
          </p>
          <p>
            Telefon: 0 160 910 144 70<br />
            E-Mail: support@geno-digital.de
          </p>
          <p>
            Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
            gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen
            Daten (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
          </p>

          <h3>Speicherdauer</h3>
          <p>
            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
            wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
            Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen
            oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
            sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer
            personenbezogenen Daten haben (z.B. steuer- oder handelsrechtliche
            Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall
            dieser Gründe.
          </p>

          <h3>Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung</h3>
          <p>
            Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre
            personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9
            Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO
            verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung
            personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf
            Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies
            oder in den Zugriff auf Informationen in Ihr Endgerät (z.B. via Device-Fingerprinting)
            eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25
            Abs. 1 TTDSG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur
            Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich,
            verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren
            verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung
            erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung
            kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f
            DSGVO erfolgen.
          </p>

          <h3>Empfänger von personenbezogenen Daten</h3>
          <p>
            Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen
            zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an
            diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an
            externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist,
            wenn wir gesetzlich hierzu verpflichtet sind (z.B. Weitergabe von Daten an
            Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO
            an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe
            erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten
            unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung
            weiter.
          </p>

          <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
          <p>
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
            möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
            Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf
            unberührt.
          </p>

          <h3>Widerspruchsrecht gegen die Datenerhebung (Art. 21 DSGVO)</h3>
          <p className="uppercase font-bold">
            WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO
            ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN
            SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH
            EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING.
          </p>
          <p className="uppercase font-bold">
            WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO
            HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER
            PERSONENBEZOGENEN DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR
            DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT.
          </p>

          <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
          <p>
            Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei
            einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen
            Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das
            Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder
            gerichtlicher Rechtsbehelfe.
          </p>

          <h3>Recht auf Datenübertragbarkeit</h3>
          <p>
            Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in
            Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in
            einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte
            Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur,
            soweit es technisch machbar ist.
          </p>

          <h3>Auskunft, Berichtigung und Löschung</h3>
          <p>
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
            unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren
            Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf
            Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema
            personenbezogene Daten können Sie sich jederzeit an uns wenden.
          </p>

          <h3>Recht auf Einschränkung der Verarbeitung</h3>
          <p>
            Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten
            zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf
            Einschränkung der Verarbeitung besteht in folgenden Fällen:
          </p>
          <ul>
            <li>
              Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten
              bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen.
            </li>
            <li>
              Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht,
              können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.
            </li>
            <li>
              Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur
              Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen.
            </li>
          </ul>

          <h3>SSL- bzw. TLS-Verschlüsselung</h3>
          <p>
            Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
            Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als
            Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte
            Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf
            „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
          </p>

          <h2>4. Datenerfassung auf dieser Website</h2>

          <h3>Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so
            genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies
            sind:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p>
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
            Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der
            Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien
            Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files
            erfasst werden.
          </p>

          <h3>Registrierung und Nutzung des Services</h3>
          <p>
            Wenn Sie sich für unseren Service registrieren, erheben wir folgende Daten:
          </p>
          <ul>
            <li>E-Mail-Adresse (erforderlich)</li>
            <li>Passwort (verschlüsselt gespeichert)</li>
            <li>Name und Firmenname (optional)</li>
            <li>Adressdaten (optional, für Rechnungsstellung)</li>
          </ul>
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
            sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur
            Durchführung vorvertraglicher Maßnahmen erforderlich ist.
          </p>

          <h3>Cookies</h3>
          <p>
            Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete
            und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend
            für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf
            Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch
            gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese
            selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.
          </p>
          <p>
            Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur
            Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z.B. für die
            Anmeldefunktion) oder zur Optimierung der Website (z.B. Cookies zur Messung des
            Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6
            Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird.
          </p>
          <p>
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies
            informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für
            bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies
            beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die
            Funktionalität dieser Website eingeschränkt sein.
          </p>

          <div className="my-6">
            <CookieSettingsButton />
          </div>

          <h2>5. Zahlungsdienstleister</h2>

          <h3>Stripe</h3>
          <p>
            Für die Zahlungsabwicklung nutzen wir den Zahlungsdienstleister Stripe (Stripe, Inc.,
            510 Townsend Street, San Francisco, CA 94103, USA). Die Datenverarbeitung dient dem
            Zweck der Zahlungsabwicklung und Betrugsprävention.
          </p>
          <p>
            Hierbei werden Ihre Zahlungsdaten (Name, Kreditkarteninformationen) direkt an Stripe
            übermittelt. Wir speichern keine vollständigen Kreditkarteninformationen. Die
            Datenübertragung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer
            sicheren und effizienten Zahlungsabwicklung).
          </p>
          <p>
            Stripe ist nach dem „EU-US Data Privacy Framework" (DPF) zertifiziert. Weitere
            Informationen finden Sie in der Datenschutzerklärung von Stripe:{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              https://stripe.com/privacy
            </a>
          </p>

          <h2>6. Kontakt</h2>
          <p>
            Bei Fragen zum Datenschutz wenden Sie sich bitte an:
          </p>
          <p>
            Lorenz Schmidt<br />
            GENO digital<br />
            Schützenstraße 19<br />
            48143 Münster<br />
            E-Mail: support@geno-digital.de
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Quelle: <a href="https://www.e-recht24.de" target="_blank" rel="noopener noreferrer">e-recht24.de</a>
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
