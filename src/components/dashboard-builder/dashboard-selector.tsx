/**
 * Dashboard Selector Component
 *
 * Allows users to switch between dashboards and create new ones
 */

'use client'

import { useState, useEffect } from 'react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, Plus, Star, Trash2, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function DashboardSelector() {
  const { currentFarmId } = useFarmStore()
  const { canCreateDashboard: checkDashboardLimit, getPlanName } = useSubscription()
  const {
    currentDashboard,
    dashboards,
    loadDashboard,
    createDashboard,
    deleteDashboard,
    setDefaultDashboard,
  } = useDashboardStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState('')
  const [newDashboardDescription, setNewDashboardDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [dashboardLimits, setDashboardLimits] = useState<{
    canCreate: boolean
    currentCount: number
    maxAllowed: number
    message: string
  } | null>(null)

  // Fetch dashboard limits
  useEffect(() => {
    async function fetchLimits() {
      if (!currentFarmId) return

      const limits = await checkDashboardLimit(currentFarmId)
      setDashboardLimits(limits)
    }

    fetchLimits()
  }, [currentFarmId, dashboards.length, checkDashboardLimit])

  const handleSwitchDashboard = async (dashboardId: string) => {
    try {
      await loadDashboard(dashboardId)
      toast.success('Dashboard gewechselt')
    } catch (error) {
      console.error('Error switching dashboard:', error)
      toast.error('Fehler beim Wechseln des Dashboards')
    }
  }

  const handleCreateDashboard = async () => {
    if (!currentFarmId) {
      toast.error('Keine Farm ausgewählt')
      return
    }

    if (!newDashboardName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    // Check limits before creating
    if (dashboardLimits && !dashboardLimits.canCreate) {
      toast.error(dashboardLimits.message)
      return
    }

    setIsCreating(true)
    try {
      const newDashboard = await createDashboard({
        farm_id: currentFarmId,
        name: newDashboardName.trim(),
        description: newDashboardDescription.trim() || undefined,
        is_default: dashboards.length === 0,
      })

      if (newDashboard) {
        await loadDashboard(newDashboard.id)
        toast.success('Dashboard erstellt')
        setIsCreateDialogOpen(false)
        setNewDashboardName('')
        setNewDashboardDescription('')

        // Refresh limits
        const limits = await checkDashboardLimit(currentFarmId)
        setDashboardLimits(limits)
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen des Dashboards'
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteDashboard = async (dashboardId: string, dashboardName: string) => {
    if (dashboards.length <= 1) {
      toast.error('Sie müssen mindestens ein Dashboard behalten')
      return
    }

    if (!confirm(`Dashboard "${dashboardName}" wirklich löschen?`)) {
      return
    }

    try {
      await deleteDashboard(dashboardId)
      toast.success('Dashboard gelöscht')
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      toast.error('Fehler beim Löschen des Dashboards')
    }
  }

  const handleSetDefault = async (dashboardId: string) => {
    try {
      await setDefaultDashboard(dashboardId)
      toast.success('Standard-Dashboard festgelegt')
    } catch (error) {
      console.error('Error setting default dashboard:', error)
      toast.error('Fehler beim Festlegen des Standard-Dashboards')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {currentDashboard?.name || 'Dashboard auswählen'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Dashboards</span>
            {dashboardLimits && (
              <span className="text-xs font-normal text-muted-foreground">
                {dashboardLimits.currentCount} / {dashboardLimits.maxAllowed === -1 ? '∞' : dashboardLimits.maxAllowed}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {dashboards.map((dashboard) => (
            <DropdownMenuItem
              key={dashboard.id}
              className="flex items-center justify-between"
              onClick={() => handleSwitchDashboard(dashboard.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                {dashboard.is_default && (
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                )}
                <div className="flex flex-col">
                  <span className={currentDashboard?.id === dashboard.id ? 'font-semibold' : ''}>
                    {dashboard.name}
                  </span>
                  {dashboard.description && (
                    <span className="text-xs text-muted-foreground">
                      {dashboard.description}
                    </span>
                  )}
                </div>
              </div>

              {currentDashboard?.id === dashboard.id && (
                <div className="flex items-center gap-1">
                  {!dashboard.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetDefault(dashboard.id)
                      }}
                      title="Als Standard festlegen"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  {dashboards.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDashboard(dashboard.id, dashboard.name)
                      }}
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          {dashboardLimits && !dashboardLimits.canCreate ? (
            <DropdownMenuItem disabled className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Neues Dashboard
              </div>
              <span className="text-xs text-muted-foreground">Limit erreicht</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Dashboard
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          {dashboardLimits && !dashboardLimits.canCreate ? (
            // Show upgrade prompt if limit reached
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Dashboard-Limit erreicht
                </DialogTitle>
                <DialogDescription>
                  Sie haben das Maximum von {dashboardLimits.maxAllowed} Dashboard{dashboardLimits.maxAllowed !== 1 ? 's' : ''} pro Betrieb erreicht.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6">
                <div className="bg-muted/50 border rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-2">Upgraden Sie für mehr Dashboards:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Professional: 3 Dashboards pro Betrieb</li>
                        <li>• Enterprise: 10 Dashboards pro Betrieb</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Ihr aktueller Plan: <strong>{getPlanName()}</strong>
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Schließen
                </Button>
                <Link href="/dashboard/abonnement">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Plan upgraden
                  </Button>
                </Link>
              </DialogFooter>
            </>
          ) : (
            // Show normal create form
            <>
              <DialogHeader>
                <DialogTitle>Neues Dashboard erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie ein neues Dashboard für Ihre Analysen
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-name">Name *</Label>
                  <Input
                    id="dashboard-name"
                    placeholder="z.B. Produktions-Dashboard"
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDashboardName.trim()) {
                        handleCreateDashboard()
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Beschreibung</Label>
                  <Input
                    id="dashboard-description"
                    placeholder="Optionale Beschreibung"
                    value={newDashboardDescription}
                    onChange={(e) => setNewDashboardDescription(e.target.value)}
                  />
                </div>

                {dashboardLimits && (
                  <p className="text-xs text-muted-foreground">
                    {dashboardLimits.currentCount} / {dashboardLimits.maxAllowed === -1 ? '∞' : dashboardLimits.maxAllowed} Dashboards verwendet
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewDashboardName('')
                    setNewDashboardDescription('')
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleCreateDashboard}
                  disabled={!newDashboardName.trim() || isCreating}
                >
                  {isCreating ? 'Erstelle...' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
