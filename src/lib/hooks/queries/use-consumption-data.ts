'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'

interface ConsumptionItem {
  date: string
  quantity: number
  feed_type_id: string
  total_cost?: number
  area_id?: string
  feed_types?: {
    id: string
    name: string
    unit?: string
  }
  areas?: {
    id: string
    name: string
  }
  supplier_id?: string | null
  supplier_name?: string | null
}

interface PriceTier {
  feed_type_id: string
  price_per_unit: number
  valid_from: string
  valid_to: string | null
}

interface ConsumptionDataResult {
  consumption: ConsumptionItem[]
  priceTiers: PriceTier[]
}

/**
 * Query key factory for consumption data
 * This ensures consistent query keys across the app
 */
export const consumptionKeys = {
  all: ['consumption'] as const,
  byFarm: (farmId: string) => [...consumptionKeys.all, farmId] as const,
  byDateRange: (farmId: string, startDate: string, endDate: string) =>
    [...consumptionKeys.byFarm(farmId), startDate, endDate] as const,
  byFilters: (
    farmId: string,
    startDate: string,
    endDate: string,
    options?: { feedTypeId?: string; areaId?: string }
  ) => [...consumptionKeys.byDateRange(farmId, startDate, endDate), options] as const,
}

/**
 * Shared hook for fetching consumption data with TanStack Query caching.
 *
 * Key benefits:
 * - Request deduplication: Multiple widgets calling this with same params = 1 query
 * - Caching: Data is cached for 5 minutes (staleTime), kept in memory for 30 min
 * - Background updates: Stale data is shown immediately, fresh data fetched in background
 *
 * @param farmId - Farm ID to fetch consumption for
 * @param startDate - Start date for the date range
 * @param endDate - End date for the date range (defaults to today)
 * @param options - Optional filters for feed type and area
 */
export function useConsumptionData(
  farmId: string | null,
  startDate: string,
  endDate: string,
  options?: { feedTypeId?: string; areaId?: string }
) {
  const supabase = createClient()

  return useQuery<ConsumptionDataResult, Error>({
    queryKey: consumptionKeys.byFilters(farmId || '', startDate, endDate, options),
    queryFn: async () => {
      if (!farmId) {
        return { consumption: [], priceTiers: [] }
      }

      const result = await loadConsumptionWithCosts(
        supabase,
        farmId,
        startDate,
        endDate,
        options
      )

      return result
    },
    enabled: !!farmId && !!startDate && !!endDate,
    // 5 minutes stale time - consumption data doesn't change frequently
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 30 minutes for reuse when navigating back
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for fetching consumption data for the current date range
 * Useful for widgets that need consumption within a dashboard's global date range
 */
export function useConsumptionDataForPeriod(
  farmId: string | null,
  daysAgo: number = 30
) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return useConsumptionData(farmId, startDate, endDate)
}
