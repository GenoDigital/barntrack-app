'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Star } from 'lucide-react'
import { PivotConfig } from './pivot-table-config'
import { savePivotConfig, canCreatePivotConfig } from '@/lib/services/pivot-config-service'
import { toast } from 'sonner'

interface SavePivotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: PivotConfig
  farmId: string
  maxAllowed: number
  currentCount: number
  onSaved: () => void
}

export function SavePivotDialog({
  open,
  onOpenChange,
  config,
  farmId,
  maxAllowed,
  currentCount,
  onSaved
}: SavePivotDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    setLoading(true)
    try {
      // Check if user can create more configs
      const { canCreate } = await canCreatePivotConfig(farmId, maxAllowed)

      if (!canCreate) {
        toast.error(`Limit erreicht: Sie können maximal ${maxAllowed} Pivot-Konfigurationen speichern`)
        return
      }

      await savePivotConfig(farmId, name.trim(), config, description.trim() || undefined)
      toast.success('Pivot-Konfiguration erfolgreich gespeichert!')

      // Reset form
      setName('')
      setDescription('')
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error('Error saving pivot config:', error)
      toast.error('Fehler beim Speichern der Konfiguration')
    } finally {
      setLoading(false)
    }
  }

  const remainingSlots = maxAllowed === -1 ? '∞' : maxAllowed - currentCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Als Favorit speichern
          </DialogTitle>
          <DialogDescription>
            Speichern Sie Ihre aktuelle Pivot-Konfiguration für späteren Zugriff.
            {maxAllowed !== -1 && (
              <span className="block mt-1 text-sm">
                Verfügbare Slots: <strong>{remainingSlots} von {maxAllowed}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Wöchentliche Übersicht"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie die Konfiguration..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Hinweis:</strong> Diese Konfiguration wird mit allen Mitgliedern Ihres Betriebs geteilt.
          </div>
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
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
