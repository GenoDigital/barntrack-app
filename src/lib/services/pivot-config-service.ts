import { createClient } from '@/lib/supabase/client'
import { PivotConfig } from '@/components/reports/pivot-table-config'

export interface SavedPivotConfig {
  id: string
  farm_id: string
  name: string
  description: string | null
  config: PivotConfig
  created_by: string
  created_at: string
  updated_at: string
  is_favorite: boolean
}

/**
 * Get all saved pivot configurations for a farm
 */
export async function getSavedPivotConfigs(farmId: string): Promise<SavedPivotConfig[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('saved_pivot_configs')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved pivot configs:', error)
    throw error
  }

  return data || []
}

/**
 * Save a new pivot configuration
 */
export async function savePivotConfig(
  farmId: string,
  name: string,
  config: PivotConfig,
  description?: string
): Promise<SavedPivotConfig> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('saved_pivot_configs')
    .insert({
      farm_id: farmId,
      name,
      description: description || null,
      config,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving pivot config:', error)
    throw error
  }

  return data
}

/**
 * Update an existing pivot configuration
 */
export async function updatePivotConfig(
  id: string,
  updates: {
    name?: string
    description?: string
    config?: PivotConfig
    is_favorite?: boolean
  }
): Promise<SavedPivotConfig> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('saved_pivot_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating pivot config:', error)
    throw error
  }

  return data
}

/**
 * Delete a saved pivot configuration
 */
export async function deletePivotConfig(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('saved_pivot_configs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting pivot config:', error)
    throw error
  }
}

/**
 * Check if user can create more pivot configurations based on their plan
 */
export async function canCreatePivotConfig(
  farmId: string,
  maxAllowed: number
): Promise<{ canCreate: boolean; currentCount: number; maxAllowed: number }> {
  const supabase = createClient()

  // If unlimited (-1), always allow
  if (maxAllowed === -1) {
    return { canCreate: true, currentCount: 0, maxAllowed: -1 }
  }

  // Get current count
  const { count, error } = await supabase
    .from('saved_pivot_configs')
    .select('*', { count: 'exact', head: true })
    .eq('farm_id', farmId)

  if (error) {
    console.error('Error checking pivot config count:', error)
    throw error
  }

  const currentCount = count || 0
  const canCreate = currentCount < maxAllowed

  return { canCreate, currentCount, maxAllowed }
}
