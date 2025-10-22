/**
 * API Route: Send Farm Invitation
 *
 * POST /api/invitations/send
 *
 * Creates an invitation record in the database and sends an invitation email
 */

import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/services/email-service'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  const supabase = await createClient()

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
    const { email, farmId, role, recipientName } = await request.json()

    // Validate required fields
    if (!email || !farmId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, farmId, role' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'editor', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if user has permission to invite to this farm
    const { data: membership, error: membershipError } = await supabase
      .from('farm_members')
      .select('role')
      .eq('farm_id', farmId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this farm' },
        { status: 403 }
      )
    }

    // Only owners and admins can invite users
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only farm owners and admins can invite users' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('farm_members')
      .select('id')
      .eq('farm_id', farmId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this farm' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, expires_at')
      .eq('email', email)
      .eq('farm_id', farmId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation for this email already exists and is still valid' },
        { status: 400 }
      )
    }

    // Get farm details for the invitation email
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('name')
      .eq('id', farmId)
      .single()

    if (farmError || !farm) {
      return NextResponse.json(
        { error: 'Farm not found' },
        { status: 404 }
      )
    }

    // Generate invitation token
    const token = crypto.randomUUID()

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation in database
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        farm_id: farmId,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Failed to create invitation:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Get inviter name
    const inviterName =
      user.user_metadata?.display_name ||
      user.user_metadata?.first_name ||
      user.email?.split('@')[0] ||
      'Ein barntrack-Nutzer'

    // Send invitation email
    console.log('Sending invitation email with params:', {
      to: email,
      recipientName: recipientName || email.split('@')[0],
      inviterName,
      farmName: farm.name,
      invitationToken: token,
    })

    const emailResult = await sendInvitationEmail({
      to: email,
      recipientName: recipientName || email.split('@')[0],
      inviterName,
      farmName: farm.name,
      invitationToken: token,
    })

    if (!emailResult.success) {
      // Log email error but don't fail the request
      // The invitation is created, user can manually share the link
      console.error('Failed to send invitation email:', emailResult.error)
      console.error('Email result:', JSON.stringify(emailResult))
    } else {
      console.log('Email sent successfully:', emailResult)
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        email_sent: emailResult.success,
      },
    })
  } catch (error) {
    console.error('Error in send invitation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
