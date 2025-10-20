'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  CookieConsentManager,
  type CookieCategory,
  type CookieConsent,
} from '@/lib/cookie-consent'

interface CookieConsentContextValue {
  consent: CookieConsent | null
  hasConsent: boolean
  showBanner: boolean
  acceptAll: () => void
  acceptEssential: () => void
  updatePreferences: (categories: Record<CookieCategory, boolean>) => void
  openSettings: () => void
  closeSettings: () => void
  settingsOpen: boolean
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load consent on mount
  useEffect(() => {
    setMounted(true)
    const currentConsent = CookieConsentManager.getConsent()
    setConsent(currentConsent)
    setShowBanner(!currentConsent)
  }, [])

  const acceptAll = useCallback(() => {
    CookieConsentManager.acceptAll()
    const newConsent = CookieConsentManager.getConsent()
    setConsent(newConsent)
    setShowBanner(false)
    setSettingsOpen(false)
  }, [])

  const acceptEssential = useCallback(() => {
    CookieConsentManager.acceptEssential()
    const newConsent = CookieConsentManager.getConsent()
    setConsent(newConsent)
    setShowBanner(false)
    setSettingsOpen(false)
  }, [])

  const updatePreferences = useCallback((categories: Record<CookieCategory, boolean>) => {
    CookieConsentManager.saveConsent(categories)
    const newConsent = CookieConsentManager.getConsent()
    setConsent(newConsent)
    setShowBanner(false)
    setSettingsOpen(false)
  }, [])

  const openSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  const value: CookieConsentContextValue = {
    consent,
    hasConsent: !!consent,
    showBanner: mounted ? showBanner : false,
    acceptAll,
    acceptEssential,
    updatePreferences,
    openSettings,
    closeSettings,
    settingsOpen: mounted ? settingsOpen : false,
  }

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
