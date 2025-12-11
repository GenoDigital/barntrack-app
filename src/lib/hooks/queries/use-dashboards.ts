'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Query key factory for dashboards
 */
export const dashboardKeys = {
  all: ['dashboards'] as const,
  byFarm: (farmId: string) => [...dashboardKeys.all, farmId] as const,
  detail: (dashboardId: string) => [...dashboardKeys.all, 'detail', dashboardId] as const,
  default: (farmId: string) => [...dashboardKeys.byFarm(farmId), 'default'] as const,
}

/**
 * Hook to fetch all dashboards for a farm
 */
export function useDashboards(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: dashboardKeys.byFarm(farmId || ''),
    queryFn: async () => {
      if (!farmId) return []

      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch the default dashboard for a farm
 */
export function useDefaultDashboard(farmId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: dashboardKeys.default(farmId || ''),
    queryFn: async () => {
      if (!farmId) return null

      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('farm_id', farmId)
        .eq('is_default', true)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a specific dashboard by ID
 */
export function useDashboard(dashboardId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: dashboardKeys.detail(dashboardId || ''),
    queryFn: async () => {
      if (!dashboardId) return null

      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!dashboardId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to invalidate dashboard queries after mutations
 */
export function useInvalidateDashboards() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    invalidateForFarm: (farmId: string) =>
      queryClient.invalidateQueries({ queryKey: dashboardKeys.byFarm(farmId) }),
    invalidateDashboard: (dashboardId: string) =>
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) }),
  }
}
