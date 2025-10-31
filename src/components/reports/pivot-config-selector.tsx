'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Star, Trash2, ChevronDown, FileText } from 'lucide-react'
import { SavedPivotConfig, deletePivotConfig } from '@/lib/services/pivot-config-service'
import { toast } from 'sonner'
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

interface PivotConfigSelectorProps {
  configs: SavedPivotConfig[]
  onSelect: (config: SavedPivotConfig) => void
  onDeleted: () => void
}

export function PivotConfigSelector({ configs, onSelect, onDeleted }: PivotConfigSelectorProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<SavedPivotConfig | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!configToDelete) return

    setDeleting(true)
    try {
      await deletePivotConfig(configToDelete.id)
      toast.success('Konfiguration gelöscht')
      onDeleted()
      setDeleteConfirmOpen(false)
      setConfigToDelete(null)
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Fehler beim Löschen der Konfiguration')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, config: SavedPivotConfig) => {
    e.stopPropagation()
    setConfigToDelete(config)
    setDeleteConfirmOpen(true)
  }

  if (configs.length === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Gespeicherte Konfigurationen
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Gespeicherte Konfigurationen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Keine gespeicherten Konfigurationen vorhanden
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Gespeicherte Konfigurationen ({configs.length})
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Gespeicherte Konfigurationen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-96 overflow-y-auto">
            {configs.map((config) => (
              <DropdownMenuItem
                key={config.id}
                className="flex items-start justify-between gap-2 cursor-pointer py-3"
                onClick={() => onSelect(config)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {config.is_favorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{config.name}</span>
                  </div>
                  {config.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {config.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(config.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={(e) => handleDeleteClick(e, config)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfiguration löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Konfiguration &quot;{configToDelete?.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Löschen...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
