/**
 * Supplier Chart Widget Component
 *
 * Displays supplier-related charts (cost breakdown, quantity comparison, cost trends)
 * Uses shadcn/ui Chart components with Recharts
 */

'use client'

import { useMemo } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { BaseWidgetProps } from '@/types/dashboard'
import { useSupplierWidgetData } from '@/lib/hooks/use-widget-data'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const chartConfig: ChartConfig = {
  quantity: {
    label: 'Menge (kg)',
    color: 'var(--chart-1)',
  },
  value: {
    label: 'Kosten',
    color: 'var(--chart-2)',
  },
}

export function SupplierChartWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useSupplierWidgetData(widget)
  const config = widget.config || {}

  // Build dynamic chart config for suppliers
  const dynamicChartConfig = useMemo(() => {
    if (!data || data.length === 0) return chartConfig

    const supplierNames = new Set<string>()
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'name' && key !== 'value' && key !== 'quantity') {
          supplierNames.add(key)
        }
      })
    })

    const dynamicConfig: ChartConfig = { ...chartConfig }
    Array.from(supplierNames).forEach((supplier, index) => {
      // Normalize supplier name for CSS variable
      const normalizedKey = supplier.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      dynamicConfig[normalizedKey] = {
        label: supplier,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })

    return dynamicConfig
  }, [data])

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Keine Daten verfügbar
        </div>
      )
    }

    const chartType = config.supplierChartType || 'costBreakdown'

    // Debug logging
    if (chartType === 'share') {
      console.log('Supplier share data:', data)
      console.log('Dynamic chart config:', dynamicChartConfig)
    }

    switch (chartType) {
      case 'costBreakdown':
        // Pie chart showing cost distribution by supplier
        const pieData = data.map((entry, index) => ({
          ...entry,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }))

        return (
          <ChartContainer config={chartConfig} className="aspect-square h-full w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                label={(entry) => `${entry.name}: €${entry.value.toFixed(0)}`}
              />
            </PieChart>
          </ChartContainer>
        )

      case 'quantityComparison':
        // Bar chart comparing quantities between suppliers
        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="quantity"
                fill="var(--color-quantity)"
                name="Menge (kg)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )

      case 'share':
        // Stacked bar chart showing feed distribution by supplier
        // Extract all supplier names from data
        const supplierNames = new Set<string>()
        data.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key !== 'name') {
              supplierNames.add(key)
            }
          })
        })

        return (
          <ChartContainer config={dynamicChartConfig} className="h-full w-full">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Array.from(supplierNames).map((supplier, index) => {
                const normalizedKey = supplier.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                return (
                  <Bar
                    key={supplier}
                    dataKey={supplier}
                    stackId="a"
                    fill={`var(--color-${normalizedKey})`}
                    radius={index === supplierNames.size - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                )
              })}
            </BarChart>
          </ChartContainer>
        )

      case 'costTrend':
        // Line chart showing cost trends over time by supplier
        // Extract all supplier names from data
        const supplierNamesForTrend = new Set<string>()
        data.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key !== 'name') {
              supplierNamesForTrend.add(key)
            }
          })
        })

        return (
          <ChartContainer config={dynamicChartConfig} className="h-full w-full">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Array.from(supplierNamesForTrend).map((supplier, index) => {
                const normalizedKey = supplier.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                return (
                  <Line
                    key={supplier}
                    type="monotone"
                    dataKey={supplier}
                    stroke={`var(--color-${normalizedKey})`}
                    strokeWidth={2}
                    dot={true}
                    name={supplier}
                  />
                )
              })}
            </LineChart>
          </ChartContainer>
        )

      default:
        return <div>Unbekannter Chart-Typ</div>
    }
  }

  return (
    <WidgetWrapper
      title={widget.title}
      description={config.description}
      isEditMode={isEditMode}
      onConfigure={onConfigure}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error}
    >
      <div className="h-full min-h-[200px]">{renderChart()}</div>
    </WidgetWrapper>
  )
}
