'use client'

import { useState } from 'react'
import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Crown } from 'lucide-react'
import { useFarmStore } from '@/lib/stores/farm-store'
import Link from 'next/link'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentUserCount, setCurrentUserCount] = useState<number>(0)
  const { subscription, getPlanLimits } = useSubscription()
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Load current user count for the farm when dialog opens
  React.useEffect(() => {
    if (open && currentFarmId) {
      loadCurrentUserCount()
    }
  }, [open, currentFarmId])

  const loadCurrentUserCount = async () => {
    if (!currentFarmId) return
    
    const { data, error } = await supabase
      .from('farm_members')
      .select('user_id')
      .eq('farm_id', currentFarmId)
    
    if (!error && data) {
      setCurrentUserCount(data.length)
    }
  }

  const canInviteUser = () => {
    if (!subscription) return false
    if (!subscription.can_invite_users) return false
    if (subscription.max_users_per_farm === -1) return true // unlimited
    return currentUserCount < subscription.max_users_per_farm
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Check if user can invite
    if (!canInviteUser()) {
      if (!subscription?.can_invite_users) {
        setError('Ihr Plan erlaubt keine Benutzereinladungen')
      } else {
        setError(`Sie haben das Maximum von ${subscription?.max_users_per_farm} Benutzern für diesen Betrieb erreicht`)
      }
      setLoading(false)
      return
    }

    try {
      // First try to invite existing user directly
      const { data: inviteData, error: inviteError } = await supabase.rpc('invite_existing_user_to_farm', {
        target_email: email,
        farm_uuid: currentFarmId,
        role_name: 'editor'
      })

      if (inviteError) throw inviteError

      if (inviteData?.success) {
        setSuccess(`Benutzer ${email} wurde erfolgreich zum Betrieb hinzugefügt!`)
        setEmail('')
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
          setSuccess(null)
        }, 2000)
        return
      }

      // If user doesn't exist, create traditional invitation and send email
      if (inviteData?.error === 'No user found with this email address') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Nicht angemeldet')
          return
        }

        // Get current farm details for the email
        const { data: farmData } = await supabase
          .from('farms')
          .select('name')
          .eq('id', currentFarmId)
          .single()

        // Get current user details for the email
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, email')
          .eq('id', user.id)
          .single()

        const { data: tokenData, error: tokenError } = await supabase
          .from('invitations')
          .insert({
            email,
            invited_by: user.id,
            farm_id: currentFarmId,
          })
          .select()
          .single()

        if (tokenError) {
          setError(tokenError.message)
        } else {
          // Send invitation email
          try {
            const { data, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
              body: {
                email,
                inviterName: userData?.display_name || userData?.email || 'Ein Benutzer',
                farmName: farmData?.name || 'Unbekannter Betrieb',
                invitationToken: tokenData.token
              }
            })

            if (emailError) {
              console.error('Error sending invitation email:', emailError)
              // Don't fail the invitation process if email fails
              setSuccess(`Einladung erstellt für ${email}. E-Mail konnte nicht versendet werden - bitte teilen Sie den Einladungslink manuell.`)
            } else {
              setSuccess(`Einladungs-E-Mail an ${email} wurde versendet!`)
            }
          } catch (emailError) {
            console.error('Error calling email function:', emailError)
            setSuccess(`Einladung erstellt für ${email}. E-Mail konnte nicht versendet werden - bitte teilen Sie den Einladungslink manuell.`)
          }

          setEmail('')
          setTimeout(() => {
            onSuccess()
            onOpenChange(false)
            setSuccess(null)
          }, 3000)
        }
      } else {
        setError(inviteData?.error || 'Fehler beim Hinzufügen des Benutzers')
      }
    } catch (err) {
      console.error('Error inviting user:', err)
      setError('Fehler beim Einladen des Benutzers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Benutzer einladen</DialogTitle>
            <DialogDescription>
              Laden Sie einen Benutzer zu diesem Betrieb ein. Wenn der Benutzer bereits registriert ist, wird er sofort hinzugefügt.
            </DialogDescription>
          </DialogHeader>
          
          {!canInviteUser() && subscription && (
            <Alert className="mb-4">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                {!subscription.can_invite_users ? (
                  <>
                    Ihr aktueller Plan erlaubt keine Benutzereinladungen. 
                    <Link href="/pricing" className="underline ml-1">
                      Upgraden Sie auf Professional oder Enterprise
                    </Link>, um Teammitglieder einzuladen.
                  </>
                ) : (
                  <>
                    Sie haben das Maximum von {getPlanLimits()?.maxUsersPerFarm} Benutzern für diesen Stall erreicht. 
                    <Link href="/pricing" className="underline ml-1">
                      Upgraden Sie Ihren Plan
                    </Link>, um mehr Benutzer einzuladen.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !canInviteUser()}>
              {loading ? 'Wird versendet...' : 'Einladung senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}