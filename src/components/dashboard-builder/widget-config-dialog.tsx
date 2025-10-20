/**
 * Widget Configuration Dialog
 *
 * Allows users to configure widget settings like title, aggregation level, etc.
 */

'use client'

import { useState, useEffect } from 'react'
import { WidgetInstance } from '@/types/dashboard'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface WidgetConfigDialogProps {
  widget: WidgetInstance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetConfigDialog({
  widget,
  open,
  onOpenChange,
}: WidgetConfigDialogProps) {
  const { updateWidget } = useDashboardStore()
  const [title, setTitle] = useState(widget?.title || '')
  const [aggregationLevel, setAggregationLevel] = useState<'day' | 'week' | 'month'>(
    (widget?.config as any)?.aggregationLevel || 'month'
  )
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when widget changes
  useEffect(() => {
    if (widget) {
      setTitle(widget.title)
      setAggregationLevel((widget.config as any)?.aggregationLevel || 'month')
    }
  }, [widget])

  if (!widget) return null

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Update widget with new configuration
      const updates: any = {
        title,
      }

      // Only add aggregationLevel if it's relevant for this widget type
      const config = widget.config as any
      const hasTimeBasedData =
        (config.groupBy === 'date' || config.xAxis === 'date' || !config.groupBy) &&
        (widget.widget_type === 'chart' || config.supplierChartType === 'costTrend')

      if (hasTimeBasedData) {
        updates.config = {
          ...widget.config,
          aggregationLevel,
        }
      }

      await updateWidget(widget.id, updates)
      toast.success('Widget-Einstellungen gespeichert')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving widget config:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if this widget supports time aggregation
  const config = widget.config as any
  const supportsTimeAggregation =
    (config.groupBy === 'date' || config.xAxis === 'date' || !config.groupBy) &&
    (widget.widget_type === 'chart' || config.supplierChartType === 'costTrend')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Widget konfigurieren</DialogTitle>
          <DialogDescription>
            Passen Sie die Einstellungen für dieses Widget an.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="widget-title">Titel</Label>
            <Input
              id="widget-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget-Titel eingeben"
            />
          </div>

          {/* Aggregation Level Selector (only for time-based charts) */}
          {supportsTimeAggregation && (
            <div className="space-y-2">
              <Label htmlFor="aggregation-level">Zeitraum-Aggregation</Label>
              <Select
                value={aggregationLevel}
                onValueChange={(value: 'day' | 'week' | 'month') =>
                  setAggregationLevel(value)
                }
              >
                <SelectTrigger id="aggregation-level">
                  <SelectValue placeholder="Wählen Sie eine Aggregationsebene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Tag</SelectItem>
                  <SelectItem value="week">Woche</SelectItem>
                  <SelectItem value="month">Monat</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Bestimmt, wie Zeitdaten gruppiert werden (z.B. nach Tag, Woche oder Monat)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
