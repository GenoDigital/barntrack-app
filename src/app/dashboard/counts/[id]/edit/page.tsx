'use client'

export const runtime = 'edge'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calculateMaxAnimalsAtAnyTime, type AnimalCountEntry } from '@/lib/utils/livestock-calculations'

type CountingMode = 'area' | 'group'

export default function EditCyclePage() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.id as string
  const supabase = createClient()
  const { currentFarmId } = useFarmStore()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [areaGroups, setAreaGroups] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  // Form state
  const [countingMode, setCountingMode] = useState<CountingMode>('group')
  const [cycleName, setCycleName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [animalCounts, setAnimalCounts] = useState<Record<string, {
    count: number
    animalType: string
    startDate: string
    endDate: string
    expectedWeight?: string
    actualWeight?: string
    buyPrice?: string
    sellPrice?: string
    isStartGroup?: boolean
    isEndGroup?: boolean
    startWeightSourceId?: string
  }>>({})

  // Financial state
  const [buyPricePerAnimal, setBuyPricePerAnimal] = useState('')
  const [sellPricePerAnimal, setSellPricePerAnimal] = useState('')
  const [expectedWeightPerAnimal, setExpectedWeightPerAnimal] = useState('')
  const [actualWeightPerAnimal, setActualWeightPerAnimal] = useState('')
  const [mortalityRate, setMortalityRate] = useState('')
  const [totalLifetimeDays, setTotalLifetimeDays] = useState('')
  const [slaughterWeightKg, setSlaughterWeightKg] = useState('')

  // Filter state
  const [showOnlyActive, setShowOnlyActive] = useState(true)

  // Load existing cycle data
  useEffect(() => {
    if (!currentFarmId || !cycleId) return

    const loadData = async () => {
      setInitialLoading(true)

      try {
        // Load cycle
        const { data: cycle, error: cycleError } = await supabase
          .from('livestock_counts')
          .select('*, livestock_count_details(*, areas(*), area_groups(*))')
          .eq('id', cycleId)
          .eq('farm_id', currentFarmId)
          .single()

        if (cycleError) throw cycleError

        // Set basic fields
        setCycleName(cycle.durchgang_name || '')
        setStartDate(cycle.start_date)
        setEndDate(cycle.end_date || '')
        setNotes(cycle.notes || '')
        setSupplierId(cycle.supplier_id || 'none')
        setBuyPricePerAnimal(cycle.buy_price_per_animal?.toString() || '')
        setSellPricePerAnimal(cycle.sell_price_per_animal?.toString() || '')
        setExpectedWeightPerAnimal(cycle.expected_weight_per_animal?.toString() || '')
        setActualWeightPerAnimal(cycle.actual_weight_per_animal?.toString() || '')
        setMortalityRate(cycle.mortality_rate?.toString() || '')
        setTotalLifetimeDays(cycle.total_lifetime_days?.toString() || '')
        setSlaughterWeightKg(cycle.slaughter_weight_kg?.toString() || '')

        // Determine counting mode and load details
        const details = cycle.livestock_count_details || []
        const hasAreas = details.some((d: any) => d.area_id)
        const hasGroups = details.some((d: any) => d.area_group_id)

        if (hasAreas && !hasGroups) {
          setCountingMode('area')
        } else {
          setCountingMode('group')
        }

        // Load areas first
        const { data: areasData } = await supabase
          .from('areas')
          .select('id, name')
          .eq('farm_id', currentFarmId)
          .order('name')

        if (areasData) setAreas(areasData)

        // Load area groups
        const { data: groupsData } = await supabase
          .from('area_groups')
          .select('id, name')
          .eq('farm_id', currentFarmId)
          .order('name')

        if (groupsData) setAreaGroups(groupsData)

        // Initialize animal counts with all areas/groups, then populate with existing data
        const counts: Record<string, { count: number; animalType: string; startDate: string; endDate: string; expectedWeight?: string; actualWeight?: string; buyPrice?: string; sellPrice?: string; isStartGroup?: boolean; isEndGroup?: boolean; startWeightSourceId?: string }> = {}

        // Initialize all options with defaults
        const allOptions = hasAreas ? areasData || [] : groupsData || []
        allOptions.forEach((option: any) => {
          counts[option.id] = {
            count: 0,
            animalType: '',
            startDate: '',
            endDate: '',
            expectedWeight: '',
            actualWeight: '',
            buyPrice: '',
            sellPrice: '',
            isStartGroup: false,
            isEndGroup: false,
            startWeightSourceId: '',
          }
        })

        // Populate with existing data
        details.forEach((d: any) => {
          const id = d.area_id || d.area_group_id
          if (id) {
            counts[id] = {
              count: d.count,
              animalType: d.animal_type || '',
              startDate: d.start_date || '',
              endDate: d.end_date || '',
              expectedWeight: d.expected_weight_per_animal?.toString() || '',
              actualWeight: d.actual_weight_per_animal?.toString() || '',
              buyPrice: d.buy_price_per_animal?.toString() || '',
              sellPrice: d.sell_price_per_animal?.toString() || '',
              isStartGroup: d.is_start_group || false,
              isEndGroup: d.is_end_group || false,
              startWeightSourceId: d.start_weight_source_detail_id || '',
            }
          }
        })
        setAnimalCounts(counts)

        // Load suppliers
        const { data: suppliersData } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('farm_id', currentFarmId)
          .order('name')

        if (suppliersData) setSuppliers(suppliersData)
      } catch (error) {
        console.error('Error loading cycle:', error)
        toast.error('Fehler beim Laden des Durchgangs')
        router.push('/dashboard/counts')
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()
  }, [currentFarmId, cycleId, supabase, router])

  const availableOptions = countingMode === 'area' ? areas : areaGroups

  // Filter and sort options
  const filteredAndSortedOptions = useMemo(() => {
    let options = availableOptions

    // Filter: only show areas/groups with animals
    if (showOnlyActive) {
      options = options.filter(option => (animalCounts[option.id]?.count || 0) > 0)
    }

    // Sort chronologically by start date
    return [...options].sort((a, b) => {
      const aDate = animalCounts[a.id]?.startDate || startDate || '9999-12-31'
      const bDate = animalCounts[b.id]?.startDate || startDate || '9999-12-31'
      return aDate.localeCompare(bDate)
    })
  }, [availableOptions, showOnlyActive, animalCounts, startDate])

  // Calculate total animals by finding max animals at any point in time
  const totalAnimalsCount = useMemo(() => {
    const entries: AnimalCountEntry[] = Object.values(animalCounts)
      .filter(({ count }) => count > 0)
      .map(({ count, startDate: itemStart, endDate: itemEnd }) => ({
        count,
        startDate: itemStart || startDate,
        endDate: itemEnd || endDate || '',
      }))

    return calculateMaxAnimalsAtAnyTime(entries, startDate, endDate)
  }, [animalCounts, startDate, endDate])

  const handleSave = async () => {
    if (!currentFarmId || !startDate) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    setLoading(true)

    try {
      // Update livestock count
      const { error: countError } = await supabase
        .from('livestock_counts')
        .update({
          durchgang_name: cycleName || null,
          start_date: startDate,
          end_date: endDate || null,
          notes: notes || null,
          supplier_id: supplierId && supplierId !== 'none' ? supplierId : null,
          buy_price_per_animal: buyPricePerAnimal ? parseFloat(buyPricePerAnimal) : null,
          sell_price_per_animal: sellPricePerAnimal ? parseFloat(sellPricePerAnimal) : null,
          expected_weight_per_animal: expectedWeightPerAnimal ? parseFloat(expectedWeightPerAnimal) : null,
          actual_weight_per_animal: actualWeightPerAnimal ? parseFloat(actualWeightPerAnimal) : null,
          mortality_rate: mortalityRate ? parseFloat(mortalityRate) : null,
          total_lifetime_days: totalLifetimeDays ? parseInt(totalLifetimeDays) : null,
          slaughter_weight_kg: slaughterWeightKg ? parseFloat(slaughterWeightKg) : null,
        })
        .eq('id', cycleId)

      if (countError) throw countError

      // Delete existing details
      const { error: deleteError } = await supabase
        .from('livestock_count_details')
        .delete()
        .eq('livestock_count_id', cycleId)

      if (deleteError) throw deleteError

      // Create new count details
      const details = Object.entries(animalCounts)
        .filter(([, { count }]) => count > 0)
        .map(([id, { count, animalType, startDate: itemStartDate, endDate: itemEndDate, expectedWeight, actualWeight, buyPrice, sellPrice, isStartGroup, isEndGroup, startWeightSourceId }]) => ({
          livestock_count_id: cycleId,
          area_id: countingMode === 'area' ? id : null,
          area_group_id: countingMode === 'group' ? id : null,
          count,
          animal_type: animalType || null,
          start_date: itemStartDate || startDate,
          end_date: itemEndDate || endDate || null,
          expected_weight_per_animal: expectedWeight ? parseFloat(expectedWeight) : null,
          actual_weight_per_animal: actualWeight ? parseFloat(actualWeight) : null,
          buy_price_per_animal: buyPrice ? parseFloat(buyPrice) : null,
          sell_price_per_animal: sellPrice ? parseFloat(sellPrice) : null,
          is_start_group: !!(expectedWeight && !startWeightSourceId),  // Auto: has start weight and not inherited
          is_end_group: !!actualWeight,  // Auto: has end weight
          start_weight_source_detail_id: startWeightSourceId || null,
        }))

      if (details.length > 0) {
        const { error: detailsError } = await supabase
          .from('livestock_count_details')
          .insert(details)

        if (detailsError) throw detailsError
      }

      toast.success('Durchgang erfolgreich aktualisiert')
      router.push('/dashboard/counts')
    } catch (error: any) {
      console.error('Error updating cycle:', error)
      const errorMessage = error?.message || error?.error_description || 'Fehler beim Aktualisieren des Durchgangs'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAnimalCountChange = (
    id: string,
    field: 'count' | 'animalType' | 'startDate' | 'endDate' | 'expectedWeight' | 'actualWeight' | 'buyPrice' | 'sellPrice' | 'isStartGroup' | 'isEndGroup' | 'startWeightSourceId',
    value: string | number | boolean
  ) => {
    setAnimalCounts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  if (!currentFarmId) {
    return (
      <div className="p-6">
        <p>Bitte wählen Sie zuerst einen Betrieb aus.</p>
      </div>
    )
  }

  if (initialLoading) {
    return (
      <div className="p-6">
        <p>Laden...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/counts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Durchgang bearbeiten</h1>
        <p className="text-muted-foreground mt-2">
          Bearbeiten Sie die Details des Durchgangs
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
            <CardDescription>Zeitraum und Erfassungsmodus des Durchgangs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycleName">Durchgangsname (optional)</Label>
              <Input
                id="cycleName"
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="z.B. Durchgang Winter 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Enddatum (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Erfassungsmodus</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={countingMode === 'group' ? 'default' : 'outline'}
                  onClick={() => {
                    setCountingMode('group')
                    // Reinitialize counts for groups
                    const initialCounts: Record<string, { count: number; animalType: string; startDate: string; endDate: string }> = {}
                    areaGroups.forEach(group => {
                      initialCounts[group.id] = { count: 0, animalType: '', startDate: '', endDate: '' }
                    })
                    setAnimalCounts(initialCounts)
                  }}
                >
                  Nach Gruppen
                </Button>
                <Button
                  type="button"
                  variant={countingMode === 'area' ? 'default' : 'outline'}
                  onClick={() => {
                    setCountingMode('area')
                    // Reinitialize counts for areas
                    const initialCounts: Record<string, { count: number; animalType: string; startDate: string; endDate: string }> = {}
                    areas.forEach(area => {
                      initialCounts[area.id] = { count: 0, animalType: '', startDate: '', endDate: '' }
                    })
                    setAnimalCounts(initialCounts)
                  }}
                >
                  Nach Bereichen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle>Finanz- und Lieferanteninformationen</CardTitle>
            <CardDescription>
              Optionale Angaben zu Preisen, Gewichten und Lieferanten. Diese Werte gelten als Standard für alle Bereiche/Gruppen und können bei Bedarf pro Bereich/Gruppe überschrieben werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Lieferant</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Lieferant wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Lieferant</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionale Notizen..."
                  rows={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyPrice">Kaufpreis pro Tier (€)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={buyPricePerAnimal}
                  onChange={(e) => setBuyPricePerAnimal(e.target.value)}
                  placeholder="z.B. 150.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Verkaufspreis pro Tier (€)</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellPricePerAnimal}
                  onChange={(e) => setSellPricePerAnimal(e.target.value)}
                  placeholder="z.B. 280.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedWeight">Startgewicht (kg)</Label>
                <Input
                  id="expectedWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={expectedWeightPerAnimal}
                  onChange={(e) => setExpectedWeightPerAnimal(e.target.value)}
                  placeholder="z.B. 25.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualWeight">Endgewicht (kg)</Label>
                <Input
                  id="actualWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualWeightPerAnimal}
                  onChange={(e) => setActualWeightPerAnimal(e.target.value)}
                  placeholder="z.B. 115.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortality">Mortalitätsrate (%)</Label>
                <Input
                  id="mortality"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={mortalityRate}
                  onChange={(e) => setMortalityRate(e.target.value)}
                  placeholder="z.B. 2.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalLifetimeDays">Gesamte Lebenstage (optional)</Label>
                <Input
                  id="totalLifetimeDays"
                  type="number"
                  min="1"
                  value={totalLifetimeDays}
                  onChange={(e) => setTotalLifetimeDays(e.target.value)}
                  placeholder="z.B. 365"
                />
                <p className="text-xs text-muted-foreground">
                  Tage seit Geburt - für Berechnung der Netto Tageszunahmen bei Bullenmast
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slaughterWeight">Schlachtgewicht (kg, optional)</Label>
                <Input
                  id="slaughterWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={slaughterWeightKg}
                  onChange={(e) => setSlaughterWeightKg(e.target.value)}
                  placeholder="z.B. 350.0"
                />
                <p className="text-xs text-muted-foreground">
                  Schlachtgewicht - für Berechnung der Netto Tageszunahmen bei Bullenmast
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animal Counts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tierzahlen erfassen</CardTitle>
                <CardDescription>
                  Geben Sie die Anzahl der Tiere pro {countingMode === 'area' ? 'Bereich' : 'Gruppe'} ein
                </CardDescription>
              </div>
              {totalAnimalsCount > 0 && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Gesamt: {totalAnimalsCount} Tiere
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Toggle */}
            {availableOptions.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="show-only-active-edit"
                  checked={showOnlyActive}
                  onCheckedChange={(checked) => setShowOnlyActive(checked as boolean)}
                />
                <Label htmlFor="show-only-active-edit" className="text-sm cursor-pointer">
                  Nur Bereiche mit Tieren anzeigen
                </Label>
                <Badge variant="outline" className="ml-auto">
                  {filteredAndSortedOptions.length} von {availableOptions.length}
                </Badge>
              </div>
            )}

            <div className="space-y-3">
              {availableOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine {countingMode === 'area' ? 'Bereiche' : 'Gruppen'} verfügbar.
                  Bitte erstellen Sie zuerst {countingMode === 'area' ? 'Bereiche' : 'Gruppen'} in den Einstellungen.
                </p>
              ) : (
                <>
                {filteredAndSortedOptions.map((option) => (
                  <Card key={option.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{option.name}</Label>
                        <Badge variant="outline">{animalCounts[option.id]?.count || 0} Tiere</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Anzahl Tiere</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Anzahl"
                            value={animalCounts[option.id]?.count || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'count', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Tierart (optional)</Label>
                          <Input
                            type="text"
                            placeholder="z.B. Schweine"
                            value={animalCounts[option.id]?.animalType || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'animalType', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Startdatum</Label>
                          <Input
                            type="date"
                            value={animalCounts[option.id]?.startDate || startDate}
                            onChange={(e) => handleAnimalCountChange(option.id, 'startDate', e.target.value)}
                            min={startDate}
                            max={endDate || undefined}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Enddatum (optional)</Label>
                          <Input
                            type="date"
                            value={animalCounts[option.id]?.endDate || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'endDate', e.target.value)}
                            min={animalCounts[option.id]?.startDate || startDate}
                            max={endDate || undefined}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Startgewicht (kg)</Label>
                          <Select
                            value={animalCounts[option.id]?.startWeightSourceId || (animalCounts[option.id]?.expectedWeight ? 'manual' : expectedWeightPerAnimal ? 'default' : 'none')}
                            onValueChange={(value) => {
                              if (value === 'manual' || value === 'none' || value === 'default') {
                                handleAnimalCountChange(option.id, 'startWeightSourceId', '')
                                if (value === 'manual') {
                                  // Keep current manual value
                                } else if (value === 'none') {
                                  handleAnimalCountChange(option.id, 'expectedWeight', '')
                                }
                              } else {
                                handleAnimalCountChange(option.id, 'startWeightSourceId', value)
                                handleAnimalCountChange(option.id, 'expectedWeight', '')
                              }
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">✏️ Direkt eingeben</SelectItem>
                              {expectedWeightPerAnimal && (
                                <SelectItem value="default">⚙️ Standard ({expectedWeightPerAnimal} kg)</SelectItem>
                              )}
                              {availableOptions
                                .filter(o => o.id !== option.id && (animalCounts[o.id]?.actualWeight || animalCounts[o.id]?.expectedWeight))
                                .map(o => (
                                  <SelectItem key={o.id} value={o.id}>
                                    🔗 Von {o.name}
                                    {animalCounts[o.id]?.actualWeight
                                      ? ` (${animalCounts[o.id]?.actualWeight} kg)`
                                      : ` (${animalCounts[o.id]?.expectedWeight} kg)`}
                                  </SelectItem>
                                ))}
                              {!expectedWeightPerAnimal && availableOptions.filter(o => o.id !== option.id).length === 0 && (
                                <SelectItem value="none">- Kein Gewicht -</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {(!animalCounts[option.id]?.startWeightSourceId || animalCounts[option.id]?.startWeightSourceId === '') && (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="z.B. 8.0"
                              value={animalCounts[option.id]?.expectedWeight || ''}
                              onChange={(e) => handleAnimalCountChange(option.id, 'expectedWeight', e.target.value)}
                              className="mt-2"
                            />
                          )}
                          {animalCounts[option.id]?.startWeightSourceId && animalCounts[option.id]?.startWeightSourceId !== '' && (() => {
                            const sourceId = animalCounts[option.id]?.startWeightSourceId
                            const source = availableOptions.find(o => o.id === sourceId)
                            const sourceWeight = animalCounts[sourceId!]?.actualWeight || animalCounts[sourceId!]?.expectedWeight
                            return (
                              <div className="text-xs text-muted-foreground mt-1">
                                Verwendet: {sourceWeight || '-'} kg (von {source?.name})
                              </div>
                            )
                          })()}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Endgewicht (kg)
                            {actualWeightPerAnimal && <span className="text-xs ml-1">(Standard: {actualWeightPerAnimal} kg)</span>}
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder={actualWeightPerAnimal || "optional"}
                            value={animalCounts[option.id]?.actualWeight || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'actualWeight', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Einkaufspreis (€)
                            {buyPricePerAnimal && <span className="text-xs ml-1">(Standard: {buyPricePerAnimal} €)</span>}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={buyPricePerAnimal || "optional"}
                            value={animalCounts[option.id]?.buyPrice || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'buyPrice', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Verkaufspreis (€)
                            {sellPricePerAnimal && <span className="text-xs ml-1">(Standard: {sellPricePerAnimal} €)</span>}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={sellPricePerAnimal || "optional"}
                            value={animalCounts[option.id]?.sellPrice || ''}
                            onChange={(e) => handleAnimalCountChange(option.id, 'sellPrice', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Live Weight Gain Calculation */}
                      {(() => {
                        const sourceId = animalCounts[option.id]?.startWeightSourceId
                        const manualStart = animalCounts[option.id]?.expectedWeight
                        const endWeight = animalCounts[option.id]?.actualWeight

                        let startWeight: number | null = null
                        let source = ''

                        if (manualStart) {
                          startWeight = parseFloat(manualStart)
                          source = 'direkt eingegeben'
                        } else if (sourceId && sourceId !== '') {
                          const sourceArea = availableOptions.find(o => o.id === sourceId)
                          const sourceWeight = animalCounts[sourceId]?.actualWeight || animalCounts[sourceId]?.expectedWeight
                          if (sourceWeight) {
                            startWeight = parseFloat(sourceWeight)
                            source = `von ${sourceArea?.name}`
                          }
                        } else if (expectedWeightPerAnimal) {
                          startWeight = parseFloat(expectedWeightPerAnimal)
                          source = 'Standard'
                        }

                        const end = endWeight ? parseFloat(endWeight) : null
                        const gain = (startWeight !== null && end !== null) ? end - startWeight : null

                        if (gain !== null || startWeight !== null || end !== null) {
                          return (
                            <div className={`p-2 rounded-md text-xs ${gain && gain > 0 ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-muted'}`}>
                              <div className="font-medium mb-1">📊 Berechnung:</div>
                              <div className="space-y-0.5 text-xs">
                                {startWeight !== null && (
                                  <div>Start: {startWeight} kg {source && `(${source})`}</div>
                                )}
                                {end !== null && (
                                  <div>Ende: {end} kg</div>
                                )}
                                {gain !== null && (
                                  <div className="font-semibold mt-1">
                                    → Gewichtszunahme: {gain.toFixed(1)} kg pro Tier
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </Card>
                ))}

                {/* Quick Add - only show when filtered */}
                {showOnlyActive && filteredAndSortedOptions.length < availableOptions.length && (
                  <Card className="p-4 border-dashed">
                    <Select
                      value=""
                      onValueChange={(id) => {
                        if (id) {
                          handleAnimalCountChange(id, 'count', 1)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="+ Weiteren Bereich hinzufügen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions
                          .filter(o => !filteredAndSortedOptions.find(f => f.id === o.id))
                          .map(o => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Card>
                )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/counts">
            <Button variant="outline" disabled={loading}>
              Abbrechen
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={loading || !startDate || totalAnimalsCount === 0}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Speichern...' : 'Änderungen speichern'}
          </Button>
        </div>
      </div>
    </div>
  )
}
