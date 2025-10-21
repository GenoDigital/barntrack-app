import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Authentication Middleware
 *
 * This middleware checks database directly for farm membership and subscription status
 * instead of relying on JWT claims. This approach:
 * - Always reflects current database state (no stale tokens)
 * - Doesn't require auth hook configuration
 * - Works identically in development and production
 * - Is secured by Supabase RLS policies
 *
 * Performance: Simple indexed queries (~5ms), cached by Next.js per request
 * See: PRODUCTION_SETUP.md for details
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard, onboarding, checkout, and accept-invitation routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/onboarding') ||
      request.nextUrl.pathname.startsWith('/checkout') ||
      request.nextUrl.pathname.startsWith('/accept-invitation')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow accept-invitation page without additional checks (it handles its own logic)
    if (request.nextUrl.pathname.startsWith('/accept-invitation')) {
      return response
    }

    // Check database directly for farm membership and subscription status
    // This is more reliable than JWT claims which can become stale
    // Note: Supabase RLS policies ensure users can only see their own data
    const { data: farmData } = await supabase
      .from('farm_members')
      .select('farm_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const hasFarm = !!farmData

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single()

    const hasSubscription = !!subData

    // Redirect logic based on subscription and farm status
    // Invited users (have farm but no subscription) can access dashboard
    if (!hasSubscription && !hasFarm) {
      // No subscription and no farm - redirect to onboarding
      if (!request.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } else if (hasSubscription && !hasFarm) {
      // Has subscription but no farm - redirect to setup
      if (!request.nextUrl.pathname.startsWith('/dashboard/setup')) {
        return NextResponse.redirect(new URL('/dashboard/setup', request.url))
      }
    } else if (hasFarm) {
      // Has farm (with or without subscription - invited users don't need subscription)
      // Redirect away from setup/onboarding to dashboard
      if (request.nextUrl.pathname.startsWith('/dashboard/setup') ||
          request.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    // Check database directly for farm membership and subscription status
    // This is more reliable than JWT claims which can become stale
    // Note: Supabase RLS policies ensure users can only see their own data
    const { data: farmData } = await supabase
      .from('farm_members')
      .select('farm_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const hasFarm = !!farmData

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single()

    const hasSubscription = !!subData

    // Invited users (have farm but no subscription) go to dashboard
    if (hasFarm) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else if (!hasSubscription) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    } else {
      // Has subscription but no farm
      return NextResponse.redirect(new URL('/dashboard/setup', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}