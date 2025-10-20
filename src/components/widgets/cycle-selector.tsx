/**
 * Cycle Selector Component
 *
 * Dropdown component for selecting which cycle to display in cycle-specific widgets.
 * Supports modes: current, latest, best, worst, or specific cycle selection.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { CycleSelector as CycleSelectorType } from '@/types/dashboard'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CycleSelectorProps {
  value?: CycleSelectorType
  onChange: (value: CycleSelectorType) => void
  className?: string
}

interface CycleOption {
  id: string
  name: string
  startDate: string
  endDate: string | null
}

export function CycleSelector({ value, onChange, className }: CycleSelectorProps) {
  const { currentFarmId } = useFarmStore()
  const [cycles, setCycles] = useState<CycleOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCycles = async () => {
      if (!currentFarmId) return

      setIsLoading(true)
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('livestock_counts')
          .select('id, durchgang_name, start_date, end_date')
          .eq('farm_id', currentFarmId)
          .order('start_date', { ascending: false })
          .limit(50)

        if (error) throw error

        const cycleOptions: CycleOption[] = (data || []).map((cycle) => ({
          id: cycle.id,
          name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
          startDate: cycle.start_date,
          endDate: cycle.end_date,
        }))

        setCycles(cycleOptions)
      } catch (err) {
        console.error('Error loading cycles:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCycles()
  }, [currentFarmId])

  const handleChange = (newValue: string) => {
    // Check if it's a preset mode or a specific cycle ID
    if (['current', 'latest', 'best', 'worst'].includes(newValue)) {
      onChange({
        mode: newValue as 'current' | 'latest' | 'best' | 'worst',
        comparisonMode: value?.comparisonMode || 'none',
      })
    } else {
      onChange({
        mode: 'specific',
        cycleId: newValue,
        comparisonMode: value?.comparisonMode || 'none',
      })
    }
  }

  const getCurrentValue = () => {
    if (!value) return 'current'
    if (value.mode === 'specific' && value.cycleId) return value.cycleId
    return value.mode
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Lade..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={getCurrentValue()} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Durchgang auswählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Schnellauswahl</SelectLabel>
          <SelectItem value="current">Aktueller Durchgang</SelectItem>
          <SelectItem value="latest">Neuester Durchgang</SelectItem>
          <SelectItem value="best">Bester Durchgang (Gewinn)</SelectItem>
          <SelectItem value="worst">Schlechtester Durchgang (Gewinn)</SelectItem>
        </SelectGroup>

        {cycles.length > 0 && (
          <SelectGroup>
            <SelectLabel>Spezifischer Durchgang</SelectLabel>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name} ({new Date(cycle.startDate).toLocaleDateString('de-DE')})
                {cycle.endDate ? ' - ' + new Date(cycle.endDate).toLocaleDateString('de-DE') : ' (laufend)'}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}

export default CycleSelector
