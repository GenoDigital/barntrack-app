/**
 * Cookie Consent Management
 * DSGVO/GDPR and TTDSG compliant cookie consent system
 */

export type CookieCategory = 'essential' | 'functional' | 'analytics' | 'marketing'

export interface CookieConsent {
  timestamp: string
  version: string
  categories: Record<CookieCategory, boolean>
}

export interface CookieCategoryInfo {
  id: CookieCategory
  name: string
  description: string
  required: boolean
  active: boolean // Is this category actually being used?
}

const STORAGE_KEY = 'barntrack-cookie-consent'
const CONSENT_VERSION = '1.0'

export const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    id: 'essential',
    name: 'Notwendig',
    description:
      'Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden. Sie speichern z.B. Ihre Anmeldedaten und Sicherheitseinstellungen.',
    required: true,
    active: true,
  },
  {
    id: 'functional',
    name: 'Funktional',
    description:
      'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung wie Sprachauswahl und Nutzereinstellungen.',
    required: false,
    active: false, // Not currently used
  },
  {
    id: 'analytics',
    name: 'Analytisch',
    description:
      'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren. Diese Funktion ist derzeit nicht aktiv.',
    required: false,
    active: false, // Not currently used
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description:
      'Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen. Diese Funktion ist derzeit nicht aktiv.',
    required: false,
    active: false, // Not currently used
  },
]

export class CookieConsentManager {
  /**
   * Get current consent from localStorage
   */
  static getConsent(): CookieConsent | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const consent: CookieConsent = JSON.parse(stored)

      // Validate version
      if (consent.version !== CONSENT_VERSION) {
        return null
      }

      return consent
    } catch (error) {
      console.error('Error reading cookie consent:', error)
      return null
    }
  }

  /**
   * Save consent to localStorage
   */
  static saveConsent(categories: Record<CookieCategory, boolean>): void {
    if (typeof window === 'undefined') return

    const consent: CookieConsent = {
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      categories: {
        essential: true, // Always true
        ...categories,
      },
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    } catch (error) {
      console.error('Error saving cookie consent:', error)
    }
  }

  /**
   * Accept all cookies
   */
  static acceptAll(): void {
    this.saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    })
  }

  /**
   * Accept only essential cookies
   */
  static acceptEssential(): void {
    this.saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    })
  }

  /**
   * Check if user has given consent
   */
  static hasConsent(): boolean {
    return this.getConsent() !== null
  }

  /**
   * Check if specific category is allowed
   */
  static isCategoryAllowed(category: CookieCategory): boolean {
    const consent = this.getConsent()
    if (!consent) return category === 'essential' // Only essential by default
    return consent.categories[category] === true
  }

  /**
   * Clear consent (for testing/debugging)
   */
  static clearConsent(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }
}
