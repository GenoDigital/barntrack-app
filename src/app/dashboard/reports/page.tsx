'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFarmStore } from '@/lib/stores/farm-store'
import { BarChart, DollarSign, Package, Filter, Download, Star, Lock } from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { loadConsumptionWithCosts } from '@/lib/utils/feed-calculations'
import { PlanUpgradeBanner } from '@/components/subscription/plan-upgrade-banner'
import { useSubscription } from '@/lib/hooks/use-subscription'
import PivotTableConfig, { PivotConfig, PivotDimension, PivotValue } from '@/components/reports/pivot-table-config'
import PivotTableView from '@/components/reports/pivot-table-view'
import { generatePivotTable, ConsumptionDataRow, PivotTableData } from '@/lib/utils/pivot-engine'
import { ErrorBoundary } from '@/components/error-boundary'
import { SavePivotDialog } from '@/components/reports/save-pivot-dialog'
import { PivotConfigSelector } from '@/components/reports/pivot-config-selector'
import { getSavedPivotConfigs, SavedPivotConfig } from '@/lib/services/pivot-config-service'
import { toast } from 'sonner'

// Utility function to parse date strings without timezone issues
// Parses 'YYYY-MM-DD' as local date at midnight, not UTC
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Available dimensions for pivot table
const AVAILABLE_DIMENSIONS: Array<{ value: PivotDimension; label: string; description?: string }> = [
  { value: 'date', label: 'Tag', description: 'Tägliche Aufschlüsselung' },
  { value: 'week', label: 'Woche', description: 'Wöchentliche Aufschlüsselung' },
  { value: 'month', label: 'Monat', description: 'Monatliche Aufschlüsselung' },
  { value: 'quarter', label: 'Quartal', description: 'Quartalsweise Aufschlüsselung' },
  { value: 'year', label: 'Jahr', description: 'Jährliche Aufschlüsselung' },
  { value: 'feed_type', label: 'Futtermittel', description: 'Nach Futtermittelart' },
  { value: 'area', label: 'Bereich', description: 'Nach Stallbereich' },
  { value: 'area_group', label: 'Bereichsgruppe', description: 'Nach Bereichsgruppe' },
  { value: 'supplier', label: 'Lieferant', description: 'Nach Lieferant' }
]

const AVAILABLE_VALUES: Array<{ value: PivotValue; label: string; description?: string }> = [
  { value: 'quantity', label: 'Menge', description: 'Futtermenge in kg' },
  { value: 'cost', label: 'Kosten', description: 'Gesamtkosten in €' },
  { value: 'avg_price', label: 'Ø Preis', description: 'Durchschnittspreis pro Einheit' },
  { value: 'min_price', label: 'Min. Preis', description: 'Niedrigster Preis' },
  { value: 'max_price', label: 'Max. Preis', description: 'Höchster Preis' },
  { value: 'count', label: 'Anzahl', description: 'Anzahl der Einträge' }
]

