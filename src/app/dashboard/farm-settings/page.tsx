'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RoleManagement } from '@/components/farm/role-management'
import { DeleteFarmDialog } from '@/components/farm/delete-farm-dialog'
import { InviteUserDialog } from '@/components/admin/invite-user-dialog'
import { SupplierManagement } from '@/components/farm/supplier-management'
import { PendingInvitationsTable } from '@/components/farm/pending-invitations-table'
import { Settings, Users, Trash2, UserPlus, Info, Building } from 'lucide-react'
import { toast } from 'sonner'

interface Farm {
  id: string
  name: string
  description: string | null
  stall_location: string | null
  stall_size: number | null
  stall_type: string | null
  max_animals: number | null
  contact_person_name: string | null
  contact_person_phone: string | null
  notes: string | null
}

export default function FarmSettingsPage() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { currentFarmId } = useFarmStore()
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (currentFarmId && user) {
      loadFarm()
      loadCurrentUserRole()
    }
  }, [currentFarmId, user])

  const loadFarm = async () => {
    if (!currentFarmId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', currentFarmId)
        .single()

      if (error) throw error
      setFarm(data)
    } catch (error) {
      console.error('Error loading farm:', error)
      toast.error('Failed to load farm details')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUserRole = async () => {
    if (!currentFarmId || !user) return

    try {
      const { data, error } = await supabase.rpc('get_user_farm_role', {
        farm_uuid: currentFarmId,
        user_uuid: user.id
      })

      if (error) throw error
      setCurrentUserRole(data)
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin' || currentUserRole === 'editor'
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin'
  const canDelete = currentUserRole === 'owner'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farm || !currentFarmId || !canEdit) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('farms')
        .update({
          name: farm.name,
          description: farm.description,
          stall_location: farm.stall_location,
          stall_size: farm.stall_size,
          stall_type: farm.stall_type,
          max_animals: farm.max_animals,
          contact_person_name: farm.contact_person_name,
          contact_person_phone: farm.contact_person_phone,
          notes: farm.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentFarmId)

      if (error) throw error
      toast.success('Farm settings saved successfully')
    } catch (error) {
      console.error('Error saving farm:', error)
      toast.error('Failed to save farm settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading farm settings...</div>
  }

  if (!farm) {
    return <div>Farm not found</div>
  }

  if (!canEdit && !canManageUsers) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access farm settings. Contact a farm owner or admin for access.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Betriebseinstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Betriebsdetails, Mitglieder und Berechtigungen
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Allgemein
          </TabsTrigger>
          {canEdit && (
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Lieferanten
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mitglieder & Rollen
            </TabsTrigger>
          )}
          {canDelete && (
            <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Gefahrenbereich
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Betriebsinformationen</CardTitle>
              <CardDescription>
                Grundlegende Informationen über Ihren Betrieb und Ihre Anlagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Farm Name</Label>
                    <Input
                      id="name"
                      value={farm.name}
                      onChange={(e) => setFarm({ ...farm, name: e.target.value })}
                      required
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stallLocation">Stall Location</Label>
                    <Input
                      id="stallLocation"
                      value={farm.stall_location || ''}
                      onChange={(e) => setFarm({ ...farm, stall_location: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stallSize">Stall Size (m²)</Label>
                    <Input
                      id="stallSize"
                      type="number"
                      step="0.1"
                      value={farm.stall_size || ''}
                      onChange={(e) => setFarm({ ...farm, stall_size: e.target.value ? parseFloat(e.target.value) : null })}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stallType">Stall Type</Label>
                    <Input
                      id="stallType"
                      value={farm.stall_type || ''}
                      onChange={(e) => setFarm({ ...farm, stall_type: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxAnimals">Max Animals</Label>
                    <Input
                      id="maxAnimals"
                      type="number"
                      value={farm.max_animals || ''}
                      onChange={(e) => setFarm({ ...farm, max_animals: e.target.value ? parseInt(e.target.value) : null })}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Person</Label>
                    <Input
                      id="contactName"
                      value={farm.contact_person_name || ''}
                      onChange={(e) => setFarm({ ...farm, contact_person_name: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={farm.contact_person_phone || ''}
                      onChange={(e) => setFarm({ ...farm, contact_person_phone: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={farm.description || ''}
                    onChange={(e) => setFarm({ ...farm, description: e.target.value })}
                    disabled={!canEdit}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={farm.notes || ''}
                    onChange={(e) => setFarm({ ...farm, notes: e.target.value })}
                    disabled={!canEdit}
                    rows={3}
                  />
                </div>
                
                {canEdit && (
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {canEdit && (
          <TabsContent value="suppliers">
            <SupplierManagement />
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mitglieder</CardTitle>
                    <CardDescription>
                      Aktive Mitglieder mit Zugriff auf diesen Betrieb
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Benutzer einladen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RoleManagement key={refreshKey} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ausstehende Einladungen</CardTitle>
                <CardDescription>
                  Einladungen, die noch nicht angenommen wurden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingInvitationsTable
                  key={refreshKey}
                  onRefresh={() => setRefreshKey(prev => prev + 1)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canDelete && (
          <TabsContent value="danger">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your farm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Delete Farm:</strong> Once you delete a farm, there is no going back. 
                      All data including consumption records, livestock counts, and reports will be 
                      permanently deleted.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Farm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <DeleteFarmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        farmId={farm.id}
        farmName={farm.name}
      />
      
      {canManageUsers && (
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onSuccess={() => {
            // Refresh role management component
            setRefreshKey(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}