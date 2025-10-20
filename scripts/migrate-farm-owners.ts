#!/usr/bin/env tsx

/**
 * Migration script to sync existing farm owners with Stripe
 * Run with: npx tsx scripts/migrate-farm-owners.ts
 */

import { createClient } from '@/lib/supabase/server'
import { migrateFarmOwnersToProPlan } from '@/lib/utils/user-migration'

async function main() {
  console.log('🚀 Starting farm owner migration to Stripe...')
  
  try {
    const supabase = createClient()
    
    // Call the migration function
    const result = await migrateFarmOwnersToProPlan(supabase)
    
    if (result.success) {
      console.log('✅ Migration completed successfully!')
      console.log(`📊 Results:`)
      console.log(`   - Total processed: ${result.totalProcessed}`)
      console.log(`   - Successfully migrated: ${result.successCount}`)
      console.log(`   - Failed: ${result.failureCount}`)
      
      if (result.details && result.details.length > 0) {
        console.log('\n📋 Details:')
        result.details.forEach((detail, index) => {
          const status = detail.success ? '✅' : '❌'
          console.log(`   ${status} ${detail.email}: ${detail.message}`)
        })
      }
    } else {
      console.error('❌ Migration failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Unexpected error during migration:', error)
    process.exit(1)
  }
}

// Run the migration
main().catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})