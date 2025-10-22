import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  // Redirect URL for success case
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Successfully verified - redirect to the next URL
      // For invitations, this will be /accept-invitation?token=...
      return NextResponse.redirect(redirectTo)
    }

    // Log error for debugging
    console.error('Token verification error:', error)
  }

  // Return the user to an error page with instructions
  const errorUrl = request.nextUrl.clone()
  errorUrl.pathname = '/login'
  errorUrl.search = '?error=verification_failed&message=Email verification failed. Please try requesting a new confirmation email.'
  return NextResponse.redirect(errorUrl)
}
