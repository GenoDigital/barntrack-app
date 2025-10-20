import { Zap, Building2, Users } from 'lucide-react'
import type { PlanConfig } from '@/lib/utils/price-formatting'

// Shared plan configurations used across all pricing pages
export const planConfigs: Record<string, PlanConfig> = {
  'Starter': {
    name: 'Starter',
    description: 'Perfekt für kleinere Betriebe',
    badge: null,
    features: [
      'Bis zu 1 Stall',
      'Grundlegende Futterkostenverfolgung',
      'Basis Berichte',
      'Lieferantenverwaltung',
      'E-Mail Support',
      'Datensicherung'
    ],
    icon: Zap,
    popular: false
  },
  'Professional': {
    name: 'Professional',
    description: 'Erweiterte Funktionen für wachsende Betriebe',
    badge: 'Beliebt',
    features: [
      'Bis zu 10 Ställe',
      'Erweiterte Analysen & Auswertung',
      'Automatische Lieferanten-Synchronisation',
      'Bereichsspezifische Berichte',
      'Gewinn/Verlust Analysen',
      'Prioritäts-Support',
      'Export-Funktionen',
      'Erweiterte Filterfunktionen'
    ],
    icon: Building2,
    popular: true
  },
  'Enterprise': {
    name: 'Enterprise',
    description: 'Komplettlösung für große Betriebe',
    badge: 'Vollausstattung',
    features: [
      'Unbegrenzte Ställe',
      'Multi-User Zusammenarbeit',
      'API-Zugang',
      'Individuelle Berichte',
      'Dedicated Support Manager',
      'Onboarding & Schulungen',
      'SLA Garantie',
      'Individuelle Integrationen'
    ],
    icon: Users,
    popular: false
  }
}
