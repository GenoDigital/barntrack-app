'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, UserX, Crown, Shield, Edit, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface FarmMember {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  user: {
    id: string
    email: string
    display_name: string | null
  }
  created_at: string
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
}

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  editor: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200',
}

const roleDescriptions = {
  owner: 'Vollzugriff, kann Betrieb löschen',
  admin: 'Kann Benutzer verwalten und alle Daten bearbeiten',
  editor: 'Kann alle Daten bearbeiten',
  viewer: 'Kann nur Daten anzeigen',
}

export function RoleManagement() {
  const [members, setMembers] = useState<FarmMember[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const { currentFarmId } = useFarmStore()
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (currentFarmId && user) {
      loadMembers()
      loadCurrentUserRole()
    }
  }, [currentFarmId, user])

  const loadMembers = async () => {
    if (!currentFarmId) {
      console.log('No currentFarmId set')
      return
    }

    console.log('Loading members for farm:', currentFarmId)
    setLoading(true)
    try {
      // Get farm members first, then fetch user details separately but efficiently
      const { data: membersData, error: membersError } = await supabase
        .from('farm_members')
        .select('id, user_id, role, created_at')
        .eq('farm_id', currentFarmId)
        .order('created_at', { ascending: true })

      console.log('Farm members data:', membersData)
      if (membersError) {
        console.error('Error fetching farm members:', membersError)
        throw membersError
      }

      if (!membersData || membersData.length === 0) {
        setMembers([])
        return
      }

      // Get all unique user IDs
      const userIds = [...new Set(membersData.map(member => member.user_id))]
      
      // Fetch all users in one query
      console.log('Fetching users with IDs:', userIds)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, display_name')
        .in('id', userIds)

      console.log('Users query result:', { usersData, usersError, userIds })
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      // Create a map for quick user lookup
      const usersMap = new Map((usersData || []).map(user => [user.id, user]))

      // Combine members with their user data
      const membersWithUsers = membersData
        .map(member => {
          const user = usersMap.get(member.user_id)
          if (!user) {
            console.warn(`User not found for member ${member.id} with user_id ${member.user_id}`)
            return null
          }
          return {
            ...member,
            user
          }
        })
        .filter(Boolean) // Remove null entries

      console.log('Final members with users:', membersWithUsers)
      setMembers(membersWithUsers)
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Fehler beim Laden der Betriebsmitglieder')
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

  const canModifyRoles = currentUserRole === 'owner' || currentUserRole === 'admin'
  const isOwner = currentUserRole === 'owner'
  const ownerCount = members.filter(m => m.role === 'owner').length
  const currentUserIsLastOwner = members.find(m => m.user_id === user?.id)?.role === 'owner' && ownerCount === 1

  const updateRole = async (targetUserId: string, newRole: string) => {
    if (!currentFarmId) return

    try {
      const { data, error } = await supabase.rpc('update_farm_member_role', {
        farm_uuid: currentFarmId,
        target_user_id: targetUserId,
        new_role: newRole
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Rolle erfolgreich aktualisiert')
        loadMembers()
      } else {
        toast.error(data?.error || 'Fehler beim Aktualisieren der Rolle')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Fehler beim Aktualisieren der Rolle')
    }
  }

  const removeMember = async (targetUserId: string) => {
    if (!currentFarmId) return

    try {
      const { data, error } = await supabase.rpc('remove_farm_member', {
        farm_uuid: currentFarmId,
        target_user_id: targetUserId
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Benutzer vom Betrieb entfernt')
        loadMembers()
      } else {
        toast.error(data?.error || 'Fehler beim Entfernen des Benutzers')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Fehler beim Entfernen des Benutzers')
    }
  }

  if (loading) {
    return <div>Lade Betriebsmitglieder...</div>
  }

  if (!canModifyRoles) {
    return (
      <Alert>
        <AlertDescription>
          Sie haben keine Berechtigung, Rollen in diesem Betrieb zu verwalten.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Betriebsmitglieder</h3>
        <p className="text-sm text-muted-foreground">
          Benutzerrollen und Berechtigungen für diesen Betrieb verwalten
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Berechtigungen</TableHead>
              <TableHead>Mitglied seit</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const IconComponent = roleIcons[member.role]
              const isCurrentUser = member.user_id === user?.id
              const isLastOwner = member.role === 'owner' && ownerCount === 1

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.user.display_name || member.user.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">(Sie)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <Badge variant="outline" className={roleColors[member.role]}>
                        {member.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {roleDescriptions[member.role]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!isCurrentUser && canModifyRoles && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => updateRole(member.user_id, newRole)}
                            disabled={isLastOwner}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {isOwner && <SelectItem value="owner">Inhaber</SelectItem>}
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="editor">Bearbeiter</SelectItem>
                              <SelectItem value="viewer">Betrachter</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.user_id)}
                            disabled={isLastOwner}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {isCurrentUser && !isLastOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Betrieb verlassen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {currentUserIsLastOwner && (
        <Alert>
          <AlertDescription>
            Als letzter Inhaber können Sie Ihre Rolle nicht ändern oder den Betrieb verlassen. 
            Übertragen Sie zuerst das Eigentum an einen anderen Benutzer oder löschen Sie den Betrieb.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}