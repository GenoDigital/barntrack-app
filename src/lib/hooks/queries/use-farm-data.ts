'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Query key factory for farm data
 */
export const farmKeys = {
  all: ['farm'] as const,
  farm: (farmId: string) => [...farmKeys.all, farmId] as const,
  areas: (farmId: string) => [...farmKeys.farm(farmId), 'areas'] as const,
  feedTypes: (farmId: string) => [...farmKeys.farm(farmId), 'feedTypes'] as const,
  suppliers: (farmId: string) => [...farmKeys.farm(farmId), 'suppliers'] as const,
  priceTiers: (farmId: string) => [...farmKeys.farm(farmId), 'priceTiers'] as const,
}

/**
 * Hook to fetch farm areas with caching
 * Areas rarely change - 10 minute stale time
 */
export function useAreas(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: farmKeys.areas(farmId || ''),
    queryFn: async () => {
      if (!farmId) return []

      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('farm_id', farmId)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!farmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to fetch feed types with caching
 * Feed types rarely change - 10 minute stale time
 */
export function useFeedTypes(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: farmKeys.feedTypes(farmId || ''),
    queryFn: async () => {
      if (!farmId) return []

      const { data, error } = await supabase
        .from('feed_types')
        .select('*')
        .eq('farm_id', farmId)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!farmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to fetch suppliers with caching
 * Suppliers rarely change - 10 minute stale time
 */
export function useSuppliers(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: farmKeys.suppliers(farmId || ''),
    queryFn: async () => {
      if (!farmId) return []

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('farm_id', farmId)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!farmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to fetch price tiers with caching
 */
export function usePriceTiers(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: farmKeys.priceTiers(farmId || ''),
    queryFn: async () => {
      if (!farmId) return []

      const { data, error } = await supabase
        .from('price_tiers')
        .select(`
          *,
          suppliers(id, name),
          feed_types(id, name, unit)
        `)
        .eq('farm_id', farmId)
        .order('valid_from', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch farm counts (for stat widgets)
 * Returns counts of areas, feed types, and suppliers
 */
export function useFarmCounts(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...farmKeys.farm(farmId || ''), 'counts'],
    queryFn: async () => {
      if (!farmId) return { areas: 0, feedTypes: 0, suppliers: 0 }

      const [areasResult, feedTypesResult, suppliersResult] = await Promise.all([
        supabase
          .from('areas')
          .select('*', { count: 'exact', head: true })
          .eq('farm_id', farmId),
        supabase
          .from('feed_types')
          .select('*', { count: 'exact', head: true })
          .eq('farm_id', farmId),
        supabase
          .from('suppliers')
          .select('*', { count: 'exact', head: true })
          .eq('farm_id', farmId),
      ])

      return {
        areas: areasResult.count || 0,
        feedTypes: feedTypesResult.count || 0,
        suppliers: suppliersResult.count || 0,
      }
    },
    enabled: !!farmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}
