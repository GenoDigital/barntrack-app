/**
 * Scatter Plot Widget Component
 *
 * Displays scatter plots to identify correlations and outliers
 * Used for FCR vs Profit analysis, duration vs profitability, etc.
 */

'use client'

import { useEffect } from 'react'
import { BaseWidgetProps, ScatterWidgetConfig } from '@/types/dashboard'
import { useScatterWidgetData } from '@/lib/hooks/use-widget-data'
import { WidgetWrapper } from './base/widget-wrapper'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

const chartConfig: ChartConfig = {
  x: {
    label: 'X-Achse',
    color: 'var(--chart-1)',
  },
  y: {
    label: 'Y-Achse',
    color: 'var(--chart-2)',
  },
}

export function ScatterWidget({ widget, isEditMode, onConfigure, onDelete }: BaseWidgetProps) {
  const { data, isLoading, error, refetch } = useScatterWidgetData(widget)
  const config = widget.config as ScatterWidgetConfig

  useEffect(() => {
    refetch()
  }, [widget.config, refetch])

  // Guard against null data
  if (!data || !data.points) {
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

  // Transform data for scatter chart
  const scatterData = data.points.map((point: any) => ({
    x: point.x,
    y: point.y,
    z: point.size || 100, // For point sizing
    name: point.label || '',
    group: point.group || 'default',
  }))

  // Group points by category if groupBy is specified
  const groups = config.groupBy
    ? [...new Set(scatterData.map((p: any) => p.group))]
    : ['all']

  const colors = config.colors || [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  const getPointColor = (group: string) => {
    const index = groups.indexOf(group)
    return colors[index % colors.length]
  }

  const formatValue = (value: number, axis: 'x' | 'y') => {
    const axisConfig = axis === 'x' ? config.xAxis : config.yAxis

    // Determine format based on field name
    if (axisConfig.field.includes('cost') || axisConfig.field.includes('profit') || axisConfig.field.includes('revenue')) {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    } else if (axisConfig.field.includes('rate') || axisConfig.field.includes('margin')) {
      return `${value.toFixed(1)}%`
    } else if (axisConfig.field.includes('duration') || axisConfig.field.includes('days')) {
      return `${Math.round(value)} Tage`
    } else if (axisConfig.field === 'fcr' || axisConfig.field.includes('ratio')) {
      return value.toFixed(2)
    }

    return value.toFixed(1)
  }

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
      <div className="h-full">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={config.xAxis.label}
              label={{
                value: config.xAxis.label,
                position: 'bottom',
                offset: 0,
              }}
              tickFormatter={(value) => formatValue(value, 'x')}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={config.yAxis.label}
              label={{
                value: config.yAxis.label,
                angle: -90,
                position: 'insideLeft',
              }}
              tickFormatter={(value) => formatValue(value, 'y')}
              tick={{ fontSize: 11 }}
            />
            {config.pointSize && (
              <ZAxis
                type="number"
                dataKey="z"
                range={[config.pointSize.min, config.pointSize.max]}
              />
            )}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: string, entry: any) => {
                    const point = entry.payload
                    return (
                      <div className="space-y-1">
                        {point.name && (
                          <div className="font-medium">{point.name}</div>
                        )}
                        <div>
                          <span>{config.xAxis.label}: </span>
                          <span className="font-medium">{formatValue(point.x, 'x')}</span>
                        </div>
                        <div>
                          <span>{config.yAxis.label}: </span>
                          <span className="font-medium">{formatValue(point.y, 'y')}</span>
                        </div>
                        {config.groupBy && (
                          <div>
                            <span>Gruppe: </span>
                            <span className="font-medium">{point.group}</span>
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
              }
            />

            {/* Quadrant reference lines */}
            {config.showQuadrants && config.quadrantThresholds && (
              <>
                <ReferenceLine
                  x={config.quadrantThresholds.x}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: 'Ziel', position: 'top' }}
                />
                <ReferenceLine
                  y={config.quadrantThresholds.y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: 'Ziel', position: 'right' }}
                />
              </>
            )}

            {/* Render scatter points */}
            {config.groupBy ? (
              groups.map((group) => (
                <Scatter
                  key={group}
                  name={group}
                  data={scatterData.filter((p: any) => p.group === group)}
                  fill={getPointColor(group)}
                />
              ))
            ) : (
              <Scatter
                name="Data"
                data={scatterData}
                fill={colors[0]}
              />
            )}
          </ScatterChart>
        </ChartContainer>

        {/* Legend for groups */}
        {config.groupBy && groups.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {groups.map((group) => (
              <div key={group} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getPointColor(group) }}
                />
                <span>{group}</span>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {data.stats && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Datenpunkte: </span>
              <span className="font-medium">{data.stats.count}</span>
            </div>
            {data.stats.correlation != null && (
              <div>
                <span className="text-muted-foreground">Korrelation: </span>
                <span className="font-medium">{data.stats.correlation.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}

export default ScatterWidget
