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
 *
 * This runs on the server with proper authentication context,
 * ensuring auth.uid() works correctly in RLS policies and triggers.
 */
export async function createFarmAction(params: CreateFarmParams): Promise<CreateFarmResult> {
  const supabase = await createClient()

  try {
    // Get the current user from server-side session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Nicht authentifiziert'
      }
    }

    // Validate farm name
    if (!params.name.trim()) {
      return {
        success: false,
        error: 'Stallname ist erforderlich'
      }
    }

    // Check subscription limits via RPC
    const { data: canCreate, error: limitError } = await supabase
      .rpc('can_user_create_farm', { user_uuid: user.id })

    if (limitError) {
      console.error('Error checking farm creation limits:', limitError)
      return {
        success: false,
        error: 'Fehler beim Überprüfen der Berechtigung'
      }
    }

    if (!canCreate) {
      return {
        success: false,
        error: 'Sie haben das Maximum an Ställen für Ihren Plan erreicht. Bitte upgraden Sie Ihren Plan.'
      }
    }

    // Ensure user record exists in users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        user_type: 'owner'
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      return {
        success: false,
        error: 'Fehler beim Erstellen des Benutzerdatensatzes'
      }
    }

    // Create the farm (RLS and trigger will validate)
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .insert({
        name: params.name.trim(),
        description: params.description?.trim() || null,
        owner_id: user.id
      })
      .select()
      .single()

    if (farmError) {
      console.error('Error creating farm:', farmError)
      return {
        success: false,
        error: farmError.message || 'Fehler beim Erstellen des Stalls'
      }
    }

    // Create farm membership with owner role
    const { error: memberError } = await supabase
      .from('farm_members')
      .insert({
        farm_id: farm.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error creating farm membership:', memberError)
      return {
        success: false,
        error: 'Fehler beim Erstellen der Stallmitgliedschaft'
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/setup')

    return {
      success: true,
      farm
    }
  } catch (error) {
    console.error('Unexpected error creating farm:', error)
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
      console.error('Error checking farm creation ability:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error in canUserCreateFarmAction:', error)
    return false
  }
}
