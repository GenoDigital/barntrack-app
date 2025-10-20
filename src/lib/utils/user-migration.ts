import { createClient } from '@/lib/supabase/server'

interface MigrationResult {
  success: boolean
  message: string
  migratedUsers: number
  errors: string[]
}

/**
 * Migrates existing farm owners to professional plan with forever free coupon
 * This function should be run once to migrate all existing users who own farms
 */
export async function migrateFarmOwnersToProPlan(): Promise<MigrationResult> {
  const supabase = createClient()
  const errors: string[] = []
  let migratedUsers = 0

  try {
    // Find all users who own farms but don't have proper Stripe integration
    const { data: usersToMigrate, error: queryError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_customer_id,
        plan_type,
        status,
        users!inner(
          id,
          email,
          created_at
        ),
        farm_members!inner(
          role,
          farms!inner(
            id,
            name
          )
        )
      `)
      .eq('farm_members.role', 'owner')
      .or('stripe_customer_id.is.null,plan_type.neq.professional')

    if (queryError) {
      throw new Error(`Failed to query users: ${queryError.message}`)
    }

    if (!usersToMigrate || usersToMigrate.length === 0) {
      return {
        success: true,
        message: 'No users need migration',
        migratedUsers: 0,
        errors: []
      }
    }

    // Process each user
    for (const userSub of usersToMigrate) {
      try {
        const user = userSub.users
        let stripeCustomerId = userSub.stripe_customer_id

        // Create Stripe customer if needed
        if (!stripeCustomerId) {
          // Note: In a real migration, you'd use the actual Stripe API here
          // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
          // const customer = await stripe.customers.create({
          //   email: user.email,
          //   name: user.email.split('@')[0]
          // })
          // stripeCustomerId = customer.id
          
          // For now, we'll simulate this
          console.log(`Would create Stripe customer for ${user.email}`)
        }

        // Update subscription to professional plan with forever free coupon
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: stripeCustomerId,
            plan_type: 'professional',
            status: 'active',
            stripe_coupon_id: 'oOFyksi9', // Professional Plan Forever Free
            max_farms: 10,
            max_users_per_farm: 5,
            can_invite_users: true,
            has_advanced_analytics: true,
            has_api_access: false,
            has_priority_support: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userSub.id)

        if (updateError) {
          errors.push(`Failed to update subscription for ${user.email}: ${updateError.message}`)
          continue
        }

        // Create voucher redemption record
        const { data: voucherCode, error: voucherError } = await supabase
          .from('voucher_codes')
          .select('id')
          .eq('stripe_coupon_id', 'oOFyksi9')
          .single()

        if (voucherError) {
          errors.push(`Failed to find voucher code for ${user.email}: ${voucherError.message}`)
          continue
        }

        // Insert voucher redemption (ignore if already exists)
        const { error: redemptionError } = await supabase
          .from('voucher_redemptions')
          .upsert({
            user_id: user.id,
            voucher_code_id: voucherCode.id,
            redeemed_at: new Date().toISOString()
          }, {
            onConflict: 'voucher_code_id,user_id',
            ignoreDuplicates: true
          })

        if (redemptionError) {
          errors.push(`Failed to create voucher redemption for ${user.email}: ${redemptionError.message}`)
          continue
        }

        migratedUsers++
        console.log(`Successfully migrated ${user.email} to professional plan`)

      } catch (userError) {
        errors.push(`Error processing user: ${userError}`)
      }
    }

    return {
      success: errors.length === 0,
      message: `Migration completed. ${migratedUsers} users migrated.`,
      migratedUsers,
      errors
    }

  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error}`,
      migratedUsers,
      errors: [String(error)]
    }
  }
}

/**
 * Migrates a single user who owns farms to professional plan
 * Useful for handling new users or individual migrations
 */
export async function migrateSingleFarmOwner(userId: string): Promise<MigrationResult> {
  const supabase = createClient()

  try {
    // Check if user owns any farms
    const { data: farmOwnership, error: farmError } = await supabase
      .from('farm_members')
      .select('farm_id')
      .eq('user_id', userId)
      .eq('role', 'owner')

    if (farmError) {
      throw new Error(`Failed to check farm ownership: ${farmError.message}`)
    }

    if (!farmOwnership || farmOwnership.length === 0) {
      return {
        success: false,
        message: 'User does not own any farms',
        migratedUsers: 0,
        errors: ['User is not a farm owner']
      }
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !userData.user) {
      throw new Error(`Failed to get user data: ${userError?.message}`)
    }

    // Update or create subscription
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'professional',
        status: 'active',
        stripe_coupon_id: 'oOFyksi9',
        max_farms: 10,
        max_users_per_farm: 5,
        can_invite_users: true,
        has_advanced_analytics: true,
        has_api_access: false,
        has_priority_support: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      throw new Error(`Failed to update subscription: ${upsertError.message}`)
    }

    return {
      success: true,
      message: `Successfully migrated user ${userData.user.email} to professional plan`,
      migratedUsers: 1,
      errors: []
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to migrate user: ${error}`,
      migratedUsers: 0,
      errors: [String(error)]
    }
  }
}