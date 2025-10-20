/**
 * API Route: Test Email Service
 *
 * POST /api/email/test
 *
 * Sends a test email to verify email integration is working correctly via Edge Functions
 * This is useful for testing the email service configuration during setup
 */

import { createClient } from '@/lib/supabase/server'
import { sendTestEmail } from '@/lib/services/email-service'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { to } = body

    // If no email provided, use the current user's email
    const testEmail = to || user.email

    if (!testEmail) {
      return NextResponse.json(
        { error: 'No email address provided' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Send test email via Edge Function
    console.log(`Sending test email to: ${testEmail}`)
    const result = await sendTestEmail(testEmail)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        details: {
          recipient: testEmail,
          timestamp: new Date().toISOString(),
          messageId: result.result?.emailId,
        },
      })
    } else {
      console.error('Failed to send test email:', result.error)
      return NextResponse.json(
        {
          error: 'Failed to send test email',
          details: result.error instanceof Error ? result.error.message : String(result.error),
          troubleshooting: [
            'Check that RESEND_API_KEY is configured in Edge Function secrets',
            'Verify your domain is verified in Resend dashboard',
            'Check Supabase Edge Function logs for more details',
          ],
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in test email API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check email service status
 * Useful for health checks and debugging
 */
export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'not set'

    return NextResponse.json({
      status: 'configured',
      details: {
        email_service: 'Supabase Edge Functions',
        api_key_location: 'Edge Function Secrets (RESEND_API_KEY)',
        app_url: appUrl,
        from_addresses: {
          noreply: 'noreply@barntrack.app',
          support: 'support@barntrack.app',
          notifications: 'notifications@barntrack.app',
          hello: 'hello@barntrack.app',
        },
        edge_functions: {
          invitation: 'send-invitation-email',
          welcome: 'send-welcome-email',
          notification: 'send-notification-email',
          test: 'send-test-email',
        },
      },
      message: 'Email service is configured via Supabase Edge Functions',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
