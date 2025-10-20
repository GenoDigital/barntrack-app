'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, MapPin, Trash2, FolderOpen } from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { AreaGroupManagement } from '@/components/areas/area-group-management'

type Area = Tables<'areas'>

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (currentFarmId) {
      loadAreas()
    }
  }, [currentFarmId])

  const loadAreas = async () => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setAreas(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingArea) {
        // Update existing area
        const { error } = await supabase
          .from('areas')
          .update({
            name,
            description: description || null,
          })
          .eq('id', editingArea.id)

        if (error) throw error
      } else {
        // Create new area
        const { error } = await supabase
          .from('areas')
          .insert({
            farm_id: currentFarmId!,
            name,
            description: description || null,
          })

        if (error) throw error
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingArea(null)
      loadAreas()
    } catch (error) {
      console.error('Error saving area:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (area: Area) => {
    if (!confirm(`Möchten Sie den Bereich "${area.name}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', area.id)

      if (error) throw error
      loadAreas()
    } catch (error) {
      console.error('Error deleting area:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setName(area.name)
    setDescription(area.description || '')
    setShowCreateDialog(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bereiche</h2>
        <p className="text-muted-foreground">
          Verwalten Sie die verschiedenen Bereiche Ihres Stalles und organisieren Sie diese in Gruppen
        </p>
      </div>

      <Tabs defaultValue="areas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Stallbereiche
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Bereichsgruppen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Stallbereiche</h3>
              <p className="text-muted-foreground">
                Übersicht aller Bereiche in Ihrem Stall
              </p>
            </div>
            <Button 
              onClick={() => {
                resetForm()
                setEditingArea(null)
                setShowCreateDialog(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Neuen Bereich anlegen
            </Button>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Zuletzt geändert</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>
                        {area.description || (
                          <span className="text-muted-foreground italic">Keine Beschreibung</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(area.created_at)}</TableCell>
                      <TableCell>{formatDate(area.updated_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(area)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(area)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Löschen
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {areas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Noch keine Bereiche angelegt
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <AreaGroupManagement />
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingArea ? 'Bereich bearbeiten' : 'Neuen Bereich anlegen'}
              </DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Bereich für Ihren Stall
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Stall A, Weide 1, Aufzuchtbereich"
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
                  placeholder="Zusätzliche Informationen zu diesem Bereich..."
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingArea(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Wird gespeichert...' : editingArea ? 'Aktualisieren' : 'Bereich anlegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}