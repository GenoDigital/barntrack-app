/**
 * Widget Data Hooks
 *
 * Hooks for fetching widget data with farm isolation
 * Uses centralized feed-calculations utilities for consistent cost calculations
 * Includes hooks for stat, chart, table, heatmap, waterfall, and scatter widgets
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'
import { calculateTotalAnimalsFromDetails } from '@/lib/utils/livestock-calculations'
import {
  calculateCycleMetrics,
  calculateAreaMetrics,
  calculateFeedComponentSummary,
} from '@/lib/utils/kpi-calculations'
import {
  WidgetInstance,
  StatWidgetConfig,
  ChartWidgetConfig,
  TableWidgetConfig,
  HeatmapWidgetConfig,
  WaterfallWidgetConfig,
  ScatterWidgetConfig,
  StatData,
  ChartData,
  TableData,
} from '@/types/dashboard'

// ============================================================================
// STAT WIDGET DATA
// ============================================================================

export function useStatWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const { globalDateRange } = useDashboardStore()
  const [data, setData] = useState<StatData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config as StatWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let value = 0
      let subtitle = ''

      // Calculate date range - use fixed timeRange if provided, otherwise global
      let startDateStr: string
      let endDateStr: string
      let daysAgo: number

      if (config.timeRange) {
        // Widget has fixed time range
        const timeRange = config.timeRange
        daysAgo = parseInt(timeRange.replace('d', ''))
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        startDateStr = startDate.toISOString().split('T')[0]
        endDateStr = endDate.toISOString().split('T')[0]
      } else if (globalDateRange) {
        // Use global dashboard date range
        startDateStr = globalDateRange.startDate
        endDateStr = globalDateRange.endDate
        const start = new Date(startDateStr)
        const end = new Date(endDateStr)
        daysAgo = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      } else {
        // Fallback to last 30 days
        daysAgo = 30
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        startDateStr = startDate.toISOString().split('T')[0]
        endDateStr = endDate.toISOString().split('T')[0]
      }

      // Note: Cycle-related data sources (active_cycles_count, avg_cycle_duration, avg_cycle_profit)
      // do NOT use the date range calculated above. They always query all cycles for the farm.
      switch (config.dataSource) {
        case 'monthly_cost': {
          // Use centralized utility for consistent cost calculations
          const { consumption } = await loadConsumptionWithCosts(
            supabase,
            currentFarmId,
            startDateStr,
            endDateStr
          )

          value = consumption.reduce((sum, item) => sum + (item.total_cost || 0), 0)
          subtitle = `Letzte ${daysAgo} Tage`
          break
        }

        case 'feed_count': {
          const { count } = await supabase
            .from('feed_types')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', currentFarmId)

          value = count || 0
          subtitle = 'Aktive Futtermittel'
          break
        }

        case 'daily_avg': {
          // Use centralized utility for consistent cost calculations
          const { consumption } = await loadConsumptionWithCosts(
            supabase,
            currentFarmId,
            startDateStr,
            endDateStr
          )

          const dateMap = new Map<string, number>()
          consumption.forEach((item) => {
            const current = dateMap.get(item.date) || 0
            dateMap.set(item.date, current + (item.total_cost || 0))
          })

          const totalCost = Array.from(dateMap.values()).reduce((a, b) => a + b, 0)
          const daysWithData = dateMap.size
          value = daysWithData > 0 ? totalCost / daysWithData : 0
          subtitle = `Durchschnitt (${daysWithData} Tage)`
          break
        }

        case 'total_quantity': {
          // Use centralized utility
          const { consumption } = await loadConsumptionWithCosts(
            supabase,
            currentFarmId,
            startDateStr,
            endDateStr
          )

          value = consumption.reduce((sum, item) => sum + item.quantity, 0)
          subtitle = `${daysAgo} Tage (kg)`
          break
        }

        case 'supplier_count': {
          const { count } = await supabase
            .from('suppliers')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', currentFarmId)

          value = count || 0
          subtitle = 'Aktive Lieferanten'
          break
        }

        case 'area_count': {
          const { count } = await supabase
            .from('areas')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', currentFarmId)

          value = count || 0
          subtitle = 'Bereiche'
          break
        }

        case 'active_cycles_count': {
          const { count } = await supabase
            .from('livestock_counts')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', currentFarmId)
            .is('end_date', null)

          value = count || 0
          subtitle = 'Aktive Durchgänge'
          break
        }

        case 'avg_cycle_duration': {
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('start_date, end_date')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const durations = cycles.map((cycle) => {
              const start = new Date(cycle.start_date)
              const end = new Date(cycle.end_date!)
              return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            })
            value = durations.reduce((a, b) => a + b, 0) / durations.length
          }
          subtitle = 'Durchschnittliche Dauer (Tage)'
          break
        }

        case 'avg_cycle_profit': {
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('revenue', 'is', null)

          if (cycles && cycles.length > 0) {
            // Use centralized KPI calculation for each cycle
            const profitsPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )

              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              // Use centralized calculation
              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )

              return metrics.profitLoss
            })

            const profits = await Promise.all(profitsPromises)
            value = profits.reduce((a, b) => a + b, 0) / profits.length
          }
          subtitle = 'Durchschnittlicher Gewinn'
          break
        }

        // ============================================================================
        // CYCLE-SPECIFIC KPI DATA SOURCES (IGNORE GLOBAL DATE RANGE)
        // These data sources always query based on cycle start/end dates, not dashboard filters
        // ============================================================================

        case 'current_cycle_profit': {
          // Find current (ongoing) cycle
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.profitLoss
            subtitle = `Aktueller Durchgang`
          }
          break
        }

        case 'current_cycle_fcr': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.feedConversionRatio
            subtitle = 'Futterverwertung'
          }
          break
        }

        case 'current_cycle_feed_cost': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.totalFeedCost
            subtitle = 'Futterkosten'
          }
          break
        }

        case 'current_cycle_duration': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('start_date')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const start = new Date(cycle.start_date)
            const now = new Date()
            value = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            subtitle = 'Tage seit Start'
          }
          break
        }

        case 'current_cycle_animals': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.totalAnimals
            subtitle = 'Tiere im Durchgang'
          }
          break
        }

        case 'current_cycle_margin': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.profitMargin
            subtitle = 'Gewinnspanne (%)'
          }
          break
        }

        case 'current_cycle_feed_efficiency': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.feedEfficiency
            subtitle = 'Futtereffizienz'
          }
          break
        }

        case 'current_cycle_cost_per_animal': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.feedCostPerAnimal
            subtitle = 'Kosten pro Tier'
          }
          break
        }

        case 'best_cycle_profit': {
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('revenue', 'is', null)

          if (cycles && cycles.length > 0) {
            const profitsPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.profitLoss
            })

            const profits = await Promise.all(profitsPromises)
            value = Math.max(...profits)
            subtitle = 'Bester Durchgang'
          }
          break
        }

        case 'worst_cycle_profit': {
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('revenue', 'is', null)

          if (cycles && cycles.length > 0) {
            const profitsPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.profitLoss
            })

            const profits = await Promise.all(profitsPromises)
            value = Math.min(...profits)
            subtitle = 'Schlechtester Durchgang'
          }
          break
        }

        case 'avg_fcr_all_cycles': {
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const fcrPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.feedConversionRatio
            })

            const fcrs = await Promise.all(fcrPromises)
            const validFcrs = fcrs.filter(fcr => fcr > 0 && isFinite(fcr))
            if (validFcrs.length > 0) {
              value = validFcrs.reduce((a, b) => a + b, 0) / validFcrs.length
            }
            subtitle = 'Durchschnittliche FCR'
          }
          break
        }

        case 'total_cycles_count': {
          // MULTI-CYCLE OVERVIEW: Count all completed cycles
          const { data: cycles, count } = await supabase
            .from('livestock_counts')
            .select('id', { count: 'exact' })
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          value = count || 0
          subtitle = 'Abgeschlossene Durchgänge'
          break
        }

        case 'profitable_cycles_rate': {
          // MULTI-CYCLE OVERVIEW: Calculate percentage of profitable cycles
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const profitPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.profitLoss > 0
            })

            const profitResults = await Promise.all(profitPromises)
            const profitableCount = profitResults.filter(Boolean).length
            value = (profitableCount / cycles.length) * 100
            subtitle = `${profitableCount} von ${cycles.length} profitabel`
          }
          break
        }

        case 'total_profit_all_cycles': {
          // MULTI-CYCLE OVERVIEW: Sum all profits/losses
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const profitPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.profitLoss
            })

            const profits = await Promise.all(profitPromises)
            value = profits.reduce((a, b) => a + b, 0)
            subtitle = `${cycles.length} Durchgänge`
          }
          break
        }

        case 'best_fcr_all_cycles': {
          // MULTI-CYCLE OVERVIEW: Find best (lowest) FCR across all cycles
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const fcrPromises = cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )
              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )
              return metrics.feedConversionRatio
            })

            const fcrs = await Promise.all(fcrPromises)
            const validFcrs = fcrs.filter(fcr => fcr > 0 && isFinite(fcr))
            if (validFcrs.length > 0) {
              value = Math.min(...validFcrs)
            }
            subtitle = 'Beste FCR (niedrigster Wert)'
          }
          break
        }

        case 'avg_animals_per_cycle': {
          // MULTI-CYCLE OVERVIEW: Calculate average number of animals per cycle
          const { data: cycles } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .not('end_date', 'is', null)

          if (cycles && cycles.length > 0) {
            const animalCounts = cycles.map((cycle) => {
              const metrics = calculateCycleMetrics(
                cycle as any,
                [] as any,
                []
              )
              return metrics.totalAnimals
            })

            const validCounts = animalCounts.filter(count => count > 0)
            if (validCounts.length > 0) {
              value = validCounts.reduce((a, b) => a + b, 0) / validCounts.length
            }
            subtitle = `${cycles.length} Durchgänge`
          }
          break
        }
      }

      setData({ value, subtitle })
    } catch (err) {
      console.error('Error fetching stat widget data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.dataSource, config.timeRange, globalDateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ============================================================================
// CHART WIDGET DATA
// ============================================================================

export function useChartWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const { globalDateRange } = useDashboardStore()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config as ChartWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let startDateStr: string
      let endDateStr: string

      // If widget has fixed timeRange, use that; otherwise use global date range
      if (config.timeRange) {
        // Widget has fixed time range
        const timeRangeValue = typeof config.timeRange === 'string'
          ? config.timeRange
          : config.timeRange?.value || '30d'
        const daysAgo = parseInt(timeRangeValue.replace('d', ''))
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        startDateStr = startDate.toISOString().split('T')[0]
        endDateStr = endDate.toISOString().split('T')[0]
      } else if (globalDateRange) {
        // Use global dashboard date range
        startDateStr = globalDateRange.startDate
        endDateStr = globalDateRange.endDate
      } else {
        // Fallback to last 30 days
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDateStr = startDate.toISOString().split('T')[0]
        endDateStr = endDate.toISOString().split('T')[0]
      }

      // Use centralized utility for consistent cost calculations
      const { consumption } = await loadConsumptionWithCosts(
        supabase,
        currentFarmId,
        startDateStr,
        endDateStr
      )

      setData(consumption || [])
    } catch (err) {
      console.error('Error fetching chart widget data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.timeRange, globalDateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ============================================================================
// TABLE WIDGET DATA
// ============================================================================

export function useTableWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const { globalDateRange } = useDashboardStore()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config as TableWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Check dataSource to determine what data to load
      const dataSource = config.dataSource || 'consumption'

      // Note: 'cycles' dataSource does NOT use global date range.
      // Cycles are loaded independently and use their own start_date/end_date.
      if (dataSource === 'suppliers') {
        // Load suppliers
        const { data: suppliers, error: suppliersError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('farm_id', currentFarmId)
          .order('name', { ascending: true })
          .limit(config.pageSize || 10)

        if (suppliersError) throw suppliersError
        setData(suppliers || [])
      } else if (dataSource === 'cycles') {
        // Load livestock cycles with calculated feed costs
        const { data: cycles, error: cyclesError } = await supabase
          .from('livestock_counts')
          .select('*, livestock_count_details(count, area_id, area_group_id)')
          .eq('farm_id', currentFarmId)
          .order('start_date', { ascending: false })
          .limit(config.pageSize || 10)

        if (cyclesError) throw cyclesError

        // Use centralized KPI calculations for each cycle
        const cyclesWithCosts = await Promise.all(
          (cycles || []).map(async (cycle) => {
            // Load consumption for this cycle's date range
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )

            // Fetch all cost transactions for this cycle
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            // Use centralized calculation
            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )

            return {
              ...cycle,
              total_feed_quantity: metrics.totalFeedQuantity,
              total_feed_cost: metrics.totalFeedCost,
              animal_purchase_cost: metrics.animalPurchaseCost,
              additional_costs: metrics.additionalCosts,
              total_animals: metrics.totalAnimals,
              profit_loss: metrics.profitLoss,
            }
          })
        )

        setData(cyclesWithCosts)
      } else if (dataSource === 'cycleAreas') {
        // HIERARCHICAL: Load all completed cycles with expandable area performance
        const { data: cycles } = await supabase
          .from('livestock_counts')
          .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date, areas(id, name), area_groups(id, name))')
          .eq('farm_id', currentFarmId)
          .not('end_date', 'is', null)
          .order('start_date', { ascending: false })
          .limit(config.pageSize || 10)

        if (cycles && cycles.length > 0) {
          const hierarchicalData = await Promise.all(
            cycles.map(async (cycle) => {
              // Load consumption and costs for this cycle
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )

              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              // Calculate area metrics for this cycle
              const areaMetrics = calculateAreaMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )

              // Calculate cycle-level aggregates
              const totalFeedCost = areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0)
              const totalAnimals = areaMetrics.reduce((sum, a) => sum + a.animalCount, 0)

              // Calculate cycle start/end from area details (earliest start, latest end)
              const detailsWithAnimals = cycle.livestock_count_details.filter((d: any) => d.count > 0)
              const areaStartDates = detailsWithAnimals.map((d: any) => d.start_date)
              const areaEndDates = detailsWithAnimals.filter((d: any) => d.end_date).map((d: any) => d.end_date)

              const cycleStartDate = areaStartDates.length > 0
                ? areaStartDates.reduce((min: string, date: string) => date < min ? date : min)
                : cycle.start_date
              const cycleEndDate = areaEndDates.length > 0
                ? areaEndDates.reduce((max: string, date: string) => date > max ? date : max)
                : cycle.end_date

              return {
                // Cycle-level row
                id: cycle.id,
                cycleName: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
                startDate: cycleStartDate,
                endDate: cycleEndDate,
                animalCount: totalAnimals,
                feedCost: totalFeedCost,
                feedCostPerAnimal: totalAnimals > 0 ? totalFeedCost / totalAnimals : 0,
                areaCount: areaMetrics.length,
                isParent: true,
                level: 0,

                // Area-level rows (children)
                children: areaMetrics.map(area => {
                  // Find the specific detail for this area
                  const detail = cycle.livestock_count_details.find((d: any) =>
                    (d.area_id === area.areaId || d.area_group_id === area.areaId) && d.count > 0
                  )

                  return {
                    id: `${cycle.id}-${area.areaId}`,
                    cycleId: cycle.id,
                    areaName: area.areaName,
                    startDate: detail?.start_date || cycleStartDate,
                    endDate: detail?.end_date || cycleEndDate,
                    animalCount: area.animalCount,
                    feedCost: area.totalFeedCost,
                    feedCostPerAnimal: area.feedCostPerAnimal,
                    percentageOfTotal: area.percentageOfTotal,
                    isChild: true,
                    level: 1,
                    parentId: cycle.id,
                  }
                })
              }
            })
          )

          setData(hierarchicalData)
        }
      } else if (dataSource === 'cycleFeedComponents') {
        // CYCLE-SPECIFIC: Load feed component breakdown for a single cycle (ignore global date range)
        const { data: cycle } = await supabase
          .from('livestock_counts')
          .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
          .eq('farm_id', currentFarmId)
          .is('end_date', null)
          .order('start_date', { ascending: false })
          .limit(1)
          .single()

        if (cycle) {
          const { consumption } = await loadConsumptionWithCosts(
            supabase,
            currentFarmId,
            cycle.start_date,
            cycle.end_date
          )

          // Use centralized feed component calculation
          const feedComponents = calculateFeedComponentSummary(
            cycle as any,
            consumption as any
          )

          setData(feedComponents)
        }
      } else if (dataSource === 'cycleComparison') {
        // CYCLE-SPECIFIC: Load comparison data for all completed cycles (ignore global date range)
        const { data: cycles } = await supabase
          .from('livestock_counts')
          .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
          .eq('farm_id', currentFarmId)
          .not('end_date', 'is', null)
          .order('start_date', { ascending: false })
          .limit(config.pageSize || 10)

        if (cycles && cycles.length > 0) {
          const comparisonData = await Promise.all(
            cycles.map(async (cycle) => {
              const { consumption } = await loadConsumptionWithCosts(
                supabase,
                currentFarmId,
                cycle.start_date,
                cycle.end_date
              )

              const { data: costTransactions } = await supabase
                .from('cost_transactions')
                .select('amount')
                .eq('livestock_count_id', cycle.id)

              const metrics = calculateCycleMetrics(
                cycle as any,
                consumption as any,
                (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
              )

              return {
                cycleId: cycle.id,
                cycleName: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
                startDate: cycle.start_date,
                endDate: cycle.end_date,
                status: cycle.end_date ? 'completed' : 'active',
                duration: metrics.cycleDuration,
                totalAnimals: metrics.totalAnimals,
                totalFeedQuantity: metrics.totalFeedQuantity,
                totalFeedCost: metrics.totalFeedCost,
                animalPurchaseCost: metrics.animalPurchaseCost,
                additionalCosts: metrics.additionalCosts,
                revenue: metrics.totalRevenue,
                profitLoss: metrics.profitLoss,
                fcr: metrics.feedConversionRatio,
                feedCostPerAnimal: metrics.feedCostPerAnimal,
                profitMargin: metrics.profitMargin,
              }
            })
          )

          setData(comparisonData)
        }
      } else {
        // Load consumption data (default)
        // Use global date range if available, otherwise default to last 90 days
        let startDateStr: string
        let endDateStr: string

        if (globalDateRange) {
          startDateStr = globalDateRange.startDate
          endDateStr = globalDateRange.endDate
        } else {
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 90)
          startDateStr = startDate.toISOString().split('T')[0]
          endDateStr = endDate.toISOString().split('T')[0]
        }

        // Use centralized utility for consistent cost calculations
        const { consumption } = await loadConsumptionWithCosts(
          supabase,
          currentFarmId,
          startDateStr,
          endDateStr
        )

        // Sort by date descending and limit
        const sortedData = consumption
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, config.pageSize || 10)

        setData(sortedData || [])
      }
    } catch (err) {
      console.error('Error fetching table widget data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.pageSize, config.dataSource, globalDateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ============================================================================
// CYCLE CHART WIDGET DATA
// ============================================================================
// Note: This hook does NOT use global date range. It loads all cycles
// and calculates feed costs based on each cycle's own start_date/end_date.

export function useCycleChartWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config || {}

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data: cycles, error: cyclesError } = await supabase
        .from('livestock_counts')
        .select('*, livestock_count_details(count, area_id, area_group_id)')
        .eq('farm_id', currentFarmId)
        .order('start_date', { ascending: true })
        .limit(10)

      if (cyclesError) throw cyclesError

      // Use centralized KPI calculations for each cycle
      const cyclesWithCosts = await Promise.all(
        (cycles || []).map(async (cycle) => {
          // Load consumption for this cycle's date range
          const { consumption } = await loadConsumptionWithCosts(
            supabase,
            currentFarmId,
            cycle.start_date,
            cycle.end_date
          )

          // Fetch all cost transactions for this cycle
          const { data: costTransactions } = await supabase
            .from('cost_transactions')
            .select('amount')
            .eq('livestock_count_id', cycle.id)

          // Use centralized calculation
          const metrics = calculateCycleMetrics(
            cycle as any,
            consumption as any,
            (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
          )

          return {
            ...cycle,
            total_feed_cost: metrics.totalFeedCost,
            animal_purchase_cost: metrics.animalPurchaseCost,
            additional_costs: metrics.additionalCosts,
            total_animals: metrics.totalAnimals,
          }
        })
      )

      // Format data based on chart type
      const chartType = config.cycleChartType || 'profitLoss'
      let formattedData: any[] = []

      if (chartType === 'profitLoss' && cyclesWithCosts) {
        // Bar chart: profit/loss per cycle
        formattedData = cyclesWithCosts.map((cycle) => {
          const revenue = cycle.revenue || 0
          const feedCost = cycle.total_feed_cost || 0
          const animalPurchaseCost = cycle.animal_purchase_cost || 0
          const additionalCosts = cycle.additional_costs || 0
          const profit = revenue - feedCost - animalPurchaseCost - additionalCosts

          return {
            name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
            profit,
          }
        })
      } else if (chartType === 'costComparison' && cyclesWithCosts) {
        // Stacked bar chart: cost breakdown per cycle
        formattedData = cyclesWithCosts.map((cycle) => ({
          name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
          feedCost: cycle.total_feed_cost || 0,
          animalPurchase: cycle.animal_purchase_cost || 0,
          additionalCosts: cycle.additional_costs || 0,
        }))
      } else if (chartType === 'costBreakdown' && cyclesWithCosts && cyclesWithCosts.length > 0) {
        // Pie chart: average cost distribution
        const avgFeedCost = cyclesWithCosts.reduce((sum, c) => sum + (c.total_feed_cost || 0), 0) / cyclesWithCosts.length
        const avgAnimalPurchaseCost = cyclesWithCosts.reduce((sum, c) => sum + (c.animal_purchase_cost || 0), 0) / cyclesWithCosts.length
        const avgAdditionalCosts = cyclesWithCosts.reduce((sum, c) => sum + (c.additional_costs || 0), 0) / cyclesWithCosts.length

        formattedData = [
          { name: 'Futterkosten', value: avgFeedCost },
          { name: 'Tierkauf', value: avgAnimalPurchaseCost },
          { name: 'Weitere Kosten', value: avgAdditionalCosts },
        ].filter((item) => item.value > 0)
      } else if (chartType === 'performance' && cyclesWithCosts) {
        // Line chart: feed conversion ratio over time
        formattedData = cyclesWithCosts
          .filter((c) => c.feed_conversion_ratio !== null)
          .map((cycle) => ({
            name: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
            fcr: cycle.feed_conversion_ratio,
          }))
      }

      setData(formattedData)
    } catch (err) {
      console.error('Error fetching cycle chart data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.cycleChartType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ============================================================================
// GAUGE WIDGET DATA
// ============================================================================
// Note: Cycle-specific gauge metrics do NOT use global date range.
// They always query based on cycle start/end dates.

export function useGaugeWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const [data, setData] = useState<{ value: number; target: number; label: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config as any // GaugeWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let value = 0
      let label = ''
      const target = config.target || 0
      const metric = config.metric || 'cycle_profit_margin'

      // All gauge metrics are cycle-specific
      switch (metric) {
        case 'cycle_profit_margin': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.profitMargin
            label = 'Gewinnspanne'
          }
          break
        }

        case 'cycle_fcr': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.feedConversionRatio
            label = 'Futterverwertung'
          }
          break
        }

        case 'cycle_feed_efficiency': {
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )
            value = metrics.feedEfficiency
            label = 'Futtereffizienz'
          }
          break
        }

        case 'cycle_mortality_rate': {
          // Calculate mortality rate: (dead animals / total animals) × 100
          const { data: cycle } = await supabase
            .from('livestock_counts')
            .select('*, livestock_count_details(count, area_id, area_group_id, start_date, end_date)')
            .eq('farm_id', currentFarmId)
            .is('end_date', null)
            .order('start_date', { ascending: false })
            .limit(1)
            .single()

          if (cycle) {
            const { consumption } = await loadConsumptionWithCosts(
              supabase,
              currentFarmId,
              cycle.start_date,
              cycle.end_date
            )
            const { data: costTransactions } = await supabase
              .from('cost_transactions')
              .select('amount')
              .eq('livestock_count_id', cycle.id)

            const metrics = calculateCycleMetrics(
              cycle as any,
              consumption as any,
              (costTransactions || []).map(ct => ({ ...ct, transaction_date: '', cost_types: undefined }))
            )

            // TODO: Mortality tracking not yet implemented in cycle metrics
            // For now, return 0
            value = 0
            label = 'Sterblichkeitsrate'
          }
          break
        }
      }

      setData({ value, target, label })
    } catch (err) {
      console.error('Error fetching gauge widget data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.metric, config.target])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ============================================================================
// SUPPLIER WIDGET DATA
// ============================================================================

export function useSupplierWidgetData(widget: WidgetInstance) {
  const { currentFarmId } = useFarmStore()
  const { globalDateRange } = useDashboardStore()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = widget.config || {}

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    console.log('useSupplierWidgetData fetchData called', {
      widgetId: widget.id,
      widgetName: widget.name,
      config
    })

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Calculate date range - use global if available, otherwise last 90 days
      let startDateStr: string
      let endDateStr: string

      if (globalDateRange) {
        startDateStr = globalDateRange.startDate
        endDateStr = globalDateRange.endDate
      } else {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 90)
        startDateStr = startDate.toISOString().split('T')[0]
        endDateStr = endDate.toISOString().split('T')[0]
      }

      const dataSource = config.dataSource || 'suppliers'
      console.log('Data source:', dataSource, 'Date range:', startDateStr, 'to', endDateStr)

      if (dataSource === 'suppliers') {
        // Supplier table: aggregate procurement data by supplier
        // Get price_tiers with supplier info to calculate procurement
        const { data: priceTiers, error: priceError } = await supabase
          .from('price_tiers')
          .select(`
            *,
            suppliers(name),
            feed_types(name, unit)
          `)
          .eq('farm_id', currentFarmId)
          .lte('valid_from', endDateStr)
          .or(`valid_to.is.null,valid_to.gte.${startDateStr}`)

        if (priceError) throw priceError

        console.log('Price tiers loaded:', priceTiers?.length, priceTiers)

        // Get consumption data for the date range
        const { consumption } = await loadConsumptionWithCosts(
          supabase,
          currentFarmId,
          startDateStr,
          endDateStr
        )

        console.log('Consumption loaded:', consumption?.length, consumption)

        // Group by supplier
        const supplierMap = new Map()

        consumption.forEach((item) => {
          // Find matching price tier to determine supplier
          const priceTier = priceTiers?.find(
            (pt: any) =>
              pt.feed_type_id === item.feed_type_id &&
              pt.valid_from <= item.date &&
              (!pt.valid_to || pt.valid_to >= item.date)
          )

          if (priceTier && priceTier.supplier_id) {
            const supplierId = priceTier.supplier_id
            const supplierName = priceTier.suppliers?.name || 'Unbekannt'

            if (!supplierMap.has(supplierId)) {
              supplierMap.set(supplierId, {
                id: supplierId,
                name: supplierName,
                total_quantity: 0,
                total_cost: 0,
                feed_types: new Set(),
                last_delivery: null,
              })
            }

            const supplier = supplierMap.get(supplierId)
            supplier.total_quantity += item.quantity || 0
            supplier.total_cost += item.total_cost || 0
            supplier.feed_types.add(item.feed_type_id)

            if (!supplier.last_delivery || item.date > supplier.last_delivery) {
              supplier.last_delivery = item.date
            }
          }
        })

        // Convert to array and format
        const supplierData = Array.from(supplierMap.values())
          .map((s: any) => ({
            ...s,
            feed_types_count: s.feed_types.size,
            feed_types: undefined,
          }))
          .sort((a: any, b: any) => b.total_cost - a.total_cost)

        console.log('Supplier data result:', supplierData)
        setData(supplierData)
      } else if (dataSource === 'supplier_costs_trend') {
        // Supplier costs over time with configurable aggregation
        const { consumption } = await loadConsumptionWithCosts(
          supabase,
          currentFarmId,
          startDateStr,
          endDateStr
        )

        const { data: priceTiers, error: priceError } = await supabase
          .from('price_tiers')
          .select(`
            *,
            suppliers(name)
          `)
          .eq('farm_id', currentFarmId)
          .lte('valid_from', endDateStr)
          .or(`valid_to.is.null,valid_to.gte.${startDateStr}`)

        if (priceError) throw priceError

        // Determine aggregation level (default: month)
        const aggregationLevel = config.aggregationLevel || 'month'

        // Helper function to get period key from date
        const getPeriodKey = (dateStr: string) => {
          const date = new Date(dateStr)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const week = Math.ceil(date.getDate() / 7)

          switch (aggregationLevel) {
            case 'day':
              return `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            case 'week':
              return `${year}-W${String(week).padStart(2, '0')}`
            case 'month':
            default:
              return `${year}-${String(month).padStart(2, '0')}`
          }
        }

        // Helper function to format period label with year
        const formatPeriodLabel = (periodKey: string) => {
          if (aggregationLevel === 'day') {
            const [year, month, day] = periodKey.split('-')
            return `${day}.${month}.${year}`
          } else if (aggregationLevel === 'week') {
            const [year, week] = periodKey.split('-W')
            return `KW${week} ${year}`
          } else {
            // month
            const [year, month] = periodKey.split('-')
            const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
            return `${monthNames[parseInt(month) - 1]} ${year}`
          }
        }

        // Group by time period and supplier
        const periodSupplierMap = new Map()

        consumption.forEach((item) => {
          const priceTier = priceTiers?.find(
            (pt: any) =>
              pt.feed_type_id === item.feed_type_id &&
              pt.valid_from <= item.date &&
              (!pt.valid_to || pt.valid_to >= item.date)
          )

          const supplierName = priceTier?.suppliers?.name || 'Unbekannt'
          const periodKey = getPeriodKey(item.date)
          const periodLabel = formatPeriodLabel(periodKey)

          if (!periodSupplierMap.has(periodKey)) {
            periodSupplierMap.set(periodKey, {
              periodKey,
              name: periodLabel,
              suppliers: new Map()
            })
          }

          const period = periodSupplierMap.get(periodKey)
          const currentCost = period.suppliers.get(supplierName) || 0
          period.suppliers.set(supplierName, currentCost + (item.total_cost || 0))
        })

        // Convert to array format for recharts
        const timeSeriesData = Array.from(periodSupplierMap.values())
          .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
          .map((period) => {
            const dataPoint: any = { name: period.name }
            period.suppliers.forEach((cost: number, supplier: string) => {
              dataPoint[supplier] = cost
            })
            return dataPoint
          })

        setData(timeSeriesData)
      } else if (dataSource === 'supplier_share' || dataSource === 'supplier_costs' || dataSource === 'supplier_quantity') {
        // Get consumption and price tiers data
        const { consumption } = await loadConsumptionWithCosts(
          supabase,
          currentFarmId,
          startDateStr,
          endDateStr
        )

        const { data: priceTiers, error: priceError } = await supabase
          .from('price_tiers')
          .select(`
            *,
            suppliers(name),
            feed_types(name)
          `)
          .eq('farm_id', currentFarmId)
          .lte('valid_from', endDateStr)
          .or(`valid_to.is.null,valid_to.gte.${startDateStr}`)

        if (priceError) throw priceError

        if (dataSource === 'supplier_share') {
          // Group by feed type and supplier for stacked bar
          const feedTypeMap = new Map()

          consumption.forEach((item) => {
            const priceTier = priceTiers?.find(
              (pt: any) =>
                pt.feed_type_id === item.feed_type_id &&
                pt.valid_from <= item.date &&
                (!pt.valid_to || pt.valid_to >= item.date)
            )

            const feedTypeName = item.feed_types?.name || 'Unbekannt'
            const supplierName = priceTier?.suppliers?.name || 'Unbekannt'

            if (!feedTypeMap.has(feedTypeName)) {
              feedTypeMap.set(feedTypeName, { name: feedTypeName })
            }

            const feedType = feedTypeMap.get(feedTypeName)
            feedType[supplierName] = (feedType[supplierName] || 0) + (item.quantity || 0)
          })

          setData(Array.from(feedTypeMap.values()))
        } else if (dataSource === 'supplier_costs') {
          // Aggregate costs by supplier
          const supplierCosts = new Map()

          consumption.forEach((item) => {
            const priceTier = priceTiers?.find(
              (pt: any) =>
                pt.feed_type_id === item.feed_type_id &&
                pt.valid_from <= item.date &&
                (!pt.valid_to || pt.valid_to >= item.date)
            )

            const supplierName = priceTier?.suppliers?.name || 'Unbekannt'
            supplierCosts.set(
              supplierName,
              (supplierCosts.get(supplierName) || 0) + (item.total_cost || 0)
            )
          })

          setData(
            Array.from(supplierCosts.entries()).map(([name, value]) => ({
              name,
              value,
            }))
          )
        } else if (dataSource === 'supplier_quantity') {
          // Aggregate quantities by supplier
          const supplierQuantities = new Map()

          consumption.forEach((item) => {
            const priceTier = priceTiers?.find(
              (pt: any) =>
                pt.feed_type_id === item.feed_type_id &&
                pt.valid_from <= item.date &&
                (!pt.valid_to || pt.valid_to >= item.date)
            )

            const supplierName = priceTier?.suppliers?.name || 'Unbekannt'
            supplierQuantities.set(
              supplierName,
              (supplierQuantities.get(supplierName) || 0) + (item.quantity || 0)
            )
          })

          setData(
            Array.from(supplierQuantities.entries()).map(([name, quantity]) => ({
              name,
              quantity,
            }))
          )
        }
      }
    } catch (err) {
      console.error('Error fetching supplier widget data:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        err
      })
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.dataSource, config.aggregationLevel, globalDateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Hook for heatmap widget data
 */
