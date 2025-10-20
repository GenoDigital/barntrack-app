'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, RotateCcw, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Farm {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  street_address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  website: string | null
  tax_number: string | null
  payment_terms: string | null
  delivery_terms: string | null
  minimum_order_quantity: number | null
  default_delivery_time_days: number | null
  notes: string | null
  is_active: boolean
}

interface SyncConflict {
  currentSupplier: Supplier
  matchingSupplier: Supplier
  farmName: string
  farmId: string
}

export function SupplierManagement() {
  const [userFarms, setUserFarms] = useState<Farm[]>([])
  const [sourceSuppliers, setSourceSuppliers] = useState<Supplier[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [selectedSourceFarm, setSelectedSourceFarm] = useState('')
  const [showImportSection, setShowImportSection] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([])
  const [selectedSyncSuppliers, setSelectedSyncSuppliers] = useState<string[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  useEffect(() => {
    loadUserFarms()
  }, [])

  useEffect(() => {
    if (selectedSourceFarm) {
      loadSuppliersFromFarm(selectedSourceFarm)
    }
  }, [selectedSourceFarm])

  const loadUserFarms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('farm_members')
        .select('farm_id, farms!inner(id, name)')
        .eq('user_id', user.id)

      if (!error && data) {
        const farms = data.map(member => ({
          id: member.farms.id,
          name: member.farms.name
        }))
        setUserFarms(farms.filter(f => f.id !== currentFarmId))
      }
    } catch (error) {
      console.error('Error loading user farms:', error)
    }
  }

  const loadSuppliersFromFarm = async (farmId: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('farm_id', farmId)
        .eq('is_active', true)
        .order('name')

      if (!error) {
        setSourceSuppliers(data || [])
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const importSelectedSuppliers = async () => {
    if (!currentFarmId || selectedSuppliers.length === 0) return

    setImportLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht authentifiziert')

      const suppliersToImport = sourceSuppliers.filter(s => selectedSuppliers.includes(s.id))
      
      for (const supplier of suppliersToImport) {
        // Check if supplier with same name already exists in target farm
        const { data: existing } = await supabase
          .from('suppliers')
          .select('id')
          .eq('farm_id', currentFarmId)
          .eq('name', supplier.name)
          .single()

        if (!existing) {
          // Create new supplier without the id and farm-specific fields
          const newSupplier = {
            farm_id: currentFarmId,
            name: supplier.name,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            street_address: supplier.street_address,
            postal_code: supplier.postal_code,
            city: supplier.city,
            country: supplier.country,
            website: supplier.website,
            tax_number: supplier.tax_number,
            payment_terms: supplier.payment_terms,
            delivery_terms: supplier.delivery_terms,
            minimum_order_quantity: supplier.minimum_order_quantity,
            default_delivery_time_days: supplier.default_delivery_time_days,
            notes: supplier.notes,
            is_active: true,
            created_by: user.id
          }

          await supabase.from('suppliers').insert(newSupplier)
        }
      }

      toast.success(`${selectedSuppliers.length} Lieferanten erfolgreich importiert!`)
      setSelectedSuppliers([])
      setShowImportSection(false)
    } catch (error) {
      console.error('Error importing suppliers:', error)
      toast.error('Fehler beim Importieren der Lieferanten')
    } finally {
      setImportLoading(false)
    }
  }

  const findSyncConflicts = async () => {
    if (!currentFarmId) return

    setSyncLoading(true)
    try {
      // Get suppliers from current farm
      const { data: currentSuppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('farm_id', currentFarmId)
        .eq('is_active', true)

      // Find matching suppliers across all user's farms
      const conflicts = []
      
      for (const farm of userFarms) {
        const { data: otherFarmSuppliers } = await supabase
          .from('suppliers')
          .select('*')
          .eq('farm_id', farm.id)
          .eq('is_active', true)

        for (const currentSupplier of currentSuppliers || []) {
          const matchingSupplier = otherFarmSuppliers?.find(s => s.name === currentSupplier.name)
          
          if (matchingSupplier) {
            // Check if there are differences
            const fieldsToCompare = ['contact_person', 'phone', 'email', 'street_address', 'postal_code', 'city', 'website', 'payment_terms', 'delivery_terms'] as const
            const hasChanges = fieldsToCompare.some(field => 
              currentSupplier[field] !== matchingSupplier[field]
            )

            if (hasChanges) {
              conflicts.push({
                currentSupplier,
                matchingSupplier,
                farmName: farm.name,
                farmId: farm.id
              })
            }
          }
        }
      }

      setSyncConflicts(conflicts)
      if (conflicts.length === 0) {
        toast.success('Alle Lieferanten sind bereits synchronisiert!')
      }
    } catch (error) {
      console.error('Error finding sync conflicts:', error)
      toast.error('Fehler beim Prüfen der Synchronisation')
    } finally {
      setSyncLoading(false)
    }
  }

  const syncSelectedSuppliers = async () => {
    if (selectedSyncSuppliers.length === 0) return

    setSyncLoading(true)
    try {
      const conflictsToSync = syncConflicts.filter(c => 
        selectedSyncSuppliers.includes(c.currentSupplier.id)
      )

      for (const conflict of conflictsToSync) {
        // Update the matching supplier in the other farm with current farm's data
        await supabase
          .from('suppliers')
          .update({
            contact_person: conflict.currentSupplier.contact_person,
            phone: conflict.currentSupplier.phone,
            email: conflict.currentSupplier.email,
            street_address: conflict.currentSupplier.street_address,
            postal_code: conflict.currentSupplier.postal_code,
            city: conflict.currentSupplier.city,
            website: conflict.currentSupplier.website,
            payment_terms: conflict.currentSupplier.payment_terms,
            delivery_terms: conflict.currentSupplier.delivery_terms,
            updated_at: new Date().toISOString()
          })
          .eq('id', conflict.matchingSupplier.id)
      }

      toast.success(`${selectedSyncSuppliers.length} Lieferanten erfolgreich synchronisiert!`)
      setSelectedSyncSuppliers([])
      setSyncConflicts([])
    } catch (error) {
      console.error('Error syncing suppliers:', error)
      toast.error('Fehler beim Synchronisieren der Lieferanten')
    } finally {
      setSyncLoading(false)
    }
  }

  const availableFarms = userFarms.filter(f => f.id !== currentFarmId)

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Lieferanten importieren
          </CardTitle>
          <CardDescription>
            Importieren Sie Lieferanten von anderen Betrieben
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableFarms.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Sie haben keine anderen Betriebe, von denen Lieferanten importiert werden können.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {!showImportSection ? (
                <Button
                  onClick={() => setShowImportSection(true)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Lieferanten importieren
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Quell-Betrieb auswählen:</label>
                    <Select value={selectedSourceFarm} onValueChange={setSelectedSourceFarm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Betrieb auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFarms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {sourceSuppliers.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Zu importierende Lieferanten auswählen:
                      </label>
                      <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-2">
                        {sourceSuppliers.map((supplier) => (
                          <div key={supplier.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={supplier.id}
                              checked={selectedSuppliers.includes(supplier.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSuppliers([...selectedSuppliers, supplier.id])
                                } else {
                                  setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id))
                                }
                              }}
                            />
                            <label htmlFor={supplier.id} className="text-sm">
                              {supplier.name}
                              {supplier.city && (
                                <span className="text-muted-foreground ml-2">
                                  ({supplier.city})
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={importSelectedSuppliers}
                      disabled={selectedSuppliers.length === 0 || importLoading}
                    >
                      {importLoading ? 'Importiere...' : `${selectedSuppliers.length} Lieferanten importieren`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowImportSection(false)
                        setSelectedSuppliers([])
                        setSelectedSourceFarm('')
                      }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Lieferanten synchronisieren
          </CardTitle>
          <CardDescription>
            Synchronisieren Sie Lieferantendaten zwischen Ihren Betrieben
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableFarms.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Sie haben keine anderen Betriebe für die Synchronisation.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={findSyncConflicts}
                  disabled={syncLoading}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {syncLoading ? 'Prüfe Synchronisation...' : 'Synchronisation prüfen'}
                </Button>
              </div>

              {syncConflicts.length > 0 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {syncConflicts.length} Lieferanten haben unterschiedliche Daten in anderen Betrieben.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {syncConflicts.map((conflict) => (
                      <div key={conflict.currentSupplier.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`sync-${conflict.currentSupplier.id}`}
                              checked={selectedSyncSuppliers.includes(conflict.currentSupplier.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSyncSuppliers([...selectedSyncSuppliers, conflict.currentSupplier.id])
                                } else {
                                  setSelectedSyncSuppliers(selectedSyncSuppliers.filter(id => id !== conflict.currentSupplier.id))
                                }
                              }}
                            />
                            <label htmlFor={`sync-${conflict.currentSupplier.id}`} className="font-medium">
                              {conflict.currentSupplier.name}
                            </label>
                            <Badge variant="outline">{conflict.farmName}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Wird mit aktuellen Daten synchronisiert
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={syncSelectedSuppliers}
                    disabled={selectedSyncSuppliers.length === 0 || syncLoading}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {syncLoading ? 'Synchronisiere...' : `${selectedSyncSuppliers.length} Lieferanten synchronisieren`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}