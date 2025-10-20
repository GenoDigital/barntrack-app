'use client'

import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export function CookieSettingsButton() {
  const { openSettings } = useCookieConsent()

  return (
    <Button onClick={openSettings} variant="outline" className="gap-2">
      <Settings className="h-4 w-4" />
      Cookie-Einstellungen ändern
    </Button>
  )
}
