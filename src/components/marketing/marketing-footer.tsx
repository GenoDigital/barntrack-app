import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Preise', href: '/pricing' },
    { label: 'Demo buchen', href: '/demo' },
  ],
  company: [
    { label: 'Über uns', href: '/about' },
    { label: 'Partnerschaften', href: '/sponsorship' },
    { label: 'Kontakt', href: '/contact' },
  ],
  legal: [
    { label: 'Datenschutz', href: '/privacy' },
    { label: 'AGB', href: '/terms' },
    { label: 'Impressum', href: '/imprint' },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                barntrack
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Die moderne Futtermittelverwaltung für landwirtschaftliche Betriebe.
              Kosten im Griff, Prozesse optimiert.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@barntrack.app" className="hover:text-foreground transition-colors">
                  info@barntrack.app
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+49123456789" className="hover:text-foreground transition-colors">
                  +49 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Deutschland</span>
              </div>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="font-semibold mb-4">Produkt</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold mb-4">Unternehmen</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold mb-4">Rechtliches</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} barntrack. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>🇪🇺 Hosting in der EU</span>
            <span>🔒 DSGVO-konform</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
