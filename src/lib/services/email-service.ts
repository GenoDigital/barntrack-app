/**
 * Email Service
 *
 * Handles sending custom transactional emails via Supabase Edge Functions
 * For auth emails (signup, password reset), Supabase handles those automatically
 */

import { createClient } from '@/lib/supabase/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send invitation email to join a farm
 */
export async function sendInvitationEmail(params: {
  to: string
  recipientName: string
  inviterName: string
  farmName: string
  invitationToken: string
}) {
  const invitationLink = `${APP_URL}/signup?invitation=${params.invitationToken}&email=${encodeURIComponent(params.to)}`

  try {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        email: params.to,
        recipientName: params.recipientName,
        inviterName: params.inviterName,
        farmName: params.farmName,
        invitationLink,
      },
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, messageId: data?.emailId }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(params: {
  to: string
  recipientName: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}) {
  try {
    const supabase = createClient()

    // Build the message with action button if provided
    let fullMessage = params.message
    if (params.actionUrl) {
      fullMessage += `\n\n<div style="text-align: center; margin: 20px 0;">
        <a href="${params.actionUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          ${params.actionLabel || 'Ansehen'}
        </a>
      </div>`
    }

    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        email: params.to,
        subject: params.title,
        message: fullMessage,
        userName: params.recipientName,
      },
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, messageId: data?.emailId }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Send welcome email after user completes registration
 * This is separate from Supabase's email confirmation
 */
export async function sendWelcomeEmail(params: {
  to: string
  name: string
  farmName?: string
}) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: params.to,
        userName: params.name,
        farmName: params.farmName,
      },
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, messageId: data?.emailId }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Test function to verify email service is working
 * Call this from an API route during setup
 */
export async function sendTestEmail(to: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('send-test-email', {
      body: {
        email: to,
      },
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, result: data }
  } catch (error) {
    return { success: false, error }
  }
}
