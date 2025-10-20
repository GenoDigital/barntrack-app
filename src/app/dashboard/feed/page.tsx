'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, Package, Trash2 } from 'lucide-react'
import { Tables } from '@/lib/database.types'

type FeedType = Tables<'feed_types'>

export default function FeedPage() {
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFeedType, setEditingFeedType] = useState<FeedType | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [normalizedName, setNormalizedName] = useState('')
  const [unit, setUnit] = useState('kg')

  useEffect(() => {
    if (currentFarmId) {
      loadFeedTypes()
    }
  }, [currentFarmId])

  const loadFeedTypes = async () => {
    const { data, error } = await supabase
      .from('feed_types')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setFeedTypes(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingFeedType) {
        // Update existing feed type
        const { error } = await supabase
          .from('feed_types')
          .update({
            name,
            normalized_name: normalizedName || null,
            unit,
          })
          .eq('id', editingFeedType.id)

        if (error) throw error
      } else {
        // Create new feed type
        const { error } = await supabase
          .from('feed_types')
          .insert({
            farm_id: currentFarmId!,
            name,
            normalized_name: normalizedName || null,
            unit,
          })

        if (error) throw error
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingFeedType(null)
      loadFeedTypes()
    } catch (error) {
      console.error('Error saving feed type:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (feedType: FeedType) => {
    if (!confirm(`Möchten Sie das Futtermittel "${feedType.name}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('feed_types')
        .delete()
        .eq('id', feedType.id)

      if (error) throw error
      loadFeedTypes()
    } catch (error) {
      console.error('Error deleting feed type:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setNormalizedName('')
    setUnit('kg')
  }

  const handleEdit = (feedType: FeedType) => {
    setEditingFeedType(feedType)
    setName(feedType.name)
    setNormalizedName(feedType.normalized_name || '')
    setUnit(feedType.unit || 'kg')
    setShowCreateDialog(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Futtermittel</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Futtermittel und deren Eigenschaften
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm()
            setEditingFeedType(null)
            setShowCreateDialog(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Neues Futtermittel
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Futtermittel-Typen
            </CardTitle>
            <CardDescription>
              Übersicht aller verfügbaren Futtermittel in Ihrem Stall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Normalisierter Name</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Zuletzt geändert</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedTypes.map((feedType) => (
                  <TableRow key={feedType.id}>
                    <TableCell className="font-medium">{feedType.name}</TableCell>
                    <TableCell>
                      {feedType.normalized_name ? (
                        <Badge variant="secondary">{feedType.normalized_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic">Nicht gesetzt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{feedType.unit || 'kg'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(feedType.created_at)}</TableCell>
                    <TableCell>{formatDate(feedType.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(feedType)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(feedType)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {feedTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Noch keine Futtermittel angelegt. Diese werden automatisch beim CSV-Import erstellt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingFeedType ? 'Futtermittel bearbeiten' : 'Neues Futtermittel anlegen'}
              </DialogTitle>
              <DialogDescription>
                Erstellen oder bearbeiten Sie ein Futtermittel für Ihren Stall
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Milchleistungsfutter, Grundfutter"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="normalizedName">Normalisierter Name (optional)</Label>
                <Input
                  id="normalizedName"
                  value={normalizedName}
                  onChange={(e) => setNormalizedName(e.target.value)}
                  placeholder="z.B. MLF, GF für bessere Zuordnung"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Einheit</Label>
                <Select value={unit} onValueChange={setUnit} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramm (kg)</SelectItem>
                    <SelectItem value="t">Tonnen (t)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="m³">Kubikmeter (m³)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingFeedType(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Wird gespeichert...' : editingFeedType ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}