'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ModeSelectionProps {
  onSelect: (mode: 'trial' | 'paid') => void
}

export function ModeSelection({ onSelect }: ModeSelectionProps) {
  const [lowestPrice, setLowestPrice] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchLowestPrice()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLowestPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_configurations')
        .select('yearly_price_cents')
        .eq('is_active', true)
        .order('yearly_price_cents', { ascending: true })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching price:', error)
        return
      }

      if (data?.yearly_price_cents) {
        setLowestPrice(data.yearly_price_cents)
      }
    } catch (err) {
      console.error('Error loading price:', err)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Willkommen bei barntrack!</CardTitle>
        <CardDescription className="text-lg">
          Wie möchten Sie starten?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trial Option */}
          <div className="relative">
            <div className="h-full p-8 border-2 rounded-xl hover:border-primary hover:shadow-lg transition-all cursor-pointer flex flex-col"
                 onClick={() => onSelect('trial')}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold mb-2">10 Tage kostenlos testen</h3>
                <p className="text-muted-foreground">
                  Probieren Sie alle Professional Features ohne Risiko aus
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex-grow">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Bis zu 10 Ställe verwalten</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Bis zu 5 Benutzer pro Stall</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Erweiterte Auswertungen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Priority Support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Keine Kreditkarte erforderlich</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">€0</div>
                <div className="text-sm text-muted-foreground mb-4">für 10 Tage</div>
                <Button size="lg" className="w-full" onClick={(e) => {
                  e.stopPropagation()
                  onSelect('trial')
                }}>
                  Kostenlos testen
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Nach der Testphase automatisch Starter Plan
                </p>
              </div>
            </div>
          </div>

          {/* Paid Option */}
          <div className="relative">
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Empfohlen
            </div>
            <div className="h-full p-8 border-2 border-primary rounded-xl hover:shadow-lg transition-all cursor-pointer flex flex-col"
                 onClick={() => onSelect('paid')}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-2xl font-bold mb-2">Mit Plan starten</h3>
                <p className="text-muted-foreground">
                  Wählen Sie Ihren Plan und legen Sie sofort los
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex-grow">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Voller Zugang ab Tag 1</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Wählen Sie Ihren idealen Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Gutscheincode einlösbar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Jährliche Abrechnung verfügbar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Sichere Zahlung über Stripe</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                {lowestPrice !== null ? (
                  <>
                    <div className="text-2xl font-bold mb-1">Ab €{(lowestPrice / 100).toFixed(0)}/Jahr</div>
                    <div className="text-xs text-muted-foreground mb-4">
                      ca. €{(lowestPrice / 100 / 12).toFixed(2)}/Monat
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold mb-2">Pläne verfügbar</div>
                )}
                <Button size="lg" className="w-full" onClick={(e) => {
                  e.stopPropagation()
                  onSelect('paid')
                }}>
                  Plan auswählen
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Jederzeit kündbar
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
