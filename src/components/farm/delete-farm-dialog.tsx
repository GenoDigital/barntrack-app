'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
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
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteFarmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId: string
  farmName: string
  onSuccess?: () => void
}

export function DeleteFarmDialog({ 
  open, 
  onOpenChange, 
  farmId, 
  farmName,
  onSuccess 
}: DeleteFarmDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const { setCurrentFarm, farms, loadFarms } = useFarmStore()
  const supabase = createClient()

  const isConfirmValid = confirmText === farmName

  const handleDelete = async () => {
    if (!isConfirmValid) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('delete_farm', {
        farm_uuid: farmId
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Betrieb erfolgreich gelöscht')
        
        // Switch to another farm or clear current farm
        const remainingFarms = farms.filter(f => f.id !== farmId)
        if (remainingFarms.length > 0) {
          setCurrentFarm(remainingFarms[0])
        } else {
          setCurrentFarm(null)
        }
        
        // Reload farms list
        await loadFarms()
        
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data?.error || 'Fehler beim Löschen des Betriebs')
      }
    } catch (error) {
      console.error('Error deleting farm:', error)
      toast.error('Fehler beim Löschen des Betriebs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Betrieb löschen
          </DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Der Betrieb
            und alle zugehörigen Daten werden permanent gelöscht, einschließlich
            Bereiche, Futtermitteltypen, Verbrauchsdaten und Tierbestände.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Warnung:</strong> Alle mit diesem Betrieb verbundenen Daten gehen 
            permanent verloren. Dies umfasst alle Verbrauchsdaten, Berichte und 
            Analysedaten.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Geben Sie <strong>{farmName}</strong> ein, um die Löschung zu bestätigen:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={farmName}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || loading}
          >
            {loading ? 'Wird gelöscht...' : 'Betrieb löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}