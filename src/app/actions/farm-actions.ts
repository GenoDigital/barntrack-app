'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateFarmParams {
  name: string
  description?: string | null
}

export interface CreateFarmResult {
  success: boolean
  farm?: {
    id: string
    name: string
    description: string | null
    owner_id: string
  }
  error?: string
}

/**
 * Server Action: Create a new farm
 * Simple approach using upsert (like users table which works)
 */
export async function createFarmAction(params: CreateFarmParams): Promise<CreateFarmResult> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Nicht authentifiziert'
      }
    }

    if (!params.name.trim()) {
      return {
        success: false,
        error: 'Stallname ist erforderlich'
      }
    }

    // Check subscription limits
    const { data: canCreate, error: limitError } = await supabase
      .rpc('can_user_create_farm', { user_uuid: user.id })

    if (limitError) {
      console.error('Farm creation limit check failed:', limitError.message)
      return {
        success: false,
        error: 'Fehler beim Überprüfen der Berechtigung'
      }
    }

    if (!canCreate) {
      return {
        success: false,
        error: 'Sie haben das Maximum an Ställen für Ihren Plan erreicht'
      }
    }

    // Ensure user record exists (uses upsert, works fine)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        user_type: 'owner'
      })

    if (userError) {
      console.error('User record creation failed:', userError.message)
      return {
        success: false,
        error: 'Fehler beim Erstellen des Benutzerdatensatzes'
      }
    }

    // Create farm via SECURITY DEFINER function (bypasses RLS but validates auth)
    // This validates: auth.uid() matches user_uuid AND subscription limits
    const { data: farm, error: farmError } = await supabase
      .rpc('create_farm_for_user', {
        user_uuid: user.id,
        farm_name: params.name.trim(),
        farm_description: params.description?.trim() || null
      })

    if (farmError) {
      console.error('Farm creation failed:', farmError.message)
      return {
        success: false,
        error: farmError.message || 'Fehler beim Erstellen des Stalls'
      }
    }

    if (!farm) {
      return {
        success: false,
        error: 'Stall konnte nicht erstellt werden'
      }
    }

    // Parse the JSON result
    const farmData = typeof farm === 'string' ? JSON.parse(farm) : farm

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/setup')

    return {
      success: true,
      farm: farmData
    }
  } catch (error) {
    console.error('Unexpected farm creation error:', error instanceof Error ? error.message : 'Unknown error')
    return {
      success: false,
      error: 'Ein unerwarteter Fehler ist aufgetreten'
    }
  }
}

/**
 * Server Action: Check if the current user can create a farm
 */
export async function canUserCreateFarmAction(): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .rpc('can_user_create_farm', { user_uuid: user.id })

    if (error) {
      console.error('Farm creation ability check failed:', error.message)
      return false
    }

    return data === true
  } catch (error) {
    console.error('canUserCreateFarmAction error:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}
