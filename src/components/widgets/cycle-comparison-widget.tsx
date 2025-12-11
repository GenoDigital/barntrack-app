/**
 * Cycle Comparison Widget Component
 *
 * Displays a comparison table of all cycles (Durchgänge) with key KPIs per animal.
 * This widget provides a quick overview for comparing cycle performance.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { BaseWidgetProps } from '@/types/dashboard'
import { useFarmStore } from '@/lib/stores/farm-store'
import { createClient } from '@/lib/supabase/client'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'
import { calculateCycleMetrics, LivestockCount, ConsumptionItem, CostTransaction, IncomeTransaction } from '@/lib/utils/kpi-calculations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CycleComparisonData {
  id: string
  name: string
  startDate: string
  endDate: string | null
  duration: number
  totalAnimals: number
  buyPricePerAnimal: number | null
  sellPricePerAnimal: number | null
  priceDifference: number | null
  startWeight: number | null
  endWeight: number | null
  weightGain: number | null
  dailyGainGrams: number | null
  netDailyGainGrams: number | null
  feedCostPerAnimal: number
  dailyFeedCostPerAnimal: number
  // Feed cost breakdown
  consumptionFeedCostPerAnimal: number
  feedCategoryTransactionCostPerAnimal: number
  // Additional income (Prämien, Boni, Zuschüsse)
  additionalIncomePerAnimal: number
  // Other costs (non-feed)
  additionalCostsPerAnimal: number
  profitPerAnimal: number
  status: 'active' | 'completed'
}

export function CycleComparisonWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { currentFarmId } = useFarmStore()
  const [data, setData] = useState<CycleComparisonData[]>([])
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
            id, count, area_id, area_group_id, start_date, end_date, animal_type,
            expected_weight_per_animal, actual_weight_per_animal,
            buy_price_per_animal, sell_price_per_animal,
            is_start_group, is_end_group, start_weight_source_detail_id,
            areas(id, name),
            area_groups(id, name)
          )
        `)
        .eq('farm_id', currentFarmId)
        .order('start_date', { ascending: false })
        .limit(20)

      if (cyclesError) throw cyclesError

      if (!cycles || cycles.length === 0) {
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

      // Load ALL income transactions for all cycles in one query
      const { data: allIncomeTransactionsRaw } = await supabase
        .from('income_transactions')
        .select('id, amount, transaction_date, income_type, livestock_count_id')
        .in('livestock_count_id', cycleIds)

      // Process each cycle using pre-loaded data (fast, in-memory filtering)
      const comparisonData = cycles.map((cycle): CycleComparisonData => {
        // Filter consumption for this cycle's date range (in-memory)
        const consumption = (allConsumption || []).filter(
          (item: any) => item.date >= cycle.start_date &&
                  (!cycle.end_date || item.date <= cycle.end_date)
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

        // Filter income transactions for this cycle
        const incomeTransactions: IncomeTransaction[] = (allIncomeTransactionsRaw || [])
          .filter((it: any) => it.livestock_count_id === cycle.id)
          .map(it => ({
            id: it.id,
            amount: it.amount,
            transaction_date: it.transaction_date,
            income_type: it.income_type
          }))

        // Calculate metrics using centralized function
        const metrics = calculateCycleMetrics(
          cycle as LivestockCount,
          consumption as ConsumptionItem[],
          costTransactions,
          incomeTransactions
        )

        // Calculate buy/sell prices per animal from start/end groups
        let buyPricePerAnimal: number | null = null
        let sellPricePerAnimal: number | null = null
        let startAnimals = 0
        let endAnimals = 0

        cycle.livestock_count_details?.forEach((detail: any) => {
          if (detail.is_start_group && detail.buy_price_per_animal) {
            buyPricePerAnimal = (buyPricePerAnimal || 0) + (detail.buy_price_per_animal * detail.count)
            startAnimals += detail.count
          }
          if (detail.is_end_group && detail.sell_price_per_animal) {
            sellPricePerAnimal = (sellPricePerAnimal || 0) + (detail.sell_price_per_animal * detail.count)
            endAnimals += detail.count
          }
        })

        // Calculate weighted average prices
        if (buyPricePerAnimal !== null && startAnimals > 0) {
          buyPricePerAnimal = buyPricePerAnimal / startAnimals
        }
        if (sellPricePerAnimal !== null && endAnimals > 0) {
          sellPricePerAnimal = sellPricePerAnimal / endAnimals
        }

        // Fallback to cycle-level prices if no detail-level prices
        if (buyPricePerAnimal === null && cycle.buy_price_per_animal) {
          buyPricePerAnimal = cycle.buy_price_per_animal
        }
        if (sellPricePerAnimal === null && cycle.sell_price_per_animal) {
          sellPricePerAnimal = cycle.sell_price_per_animal
        }

        const priceDifference = (sellPricePerAnimal !== null && buyPricePerAnimal !== null)
          ? sellPricePerAnimal - buyPricePerAnimal
          : null

        // Get start/end weights
        const startWeight = cycle.expected_weight_per_animal
        const endWeight = cycle.actual_weight_per_animal
        const weightGain = metrics.weightGain > 0 ? metrics.weightGain : null

        // Calculate profit per animal
        const profitPerAnimal = metrics.totalAnimals > 0
          ? metrics.profitLoss / metrics.totalAnimals
          : 0

        return {
          id: cycle.id,
          name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
          startDate: cycle.start_date,
          endDate: cycle.end_date,
          duration: metrics.cycleDuration,
          totalAnimals: metrics.totalAnimals,
          buyPricePerAnimal,
          sellPricePerAnimal,
          priceDifference,
          startWeight,
          endWeight,
          weightGain,
          dailyGainGrams: metrics.dailyGainGrams,
          netDailyGainGrams: metrics.netDailyGainGrams,
          feedCostPerAnimal: metrics.feedCostPerAnimal,
          dailyFeedCostPerAnimal: metrics.cycleDuration > 0
            ? metrics.feedCostPerAnimal / metrics.cycleDuration
            : 0,
          consumptionFeedCostPerAnimal: metrics.totalAnimals > 0
            ? metrics.consumptionFeedCost / metrics.totalAnimals
            : 0,
          feedCategoryTransactionCostPerAnimal: metrics.totalAnimals > 0
            ? metrics.feedCategoryTransactionCosts / metrics.totalAnimals
            : 0,
          additionalIncomePerAnimal: metrics.totalAnimals > 0
            ? metrics.additionalIncome / metrics.totalAnimals
            : 0,
          additionalCostsPerAnimal: metrics.totalAnimals > 0
            ? metrics.additionalCosts / metrics.totalAnimals
            : 0,
          profitPerAnimal,
          status: cycle.end_date ? 'completed' : 'active',
        }
      })

      setData(comparisonData)
    } catch (err) {
      console.error('Error fetching cycle comparison data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatNumber = (value: number | null, decimals = 1) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <WidgetWrapper
      title={widget.title}
      description={widget.config?.description || 'Vergleich aller Durchgänge mit wichtigen Kennzahlen pro Tier'}
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
              <TableHead className="whitespace-nowrap text-right">Kaufpreis</TableHead>
              <TableHead className="whitespace-nowrap text-right">Verkaufspreis</TableHead>
              <TableHead className="whitespace-nowrap text-right">Differenz</TableHead>
              <TableHead className="whitespace-nowrap text-right">Start kg</TableHead>
              <TableHead className="whitespace-nowrap text-right">Ende kg</TableHead>
              <TableHead className="whitespace-nowrap text-right">Zuwachs</TableHead>
              <TableHead className="whitespace-nowrap text-right">g/Tag</TableHead>
              <TableHead className="whitespace-nowrap text-right">Futter/Tier</TableHead>
              <TableHead className="whitespace-nowrap text-right">Futter/Tag</TableHead>
              <TableHead className="whitespace-nowrap text-right">Prämien/Tier</TableHead>
              <TableHead className="whitespace-nowrap text-right">Gewinn/Tier</TableHead>
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
                  <TableCell className="text-right">{formatCurrency(cycle.buyPricePerAnimal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cycle.sellPricePerAnimal)}</TableCell>
                  <TableCell className={cn(
                    'text-right',
                    cycle.priceDifference !== null && cycle.priceDifference > 0 && 'text-green-600',
                    cycle.priceDifference !== null && cycle.priceDifference < 0 && 'text-red-600'
                  )}>
                    {formatCurrency(cycle.priceDifference)}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(cycle.startWeight)}</TableCell>
                  <TableCell className="text-right">{formatNumber(cycle.endWeight)}</TableCell>
                  <TableCell className="text-right">{formatNumber(cycle.weightGain)}</TableCell>
                  <TableCell className="text-right">{formatNumber(cycle.dailyGainGrams, 0)}</TableCell>
                  <TableCell className="text-right">
                    {cycle.feedCategoryTransactionCostPerAnimal > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted">
                            {formatCurrency(cycle.feedCostPerAnimal)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between gap-4">
                                <span>Verbrauch:</span>
                                <span>{formatCurrency(cycle.consumptionFeedCostPerAnimal)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Zukäufe (MAT etc.):</span>
                                <span>{formatCurrency(cycle.feedCategoryTransactionCostPerAnimal)}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      formatCurrency(cycle.feedCostPerAnimal)
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(cycle.dailyFeedCostPerAnimal)}</TableCell>
                  <TableCell className={cn(
                    'text-right',
                    cycle.additionalIncomePerAnimal > 0 && 'text-green-600'
                  )}>
                    {cycle.additionalIncomePerAnimal > 0
                      ? formatCurrency(cycle.additionalIncomePerAnimal)
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <div className={cn(
                            'flex items-center justify-end gap-1',
                            cycle.profitPerAnimal > 0 && 'text-green-600',
                            cycle.profitPerAnimal < 0 && 'text-red-600'
                          )}>
                            {cycle.profitPerAnimal > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : cycle.profitPerAnimal < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {formatCurrency(cycle.profitPerAnimal)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between gap-4">
                              <span>Verkauf - Kauf:</span>
                              <span>{formatCurrency(cycle.priceDifference)}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-red-500">
                              <span>- Futterkosten:</span>
                              <span>{formatCurrency(cycle.feedCostPerAnimal)}</span>
                            </div>
                            {cycle.additionalCostsPerAnimal > 0 && (
                              <div className="flex justify-between gap-4 text-red-500">
                                <span>- Sonstige Kosten:</span>
                                <span>{formatCurrency(cycle.additionalCostsPerAnimal)}</span>
                              </div>
                            )}
                            {cycle.additionalIncomePerAnimal > 0 && (
                              <div className="flex justify-between gap-4 text-green-500">
                                <span>+ Prämien/Zuschüsse:</span>
                                <span>{formatCurrency(cycle.additionalIncomePerAnimal)}</span>
                              </div>
                            )}
                            <div className="border-t pt-1 flex justify-between gap-4 font-semibold">
                              <span>= Gewinn/Tier:</span>
                              <span>{formatCurrency(cycle.profitPerAnimal)}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground">
                  Keine Durchgänge vorhanden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </WidgetWrapper>
  )
}
