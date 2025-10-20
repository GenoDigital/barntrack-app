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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Crown } from 'lucide-react'
import Link from 'next/link'

interface CreateFarmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateFarmDialog({ open, onOpenChange, onSuccess }: CreateFarmDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canCreate, setCanCreate] = useState<boolean | null>(null)
  const { subscription, getPlanLimits, canCreateFarm } = useSubscription()
  const supabase = createClient()

  // Check if user can create farm when dialog opens
  React.useEffect(() => {
    if (open) {
      canCreateFarm().then(setCanCreate)
    }
  }, [open, canCreateFarm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check if user can create farm
    const canCreate = await canCreateFarm()
    if (!canCreate) {
      setError('Sie haben das Maximum an Ställen für Ihren Plan erreicht')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Nicht angemeldet')
      setLoading(false)
      return
    }

    try {
      // Create the farm (farm_members record is created automatically by database trigger)
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single()

      if (farmError) {
        setError(farmError.message)
        setLoading(false)
        return
      }

      setName('')
      setDescription('')
      onSuccess()
    } catch (err) {
      setError('Fehler beim Erstellen des Stalls')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuen Stall erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Stall zur Verwaltung Ihrer Futterdaten
            </DialogDescription>
          </DialogHeader>
          
          {canCreate === false && (
            <Alert className="mb-4">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Sie haben das Maximum an Ställen für Ihren Plan erreicht ({getPlanLimits()?.maxFarms} Ställe). 
                <Link href="/pricing" className="underline ml-1">
                  Upgraden Sie Ihren Plan
                </Link>, um mehr Ställe zu erstellen.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Hauptstall"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zusätzliche Informationen zum Stall"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
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
            <Button type="submit" disabled={loading || canCreate === false}>
              {loading ? 'Erstellt...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}