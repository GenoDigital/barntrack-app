import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Singleton instance to avoid creating multiple clients
// This reduces connection overhead and memory usage
let browserClient: SupabaseClient<Database> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}