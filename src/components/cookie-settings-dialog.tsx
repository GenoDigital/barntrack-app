'use client'

import { useState, useEffect } from 'react'
import { useCookieConsent } from '@/contexts/cookie-consent-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { COOKIE_CATEGORIES, type CookieCategory } from '@/lib/cookie-consent'

export function CookieSettingsDialog() {
  const { settingsOpen, closeSettings, consent, updatePreferences, acceptEssential } =
    useCookieConsent()

  // Initialize with current consent or defaults
  const [categories, setCategories] = useState<Record<CookieCategory, boolean>>({
    essential: true,
    functional: consent?.categories.functional ?? false,
    analytics: consent?.categories.analytics ?? false,
    marketing: consent?.categories.marketing ?? false,
  })

  // Update when consent changes
  useEffect(() => {
    if (consent) {
      setCategories(consent.categories)
    }
  }, [consent])

  const handleToggle = (category: CookieCategory, enabled: boolean) => {
    setCategories((prev) => ({
      ...prev,
      [category]: enabled,
    }))
  }

  const handleSave = () => {
    updatePreferences(categories)
  }

  const handleRejectAll = () => {
    acceptEssential()
  }

  return (
    <Dialog open={settingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Verwalten Sie Ihre Cookie-Präferenzen. Sie können Ihre Einstellungen jederzeit ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {COOKIE_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor={category.id}
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    {category.name}
                    {category.required && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (immer aktiv)
                      </span>
                    )}
                    {!category.active && !category.required && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (nicht aktiv)
                      </span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Switch
                  id={category.id}
                  checked={categories[category.id]}
                  onCheckedChange={(checked) => handleToggle(category.id, checked)}
                  disabled={category.required}
                />
              </div>
              <Separator />
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleRejectAll} variant="outline" className="w-full sm:w-auto">
            Alle ablehnen
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Auswahl speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
