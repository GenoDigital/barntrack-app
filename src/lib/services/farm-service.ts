/**
 * Farm Service Layer
 *
 * Handles all farm creation operations with subscription limit checking,
 * user record management, and farm membership creation.
 *
 * This is the SINGLE source of truth for creating farms - both onboarding
 * and the create-farm dialog should use this service.
 */

import { createClient } from '@/lib/supabase/client'

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
 * Create a new farm with all necessary relationships
 *
 * This function:
 * 1. Checks if user can create a farm (subscription limits)
 * 2. Ensures user record exists in users table
 * 3. Creates the farm
 * 4. Creates the farm_members record with owner role
 *
 * @param params - Farm creation parameters
 * @returns Result object with success status and farm data or error
 */
export async function createFarm(params: CreateFarmParams): Promise<CreateFarmResult> {
  const supabase = createClient()

  try {
    // Get the current user
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

    // Check subscription limits
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

    // Debug: Check what the database sees
    console.log('About to create farm with owner_id:', user.id)
    console.log('User email:', user.email)

    // Test if auth context is working
    const { data: authTest, error: authTestError } = await supabase.rpc('auth.uid' as any)
    console.log('Database auth.uid() returns:', authTest, 'Error:', authTestError)

    // Create the farm
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
      console.error('User ID attempted:', user.id)
      return {
        success: false,
        error: 'Fehler beim Erstellen des Stalls'
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
      // This is critical - if membership fails, the user won't be able to access the farm
      // We should try to clean up the farm, but that might fail due to RLS
      // Log the error and return it
      return {
        success: false,
        error: 'Fehler beim Erstellen der Stallmitgliedschaft'
      }
    }

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
 * Check if the current user can create a farm based on their subscription limits
 *
 * @returns true if user can create a farm, false otherwise
 */
export async function canUserCreateFarm(): Promise<boolean> {
  const supabase = createClient()

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
    console.error('Error in canUserCreateFarm:', error)
    return false
  }
}
