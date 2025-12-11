/**
 * Widget Renderer Component
 *
 * Renders the appropriate widget component based on widget type
 */

'use client'

import { WidgetInstance } from '@/types/dashboard'
import { StatWidget } from './stat-widget'
import { ChartWidget } from './chart-widget'
import { TableWidget } from './table-widget'
import { CycleTableWidget } from './cycle-table-widget'
import { CycleStatWidget } from './cycle-stat-widget'
import { CycleChartWidget } from './cycle-chart-widget'
import { CycleComparisonWidget } from './cycle-comparison-widget'
import { FeedComparisonWidget } from './feed-comparison-widget'
import { SupplierTableWidget } from './supplier-table-widget'
import { SupplierChartWidget } from './supplier-chart-widget'
import { GaugeWidget } from './gauge-widget'
import { HeatmapWidget } from './heatmap-widget'
import { WaterfallWidget } from './waterfall-widget'
import { ScatterWidget } from './scatter-widget'

interface WidgetRendererProps {
  widget: WidgetInstance
  isEditMode: boolean
  onConfigure?: (widget: WidgetInstance) => void
  onDelete?: (widgetId: string) => void
}

export function WidgetRenderer({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: WidgetRendererProps) {
  const handleConfigure = () => {
    onConfigure?.(widget)
  }

  const handleDelete = () => {
    onDelete?.(widget.id)
  }

  // Check for specific cycle widgets first
  const widgetName = widget.name || widget.template_name

  console.log('WidgetRenderer:', {
    id: widget.id,
    widgetName,
    template_name: widget.template_name,
    widget_type: widget.widget_type,
    config: widget.config
  })

  if (widgetName === 'cycle_table' || widgetName?.includes('cycle_table')) {
    return (
      <CycleTableWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  if (widgetName === 'cycle_stat' || widgetName?.includes('cycle_stat') ||
      widgetName === 'active_cycles_stat' || widgetName?.includes('active_cycles')) {
    return (
      <CycleStatWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  if (widgetName === 'cycle_chart' || widgetName?.includes('cycle_chart') ||
      widgetName === 'cycle_profit_chart' || widgetName === 'cycle_performance_chart') {
    return (
      <CycleChartWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  // Check for cycle comparison widget
  if (widgetName === 'cycle_comparison' || widgetName?.includes('cycle_comparison')) {
    return (
      <CycleComparisonWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  // Check for feed comparison widget
  if (widgetName === 'feed_comparison' || widgetName?.includes('feed_comparison')) {
    return (
      <FeedComparisonWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  // Check for supplier widgets
  if (widgetName === 'supplier_table' || widgetName?.includes('supplier_table')) {
    return (
      <SupplierTableWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  if (widgetName?.includes('supplier_') &&
      (widgetName?.includes('chart') || widgetName?.includes('share') ||
       widgetName?.includes('breakdown') || widgetName?.includes('trend') ||
       widgetName?.includes('comparison'))) {
    return (
      <SupplierChartWidget
        widget={widget}
        isEditMode={isEditMode}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />
    )
  }

  // Fall back to generic widget types
  switch (widget.widget_type) {
    case 'stat':
      return (
        <StatWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'chart':
      return (
        <ChartWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'table':
      return (
        <TableWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'gauge':
      return (
        <GaugeWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'activity':
      // TODO: Implement activity widget
      return (
        <div className="p-4 text-muted-foreground">
          Activity Widget (coming soon)
        </div>
      )

    case 'heatmap':
      return (
        <HeatmapWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'waterfall':
      return (
        <WaterfallWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    case 'scatter':
      return (
        <ScatterWidget
          widget={widget}
          isEditMode={isEditMode}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )

    default:
      return (
        <div className="p-4 text-destructive">
          Unknown widget type: {widget.widget_type}
        </div>
      )
  }
}
