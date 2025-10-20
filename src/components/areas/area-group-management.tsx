'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Users, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Area {
  id: string
  name: string
  description: string | null
}

interface AreaGroup {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
  area_count?: number
}

interface AreaGroupMembership {
  area_id: string
  area_group_id: string
  area: Area
}

export function AreaGroupManagement() {
  const [areaGroups, setAreaGroups] = useState<AreaGroup[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [memberships, setMemberships] = useState<AreaGroupMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AreaGroup | null>(null)
  const [showMembershipDialog, setShowMembershipDialog] = useState(false)
  const [selectedGroupForMembership, setSelectedGroupForMembership] = useState<AreaGroup | null>(null)
  const [areaGroupAssignments, setAreaGroupAssignments] = useState<{[areaId: string]: string}>({}) // areaId -> groupId
  const [pendingAssignments, setPendingAssignments] = useState<{[areaId: string]: string | null}>({}) // Changes to save
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    if (currentFarmId) {
      loadData()
    }
  }, [currentFarmId])

  const loadData = async () => {
    if (!currentFarmId) return

    setLoading(true)
    try {
      // Load area groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('area_groups')
        .select('*')
        .eq('farm_id', currentFarmId)
        .order('name')

      if (groupsError) throw groupsError

      // Load areas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name, description')
        .eq('farm_id', currentFarmId)
        .order('name')

      if (areasError) throw areasError

      // Load memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('area_group_memberships')
        .select(`
          area_id,
          area_group_id,
          area:areas(id, name, description)
        `)
        .in('area_group_id', (groupsData || []).map(g => g.id))

      if (membershipsError) throw membershipsError

      // Calculate area counts for each group
      const groupsWithCounts = (groupsData || []).map(group => ({
        ...group,
        area_count: (membershipsData || []).filter(m => m.area_group_id === group.id).length
      }))

      setAreaGroups(groupsWithCounts)
      setAreas(areasData || [])
      setMemberships(membershipsData || [])

      // Build area assignments mapping (areaId -> groupId)
      const assignments: {[areaId: string]: string} = {}
      membershipsData?.forEach(membership => {
        assignments[membership.area_id] = membership.area_group_id
      })
      setAreaGroupAssignments(assignments)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Bereichsgruppen')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFarmId) return

    try {
      const { data, error } = await supabase
        .from('area_groups')
        .insert({
          farm_id: currentFarmId,
          name: formData.name,
          description: formData.description || null,
          color: formData.color
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Bereichsgruppe erfolgreich erstellt')
      setFormData({ name: '', description: '', color: '#3B82F6' })
      setShowCreateDialog(false)
      loadData()
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Fehler beim Erstellen der Bereichsgruppe')
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    try {
      const { error } = await supabase
        .from('area_groups')
        .update({
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGroup.id)

      if (error) throw error

      toast.success('Bereichsgruppe erfolgreich aktualisiert')
      setShowEditDialog(false)
      setEditingGroup(null)
      setFormData({ name: '', description: '', color: '#3B82F6' })
      loadData()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Fehler beim Aktualisieren der Bereichsgruppe')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Bereichsgruppe löschen möchten?')) return

    try {
      const { error } = await supabase
        .from('area_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      toast.success('Bereichsgruppe erfolgreich gelöscht')
      loadData()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Fehler beim Löschen der Bereichsgruppe')
    }
  }

  const openEditDialog = (group: AreaGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color
    })
    setShowEditDialog(true)
  }

  const openMembershipDialog = (group: AreaGroup) => {
    setSelectedGroupForMembership(group)
    setPendingAssignments({}) // Clear any pending changes
    setShowMembershipDialog(true)
  }

  const handleAreaGroupAssignmentChange = (areaId: string, newGroupId: string | null) => {
    // Store the pending change locally
    setPendingAssignments(prev => ({
      ...prev,
      [areaId]: newGroupId
    }))
  }

  const getCurrentAssignment = (areaId: string): string | null => {
    // Return pending assignment if exists, otherwise return current assignment
    if (areaId in pendingAssignments) {
      return pendingAssignments[areaId]
    }
    return areaGroupAssignments[areaId] || null
  }

  const hasPendingChanges = () => {
    return Object.keys(pendingAssignments).length > 0
  }

  const saveAssignments = async () => {
    if (!hasPendingChanges()) return

    try {
      setLoading(true)

      // Process each pending assignment
      for (const [areaId, newGroupId] of Object.entries(pendingAssignments)) {
        // If newGroupId is null, remove area from any group
        if (newGroupId === null) {
          const { error } = await supabase
            .from('area_group_memberships')
            .delete()
            .eq('area_id', areaId)

          if (error) throw error
        } else {
          // First, remove area from any existing group (due to unique constraint)
          await supabase
            .from('area_group_memberships')
            .delete()
            .eq('area_id', areaId)

          // Then add to new group
          const { error } = await supabase
            .from('area_group_memberships')
            .insert({
              area_group_id: newGroupId,
              area_id: areaId
            })

          if (error) throw error
        }
      }

      toast.success('Bereichszuordnungen erfolgreich gespeichert')
      setPendingAssignments({}) // Clear pending changes
      loadData() // Refresh to update counts and current assignments
    } catch (error) {
      console.error('Error saving assignments:', error)
      toast.error('Fehler beim Speichern der Bereichszuordnungen')
    } finally {
      setLoading(false)
    }
  }

  const cancelAssignments = () => {
    setPendingAssignments({})
  }

  const getGroupAreas = (groupId: string) => {
    return memberships
      .filter(m => m.area_group_id === groupId)
      .map(m => m.area)
  }

  if (loading) {
    return <div>Lade Bereichsgruppen...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bereichsgruppen</h2>
          <p className="text-muted-foreground">
            Gruppieren Sie Stallbereiche für erweiterte Auswertungen
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setPendingAssignments({}) // Clear any pending changes
              setShowMembershipDialog(true)
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            Zuordnungen verwalten
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Gruppe erstellen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areaGroups.map((group) => (
          <Card key={group.id} className="relative">
            <div 
              className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
              style={{ backgroundColor: group.color }}
            />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMembershipDialog(group)}
                    title="Bereichszuordnungen verwalten"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(group)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {group.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {group.area_count} Bereiche
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {getGroupAreas(group.id).slice(0, 3).map((area) => (
                    <Badge key={area.id} variant="secondary" className="text-xs">
                      {area.name}
                    </Badge>
                  ))}
                  {getGroupAreas(group.id).length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{getGroupAreas(group.id).length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {areaGroups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Bereichsgruppen vorhanden</h3>
            <p className="text-muted-foreground text-center mb-4">
              Erstellen Sie Ihre erste Bereichsgruppe, um Stallbereiche zu organisieren und erweiterte Auswertungen zu ermöglichen.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Gruppe erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <form onSubmit={handleCreateGroup}>
            <DialogHeader>
              <DialogTitle>Bereichsgruppe erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Gruppe zur Organisation Ihrer Stallbereiche.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Mastbereiche, Aufzuchtbereiche"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionale Beschreibung der Gruppe"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Farbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit">Erstellen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <form onSubmit={handleUpdateGroup}>
            <DialogHeader>
              <DialogTitle>Bereichsgruppe bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie die Eigenschaften der Bereichsgruppe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschreibung</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Farbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit">Aktualisieren</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Area Management Dialog - Shows all areas with their current group assignments */}
      <Dialog open={showMembershipDialog} onOpenChange={setShowMembershipDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Bereichszuordnungen verwalten
            </DialogTitle>
            <DialogDescription>
              Verwalten Sie die Zuordnung aller Stallbereiche zu Gruppen. Jeder Bereich kann nur einer Gruppe zugeordnet werden.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {areas.map((area) => {
                const currentAssignment = getCurrentAssignment(area.id)
                const currentGroup = currentAssignment ? areaGroups.find(g => g.id === currentAssignment) : null
                const originalGroupId = areaGroupAssignments[area.id]
                const originalGroup = originalGroupId ? areaGroups.find(g => g.id === originalGroupId) : null
                const hasChanged = area.id in pendingAssignments
                
                return (
                  <div key={area.id} className={`p-3 border rounded-lg ${hasChanged ? 'border-blue-300 bg-blue-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{area.name}</div>
                          {hasChanged && (
                            <Badge variant="outline" className="text-xs">
                              Geändert
                            </Badge>
                          )}
                        </div>
                        {area.description && (
                          <div className="text-sm text-muted-foreground">
                            {area.description}
                          </div>
                        )}
                        {originalGroup && !hasChanged && (
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: originalGroup.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              Aktuell: {originalGroup.name}
                            </span>
                          </div>
                        )}
                        {hasChanged && (
                          <div className="mt-1 space-y-1">
                            {originalGroup && (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full opacity-50"
                                  style={{ backgroundColor: originalGroup.color }}
                                />
                                <span className="text-sm text-muted-foreground line-through">
                                  Vorher: {originalGroup.name}
                                </span>
                              </div>
                            )}
                            {currentGroup ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: currentGroup.color }}
                                />
                                <span className="text-sm text-blue-600">
                                  Neu: {currentGroup.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-blue-600">
                                Neu: Keine Gruppe
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Select
                          value={currentAssignment || "none"}
                          onValueChange={(value) => {
                            const newGroupId = value === "none" ? null : value
                            handleAreaGroupAssignmentChange(area.id, newGroupId)
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Gruppe wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Keine Gruppe</span>
                            </SelectItem>
                            {areaGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                  {group.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {hasPendingChanges() && (
            <div className="p-4 bg-muted rounded-lg mb-4">
              <div className="text-sm font-medium text-center">
                {Object.keys(pendingAssignments).length} ungespeicherte Änderung(en)
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (hasPendingChanges()) {
                  cancelAssignments()
                }
                setShowMembershipDialog(false)
              }}
            >
              {hasPendingChanges() ? 'Verwerfen' : 'Schließen'}
            </Button>
            {hasPendingChanges() && (
              <Button 
                onClick={saveAssignments}
                disabled={loading}
              >
                {loading ? 'Speichert...' : 'Änderungen speichern'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}