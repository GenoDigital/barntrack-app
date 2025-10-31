'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Subscription {
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  current_period_end: string | null
  trial_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_coupon_id: string | null
  stripe_product_id: string | null
  stripe_price_id: string | null
  cancel_at_period_end?: boolean
  canceled_at: string | null
  ended_at: string | null
}

interface PlanConfiguration {
  plan_name: string
  display_name: string
  description: string
  max_farms: number
  max_users_per_farm: number
  max_uploads_per_month: number
  max_storage_gb: number
  max_dashboards_per_farm: number
  max_pivot_configs_per_farm: number
  can_invite_users: boolean
  has_advanced_analytics: boolean
  has_api_access: boolean
  has_priority_support: boolean
  has_bulk_import: boolean
  has_custom_reports: boolean
  has_data_export: boolean
  has_audit_logs: boolean
  monthly_price_cents: number
  yearly_price_cents: number
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [planConfig, setPlanConfig] = useState<PlanConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch subscription (no user_uuid needed - uses authenticated user)
      const { data: subData, error: subError } = await supabase.rpc('get_user_subscription')

      if (subError) {
        console.error('Error fetching subscription:', subError)
        setError(subError.message)
        return
      }

      if (subData && subData.length > 0) {
        setSubscription(subData[0])
      }

      // Fetch plan configuration
      const { data: planData, error: planError } = await supabase.rpc('get_current_user_plan_configuration')

      if (planError) {
        console.error('Error fetching plan configuration:', planError)
        // Don't set error here as subscription might still work
      } else if (planData && planData.length > 0) {
        setPlanConfig(planData[0])
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err)
      setError('Failed to fetch subscription')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  const canCreateFarm = async (): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase.rpc('can_user_create_farm', {
        user_uuid: user.id
      })

      if (error) {
        console.error('Error checking farm creation ability:', error)
        return false
      }

      return data === true
    } catch (err) {
      console.error('Error in canCreateFarm:', err)
      return false
    }
  }

  const getPlanLimits = () => {
    if (!planConfig) return null

    return {
      maxFarms: planConfig.max_farms === -1 ? 'Unbegrenzt' : (planConfig.max_farms?.toString() ?? '-'),
      maxUsersPerFarm: planConfig.max_users_per_farm === -1 ? 'Unbegrenzt' : (planConfig.max_users_per_farm?.toString() ?? '-'),
      maxUploadsPerMonth: planConfig.max_uploads_per_month === -1 ? 'Unbegrenzt' : (planConfig.max_uploads_per_month?.toString() ?? '-'),
      maxStorageGb: planConfig.max_storage_gb === -1 ? 'Unbegrenzt' : (planConfig.max_storage_gb?.toString() ?? '-'),
      maxDashboardsPerFarm: planConfig.max_dashboards_per_farm === -1 ? 'Unbegrenzt' : (planConfig.max_dashboards_per_farm?.toString() ?? '-'),
      maxPivotConfigsPerFarm: planConfig.max_pivot_configs_per_farm === -1 ? 'Unbegrenzt' : (planConfig.max_pivot_configs_per_farm?.toString() ?? '-'),
      canInviteUsers: planConfig.can_invite_users ?? false,
      hasAdvancedAnalytics: planConfig.has_advanced_analytics ?? false,
      hasApiAccess: planConfig.has_api_access ?? false,
      hasPrioritySupport: planConfig.has_priority_support ?? false,
      hasBulkImport: planConfig.has_bulk_import ?? false,
      hasCustomReports: planConfig.has_custom_reports ?? false,
      hasDataExport: planConfig.has_data_export ?? false,
      hasAuditLogs: planConfig.has_audit_logs ?? false
    }
  }

  const getPlanName = () => {
    if (planConfig) {
      return planConfig.display_name
    }
    
    // Default fallback if no plan config is available
    return 'Starter'
  }

  const getTrialDaysRemaining = (): number | null => {
    if (!subscription?.trial_end || subscription.status !== 'trialing') return null
    
    const trialEnd = new Date(subscription.trial_end)
    const today = new Date()
    const diffTime = trialEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  const isTrialing = (): boolean => {
    return subscription?.status === 'trialing' && getTrialDaysRemaining() !== null && getTrialDaysRemaining()! > 0
  }

  const hasForeverFree = (): boolean => {
    if (!subscription?.stripe_coupon_id) return false
    
    // Check if it's a forever free coupon by checking subscription status and coupon presence
    // Forever free coupons typically result in 'active' status without trial
    return subscription.status === 'active' && 
           subscription.stripe_coupon_id !== null && 
           subscription.trial_end === null
  }

  const needsPaymentSetup = (): boolean => {
    return isTrialing() && !hasForeverFree()
  }

  // Convenience functions for checking plan features
  const checkPlanLimit = async (limitType: string, currentUsage: number = 0) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('check_plan_limit', {
        limit_type: limitType,
        current_usage: currentUsage
      })

      if (error) {
        console.error('Error checking plan limit:', error)
        return { allowed: false, error: error.message }
      }

      return data
    } catch (err) {
      console.error('Error in checkPlanLimit:', err)
      return { allowed: false, error: 'Failed to check plan limit' }
    }
  }

  const checkPlanFeature = async (featureName: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('check_plan_feature', {
        feature_name: featureName
      })

      if (error) {
        console.error('Error checking plan feature:', error)
        return { has_feature: false, error: error.message }
      }

      return data
    } catch (err) {
      console.error('Error in checkPlanFeature:', err)
      return { has_feature: false, error: 'Failed to check plan feature' }
    }
  }

  const hasCustomDashboards = (): boolean => {
    return planConfig?.has_custom_reports ?? false
  }

  const canCreateDashboard = async (farmId: string): Promise<{
    canCreate: boolean
    currentCount: number
    maxAllowed: number
    message: string
  }> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('can_user_create_dashboard', {
        p_farm_id: farmId
      })

      if (error) {
        console.error('Error checking dashboard creation ability:', error)
        return {
          canCreate: false,
          currentCount: 0,
          maxAllowed: 0,
          message: 'Fehler beim Überprüfen der Dashboard-Berechtigung'
        }
      }

      if (data && data.length > 0) {
        return {
          canCreate: data[0].can_create,
          currentCount: data[0].current_count,
          maxAllowed: data[0].max_allowed,
          message: data[0].message
        }
      }

      return {
        canCreate: false,
        currentCount: 0,
        maxAllowed: 0,
        message: 'Keine Daten gefunden'
      }
    } catch (err) {
      console.error('Error in canCreateDashboard:', err)
      return {
        canCreate: false,
        currentCount: 0,
        maxAllowed: 0,
        message: 'Fehler beim Überprüfen der Dashboard-Berechtigung'
      }
    }
  }

  return {
    subscription,
    planConfig,
    loading,
    error,
    canCreateFarm,
    canCreateDashboard,
    getPlanLimits,
    getPlanName,
    getTrialDaysRemaining,
    isTrialing,
    hasForeverFree,
    hasCustomDashboards,
    needsPaymentSetup,
    checkPlanLimit,
    checkPlanFeature,
    refetch: fetchSubscription
  }
}