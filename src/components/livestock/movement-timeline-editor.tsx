'use client'

import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  GanttProvider,
  GanttHeader,
  GanttTimeline,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttToday,
  createTimelineDataForRange,
  type GanttFeature,
  type GanttStatus,
} from '@/components/ui/shadcn-io/gantt'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type AnimalMovement = {
  id: string
  areaId: string | null
  areaGroupId: string | null
  areaName: string
  count: number
  animalType: string | null
  startDate: Date
  endDate: Date | null
}

export type AreaOption = {
  id: string
  name: string
  type: 'area' | 'group'
}

type MovementTimelineEditorProps = {
  cycleStartDate: Date
  cycleEndDate: Date | null
  totalAnimals: number
  movements: AnimalMovement[]
  availableAreas: AreaOption[]
  onMovementsChange: (movements: AnimalMovement[]) => void
  readOnly?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  starter: '#10b981',
  finishing: '#f59e0b',
  default: '#3b82f6',
}

export function MovementTimelineEditor({
  cycleStartDate,
  cycleEndDate,
  totalAnimals,
  movements,
  availableAreas,
  onMovementsChange,
  readOnly = false,
}: MovementTimelineEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newMovementArea, setNewMovementArea] = useState<string>('')
  const [newMovementCount, setNewMovementCount] = useState<string>('')
  const [newMovementStartDate, setNewMovementStartDate] = useState<string>('')
  const [newMovementEndDate, setNewMovementEndDate] = useState<string>('')

  // Create filtered timeline data for the cycle date range
  const timelineData = useMemo(() => {
    const endDate = cycleEndDate || new Date(cycleStartDate.getTime() + 90 * 24 * 60 * 60 * 1000) // Default 90 days
    return createTimelineDataForRange(cycleStartDate, endDate)
  }, [cycleStartDate, cycleEndDate])

  // Convert movements to Gantt features
  const ganttFeatures: GanttFeature[] = useMemo(() => {
    return movements.map((movement) => {
      const status: GanttStatus = {
        id: movement.areaName.toLowerCase(),
        name: movement.areaName,
        color: STATUS_COLORS[movement.areaName.toLowerCase()] || STATUS_COLORS.default,
      }

      return {
        id: movement.id,
        name: `${movement.count} Tiere`,
        startAt: movement.startDate,
        endAt: movement.endDate || cycleEndDate || new Date(cycleStartDate.getTime() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
        status,
        lane: movement.areaId || movement.areaGroupId || undefined,
      }
    })
  }, [movements, cycleEndDate, cycleStartDate])

  // Group features by area
  const featuresByArea = useMemo(() => {
    const grouped: Record<string, GanttFeature[]> = {}

    for (const feature of ganttFeatures) {
      const movement = movements.find(m => m.id === feature.id)
      if (!movement) continue

      const key = movement.areaId || movement.areaGroupId || 'unassigned'
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(feature)
    }

    return grouped
  }, [ganttFeatures, movements])

  // Validate movements
  const validateMovements = useCallback((newMovements: AnimalMovement[]) => {
    const errors: string[] = []

    // Check if we have any movements
    if (newMovements.length === 0) {
      errors.push('Mindestens eine Bewegung muss definiert werden')
      setValidationErrors(errors)
      return errors
    }

    // For each point in time, check that total animals equals cycle total
    const allDates = new Set<number>()
    allDates.add(cycleStartDate.getTime())
    if (cycleEndDate) {
      allDates.add(cycleEndDate.getTime())
    }

    newMovements.forEach(m => {
      allDates.add(m.startDate.getTime())
      if (m.endDate) {
        allDates.add(m.endDate.getTime())
      }
    })

    const sortedDates = Array.from(allDates).sort((a, b) => a - b)

    for (const dateTime of sortedDates) {
      const date = new Date(dateTime)

      // Count animals at this point in time
      const animalsAtDate = newMovements
        .filter(m => {
          const afterStart = date >= m.startDate
          const beforeEnd = !m.endDate || date <= m.endDate
          return afterStart && beforeEnd
        })
        .reduce((sum, m) => sum + m.count, 0)

      if (animalsAtDate !== totalAnimals) {
        errors.push(
          `Am ${format(date, 'dd.MM.yyyy')}: ${animalsAtDate} Tiere (erwartet: ${totalAnimals})`
        )
      }
    }

    setValidationErrors(errors)
    return errors
  }, [cycleStartDate, cycleEndDate, totalAnimals])

  // Handle movement changes from Gantt
  const handleMovementUpdate = useCallback(
    (id: string, startDate: Date, endDate: Date | null) => {
      const newMovements = movements.map(movement => {
        if (movement.id === id) {
          return {
            ...movement,
            startDate,
            endDate,
          }
        }
        return movement
      })

      validateMovements(newMovements)
      onMovementsChange(newMovements)
    },
    [movements, onMovementsChange, validateMovements]
  )

  // Handle adding new movement
  const handleAddMovement = useCallback((date: Date) => {
    // Pre-fill the start date with the clicked date
    setNewMovementStartDate(format(date, 'yyyy-MM-dd'))
    setNewMovementEndDate('')
    setNewMovementArea('')
    setNewMovementCount('')
    setAddDialogOpen(true)
  }, [])

  const handleConfirmAddMovement = useCallback(() => {
    if (!newMovementStartDate || !newMovementArea || !newMovementCount) {
      return
    }

    const selectedArea = availableAreas.find(a => a.id === newMovementArea)
    if (!selectedArea) {
      return
    }

    const count = parseInt(newMovementCount, 10)
    if (isNaN(count) || count <= 0) {
      return
    }

    const startDate = new Date(newMovementStartDate)
    const endDate = newMovementEndDate ? new Date(newMovementEndDate) : null

    const newMovement: AnimalMovement = {
      id: `movement-${Date.now()}`,
      areaId: selectedArea.type === 'area' ? selectedArea.id : null,
      areaGroupId: selectedArea.type === 'group' ? selectedArea.id : null,
      areaName: selectedArea.name,
      count,
      animalType: null,
      startDate,
      endDate,
    }

    const newMovements = [...movements, newMovement]
    validateMovements(newMovements)
    onMovementsChange(newMovements)
    setAddDialogOpen(false)
  }, [newMovementStartDate, newMovementEndDate, newMovementArea, newMovementCount, availableAreas, movements, onMovementsChange, validateMovements])

  // Get unique areas that have movements
  const areasWithMovements = useMemo(() => {
    const areaMap = new Map<string, { name: string; features: GanttFeature[] }>()

    movements.forEach(movement => {
      const key = movement.areaId || movement.areaGroupId || 'unassigned'
      if (!areaMap.has(key)) {
        areaMap.set(key, {
          name: movement.areaName,
          features: [],
        })
      }

      const feature = ganttFeatures.find(f => f.id === movement.id)
      if (feature) {
        areaMap.get(key)!.features.push(feature)
      }
    })

    return Array.from(areaMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      features: data.features,
    }))
  }, [movements, ganttFeatures])

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Validierungsfehler:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Ziehen Sie die Balken, um Bewegungszeiträume anzupassen. Ziehen Sie an den Rändern, um Start- oder Enddatum zu ändern.
          Die Gesamtzahl der Tiere ({totalAnimals}) muss zu jedem Zeitpunkt konstant bleiben.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Gesamt Tiere</div>
          <div className="text-2xl font-bold">{totalAnimals}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Bewegungen</div>
          <div className="text-2xl font-bold">{movements.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Bereiche</div>
          <div className="text-2xl font-bold">{areasWithMovements.length}</div>
        </Card>
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg bg-background h-[500px]">
        <GanttProvider
          range="daily"
          zoom={100}
          initialTimelineData={timelineData}
          onAddItem={readOnly ? undefined : handleAddMovement}
        >
          <GanttSidebar>
            <GanttSidebarGroup name="Bereiche / Gruppen">
              {areasWithMovements.map((area) => {
                // Create a representative feature for the sidebar
                const representativeFeature = area.features[0]
                return (
                  <GanttSidebarItem
                    key={area.id}
                    feature={representativeFeature}
                  />
                )
              })}
            </GanttSidebarGroup>
          </GanttSidebar>

          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              <GanttFeatureListGroup>
                {areasWithMovements.map((area) => (
                  <div key={area.id}>
                    <GanttFeatureRow
                      features={area.features}
                      onMove={readOnly ? undefined : handleMovementUpdate}
                    >
                      {(feature) => {
                        const movement = movements.find(m => m.id === feature.id)
                        return (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-medium text-xs truncate">
                              {movement?.areaName}
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {movement?.count} 🐷
                            </Badge>
                          </div>
                        )
                      }}
                    </GanttFeatureRow>
                  </div>
                ))}
              </GanttFeatureListGroup>
            </GanttFeatureList>
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      </div>

      {/* Movement Details Table */}
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Bereich / Gruppe</th>
              <th className="text-left p-3 text-sm font-medium">Anzahl</th>
              <th className="text-left p-3 text-sm font-medium">Von</th>
              <th className="text-left p-3 text-sm font-medium">Bis</th>
              <th className="text-left p-3 text-sm font-medium">Dauer</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movements
              .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
              .map((movement) => {
                const duration = movement.endDate
                  ? Math.ceil((movement.endDate.getTime() - movement.startDate.getTime()) / (1000 * 60 * 60 * 24))
                  : 'Bis Zyklusende'

                return (
                  <tr key={movement.id} className="hover:bg-muted/30">
                    <td className="p-3 text-sm">{movement.areaName}</td>
                    <td className="p-3 text-sm font-medium">{movement.count}</td>
                    <td className="p-3 text-sm">{format(movement.startDate, 'dd.MM.yyyy')}</td>
                    <td className="p-3 text-sm">
                      {movement.endDate ? format(movement.endDate, 'dd.MM.yyyy') : '—'}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {typeof duration === 'number' ? `${duration} Tage` : duration}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Add Movement Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Bewegung hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie eine neue Tierbewegung zum Zeitplan hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="area">Bereich / Gruppe</Label>
              <Select value={newMovementArea} onValueChange={setNewMovementArea}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="Wählen Sie einen Bereich..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name} ({area.type === 'area' ? 'Bereich' : 'Gruppe'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="count">Anzahl Tiere</Label>
              <Input
                id="count"
                type="number"
                min="1"
                value={newMovementCount}
                onChange={(e) => setNewMovementCount(e.target.value)}
                placeholder="z.B. 50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                value={newMovementStartDate}
                onChange={(e) => setNewMovementStartDate(e.target.value)}
                min={format(cycleStartDate, 'yyyy-MM-dd')}
                max={cycleEndDate ? format(cycleEndDate, 'yyyy-MM-dd') : undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Enddatum (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={newMovementEndDate}
                onChange={(e) => setNewMovementEndDate(e.target.value)}
                min={newMovementStartDate || format(cycleStartDate, 'yyyy-MM-dd')}
                max={cycleEndDate ? format(cycleEndDate, 'yyyy-MM-dd') : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Leer lassen, wenn die Bewegung bis zum Ende des Zyklus dauert
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirmAddMovement}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
