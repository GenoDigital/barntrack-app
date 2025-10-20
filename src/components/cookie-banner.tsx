'use client'

import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const { showBanner, acceptAll, acceptEssential, openSettings } = useCookieConsent()

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon and Text */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">🍪 Cookie-Hinweis</h3>
              <p className="text-sm text-muted-foreground">
                Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu
                bieten. Einige Cookies sind technisch notwendig, andere helfen uns, die Website zu
                verbessern.{' '}
                <Link
                  href="/privacy"
                  className="underline hover:text-foreground transition-colors"
                >
                  Mehr erfahren
                </Link>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button onClick={acceptAll} size="sm" className="w-full sm:w-auto">
              Alle akzeptieren
            </Button>
            <Button
              onClick={openSettings}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              Einstellungen
            </Button>
            <Button
              onClick={acceptEssential}
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto"
            >
              Nur Notwendige
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
