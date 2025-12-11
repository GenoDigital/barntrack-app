/**
 * Dashboard Page
 *
 * Main page for customizable dashboards with drag-and-drop widgets
 */

'use client'

import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { DashboardGridLayout } from '@/components/dashboard-builder/grid-layout'
import { WidgetRenderer } from '@/components/widgets/widget-renderer'
import { WidgetLibraryDialog } from '@/components/dashboard-builder/widget-library-dialog'
import { WidgetConfigDialog } from '@/components/dashboard-builder/widget-config-dialog'
import { DateRangeSelector } from '@/components/dashboard-builder/date-range-selector'
import { DashboardSelector } from '@/components/dashboard-builder/dashboard-selector'
import { Button } from '@/components/ui/button'
import { Plus, Save, Edit, Eye, Loader2, X, Lock, Sparkles } from 'lucide-react'
import { getDashboards, getDefaultDashboard, createDashboard } from '@/lib/services/dashboard-service'
import { toast } from 'sonner'
import { WidgetInstance } from '@/types/dashboard'
import Link from 'next/link'

export default function DashboardPage() {
  const { currentFarmId } = useFarmStore()
  const { hasCustomDashboards, getPlanName, loading: subscriptionLoading } = useSubscription()
  const {
    currentDashboard,
    widgets,
    isEditMode,
    isSaving,
    setCurrentDashboard,
    setDashboards,
    setWidgets,
    setEditMode,
    loadDashboard,
    saveDashboard,
    removeWidget,
    cancelEdit,
  } = useDashboardStore()

  const [isLoading, setIsLoading] = useState(true)
  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  // Load dashboard on mount
  useEffect(() => {
    async function loadInitialDashboard() {
      if (!currentFarmId) return

      setIsLoading(true)

      try {
        // Fetch dashboards and default in parallel to minimize latency
        const [dashboards, defaultDashboard] = await Promise.all([
          getDashboards(currentFarmId),
          getDefaultDashboard(currentFarmId)
        ])
        setDashboards(dashboards)

        // Use default dashboard or first available
        let dashboard = defaultDashboard

        if (!dashboard && dashboards.length > 0) {
          dashboard = dashboards[0]
        }

        if (!dashboard) {
          // Create a default dashboard
          dashboard = await createDashboard({
            farm_id: currentFarmId,
            name: 'Mein Dashboard',
            description: 'Standard Dashboard',
            is_default: true,
          })
        }

        if (dashboard) {
          await loadDashboard(dashboard.id)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        toast.error('Fehler beim Laden des Dashboards')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialDashboard()
  }, [currentFarmId])

  const handleSave = async () => {
    try {
      await saveDashboard()
      toast.success('Dashboard gespeichert')
      setEditMode(false)
    } catch (error) {
      console.error('Error saving dashboard:', error)
      toast.error('Fehler beim Speichern')
    }
  }

  const handleCancel = () => {
    cancelEdit()
    toast.info('Änderungen verworfen')
  }

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Save when exiting edit mode
      handleSave()
    } else {
      setEditMode(true)
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await removeWidget(widgetId)
      toast.success('Widget gelöscht')
    } catch (error) {
      console.error('Error deleting widget:', error)
      toast.error('Fehler beim Löschen')
    }
  }

  const handleConfigureWidget = (widget: WidgetInstance) => {
    setSelectedWidget(widget)
    setIsConfigDialogOpen(true)
  }

  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    )
  }

  // Feature gate: Check if user has access to custom dashboards
  if (!hasCustomDashboards()) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="max-w-md space-y-6 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              Custom Dashboards
            </h2>
            <p className="text-muted-foreground">
              Diese Funktion ist nur in den Professional und Enterprise Plänen verfügbar.
            </p>
          </div>

          <div className="bg-muted/50 border rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3 text-left">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Mit Custom Dashboards erhalten Sie:</p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left ml-8">
              <li>• Individuell anpassbare Dashboard-Layouts</li>
              <li>• Drag & Drop Widget-Verwaltung</li>
              <li>• Mehrere Dashboards pro Betrieb</li>
              <li>• Erweiterte Analyse-Widgets</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/abonnement">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Jetzt upgraden
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Ihr aktueller Plan: <strong>{getPlanName()}</strong>
          </p>
        </div>
      </div>
    )
  }

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Kein Dashboard gefunden</p>
          <Button onClick={() => window.location.reload()}>
            Neu laden
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {currentDashboard.name}
            </h2>
            {currentDashboard.description && (
              <p className="text-muted-foreground">
                {currentDashboard.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dashboard Selector */}
          <DashboardSelector />

          <div className="h-6 w-px bg-border" />
          {/* Date Range Selector */}
          <DateRangeSelector />

          <div className="h-6 w-px bg-border" />

          {isEditMode && (
            <WidgetLibraryDialog>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Widget hinzufügen
              </Button>
            </WidgetLibraryDialog>
          )}

          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </>
          )}

          {!isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              Bearbeitungsmodus aktiv
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ziehen Sie Widgets, um sie neu anzuordnen. Klicken Sie auf "Speichern", um Änderungen zu übernehmen, oder auf "Abbrechen", um sie zu verwerfen.
          </p>
        </div>
      )}

      {/* Dashboard Grid */}
      {widgets.length > 0 ? (
        <DashboardGridLayout>
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetRenderer
                widget={widget}
                isEditMode={isEditMode}
                onConfigure={handleConfigureWidget}
                onDelete={handleDeleteWidget}
              />
            </div>
          ))}
        </DashboardGridLayout>
      ) : (
        <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Noch keine Widgets vorhanden
            </p>
            {isEditMode && (
              <WidgetLibraryDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Widget hinzufügen
                </Button>
              </WidgetLibraryDialog>
            )}
          </div>
        </div>
      )}

      {/* Widget Configuration Dialog */}
      <WidgetConfigDialog
        widget={selectedWidget}
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
      />
    </div>
  )
}
