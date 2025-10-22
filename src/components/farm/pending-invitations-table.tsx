'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Mail, X, Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Invitation {
  id: string
  email: string
  token: string
  created_at: string
  expires_at: string
  used_at: string | null
  inviter_name: string | null
  inviter_email: string | null
}

interface PendingInvitationsTableProps {
  onRefresh?: () => void
}

export function PendingInvitationsTable({ onRefresh }: PendingInvitationsTableProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  useEffect(() => {
    if (currentFarmId) {
      loadInvitations()
    }
  }, [currentFarmId])

  const loadInvitations = async () => {
    if (!currentFarmId) return

    setLoading(true)
    try {
      // Fetch invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('id, email, token, created_at, expires_at, used_at, invited_by')
        .eq('farm_id', currentFarmId)
        .is('used_at', null)
        .order('created_at', { ascending: false })

      if (invitationsError) throw invitationsError

      // Get unique inviter IDs
      const inviterIds = [...new Set(
        (invitationsData || [])
          .map(inv => inv.invited_by)
          .filter(id => id !== null)
      )]

      // Fetch inviter details if there are any
      let invitersMap: Record<string, { display_name: string | null; email: string | null }> = {}
      if (inviterIds.length > 0) {
        const { data: invitersData, error: invitersError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', inviterIds)

        if (!invitersError && invitersData) {
          invitersMap = invitersData.reduce((acc, user) => ({
            ...acc,
            [user.id]: { display_name: user.display_name, email: user.email }
          }), {})
        }
      }

      // Transform the data
      const transformedData = (invitationsData || []).map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        used_at: inv.used_at,
        inviter_name: inv.invited_by ? invitersMap[inv.invited_by]?.display_name || null : null,
        inviter_email: inv.invited_by ? invitersMap[inv.invited_by]?.email || null : null,
      }))

      setInvitations(transformedData)
    } catch {
      toast.error('Fehler beim Laden der Einladungen')
    } finally {
      setLoading(false)
    }
  }

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.used_at) {
      return { label: 'Verwendet', variant: 'secondary' as const }
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (expiresAt < now) {
      return { label: 'Abgelaufen', variant: 'destructive' as const }
    }

    return { label: 'Ausstehend', variant: 'default' as const }
  }

  const copyInvitationLink = async (invitation: Invitation) => {
    // Copy the invitation code, not a link
    // Users will receive the code via email and enter it on the redeem page
    try {
      await navigator.clipboard.writeText(invitation.token)
      toast.success('Einladungscode kopiert')
    } catch {
      toast.error('Fehler beim Kopieren des Codes')
    }
  }

  const resendInvitation = async (invitation: Invitation) => {
    setActionLoading(invitation.id)

    try {
      // Get inviter info
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')

      const { data: userData } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', user.id)
        .single()

      const { data: farmData } = await supabase
        .from('farms')
        .select('name')
        .eq('id', currentFarmId)
        .single()

      // Generate signup link (new format with member=true, no token in URL)
      const signupLink = `${window.location.origin}/signup?member=true&email=${encodeURIComponent(invitation.email)}`

      // Call Edge Function to resend email with correct field names
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          recipientName: invitation.email.split('@')[0],
          inviterName: userData?.display_name || userData?.email || 'Ein Benutzer',
          farmName: farmData?.name || 'Unbekannter Betrieb',
          invitationCode: invitation.token,
          signupLink: signupLink
        }
      })

      if (emailError) {
        toast.error('Fehler beim Versenden der E-Mail')
      } else {
        toast.success(`Einladung an ${invitation.email} wurde erneut versendet`)
      }
    } catch {
      toast.error('Fehler beim erneuten Versenden der Einladung')
    } finally {
      setActionLoading(null)
    }
  }

  const revokeInvitation = async () => {
    if (!selectedInvitation) return

    setActionLoading(selectedInvitation.id)

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', selectedInvitation.id)

      if (error) throw error

      toast.success(`Einladung für ${selectedInvitation.email} wurde widerrufen`)
      setRevokeDialogOpen(false)
      setSelectedInvitation(null)

      // Reload invitations
      await loadInvitations()

      // Notify parent to refresh if needed
      if (onRefresh) {
        onRefresh()
      }
    } catch {
      toast.error('Fehler beim Widerrufen der Einladung')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Keine ausstehenden Einladungen</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-Mail</TableHead>
              <TableHead>Eingeladen von</TableHead>
              <TableHead>Gesendet</TableHead>
              <TableHead>Läuft ab</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const status = getInvitationStatus(invitation)
              const isExpired = status.label === 'Abgelaufen'

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    {invitation.inviter_name || invitation.inviter_email || 'Unbekannt'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.expires_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyInvitationLink(invitation)}
                        disabled={actionLoading === invitation.id}
                        title="Einladungscode kopieren"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInvitation(invitation)}
                        disabled={actionLoading === invitation.id}
                        title="E-Mail erneut senden"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInvitation(invitation)
                          setRevokeDialogOpen(true)
                        }}
                        disabled={actionLoading === invitation.id}
                        title="Einladung widerrufen"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einladung widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Einladung für{' '}
              <strong>{selectedInvitation?.email}</strong> widerrufen möchten?
              Der Einladungslink wird ungültig und kann nicht mehr verwendet werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeInvitation}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading !== null}
            >
              {actionLoading ? 'Wird widerrufen...' : 'Widerrufen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