export function useHeatmapWidgetData(widget: WidgetInstance) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentFarmId } = useFarmStore()
  const config = widget.config as HeatmapWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    try {
      // Validate config
      if (!config || !config.metric || !config.yAxis) {
        throw new Error('Invalid heatmap configuration: missing metric or yAxis')
      }

      const supabase = createClient()

      // Load all livestock cycles for this farm
      const { data: cycles, error: cyclesError } = await supabase
        .from('livestock_counts')
        .select('*')
        .eq('farm_id', currentFarmId)
        .order('start_date', { ascending: true })

      if (cyclesError) throw cyclesError

      // Calculate metrics for each cycle by area
      const cells: any[] = []

      for (const cycle of cycles || []) {
        try {
          const metrics = await calculateCycleMetrics(cycle.id, currentFarmId)
          const areaMetrics = await calculateAreaMetrics(cycle.id, currentFarmId)

          // Add cycle-level cell
          const cycleName = cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`

          if (config.yAxis === 'area') {
            // Create a cell for each area
            for (const [areaId, areaData] of Object.entries(areaMetrics)) {
              const area = areaData as any
              let value: number | null = null

              switch (config.metric) {
                case 'fcr':
                  value = area.feedConversionRatio
                  break
                case 'profit':
                  value = area.profitLoss
                  break
                case 'cost':
                  value = area.totalFeedCost
                  break
                case 'feed_efficiency':
                  value = area.feedConversionRatio ? 1 / area.feedConversionRatio : null
                  break
                case 'mortality_rate':
                  value = area.mortalityRate
                  break
              }

              cells.push({
                x: cycleName,
                y: area.areaName || 'Unbekannt',
                value,
              })
            }
          } else {
            // Single cell per cycle (aggregate)
            let value: number | null = null

            switch (config.metric) {
              case 'fcr':
                value = metrics.feedConversionRatio
                break
              case 'profit':
                value = metrics.profitLoss
                break
              case 'cost':
                value = metrics.totalFeedCost
                break
              case 'feed_efficiency':
                value = metrics.feedConversionRatio ? 1 / metrics.feedConversionRatio : null
                break
              case 'mortality_rate':
                value = metrics.mortalityRate
                break
            }

            cells.push({
              x: cycleName,
              y: 'Gesamt',
              value,
            })
          }
        } catch (cycleErr) {
          console.warn(`Error calculating metrics for cycle ${cycle.id}:`, cycleErr)
          // Continue with next cycle
        }
      }

      setData({ cells })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error loading heatmap data:', {
        error: err,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        config: { metric: config?.metric, yAxis: config?.yAxis },
      })
      setError(errorMessage || 'Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config?.metric, config?.yAxis])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Hook for waterfall widget data
 */
export function useWaterfallWidgetData(widget: WidgetInstance) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentFarmId } = useFarmStore()
  const config = widget.config as WaterfallWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get cycle data
      let cycleId: string | undefined

      if (config.cycleSelector?.cycleId) {
        cycleId = config.cycleSelector.cycleId
      } else {
        // Get most recent cycle
        const { data: latestCycle } = await supabase
          .from('livestock_counts')
          .select('id')
          .eq('farm_id', currentFarmId)
          .order('start_date', { ascending: false })
          .limit(1)
          .single()

        cycleId = latestCycle?.id
      }

      if (!cycleId) {
        setData({ steps: [], summary: { total: 0 } })
        return
      }

      const metrics = await calculateCycleMetrics(cycleId, currentFarmId)

      // Build waterfall steps
      const steps: any[] = []
      let cumulative = 0

      // Start with revenue
      steps.push({
        label: 'Erlös',
        value: metrics.revenue,
        cumulativeValue: metrics.revenue,
        baseValue: 0,
        isTotal: false,
      })
      cumulative = metrics.revenue

      // Subtract feed costs
      steps.push({
        label: 'Futterkosten',
        value: -metrics.totalFeedCost,
        cumulativeValue: cumulative - metrics.totalFeedCost,
        baseValue: cumulative,
        isTotal: false,
      })
      cumulative -= metrics.totalFeedCost

      // Subtract animal purchase costs
      if (metrics.animalPurchaseCost > 0) {
        steps.push({
          label: 'Tierkauf',
          value: -metrics.animalPurchaseCost,
          cumulativeValue: cumulative - metrics.animalPurchaseCost,
          baseValue: cumulative,
          isTotal: false,
        })
        cumulative -= metrics.animalPurchaseCost
      }

      // Subtract additional costs
      if (metrics.additionalCosts > 0) {
        steps.push({
          label: 'Weitere Kosten',
          value: -metrics.additionalCosts,
          cumulativeValue: cumulative - metrics.additionalCosts,
          baseValue: cumulative,
          isTotal: false,
        })
        cumulative -= metrics.additionalCosts
      }

      // Final profit/loss
      steps.push({
        label: 'Gewinn/Verlust',
        value: metrics.profitLoss,
        cumulativeValue: metrics.profitLoss,
        baseValue: 0,
        isTotal: true,
      })

      setData({
        steps,
        summary: {
          total: metrics.profitLoss,
        },
      })
    } catch (err) {
      console.error('Error loading waterfall data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.cycleSelector?.cycleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Hook for scatter widget data
 */
export function useScatterWidgetData(widget: WidgetInstance) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentFarmId } = useFarmStore()
  const config = widget.config as ScatterWidgetConfig

  const fetchData = useCallback(async () => {
    if (!currentFarmId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Load all completed cycles
      const { data: cycles, error: cyclesError } = await supabase
        .from('livestock_counts')
        .select('*')
        .eq('farm_id', currentFarmId)
        .not('end_date', 'is', null)
        .order('start_date', { ascending: false })

      if (cyclesError) throw cyclesError

      // Calculate metrics for each cycle
      const points: any[] = []

      for (const cycle of cycles || []) {
        const metrics = await calculateCycleMetrics(cycle.id, currentFarmId)

        const point: any = {
          label: cycle.durchgang_name || `Durchgang ${cycle.id.slice(0, 8)}`,
        }

        // Map x and y values based on config
        const xField = config.xAxis.field
        const yField = config.yAxis.field

        // X-axis
        if (xField === 'fcr') point.x = metrics.feedConversionRatio
        else if (xField === 'duration') point.x = metrics.duration
        else if (xField.includes('cost')) point.x = metrics.totalFeedCost
        else if (xField.includes('profit')) point.x = metrics.profitLoss
        else if (xField.includes('animals')) point.x = metrics.totalAnimals

        // Y-axis
        if (yField === 'profit' || yField.includes('profit')) point.y = metrics.profitLoss
        else if (yField === 'fcr') point.y = metrics.feedConversionRatio
        else if (yField.includes('margin')) point.y = metrics.profitMargin
        else if (yField.includes('cost')) point.y = metrics.totalFeedCost
        else if (yField === 'duration') point.y = metrics.duration

        // Size based on optional field
        if (config.pointSize?.field) {
          if (config.pointSize.field === 'animals') {
            point.size = metrics.totalAnimals
          } else if (config.pointSize.field === 'revenue') {
            point.size = metrics.revenue
          }
        }

        // Grouping
        if (config.groupBy === 'profitability') {
          if (metrics.profitLoss > 0) point.group = 'Profitabel'
          else point.group = 'Verlust'
        }

        points.push(point)
      }

      // Calculate correlation if applicable
      let correlation: number | undefined
      if (points.length > 2) {
        const xValues = points.map(p => p.x)
        const yValues = points.map(p => p.y)

        const n = points.length
        const sumX = xValues.reduce((a, b) => a + b, 0)
        const sumY = yValues.reduce((a, b) => a + b, 0)
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
        const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)
        const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0)

        const numerator = n * sumXY - sumX * sumY
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

        if (denominator !== 0) {
          correlation = numerator / denominator
        }
      }

      setData({
        points,
        stats: {
          count: points.length,
          correlation,
        },
      })
    } catch (err) {
      console.error('Error loading scatter data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }, [currentFarmId, config.xAxis.field, config.yAxis.field, config.pointSize?.field, config.groupBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
