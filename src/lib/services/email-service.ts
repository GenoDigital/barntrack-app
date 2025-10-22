/**
 * Email Service
 *
 * Handles sending custom transactional emails via Supabase Edge Functions
 * For auth emails (signup, password reset), Supabase handles those automatically
 */

import { createClient } from '@/lib/supabase/server'

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
  const signupLink = `${APP_URL}/signup?member=true&email=${encodeURIComponent(params.to)}`

  try {
    const supabase = await createClient()

    const requestBody = {
      email: params.to,
      recipientName: params.recipientName,
      inviterName: params.inviterName,
      farmName: params.farmName,
      invitationCode: params.invitationToken, // Send as code, not link parameter
      signupLink, // Separate signup link without code
    }

    console.log('Invoking Edge Function with body:', JSON.stringify(requestBody))

    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: requestBody,
    })

    if (error) {
      console.error('Edge Function error:', error)
      return { success: false, error }
    }

    console.log('Edge Function response:', data)
    return { success: true, messageId: data?.emailId }
  } catch (error) {
    console.error('Exception in sendInvitationEmail:', error)
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
    const supabase = await createClient()

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
    const supabase = await createClient()

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
    const supabase = await createClient()

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
