'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, Trash2, DollarSign, Tag } from 'lucide-react'
import { toast } from 'sonner'

type CostType = {
  id: string
  farm_id: string
  created_by: string
  name: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CostTypesPage() {
  const [costTypes, setCostTypes] = useState<CostType[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCostType, setEditingCostType] = useState<CostType | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (currentFarmId) {
      loadCostTypes()
    }
  }, [currentFarmId])

  const loadCostTypes = async () => {
    const { data, error } = await supabase
      .from('cost_types')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setCostTypes(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Kostentyp-Name ist erforderlich')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Nicht authentifiziert')
        return
      }

      if (!currentFarmId) {
        toast.error('Kein Stall ausgewählt')
        return
      }

      const costTypeData = {
        name: name.trim(),
        description: description || null,
        category: category || null,
        is_active: isActive,
      }

      if (editingCostType) {
        // Update existing cost type
        const { error } = await supabase
          .from('cost_types')
          .update(costTypeData)
          .eq('id', editingCostType.id)

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        toast.success('Kostentyp erfolgreich aktualisiert!')
      } else {
        // Create new cost type
        const newCostTypeData = {
          ...costTypeData,
          farm_id: currentFarmId!,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('cost_types')
          .insert(newCostTypeData)

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }
        toast.success('Kostentyp erfolgreich erstellt!')
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingCostType(null)
      loadCostTypes()
    } catch (error) {
      console.error('Error saving cost type:', error)

      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error('Fehler beim Speichern des Kostentyps')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (costType: CostType) => {
    if (!confirm(`Möchten Sie "${costType.name}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cost_types')
        .delete()
        .eq('id', costType.id)

      if (error) throw error
      toast.success('Kostentyp erfolgreich gelöscht!')
      loadCostTypes()
    } catch (error) {
      console.error('Error deleting cost type:', error)
      toast.error('Fehler beim Löschen des Kostentyps')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setCategory('')
    setIsActive(true)
  }

  const handleEdit = (costType: CostType) => {
    setEditingCostType(costType)
    setName(costType.name)
    setDescription(costType.description || '')
    setCategory(costType.category || '')
    setIsActive(costType.is_active || true)
    setShowCreateDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kostenarten</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kostenarten für zusätzliche Kosten
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setEditingCostType(null)
            setShowCreateDialog(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Neue Kostenart
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Kostenarten
            </CardTitle>
            <CardDescription>
              Übersicht aller Ihrer definierten Kostenarten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costTypes.map((costType) => (
                  <TableRow key={costType.id}>
                    <TableCell className="font-medium">{costType.name}</TableCell>
                    <TableCell>
                      {costType.category ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Tag className="h-3 w-3" />
                          {costType.category}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {costType.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={costType.is_active ? "default" : "secondary"}>
                        {costType.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(costType)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(costType)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {costTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Noch keine Kostenarten angelegt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCostType ? 'Kostenart bearbeiten' : 'Neue Kostenart anlegen'}
              </DialogTitle>
              <DialogDescription>
                Definieren Sie eine Kostenart für zusätzliche Kosten
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Tierarzt, Energie, Personal"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="z.B. Tierarzt, Energie, Personal, Reparaturen"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung der Kostenart..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <Label htmlFor="isActive">Aktive Kostenart</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingCostType(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Wird gespeichert...' : editingCostType ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
