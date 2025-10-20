/**
 * Waterfall Chart Widget Component
 *
 * Displays waterfall charts showing cumulative effect of sequential values
 * Used for profit bridges, cost breakdowns, and progressive analysis
 */

'use client'

import { useEffect } from 'react'
import { BaseWidgetProps, WaterfallWidgetConfig } from '@/types/dashboard'
import { useWaterfallWidgetData } from '@/lib/hooks/use-widget-data'
import { WidgetWrapper } from './base/widget-wrapper'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

const chartConfig: ChartConfig = {
  value: {
    label: 'Wert',
    color: 'var(--chart-1)',
  },
  positive: {
    label: 'Positiv',
    color: 'hsl(var(--chart-2))', // Green
  },
  negative: {
    label: 'Negativ',
    color: 'hsl(var(--chart-3))', // Red
  },
  total: {
    label: 'Gesamt',
    color: 'hsl(var(--chart-4))', // Blue
  },
}

export function WaterfallWidget({ widget, isEditMode, onConfigure, onDelete }: BaseWidgetProps) {
  const { data, isLoading, error, refetch } = useWaterfallWidgetData(widget)
  const config = widget.config as WaterfallWidgetConfig

  useEffect(() => {
    refetch()
  }, [widget.config, refetch])

  // Guard against null data
  if (!data || !data.steps) {
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

  // Transform data for waterfall chart
  // Each step shows the cumulative value, and we use different colors for positive/negative/total
  const waterfallData = data.steps.map((step: any, index: number) => {
    return {
      name: step.label,
      value: step.cumulativeValue,
      change: step.value,
      isTotal: step.isTotal || false,
      isPositive: step.value >= 0,
      // For display, we need base and height for stacked bar effect
      base: step.baseValue,
      height: Math.abs(step.value),
    }
  })

  const getBarColor = (entry: any) => {
    if (entry.isTotal) return config.colors?.total || chartConfig.total.color
    if (entry.isPositive) return config.colors?.positive || chartConfig.positive.color
    return config.colors?.negative || chartConfig.negative.color
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: string, entry: any) => {
                    const change = entry.payload?.change || 0
                    const total = entry.payload?.value || 0
                    return (
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Änderung: </span>
                          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(change)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Gesamt: </span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Summary */}
        {data.summary && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Gesamt:</span>
              <span className={`font-bold ${data.summary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}

export default WaterfallWidget
