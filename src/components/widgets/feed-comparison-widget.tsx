/**
 * Feed Comparison Widget Component
 *
 * Displays a comparison table of feed consumption per cycle (Durchgang).
 * Shows feed quantities per animal for each feed type used across all cycles.
 * Dynamic columns: Only shows feed types that were actually used.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { BaseWidgetProps } from '@/types/dashboard'
import { useFarmStore } from '@/lib/stores/farm-store'
import { createClient } from '@/lib/supabase/client'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'
import { calculateCycleMetrics, calculateFeedComponentSummary, filterConsumptionByTimeframe, LivestockCount, ConsumptionItem, CostTransaction } from '@/lib/utils/kpi-calculations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeedTypeColumn {
  id: string
  name: string
  unit: string
}

interface CycleFeedData {
  id: string
  name: string
  duration: number
  totalAnimals: number
  status: 'active' | 'completed'
  feedQuantities: { [feedTypeId: string]: number } // quantity per animal
  totalQuantityPerAnimal: number
}

export function FeedComparisonWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { currentFarmId } = useFarmStore()
  const [data, setData] = useState<CycleFeedData[]>([])
  const [feedTypes, setFeedTypes] = useState<FeedTypeColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Fetch all cycles with details
      const { data: cycles, error: cyclesError } = await supabase
        .from('livestock_counts')
        .select(`
          *,
          livestock_count_details(
            id, count, area_id, area_group_id, start_date, end_date,
            areas(id, name),
            area_groups(id, name)
          )
        `)
        .eq('farm_id', currentFarmId)
        .order('start_date', { ascending: false })
        .limit(20)

      if (cyclesError) throw cyclesError

      if (!cycles || cycles.length === 0) {
        setFeedTypes([])
        setData([])
        setIsLoading(false)
        return
      }

      // BULK LOADING: Find overall date range across all cycles
      const startDates = cycles.map(c => c.start_date).filter(Boolean)
      const endDates = cycles.map(c => c.end_date).filter(Boolean)
      const minDate = startDates.length > 0
        ? startDates.reduce((a, b) => a < b ? a : b)
        : new Date().toISOString().split('T')[0]
      const maxDate = endDates.length > 0
        ? endDates.reduce((a, b) => a > b ? a : b)
        : new Date().toISOString().split('T')[0]

      // Load ALL consumption data ONCE for the entire date range
      const { consumption: allConsumption } = await loadConsumptionWithCosts(
        supabase,
        currentFarmId,
        minDate,
        maxDate
      )

      // Load ALL cost transactions for all cycles in one query
      const cycleIds = cycles.map(c => c.id)
      const { data: allCostTransactionsRaw } = await supabase
        .from('cost_transactions')
        .select('id, amount, transaction_date, livestock_count_id, cost_types(name, category)')
        .in('livestock_count_id', cycleIds)

      // Collect all feed types used across all cycles
      const feedTypesMap = new Map<string, FeedTypeColumn>()

      // Process each cycle using pre-loaded data (fast, in-memory filtering)
      const cycleDataList = cycles.map((cycle): CycleFeedData => {
        // First: date-based pre-filter for efficiency
        const dateFilteredConsumption = (allConsumption || []).filter(
          (item: any) => item.date >= cycle.start_date &&
                  (!cycle.end_date || item.date <= cycle.end_date)
        )

        // Then: Filter by area/group using the same logic as evaluation page
        // This ensures consumption is only counted for areas/groups that belong to this cycle
        const consumption = filterConsumptionByTimeframe(
          dateFilteredConsumption as ConsumptionItem[],
          cycle.livestock_count_details || [],
          cycle.end_date
        )

        // Filter cost transactions for this cycle
        const costTransactions: CostTransaction[] = (allCostTransactionsRaw || [])
          .filter((ct: any) => ct.livestock_count_id === cycle.id)
          .map(ct => ({
            id: ct.id,
            amount: ct.amount,
            transaction_date: ct.transaction_date,
            cost_types: ct.cost_types as { name: string; category: string | null } | undefined
          }))

        const metrics = calculateCycleMetrics(
          cycle as LivestockCount,
          consumption as ConsumptionItem[],
          costTransactions
        )

        // Calculate feed component summary
        const feedComponents = calculateFeedComponentSummary(
          cycle as LivestockCount,
          consumption as ConsumptionItem[]
        )

        // Build feed quantities map (quantity per animal)
        const feedQuantities: { [feedTypeId: string]: number } = {}
        let totalQuantityPerAnimal = 0

        feedComponents.forEach(component => {
          // Add to global feed types map
          if (!feedTypesMap.has(component.feedTypeId)) {
            feedTypesMap.set(component.feedTypeId, {
              id: component.feedTypeId,
              name: component.feedTypeName,
              unit: component.unit,
            })
          }

          // Calculate quantity per animal
          const quantityPerAnimal = metrics.totalAnimals > 0
            ? component.totalQuantity / metrics.totalAnimals
            : 0

          feedQuantities[component.feedTypeId] = quantityPerAnimal
          totalQuantityPerAnimal += quantityPerAnimal
        })

        return {
          id: cycle.id,
          name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
          duration: metrics.cycleDuration,
          totalAnimals: metrics.totalAnimals,
          status: cycle.end_date ? 'completed' : 'active',
          feedQuantities,
          totalQuantityPerAnimal,
        }
      })

      // Convert feed types map to sorted array (by name)
      const sortedFeedTypes = Array.from(feedTypesMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))

      setFeedTypes(sortedFeedTypes)
      setData(cycleDataList)
    } catch (err) {
      console.error('Error fetching feed comparison data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatNumber = (value: number | null | undefined, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return '-'
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  return (
    <WidgetWrapper
      title={widget.title}
      description={widget.config?.description || 'Futtermengen pro Tier und Durchgang im Vergleich'}
      isEditMode={isEditMode}
      onConfigure={onConfigure}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error || undefined}
    >
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap sticky left-0 bg-background z-10">Durchgang</TableHead>
              <TableHead className="whitespace-nowrap text-center">Status</TableHead>
              <TableHead className="whitespace-nowrap text-right">Tage</TableHead>
              <TableHead className="whitespace-nowrap text-right">Tiere</TableHead>
              {feedTypes.map(feedType => (
                <TableHead key={feedType.id} className="whitespace-nowrap text-right" title={feedType.name}>
                  {feedType.name.length > 12 ? feedType.name.slice(0, 10) + '...' : feedType.name}
                  <span className="text-xs text-muted-foreground ml-1">({feedType.unit})</span>
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap text-right font-bold">Summe (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-background z-10">
                    {cycle.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {cycle.status === 'active' ? 'Aktiv' : 'Abgeschl.'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{cycle.duration}</TableCell>
                  <TableCell className="text-right">{cycle.totalAnimals}</TableCell>
                  {feedTypes.map(feedType => (
                    <TableCell key={feedType.id} className="text-right">
                      {formatNumber(cycle.feedQuantities[feedType.id] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {formatNumber(cycle.totalQuantityPerAnimal)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4 + feedTypes.length + 1} className="text-center text-muted-foreground">
                  Keine Durchgänge vorhanden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {feedTypes.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          Alle Werte pro Tier. Nur Futterarten, die in mindestens einem Durchgang verwendet wurden, werden angezeigt.
        </p>
      )}
    </WidgetWrapper>
  )
}
