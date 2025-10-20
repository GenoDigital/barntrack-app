/**
 * Heatmap Widget Component
 *
 * Displays heatmaps to visualize patterns across two dimensions
 * Used for performance analysis, cost patterns, and trend identification
 */

'use client'

import { useEffect, useMemo } from 'react'
import { BaseWidgetProps, HeatmapWidgetConfig } from '@/types/dashboard'
import { useHeatmapWidgetData } from '@/lib/hooks/use-widget-data'
import { WidgetWrapper } from './base/widget-wrapper'

export function HeatmapWidget({ widget, isEditMode, onConfigure, onDelete }: BaseWidgetProps) {
  const { data, isLoading, error, refetch } = useHeatmapWidgetData(widget)
  const config = widget.config as HeatmapWidgetConfig

  useEffect(() => {
    refetch()
  }, [widget.config, refetch])

  // Calculate color scale
  const { min, max, getColor } = useMemo(() => {
    if (!data || !data.cells) return { min: 0, max: 0, getColor: () => '#ccc' }

    const values = data.cells.map((cell: any) => cell.value).filter((v: number) => v != null)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal

    const colorScale = config.colorScale || {
      min: '#fee5d9',
      mid: '#fc8d59',
      max: '#d7301f',
    }

    const getColor = (value: number | null) => {
      if (value == null) return '#f0f0f0'
      if (range === 0) return colorScale.mid

      const normalized = (value - minVal) / range

      // Interpolate between colors
      if (normalized < 0.5) {
        // Between min and mid
        const t = normalized * 2
        return interpolateColor(colorScale.min, colorScale.mid, t)
      } else {
        // Between mid and max
        const t = (normalized - 0.5) * 2
        return interpolateColor(colorScale.mid, colorScale.max, t)
      }
    }

    return { min: minVal, max: maxVal, getColor }
  }, [data, config.colorScale])

  // Helper function to interpolate between two hex colors
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const c1 = parseInt(color1.slice(1), 16)
    const c2 = parseInt(color2.slice(1), 16)

    const r1 = (c1 >> 16) & 255
    const g1 = (c1 >> 8) & 255
    const b1 = c1 & 255

    const r2 = (c2 >> 16) & 255
    const g2 = (c2 >> 8) & 255
    const b2 = c2 & 255

    const r = Math.round(r1 + factor * (r2 - r1))
    const g = Math.round(g1 + factor * (g2 - g1))
    const b = Math.round(b1 + factor * (b2 - b1))

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const formatValue = (value: number | null) => {
    if (value == null) return '-'

    switch (config.metric) {
      case 'cost':
      case 'profit':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'fcr':
      case 'feed_efficiency':
        return value.toFixed(2)
      case 'mortality_rate':
        return `${value.toFixed(1)}%`
      default:
        return value.toFixed(1)
    }
  }

  // Guard against null data
  if (!data || !data.cells) {
    return (
      <WidgetWrapper
        title={widget.title}
        description={config.description}
        isEditMode={isEditMode}
        onConfigure={() => onConfigure?.(widget)}
        onDelete={() => onDelete?.(widget.id)}
        isLoading={isLoading}
        error={error || undefined}
      >
        <div />
      </WidgetWrapper>
    )
  }

  // Get unique x and y values for grid
  const xValues = [...new Set(data.cells.map((cell: any) => cell.x))].sort()
  const yValues = [...new Set(data.cells.map((cell: any) => cell.y))].sort()

  // Create grid lookup
  const cellMap = new Map()
  data.cells.forEach((cell: any) => {
    cellMap.set(`${cell.x}_${cell.y}`, cell.value)
  })

  return (
    <WidgetWrapper
      title={widget.title}
      description={config.description}
      isEditMode={isEditMode}
      onConfigure={() => onConfigure?.(widget)}
      onDelete={() => onDelete?.(widget.id)}
      isLoading={isLoading}
      error={error || undefined}
    >
      <div className="overflow-auto h-full">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border p-2 bg-muted sticky left-0 z-10"></th>
                {xValues.map((x) => (
                  <th key={x} className="border p-2 bg-muted min-w-[80px] text-center">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yValues.map((y) => (
                <tr key={y}>
                  <td className="border p-2 bg-muted font-medium sticky left-0 z-10">
                    {y}
                  </td>
                  {xValues.map((x) => {
                    const value = cellMap.get(`${x}_${y}`)
                    const bgColor = getColor(value)
                    const textColor = value != null && (value - min) / (max - min) > 0.6
                      ? '#ffffff'
                      : '#000000'

                    return (
                      <td
                        key={`${x}_${y}`}
                        className="border p-2 text-center transition-colors hover:opacity-80 cursor-pointer"
                        style={{ backgroundColor: bgColor, color: textColor }}
                        title={`${y} - ${x}: ${formatValue(value)}`}
                      >
                        {config.showValues !== false ? formatValue(value) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          {config.showLegend !== false && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <span>Min: {formatValue(min)}</span>
              <div className="flex-1 mx-4 h-4 rounded"
                style={{
                  background: `linear-gradient(to right, ${config.colorScale?.min || '#fee5d9'}, ${config.colorScale?.mid || '#fc8d59'}, ${config.colorScale?.max || '#d7301f'})`
                }}
              />
              <span>Max: {formatValue(max)}</span>
            </div>
          )}
        </div>
    </WidgetWrapper>
  )
}

export default HeatmapWidget
