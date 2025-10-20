'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label as FormLabel } from '@/components/ui/label'
import { useFarmStore } from '@/lib/stores/farm-store'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Package,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Download,
  FolderOpen,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Tables } from '@/lib/database.types'
import * as XLSX from 'xlsx'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'
import { PlanUpgradeBanner } from '@/components/subscription/plan-upgrade-banner'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Label as RechartsLabel } from 'recharts'
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { startOfWeek, format, getISOWeek, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { TimelineKanban } from '@/components/evaluation/timeline-kanban'
import { calculateTotalAnimalsFromDetails, calculateCycleDuration } from '@/lib/utils/livestock-calculations'
import { calculateCycleMetrics, calculateAreaMetrics as calcAreaMetrics, calculateFeedComponentSummary as calcFeedComponentSummary } from '@/lib/utils/kpi-calculations'
import { ErrorBoundary } from '@/components/error-boundary'

// Utility function to parse date strings without timezone issues
// Parses 'YYYY-MM-DD' as local date at midnight, not UTC
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

type LivestockCount = Tables<'livestock_counts'>
type LivestockCountDetail = Tables<'livestock_count_details'>
type Area = Tables<'areas'>
type Supplier = Tables<'suppliers'>

interface AreaGroup {
  id: string
  name: string
  description: string | null
  color: string
  area_count?: number
}

interface AreaGroupMembership {
  area_id: string
  area_group_id: string
  area: Area
}

interface LivestockCountWithDetails extends LivestockCount {
  livestock_count_details: (LivestockCountDetail & { areas: Area })[]
  suppliers?: Supplier
}

interface ConsumptionData {
  date: string
  quantity: number
  total_cost: number
  area_id?: string
  feed_type_id: string
  feed_types: {
    id: string
    name: string
    unit: string
  }
  areas?: {
    id: string
    name: string
  }
}

interface EvaluationMetrics {
  totalAnimals: number
  averageWeight: number
  weightGain: number
  feedConversionRatio: number
  mortalityRate: number
  totalFeedCost: number
  feedCostPerAnimal: number
  feedCostPerKg: number
  totalRevenue: number
  totalCosts: number
  profitLoss: number
  profitMargin: number
  cycleDuration: number
  dailyFeedCost: number
  feedEfficiency: number
}

interface AreaMetrics {
  areaId: string
  areaName: string
  animalCount: number
  animalType: string
  totalFeedQuantity: number
  totalFeedCost: number
  feedCostPerAnimal: number
  totalCostPerAnimal: number         // buyPrice + feedCost + proportional additional costs
  feedCostPerDay: number
  feedCostPerKg: number
  percentageOfTotal: number
  profitLossDirectPerAnimal: number  // sellPrice - buyPrice - feedCost (direct costs only)
  profitLossFullPerAnimal: number    // sellPrice - buyPrice - feedCost - proportional additional costs
  feedTypes: { [key: string]: { quantity: number; cost: number; name: string } }
}

interface FeedComponentSummary {
  feedTypeId: string
  feedTypeName: string
  unit: string
  totalQuantity: number
  totalCost: number
  weightedAvgPrice: number
  percentageOfTotal: number
  dailyConsumption: number
}

interface CostTransaction {
  id: string
  amount: number
  transaction_date: string
  cost_types?: {
    name: string
    category: string | null
  }
}

function EvaluationContent() {
  const [durchgaenge, setDurchgaenge] = useState<LivestockCountWithDetails[]>([])
  const [selectedDurchgang, setSelectedDurchgang] = useState<string>('')
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([])
  const [costTransactions, setCostTransactions] = useState<CostTransaction[]>([])
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
  const [areaMetrics, setAreaMetrics] = useState<AreaMetrics[]>([])
  const [feedComponentSummary, setFeedComponentSummary] = useState<FeedComponentSummary[]>([])
  const [loading, setLoading] = useState(false)
  
  // Area groups functionality
  const [areaGroups, setAreaGroups] = useState<AreaGroup[]>([])
  const [groupMemberships, setGroupMemberships] = useState<AreaGroupMembership[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [showGroupFilter, setShowGroupFilter] = useState(false)

  // Chart view mode
  const [chartViewMode, setChartViewMode] = useState<'quantity' | 'cost'>('quantity')

  // Pie chart view mode
  const [pieChartMode, setPieChartMode] = useState<'quantity' | 'cost'>('cost')

  // Weitere Kosten expansion state
  const [showWeitereKosten, setShowWeitereKosten] = useState(false)

  const { currentFarmId } = useFarmStore()
  const { subscription } = useSubscription()
  const supabase = createClient()

  // Check if user has export permissions
  const canExport = subscription?.has_advanced_analytics || subscription?.plan_type === 'professional' || subscription?.plan_type === 'enterprise'

  useEffect(() => {
    if (currentFarmId) {
      loadDurchgaenge()
      loadAreaGroups()
    }
  }, [currentFarmId])

  useEffect(() => {
    if (selectedDurchgang) {
      loadEvaluationData()
    }
  }, [selectedDurchgang])

  useEffect(() => {
    if (selectedDurchgang && consumptionData.length > 0) {
      const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
      if (durchgang) {
        calculateAreaMetrics(durchgang, consumptionData, costTransactions)
      }
    }
  }, [selectedGroups, costTransactions])

  const loadDurchgaenge = async () => {
    const { data, error } = await supabase
      .from('livestock_counts')
      .select(`
        *,
        livestock_count_details(*, areas(*), area_groups(*)),
        suppliers(*)
      `)
      .eq('farm_id', currentFarmId!)
      .order('start_date', { ascending: false })

    if (!error && data) {
      setDurchgaenge(data as LivestockCountWithDetails[])
      if (data.length > 0 && !selectedDurchgang) {
        setSelectedDurchgang(data[0].id)
      }
    }
  }

  const loadAreaGroups = async () => {
    if (!currentFarmId) return

    try {
      // Load area groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('area_groups')
        .select('*')
        .eq('farm_id', currentFarmId)
        .order('name')

      if (groupsError) throw groupsError

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
      setGroupMemberships(membershipsData || [])
    } catch (error) {
      console.error('Error loading area groups:', error)
    }
  }

  const loadEvaluationData = async () => {
    if (!selectedDurchgang) return

    setLoading(true)
    try {
      const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
      if (!durchgang) return

      console.log('Loading evaluation data for durchgang:', {
        name: durchgang.durchgang_name,
        start_date: durchgang.start_date,
        end_date: durchgang.end_date
      })

      // Use centralized data loading for consistent cost calculations
      const { consumption } = await loadConsumptionWithCosts(
        supabase,
        currentFarmId!,
        durchgang.start_date,
        durchgang.end_date  // Pass null if end_date is null, centralized function will handle it
      )

      console.log('Loaded consumption records:', consumption.length)

      // Filter consumption to only include areas/groups that have animals in this Durchgang
      const areasWithAnimals = new Set(
        durchgang.livestock_count_details
          .filter(detail => detail.count > 0)
          .map(detail => detail.area_id)
      )

      const groupsWithAnimals = new Set(
        durchgang.livestock_count_details
          .filter(detail => detail.count > 0)
          .map(detail => detail.area_group_id)
          .filter(id => id != null)
      )

      console.log('Areas with animals:', Array.from(areasWithAnimals))
      console.log('Groups with animals:', Array.from(groupsWithAnimals))

      // Use all consumption - timeframe filtering happens in calculateMetrics
      const filteredConsumption = consumption as ConsumptionData[]

      console.log('Total consumption records:', filteredConsumption.length)

      // Load cost transactions for this durchgang
      const { data: costData } = await supabase
        .from('cost_transactions')
        .select(`
          id,
          amount,
          transaction_date,
          cost_types (name, category)
        `)
        .eq('livestock_count_id', selectedDurchgang)
        .order('transaction_date')

      console.log('Loaded cost transactions:', costData?.length || 0)
      setCostTransactions(costData || [])

      setConsumptionData(filteredConsumption)
      calculateMetrics(durchgang, filteredConsumption, costData || [])
      calculateAreaMetrics(durchgang, filteredConsumption, costData || [])
      calculateFeedComponentSummary(durchgang, filteredConsumption)
    } catch (error) {
      console.error('Error loading evaluation data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for group filtering
  const getFilteredAreaIds = () => {
    if (selectedGroups.length === 0) {
      return [] // No filter, return empty array to indicate "all areas"
    }
    
    return groupMemberships
      .filter(membership => selectedGroups.includes(membership.area_group_id))
      .map(membership => membership.area_id)
  }

  const shouldIncludeArea = (areaId: string) => {
    const filteredAreaIds = getFilteredAreaIds()
    return filteredAreaIds.length === 0 || filteredAreaIds.includes(areaId)
  }

  const calculateMetrics = (durchgang: LivestockCountWithDetails, consumption: ConsumptionData[], costTransactions: CostTransaction[] = []) => {
    // Use centralized KPI calculation function
    const metrics = calculateCycleMetrics(durchgang as any, consumption as any, costTransactions)
    setMetrics(metrics)
  }

  const calculateAreaMetrics = (durchgang: LivestockCountWithDetails, consumption: ConsumptionData[], costTransactions: CostTransaction[] = []) => {
    // Use centralized KPI calculation function with area filtering
    const filteredAreaIds = getFilteredAreaIds()
    const metrics = calcAreaMetrics(durchgang as any, consumption as any, costTransactions, filteredAreaIds)
    setAreaMetrics(metrics)
  }

  const calculateFeedComponentSummary = (durchgang: LivestockCountWithDetails, consumption: ConsumptionData[]) => {
    // Use centralized KPI calculation function
    const summary = calcFeedComponentSummary(durchgang as any, consumption as any)
    setFeedComponentSummary(summary)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatNumber = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  const exportAreaMetricsToExcel = () => {
    if (!areaMetrics || areaMetrics.length === 0) return
    
    const selectedDurchgangData = durchgaenge.find(d => d.id === selectedDurchgang)
    const durchgangName = selectedDurchgangData?.durchgang_name || 'Durchgang'
    
    // Prepare data for the main sheet (summary)
    const summaryData = areaMetrics.map(area => ({
      'Bucht/Bereich': area.areaName,
      'Tierart': area.animalType,
      'Anzahl Tiere': area.animalCount,
      'Futtermenge (kg)': Math.round(area.totalFeedQuantity),
      'Futterkosten (€)': parseFloat(area.totalFeedCost.toFixed(2)),
      'Kosten/Tier (€)': parseFloat(area.feedCostPerAnimal.toFixed(2)),
      'Kosten/Tag (€)': parseFloat(area.feedCostPerDay.toFixed(2)),
      'Kosten/kg Zunahme (€)': parseFloat(area.feedCostPerKg.toFixed(2)),
      'Anteil (%)': parseFloat(area.percentageOfTotal.toFixed(1))
    }))
    
    // Add totals row
    summaryData.push({
      'Bucht/Bereich': 'GESAMT',
      'Tierart': '',
      'Anzahl Tiere': areaMetrics.reduce((sum, a) => sum + a.animalCount, 0),
      'Futtermenge (kg)': Math.round(areaMetrics.reduce((sum, a) => sum + a.totalFeedQuantity, 0)),
      'Futterkosten (€)': parseFloat(areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0).toFixed(2)),
      'Kosten/Tier (€)': 0,
      'Kosten/Tag (€)': parseFloat(areaMetrics.reduce((sum, a) => sum + a.feedCostPerDay, 0).toFixed(2)),
      'Kosten/kg Zunahme (€)': 0,
      'Anteil (%)': 100
    })
    
    // Prepare detailed data for each area
    const detailedSheets: { [key: string]: any[] } = {}
    
    areaMetrics.forEach(area => {
      const feedTypesData = Object.values(area.feedTypes).map(feed => ({
        'Futtermittel': feed.name,
        'Menge (kg)': Math.round(feed.quantity),
        'Kosten (€)': parseFloat(feed.cost.toFixed(2)),
        'Preis/kg (€)': feed.quantity > 0 ? parseFloat((feed.cost / feed.quantity).toFixed(3)) : 0
      }))
      
      // Add summary for this area
      feedTypesData.push({
        'Futtermittel': 'GESAMT',
        'Menge (kg)': Math.round(area.totalFeedQuantity),
        'Kosten (€)': parseFloat(area.totalFeedCost.toFixed(2)),
        'Preis/kg (€)': area.totalFeedQuantity > 0 ? parseFloat((area.totalFeedCost / area.totalFeedQuantity).toFixed(3)) : 0
      })
      
      detailedSheets[area.areaName] = feedTypesData
    })
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Add summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Übersicht')
    
    // Add detailed sheets for each area
    Object.entries(detailedSheets).forEach(([areaName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data)
      // Limit sheet name to 31 characters (Excel limitation)
      const sheetName = areaName.substring(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]
    const filename = `Buchtauswertung_${durchgangName}_${date}.xlsx`
    
    // Write the file
    XLSX.writeFile(wb, filename)
  }

  const selectedDurchgangData = durchgaenge.find(d => d.id === selectedDurchgang)

  return (
    <div className="space-y-6">
      <PlanUpgradeBanner 
        feature="advanced_analytics"
        message="Erweiterte Analysen und detaillierte Auswertungen sind eine Premium-Funktion."
        className="mb-6"
      />
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Durchgangsauswertung</h2>
          <p className="text-muted-foreground">
            Detaillierte Analyse und Kennzahlen für Ihre Tierdurchgänge
          </p>
        </div>
        <div className="flex gap-4">
          <div className="w-80">
            <Select value={selectedDurchgang} onValueChange={setSelectedDurchgang}>
              <SelectTrigger>
                <SelectValue placeholder="Durchgang auswählen" />
              </SelectTrigger>
              <SelectContent>
                {durchgaenge.map((durchgang) => (
                  <SelectItem key={durchgang.id} value={durchgang.id}>
                    {durchgang.durchgang_name || `Durchgang ${durchgang.start_date}`}
                    {durchgang.end_date ? ` (${durchgang.start_date} - ${durchgang.end_date})` : ` (laufend seit ${durchgang.start_date})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {areaGroups.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowGroupFilter(!showGroupFilter)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {selectedGroups.length > 0 ? `${selectedGroups.length} Gruppen` : 'Filter'}
            </Button>
          )}
        </div>
      </div>

      {/* Group Filter Panel */}
      {showGroupFilter && areaGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Bereichsgruppen Filter
            </CardTitle>
            <CardDescription>
              Wählen Sie Bereichsgruppen aus, um die Auswertung auf bestimmte Bereiche zu beschränken.
              Ohne Auswahl werden alle Bereiche berücksichtigt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGroups([])}
                  disabled={selectedGroups.length === 0}
                >
                  Alle zurücksetzen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGroups(areaGroups.map(g => g.id))}
                  disabled={selectedGroups.length === areaGroups.length}
                >
                  Alle auswählen
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {areaGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGroups([...selectedGroups, group.id])
                        } else {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                        }
                      }}
                    />
                    <FormLabel htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.area_count} Bereiche
                          </div>
                        </div>
                      </div>
                    </FormLabel>
                  </div>
                ))}
              </div>
              {selectedGroups.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Ausgewählte Gruppen:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedGroups.map(groupId => {
                        const group = areaGroups.find(g => g.id === groupId)
                        if (!group) return null
                        return (
                          <Badge key={groupId} variant="secondary" className="text-xs">
                            {group.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDurchgangData && (
        <>
          {/* Durchgang Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Durchgang Übersicht
              </CardTitle>
              <CardDescription>
                Grundlegende Informationen zum ausgewählten Durchgang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedDurchgangData.durchgang_name || 'Unbenannt'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Zeitraum</p>
                  <p className="font-medium">
                    {format(parseLocalDate(selectedDurchgangData.start_date), 'dd.MM.yyyy', { locale: de })} -
                    {selectedDurchgangData.end_date
                      ? format(parseLocalDate(selectedDurchgangData.end_date), 'dd.MM.yyyy', { locale: de })
                      : 'laufend'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lieferant</p>
                  <p className="font-medium">{selectedDurchgangData.suppliers?.name || 'Nicht zugeordnet'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedDurchgangData.end_date ? "secondary" : "default"}>
                    {selectedDurchgangData.end_date ? "Abgeschlossen" : "Laufend"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Kanban View - Temporarily removed */}
          {/* {selectedDurchgangData.livestock_count_details && selectedDurchgangData.livestock_count_details.length > 0 && (
            <TimelineKanban
              entries={selectedDurchgangData.livestock_count_details.map((detail: any) => ({
                id: detail.id,
                areaId: detail.area_id,
                areaGroupId: detail.area_group_id,
                areaName: detail.areas?.name || detail.area_groups?.name || 'Unbekannt',
                count: detail.count,
                animalType: detail.animal_type,
                startDate: parseLocalDate(detail.start_date),
                endDate: detail.end_date ? parseLocalDate(detail.end_date) : null,
              }))}
              cycleStartDate={parseLocalDate(selectedDurchgangData.start_date)}
              cycleEndDate={selectedDurchgangData.end_date ? parseLocalDate(selectedDurchgangData.end_date) : null}
            />
          )} */}

          {/* Group-Specific Summary Cards */}
          {selectedGroups.length > 0 && areaMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Gruppenübersicht
                </CardTitle>
                <CardDescription>
                  Leistungskennzahlen der ausgewählten Bereichsgruppen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedGroups.map(groupId => {
                    const group = areaGroups.find(g => g.id === groupId)
                    if (!group) return null

                    // Calculate metrics for this specific group
                    const groupAreaIds = groupMemberships
                      .filter(m => m.area_group_id === groupId)
                      .map(m => m.area_id)
                    
                    const groupAreas = areaMetrics.filter(area => groupAreaIds.includes(area.areaId))
                    
                    const groupMetrics = {
                      totalAnimals: groupAreas.reduce((sum, area) => sum + area.animalCount, 0),
                      totalFeedCost: groupAreas.reduce((sum, area) => sum + area.totalFeedCost, 0),
                      totalFeedQuantity: groupAreas.reduce((sum, area) => sum + area.totalFeedQuantity, 0),
                      avgFeedCostPerAnimal: groupAreas.length > 0 
                        ? groupAreas.reduce((sum, area) => sum + (area.feedCostPerAnimal * area.animalCount), 0) / groupAreas.reduce((sum, area) => sum + area.animalCount, 0)
                        : 0,
                      avgProfitLossPerAnimal: groupAreas.length > 0
                        ? groupAreas.reduce((sum, area) => sum + (area.profitLossDirectPerAnimal * area.animalCount), 0) / groupAreas.reduce((sum, area) => sum + area.animalCount, 0)
                        : 0,
                      areaCount: groupAreas.length
                    }

                    return (
                      <Card key={groupId} className="border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">{group.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {groupMetrics.areaCount} Bereiche • {groupMetrics.totalAnimals} Tiere
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Futterkosten gesamt</span>
                                <span className="text-sm font-medium">{formatCurrency(groupMetrics.totalFeedCost)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Ø pro Tier</span>
                                <span className="text-sm font-medium">{formatCurrency(groupMetrics.avgFeedCostPerAnimal)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">G/V pro Tier</span>
                                <span className={`text-sm font-medium ${groupMetrics.avgProfitLossPerAnimal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(groupMetrics.avgProfitLossPerAnimal)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Futtermenge</span>
                                <span className="text-sm">{formatNumber(groupMetrics.totalFeedQuantity, 0)} kg</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Performance Indicators */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gewinn/Verlust</p>
                      <p className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.profitLoss)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gewinnmarge: {formatPercentage(metrics.profitMargin)}
                      </p>
                    </div>
                    {metrics.profitLoss >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Futterverwertung</p>
                      <p className="text-2xl font-bold">{formatNumber(metrics.feedConversionRatio, 2)}</p>
                      <p className="text-xs text-muted-foreground">kg Futter/kg Zunahme</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Futterkosten</p>
                      <p className="text-2xl font-bold">{formatCurrency(metrics.totalFeedCost)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(metrics.feedCostPerAnimal)}/Tier
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tiere gesamt</p>
                      <p className="text-2xl font-bold">{formatNumber(metrics.totalAnimals, 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        Mortalität: {formatPercentage(metrics.mortalityRate)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Financial Analysis */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Finanzanalyse
                  </CardTitle>
                  <CardDescription>Kosten- und Erlösaufstellung</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Einnahmen</span>
                      <span className="font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Verkaufserlös</span>
                        <span>{formatCurrency(metrics.totalRevenue)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Ausgaben</span>
                      <span className="font-bold text-red-600">{formatCurrency(metrics.totalCosts)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Futterkosten</span>
                        <span>{formatCurrency(metrics.totalFeedCost)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tierkauf</span>
                        <span>{formatCurrency(metrics.totalAnimals * (selectedDurchgangData.buy_price_per_animal || 0))}</span>
                      </div>
                      {costTransactions.length > 0 && (
                        <>
                          <div
                            className="flex justify-between items-center cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                            onClick={() => setShowWeitereKosten(!showWeitereKosten)}
                          >
                            <div className="flex items-center gap-2">
                              {showWeitereKosten ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="text-sm">Weitere Kosten</span>
                            </div>
                            <span>{formatCurrency(costTransactions.reduce((sum, t) => sum + t.amount, 0))}</span>
                          </div>
                          {showWeitereKosten && (
                            <div className="ml-6 space-y-1 border-l-2 border-muted pl-3">
                              {(() => {
                                // Group costs by category
                                const costsByCategory = costTransactions.reduce((acc, transaction) => {
                                  const category = transaction.cost_types?.category || 'Sonstige'
                                  if (!acc[category]) {
                                    acc[category] = 0
                                  }
                                  acc[category] += transaction.amount
                                  return acc
                                }, {} as Record<string, number>)

                                return Object.entries(costsByCategory)
                                  .sort(([, a], [, b]) => b - a)
                                  .map(([category, amount]) => (
                                    <div key={category} className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">{category}</span>
                                      <span>{formatCurrency(amount)}</span>
                                    </div>
                                  ))
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2 font-bold text-lg">
                      <span>Gewinn/Verlust</span>
                      <span className={metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(metrics.profitLoss)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Leistungskennzahlen
                  </CardTitle>
                  <CardDescription>Produktivität und Effizienz</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Zyklusdauer</p>
                        <p className="font-bold">{metrics.cycleDuration} Tage</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gewichtszunahme</p>
                        <p className="font-bold">{formatNumber(metrics.weightGain)} kg</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Futterkosten/kg Zunahme</p>
                        <p className="font-bold">{formatCurrency(metrics.feedCostPerKg)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tägliche Futterkosten</p>
                        <p className="font-bold">{formatCurrency(metrics.dailyFeedCost)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Futtereffizienz</p>
                        <p className="font-bold">{formatNumber(metrics.feedEfficiency, 3)} kg/€</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Endgewicht Ø</p>
                        <p className="font-bold">{formatNumber(metrics.averageWeight)} kg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cost Transactions Breakdown */}
          {costTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Zusätzliche Kosten
                </CardTitle>
                <CardDescription>
                  Detaillierte Aufschlüsselung der zusätzlichen Kostenbuchungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Kostenart</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell className="font-medium">{transaction.cost_types?.name || '-'}</TableCell>
                        <TableCell>{transaction.cost_types?.category || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={3}>Gesamt</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(costTransactions.reduce((sum, t) => sum + t.amount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Feed Trends Line Chart */}
          {consumptionData.length > 0 && selectedDurchgangData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Futterverbrauch im Zeitverlauf
                    </CardTitle>
                    <CardDescription>
                      Entwicklung des Verbrauchs und der Kosten nach Futtermittel
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={chartViewMode === 'quantity' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartViewMode('quantity')}
                    >
                      Menge
                    </Button>
                    <Button
                      variant={chartViewMode === 'cost' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartViewMode('cost')}
                    >
                      Kosten
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Generate complete week range for the cycle
                  const cycleStart = parseLocalDate(selectedDurchgangData.start_date)
                  const cycleEnd = selectedDurchgangData.end_date ? parseLocalDate(selectedDurchgangData.end_date) : new Date()

                  // Get first and last week starts
                  const firstWeekStart = startOfWeek(cycleStart, { weekStartsOn: 1, locale: de })
                  const lastWeekStart = startOfWeek(cycleEnd, { weekStartsOn: 1, locale: de })

                  // Generate all weeks in range
                  const allWeeks: string[] = []
                  let currentWeek = new Date(firstWeekStart)
                  while (currentWeek <= lastWeekStart) {
                    allWeeks.push(format(currentWeek, 'yyyy-MM-dd'))
                    currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000) // Add 7 days
                  }

                  // Group consumption by week and feed type
                  const weekMap = new Map<string, Map<string, { quantity: number; cost: number; name: string }>>()

                  consumptionData.forEach(item => {
                    // Get week start date
                    const date = parseLocalDate(item.date)
                    const weekStart = startOfWeek(date, { weekStartsOn: 1, locale: de })
                    const weekKey = format(weekStart, 'yyyy-MM-dd')

                    if (!weekMap.has(weekKey)) {
                      weekMap.set(weekKey, new Map())
                    }
                    const feedMap = weekMap.get(weekKey)!
                    const feedKey = item.feed_type_id

                    if (!feedMap.has(feedKey)) {
                      feedMap.set(feedKey, { quantity: 0, cost: 0, name: item.feed_types.name })
                    }
                    const existing = feedMap.get(feedKey)!
                    existing.quantity += item.quantity
                    existing.cost += item.total_cost
                  })

                  // Get all unique feed types
                  const allFeedTypes = Array.from(new Set(consumptionData.map(d => d.feed_type_id)))
                    .slice(0, 5) // Limit to top 5 feed types for clarity

                  // Convert to chart data format using complete week range
                  const chartData = allWeeks.map(week => {
                    const weekData: any = { week }
                    const feedMap = weekMap.get(week)

                    allFeedTypes.forEach(feedId => {
                      const feedData = feedMap?.get(feedId)
                      const feedName = feedData?.name || consumptionData.find(d => d.feed_type_id === feedId)?.feed_types.name || feedId
                      // Use quantity or cost based on chartViewMode
                      weekData[feedName] = chartViewMode === 'quantity'
                        ? (feedData?.quantity || 0)
                        : (feedData?.cost || 0)
                    })

                    return weekData
                  })

                  // Create chart config dynamically
                  const chartConfig: any = {}
                  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
                  allFeedTypes.forEach((feedId, index) => {
                    const feedName = consumptionData.find(d => d.feed_type_id === feedId)?.feed_types.name || feedId
                    chartConfig[feedName] = {
                      label: feedName,
                      color: colors[index % colors.length]
                    }
                  })

                  return (
                    <div className="w-full">
                      <div className="h-[350px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                          <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: 20, right: 12, top: 12, bottom: 12 }}
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="week"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => {
                                try {
                                  const date = new Date(value)
                                  const weekNum = getISOWeek(date)
                                  return `KW ${weekNum}`
                                } catch {
                                  return value
                                }
                              }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => {
                                if (chartViewMode === 'cost') {
                                  return `${value}€`
                                }
                                return `${value} kg`
                              }}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            {allFeedTypes.map((feedId, index) => {
                              const feedName = consumptionData.find(d => d.feed_type_id === feedId)?.feed_types.name || feedId
                              const isFirst = index === 0
                              const isLast = index === allFeedTypes.length - 1

                              return (
                                <Bar
                                  key={feedId}
                                  dataKey={feedName}
                                  stackId="a"
                                  fill={`var(--color-${feedName})`}
                                  radius={isLast ? [4, 4, 0, 0] : isFirst ? [0, 0, 4, 4] : 0}
                                />
                              )
                            })}
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Feed Components Breakdown */}
          {feedComponentSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Futtermittelkomponenten-Übersicht
                </CardTitle>
                <CardDescription>Detaillierte Aufschlüsselung aller verbrauchten Futtermittel mit gewichteten Durchschnittspreisen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Table Section */}
                  <div className="lg:col-span-2">
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Futtermittel</TableHead>
                        <TableHead className="text-right">Gesamtmenge</TableHead>
                        <TableHead className="text-right">Einheit</TableHead>
                        <TableHead className="text-right">Ø Preis/Einheit</TableHead>
                        <TableHead className="text-right">Gesamtkosten</TableHead>
                        <TableHead className="text-right">Tagesverbrauch</TableHead>
                        <TableHead className="text-right">Anteil %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedComponentSummary.map((component) => (
                        <TableRow key={component.feedTypeId}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {component.feedTypeName}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(component.totalQuantity, 0)}
                          </TableCell>
                          <TableCell className="text-right">{component.unit}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(component.weightedAvgPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(component.totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(component.dailyConsumption, 1)} {component.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercentage(component.percentageOfTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Gesamt</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(feedComponentSummary.reduce((sum, c) => sum + c.totalQuantity, 0), 0)}
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const totalQuantity = feedComponentSummary.reduce((sum, c) => sum + c.totalQuantity, 0)
                            const totalCost = feedComponentSummary.reduce((sum, c) => sum + c.totalCost, 0)
                            return formatCurrency(totalQuantity > 0 ? totalCost / totalQuantity : 0)
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(feedComponentSummary.reduce((sum, c) => sum + c.totalCost, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(feedComponentSummary.reduce((sum, c) => sum + c.dailyConsumption, 0), 1)} kg
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                    </div>
                  </div>

                  {/* Pie Chart Section */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Toggle buttons for pie chart */}
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant={pieChartMode === 'quantity' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPieChartMode('quantity')}
                      >
                        Menge
                      </Button>
                      <Button
                        variant={pieChartMode === 'cost' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPieChartMode('cost')}
                      >
                        Kosten
                      </Button>
                    </div>

                    <div className="flex items-center justify-center flex-1">
                      {(() => {
                        // Calculate total based on mode
                        const totalValue = pieChartMode === 'cost'
                          ? feedComponentSummary.reduce((sum, c) => sum + c.totalCost, 0)
                          : feedComponentSummary.reduce((sum, c) => sum + c.totalQuantity, 0)

                        // Prepare pie chart data from feedComponentSummary
                        const pieChartData = feedComponentSummary.map((component, index) => {
                          const value = pieChartMode === 'cost'
                            ? component.totalCost
                            : component.totalQuantity
                          const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0

                          return {
                            name: component.feedTypeName,
                            value: percentage,
                            fill: `var(--chart-${(index % 5) + 1})`
                          }
                        })

                      const chartConfig: ChartConfig = {}
                      feedComponentSummary.forEach((component, index) => {
                        chartConfig[component.feedTypeName] = {
                          label: component.feedTypeName,
                          color: `var(--chart-${(index % 5) + 1})`
                        }
                      })

                      return (
                        <div className="w-full max-w-[300px]">
                          <ChartContainer config={chartConfig} className="aspect-square w-full">
                            <PieChart>
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="font-medium">{payload[0].name}</div>
                                          <div className="font-bold text-right">{payload[0].value.toFixed(1)}%</div>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                              <Pie
                                data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                stroke="0"
                                innerRadius={60}
                                outerRadius={100}
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <RechartsLabel
                                  content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                      return (
                                        <text
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="fill-foreground text-2xl font-bold"
                                          >
                                            {feedComponentSummary.length}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 24}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            Futtermittel
                                          </tspan>
                                        </text>
                                      )
                                    }
                                  }}
                                />
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                      )
                    })()}
                    </div>
                  </div>
                </div>

                {/* Additional Insights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Hauptfuttermittel</div>
                        <div className="font-medium">{feedComponentSummary[0]?.feedTypeName || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {feedComponentSummary[0] && formatPercentage(feedComponentSummary[0].percentageOfTotal)} der Gesamtkosten
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Anzahl Komponenten</div>
                        <div className="font-medium">{feedComponentSummary.length}</div>
                        <div className="text-xs text-muted-foreground">verschiedene Futtermittel</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Ø Kosten/Tag</div>
                        <div className="font-medium">
                          {metrics && formatCurrency(metrics.dailyFeedCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">für alle Futtermittel</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Benchmarks */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Leistungsbewertung
                </CardTitle>
                <CardDescription>Bewertung der Kennzahlen im Vergleich zu Richtwerten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Futterverwertung</p>
                        <p className="text-sm text-muted-foreground">Ziel: 2.5 - 3.0</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatNumber(metrics.feedConversionRatio, 2)}</span>
                        {metrics.feedConversionRatio <= 3.0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Mortalitätsrate</p>
                        <p className="text-sm text-muted-foreground">Ziel: &lt; 3%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatPercentage(metrics.mortalityRate)}</span>
                        {metrics.mortalityRate < 3 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Gewinnmarge</p>
                        <p className="text-sm text-muted-foreground">Ziel: &gt; 10%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatPercentage(metrics.profitMargin)}</span>
                        {metrics.profitMargin > 10 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : metrics.profitMargin > 0 ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gruppenspezifische Auswertung - Detailed Group-Specific Analysis */}
          {areaMetrics.length > 0 && areaGroups.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Auswertung nach Gruppen
                    </CardTitle>
                    <CardDescription>Detaillierte Futterkosten und Verbrauch nach Bereichsgruppen</CardDescription>
                  </div>
                  <Button 
                    onClick={canExport ? exportAreaMetricsToExcel : undefined}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!canExport}
                    title={!canExport ? "Export-Funktionen sind nur in Professional und Enterprise Plänen verfügbar" : undefined}
                  >
                    <Download className="h-4 w-4" />
                    Excel Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary Table */}
                  <div className="overflow-x-auto">
                    <div style={{width: '1200px', minWidth: '1200px'}}>
                      <div className="[&>div]:overflow-visible [&>div]:w-auto">
                        <Table className="w-full"
                               style={{width: '1200px', minWidth: '1200px'}}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gruppe</TableHead>
                          <TableHead>Zeitraum</TableHead>
                          <TableHead>Tier-Tage</TableHead>
                          <TableHead className="text-right">Futtermenge (kg)</TableHead>
                          <TableHead className="text-right">Futterkosten</TableHead>
                          <TableHead className="text-right">Kosten/Tier/Tag</TableHead>
                          <TableHead className="text-right">Anteil %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {areaGroups.map(group => {
                          // Get the selected durchgang
                          const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
                          if (!durchgang) return null

                          // Calculate animal-days for this group from livestock_count_details
                          // This accounts for movements - we calculate total animal-days across all timeframes
                          const groupDetails = durchgang.livestock_count_details.filter(detail => {
                            // Check if detail is for this group
                            if (detail.area_group_id === group.id) return true

                            // Check if detail's area belongs to this group
                            const groupAreaIds = groupMemberships
                              .filter(m => m.area_group_id === group.id)
                              .map(m => m.area_id)
                            return groupAreaIds.includes(detail.area_id)
                          })

                          if (groupDetails.length === 0) return null

                          // Calculate group-specific start and end dates
                          const groupStartDate = groupDetails.reduce((earliest, detail) => {
                            const detailStart = new Date(detail.start_date)
                            return !earliest || detailStart < earliest ? detailStart : earliest
                          }, null as Date | null)

                          const groupEndDate = groupDetails.reduce((latest, detail) => {
                            const detailEnd = detail.end_date
                              ? new Date(detail.end_date)
                              : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                            return !latest || detailEnd > latest ? detailEnd : latest
                          }, null as Date | null)

                          // Calculate total animal-days
                          const totalAnimalDays = groupDetails.reduce((sum, detail) => {
                            const startDate = new Date(detail.start_date)
                            const endDate = detail.end_date
                              ? new Date(detail.end_date)
                              : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                            return sum + (detail.count * days)
                          }, 0)

                          // Skip groups with 0 animal-days
                          if (totalAnimalDays === 0) return null

                          // Get consumption data for this group
                          const groupAreaIds = groupMemberships
                            .filter(m => m.area_group_id === group.id)
                            .map(m => m.area_id)

                          // Check if there's a direct group-level entry
                          const groupLevelEntry = areaMetrics.find(area => area.areaId === group.id)

                          let totalFeedQuantity = 0
                          let totalFeedCost = 0

                          if (groupLevelEntry) {
                            // Group-level tracking: use the single group entry
                            totalFeedQuantity = groupLevelEntry.totalFeedQuantity
                            totalFeedCost = groupLevelEntry.totalFeedCost
                          } else {
                            // Area-level tracking: aggregate individual areas in the group
                            const groupAreas = areaMetrics.filter(area => groupAreaIds.includes(area.areaId))
                            totalFeedQuantity = groupAreas.reduce((sum, area) => sum + area.totalFeedQuantity, 0)
                            totalFeedCost = groupAreas.reduce((sum, area) => sum + area.totalFeedCost, 0)
                          }

                          // Calculate cost per animal-day
                          const costPerAnimalDay = totalAnimalDays > 0 ? totalFeedCost / totalAnimalDays : 0

                          const totalFeedCostAll = areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0)
                          const percentageOfTotal = totalFeedCostAll > 0 ? (totalFeedCost / totalFeedCostAll) * 100 : 0

                          return (
                            <TableRow key={group.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: group.color }}
                                  />
                                  {group.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div>
                                    {groupStartDate && groupEndDate && (
                                      <>
                                        {format(groupStartDate, 'dd.MM.yyyy')} - {format(groupEndDate, 'dd.MM.yyyy')}
                                      </>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {groupStartDate && groupEndDate && (
                                      <>
                                        {Math.ceil((groupEndDate.getTime() - groupStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} Tage
                                      </>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div>{formatNumber(totalAnimalDays, 0)} Tier-Tage</div>
                                  <div className="text-xs text-muted-foreground">{groupDetails.length} Zeiträume</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(totalFeedQuantity, 0)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(totalFeedCost)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(costPerAnimalDay)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={percentageOfTotal > 30 ? "destructive" : percentageOfTotal > 20 ? "secondary" : "outline"}>
                                  {formatPercentage(percentageOfTotal)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        }).filter(Boolean)}
                        {/* Virtual "Ohne Gruppe" group for ungrouped areas */}
                        {(() => {
                          // Get the selected durchgang
                          const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
                          if (!durchgang) return null

                          // Find areas not in any group
                          const groupedAreaIds = new Set(groupMemberships.map(m => m.area_id))
                          const ungroupedAreas = areaMetrics.filter(area => !groupedAreaIds.has(area.areaId))

                          if (ungroupedAreas.length === 0) return null

                          // Calculate animal-days for ungrouped areas
                          const ungroupedAreaIds = ungroupedAreas.map(a => a.areaId)
                          const ungroupedDetails = durchgang.livestock_count_details.filter(detail =>
                            ungroupedAreaIds.includes(detail.area_id)
                          )

                          // Calculate ungrouped-specific start and end dates
                          const ungroupedStartDate = ungroupedDetails.reduce((earliest, detail) => {
                            const detailStart = new Date(detail.start_date)
                            return !earliest || detailStart < earliest ? detailStart : earliest
                          }, null as Date | null)

                          const ungroupedEndDate = ungroupedDetails.reduce((latest, detail) => {
                            const detailEnd = detail.end_date
                              ? new Date(detail.end_date)
                              : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                            return !latest || detailEnd > latest ? detailEnd : latest
                          }, null as Date | null)

                          const totalAnimalDays = ungroupedDetails.reduce((sum, detail) => {
                            const startDate = new Date(detail.start_date)
                            const endDate = detail.end_date
                              ? new Date(detail.end_date)
                              : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                            return sum + (detail.count * days)
                          }, 0)

                          // Skip ungrouped areas with 0 animal-days
                          if (totalAnimalDays === 0) return null

                          const totalFeedQuantity = ungroupedAreas.reduce((sum, area) => sum + area.totalFeedQuantity, 0)
                          const totalFeedCost = ungroupedAreas.reduce((sum, area) => sum + area.totalFeedCost, 0)
                          const costPerAnimalDay = totalAnimalDays > 0 ? totalFeedCost / totalAnimalDays : 0

                          const totalFeedCostAll = areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0)
                          const percentageOfTotal = totalFeedCostAll > 0 ? (totalFeedCost / totalFeedCostAll) * 100 : 0

                          return (
                            <TableRow key="ungrouped">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-400"
                                  />
                                  Ohne Gruppe
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div>
                                    {ungroupedStartDate && ungroupedEndDate && (
                                      <>
                                        {format(ungroupedStartDate, 'dd.MM.yyyy')} - {format(ungroupedEndDate, 'dd.MM.yyyy')}
                                      </>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {ungroupedStartDate && ungroupedEndDate && (
                                      <>
                                        {Math.ceil((ungroupedEndDate.getTime() - ungroupedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} Tage
                                      </>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div>{formatNumber(totalAnimalDays, 0)} Tier-Tage</div>
                                  <div className="text-xs text-muted-foreground">{ungroupedAreas.length} Bereiche</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(totalFeedQuantity, 0)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(totalFeedCost)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(costPerAnimalDay)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={percentageOfTotal > 30 ? "destructive" : percentageOfTotal > 20 ? "secondary" : "outline"}>
                                  {formatPercentage(percentageOfTotal)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })()}
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Gesamt</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            {(() => {
                              // Get the selected durchgang
                              const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
                              if (!durchgang) return '-'

                              // Calculate total animal-days across all groups
                              const totalAnimalDays = durchgang.livestock_count_details.reduce((sum, detail) => {
                                const startDate = new Date(detail.start_date)
                                const endDate = detail.end_date
                                  ? new Date(detail.end_date)
                                  : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                                return sum + (detail.count * days)
                              }, 0)
                              return formatNumber(totalAnimalDays, 0)
                            })()}
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(areaMetrics.reduce((sum, a) => sum + a.totalFeedQuantity, 0), 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0))}</TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              // Get the selected durchgang
                              const durchgang = durchgaenge.find(d => d.id === selectedDurchgang)
                              if (!durchgang) return '-'

                              const totalAnimalDays = durchgang.livestock_count_details.reduce((sum, detail) => {
                                const startDate = new Date(detail.start_date)
                                const endDate = detail.end_date
                                  ? new Date(detail.end_date)
                                  : (durchgang.end_date ? new Date(durchgang.end_date) : new Date())
                                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                                return sum + (detail.count * days)
                              }, 0)
                              const totalFeedCost = areaMetrics.reduce((sum, a) => sum + a.totalFeedCost, 0)
                              return formatCurrency(totalAnimalDays > 0 ? totalFeedCost / totalAnimalDays : 0)
                            })()}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                      </TableBody>
                      </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </>
      )}

      {!selectedDurchgang && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Kein Durchgang ausgewählt</h3>
              <p className="text-muted-foreground">
                Wählen Sie einen Durchgang aus, um eine detaillierte Auswertung zu sehen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function EvaluationPage() {
  return (
    <ErrorBoundary>
      <EvaluationContent />
    </ErrorBoundary>
  )
}