function ReportsContent() {
  const [rawConsumptionData, setRawConsumptionData] = useState<ConsumptionDataRow[]>([])
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const { subscription, planConfig } = useSubscription()
  const supabase = createClient()

  // Check if user has export permissions
  const canExport = subscription?.has_advanced_analytics || subscription?.plan_type === 'professional' || subscription?.plan_type === 'enterprise'

  // Check if user can save pivot configs (Professional/Enterprise only)
  const canSavePivotConfigs = planConfig?.max_pivot_configs_per_farm !== 0
  const maxPivotConfigs = planConfig?.max_pivot_configs_per_farm ?? 0

  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedFeedType, setSelectedFeedType] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')

  // Pivot table configuration
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: ['week', 'feed_type'],
    columns: [],
    values: [
      { field: 'quantity', aggregation: 'sum', label: 'Menge (kg)' }
    ],
    showGrandTotals: true,
    showSubtotals: false
  })

  // Generate pivot table data
  const [pivotData, setPivotData] = useState<PivotTableData>({
    columnHeaders: [],
    rows: [],
    grandTotals: undefined
  })

  // Saved pivot configs state
  const [savedPivotConfigs, setSavedPivotConfigs] = useState<SavedPivotConfig[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Load saved pivot configurations
  const loadSavedConfigs = useCallback(async () => {
    if (!currentFarmId) return

    try {
      const configs = await getSavedPivotConfigs(currentFarmId)
      setSavedPivotConfigs(configs)
    } catch (error) {
      console.error('Pivot configs loading failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [currentFarmId])

  // Handle loading a saved configuration
  const handleLoadConfig = (config: SavedPivotConfig) => {
    setPivotConfig(config.config)
    toast.success(`Konfiguration "${config.name}" geladen`)
  }

  // Handle opening save dialog
  const handleSaveClick = () => {
    if (!canSavePivotConfigs) {
      toast.error('Pivot-Konfigurationen speichern ist nur in Professional und Enterprise Plänen verfügbar')
      return
    }
    setSaveDialogOpen(true)
  }

  // Load reports data
  const loadReports = useCallback(async () => {
    setLoading(true)

    try {
      // Use centralized data loading for consistent cost calculations
      const { consumption: data } = await loadConsumptionWithCosts(
        supabase,
        currentFarmId!,
        startDate,
        endDate,
        {
          feedTypeId: selectedFeedType,
          areaId: selectedArea
        }
      )

      if (data) {
        // Transform data to match ConsumptionDataRow interface
        const transformedData: ConsumptionDataRow[] = data.map((item: any) => ({
          date: item.date,
          feed_type_id: item.feed_types.id,
          feed_type_name: item.feed_types.name,
          area_id: item.area_id,
          area_name: item.areas?.name,
          area_group_id: item.areas?.area_group_memberships?.area_group_id,
          area_group_name: item.areas?.area_group_memberships?.area_groups?.name,
          supplier_id: item.supplier_id,
          supplier_name: item.supplier_name,
          quantity: parseFloat(item.quantity) || 0,
          total_cost: item.total_cost || 0,
          price_per_unit: item.price_per_unit || (item.total_cost && item.quantity ? item.total_cost / parseFloat(item.quantity) : 0)
        }))

        setRawConsumptionData(transformedData)
      }
    } catch (error) {
      console.error('Reports loading failed:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase, currentFarmId, startDate, endDate, selectedFeedType, selectedArea])

  useEffect(() => {
    if (currentFarmId) {
      // Set default date range (September 2025 to capture existing data)
      const endDate = new Date('2025-09-30')
      const startDate = new Date('2025-09-01')
      setEndDate(endDate.toISOString().split('T')[0])
      setStartDate(startDate.toISOString().split('T')[0])
      // Load saved configs
      loadSavedConfigs()
    }
  }, [currentFarmId, loadSavedConfigs])

  useEffect(() => {
    if (currentFarmId && startDate && endDate) {
      loadReports()
    }
  }, [currentFarmId, startDate, endDate, selectedFeedType, selectedArea, loadReports])

  // Regenerate pivot table when data or config changes
  useEffect(() => {
    if (rawConsumptionData.length > 0) {
      const newPivotData = generatePivotTable(rawConsumptionData, pivotConfig)
      setPivotData(newPivotData)
    }
  }, [rawConsumptionData, pivotConfig])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatNumber = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatInteger = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value)
  }

  const getTotalStats = () => {
    const totalQuantity = rawConsumptionData.reduce((sum, item) => sum + item.quantity, 0)
    const totalCost = rawConsumptionData.reduce((sum, item) => sum + item.total_cost, 0)
    const uniqueFeedTypes = new Set(rawConsumptionData.map(item => item.feed_type_id)).size

    return { totalQuantity, totalCost, uniqueFeedTypes }
  }


  const exportPivotToExcel = async () => {
    // Dynamic import XLSX only when export is triggered (saves ~400KB from initial bundle)
    const XLSX = await import('xlsx')

    const wb = XLSX.utils.book_new()

    // Pivot Table Sheet
    // Create header rows from columnHeaders
    const exportData: any[] = []

    // Add column header rows
    if (pivotData.columnHeaders.length > 0) {
      // Create dimension label row
      const dimensionRow = ['', ...pivotData.columnHeaders[0]]
      exportData.push(dimensionRow)

      // Add additional header rows if multi-level
      for (let i = 1; i < pivotData.columnHeaders.length; i++) {
        exportData.push(['', ...pivotData.columnHeaders[i]])
      }
    }

    // Add data rows
    pivotData.rows.forEach(row => {
      const rowData = [
        ...pivotConfig.rows.map(dim => row.dimensions[dim] || '-'),
        ...Object.values(row.cells).map(cell => cell.value)
      ]
      exportData.push(rowData)
    })

    // Add grand totals row
    if (pivotData.grandTotals) {
      const grandTotalRow = [
        'Gesamtsumme',
        ...Array(pivotConfig.rows.length - 1).fill(''),
        ...Object.values(pivotData.grandTotals).map(cell => cell.value)
      ]
      exportData.push(grandTotalRow)
    }

    const pivotWs = XLSX.utils.aoa_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, pivotWs, 'Pivot-Tabelle')

    // Raw Data Sheet
    const rawDataExport = rawConsumptionData.map(item => ({
      'Datum': item.date,
      'Futtermittel': item.feed_type_name,
      'Bereich': item.area_name || '-',
      'Gruppe': item.area_group_name || '-',
      'Lieferant': item.supplier_name || '-',
      'Menge (kg)': item.quantity,
      'Kosten (€)': item.total_cost,
      'Preis pro Einheit (€)': item.price_per_unit || 0
    }))

    const rawDataWs = XLSX.utils.json_to_sheet(rawDataExport)
    XLSX.utils.book_append_sheet(wb, rawDataWs, 'Rohdaten')

    // Summary Sheet
    const summaryData = [
      {
        'Kennzahl': 'Gesamter Futterverbrauch (kg)',
        'Wert': stats.totalQuantity
      },
      {
        'Kennzahl': 'Gesamte Futterkosten (€)',
        'Wert': stats.totalCost
      },
      {
        'Kennzahl': 'Anzahl verschiedener Futtermittel',
        'Wert': stats.uniqueFeedTypes
      },
      {
        'Kennzahl': 'Anzahl Datensätze',
        'Wert': rawConsumptionData.length
      }
    ]

    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Zusammenfassung')

    // Generate filename with current date and filter info
    const dateStr = new Date().toISOString().split('T')[0]
    const periodStr = `${startDate}_bis_${endDate}`
    const filename = `barntrack_Pivot_Berichte_${periodStr}_${dateStr}.xlsx`

    XLSX.writeFile(wb, filename)
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      <PlanUpgradeBanner
        feature="advanced_analytics"
        message="Erweiterte Berichte und Export-Funktionen sind in höheren Plänen verfügbar."
      />

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Berichte</h2>
          <p className="text-muted-foreground">
            Analysieren Sie Ihre Futterdaten
          </p>
        </div>
        <div className="flex gap-2">
          {/* Saved configs selector */}
          {canSavePivotConfigs && savedPivotConfigs.length > 0 && (
            <PivotConfigSelector
              configs={savedPivotConfigs}
              onSelect={handleLoadConfig}
              onDeleted={loadSavedConfigs}
            />
          )}

          {/* Save config button */}
          <Button
            onClick={handleSaveClick}
            variant="outline"
            disabled={!canSavePivotConfigs}
            title={!canSavePivotConfigs ? "Nur in Professional/Enterprise Plänen verfügbar" : "Als Favorit speichern"}
          >
            {canSavePivotConfigs ? (
              <Star className="h-4 w-4 mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Als Favorit speichern
          </Button>

          {/* Excel export button */}
          <Button
            onClick={canExport ? exportPivotToExcel : undefined}
            variant="outline"
            disabled={rawConsumptionData.length === 0 || !canExport}
            title={!canExport ? "Export nur in Professional/Enterprise Plänen" : undefined}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel Export
          </Button>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Von</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bis</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <Button onClick={loadReports} disabled={loading}>
              {loading ? 'Laden...' : 'Aktualisieren'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel - Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Ansicht anpassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PivotTableConfig
              config={pivotConfig}
              onChange={setPivotConfig}
              availableDimensions={AVAILABLE_DIMENSIONS}
              availableValues={AVAILABLE_VALUES}
            />
          </CardContent>
        </Card>

        {/* Pivot Table - Main Area */}
        <div className="lg:col-span-3">
          <PivotTableView
            data={pivotData}
            config={pivotConfig}
            loading={loading}
          />
        </div>
      </div>

      {/* Save Pivot Dialog */}
      <SavePivotDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        config={pivotConfig}
        farmId={currentFarmId!}
        maxAllowed={maxPivotConfigs}
        currentCount={savedPivotConfigs.length}
        onSaved={loadSavedConfigs}
      />
    </div>
  )
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsContent />
    </ErrorBoundary>
  )
}