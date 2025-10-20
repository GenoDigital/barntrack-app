/**
 * Chart Widget Component
 *
 * Displays charts using Recharts library with shadcn/ui styling
 */

'use client'

import { useMemo, useState } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { useChartWidgetData } from '@/lib/hooks/use-widget-data'
import { BaseWidgetProps, ChartWidgetConfig } from '@/types/dashboard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function ChartWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useChartWidgetData(widget)
  const config = widget.config as ChartWidgetConfig

  // Process data based on chart configuration
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    // Determine grouping dimension from xAxis or groupBy config
    const groupBy = config.xAxis || config.groupBy || 'date'
    const aggregationLevel = config.aggregationLevel || 'month' // day, week, month

    // Helper function to get period key from date
    const getPeriodKey = (dateStr: string) => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const week = Math.ceil(date.getDate() / 7)

      switch (aggregationLevel) {
        case 'day':
          return `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        case 'week':
          return `${year}-W${String(week).padStart(2, '0')}`
        case 'month':
        default:
          return `${year}-${String(month).padStart(2, '0')}`
      }
    }

    // Helper function to format period label with year
    const formatPeriodLabel = (periodKey: string) => {
      if (aggregationLevel === 'day') {
        const [year, month, day] = periodKey.split('-')
        return `${day}.${month}.${year}`
      } else if (aggregationLevel === 'week') {
        const [year, week] = periodKey.split('-W')
        return `KW${week} ${year}`
      } else {
        // month
        const [year, month] = periodKey.split('-')
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
        return `${monthNames[parseInt(month) - 1]} ${year}`
      }
    }

    switch (config.chartType) {
      case 'line':
      case 'bar':
      case 'area': {
        // Group data by the specified dimension
        const dataMap = new Map<string, { label: string; cost: number; quantity: number; sortKey: string }>()

        data.forEach((item: any) => {
          let key: string
          let label: string
          let sortKey: string

          // Determine the grouping key based on config
          switch (groupBy) {
            case 'area':
              key = item.area_id || 'none'
              label = item.areas?.name || 'Kein Bereich'
              sortKey = label
              break

            case 'area_group':
              // Handle many-to-many relationship through area_group_memberships
              // Supabase may return this as either an object or array
              const memberships = item.areas?.area_group_memberships

              if (memberships) {
                // Handle both single object and array cases
                const membership = Array.isArray(memberships) ? memberships[0] : memberships

                if (membership?.area_group_id) {
                  key = membership.area_group_id
                  label = membership.area_groups?.name || 'Keine Gruppe'
                } else {
                  key = 'none'
                  label = 'Keine Gruppe'
                }
              } else {
                key = 'none'
                label = 'Keine Gruppe'
              }
              sortKey = label
              break

            case 'feed_type':
              key = item.feed_type_id || 'none'
              label = item.feed_types?.name || 'Unbekannt'
              sortKey = label
              break

            case 'supplier':
              key = item.supplier_id || 'none'
              label = item.supplier_name || 'Kein Lieferant'
              sortKey = label
              break

            case 'date':
            default:
              // Apply time aggregation
              const periodKey = getPeriodKey(item.date)
              key = periodKey
              label = formatPeriodLabel(periodKey)
              sortKey = periodKey // Use period key for sorting
              break
          }

          const current = dataMap.get(key) || { label, cost: 0, quantity: 0, sortKey }
          dataMap.set(key, {
            label,
            cost: current.cost + (item.total_cost || 0),
            quantity: current.quantity + (item.quantity || 0),
            sortKey,
          })
        })

        // Convert to array and sort
        const result = Array.from(dataMap.values()).map(({ label, cost, quantity, sortKey }) => ({
          date: label, // Keep as 'date' for chart compatibility
          cost,
          quantity,
          sortKey,
        }))

        // Sort by date if grouping by date, otherwise sort by cost descending
        if (groupBy === 'date') {
          return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        } else {
          return result.sort((a, b) => b.cost - a.cost)
        }
      }

      case 'pie': {
        // Pie charts always group by a category (default: feed_type)
        const categoryField = config.groupBy || 'feed_type'
        const categoryMap = new Map<string, number>()

        data.forEach((item: any) => {
          let categoryName: string

          switch (categoryField) {
            case 'area':
              categoryName = item.areas?.name || 'Kein Bereich'
              break
            case 'area_group':
              // Handle many-to-many relationship through area_group_memberships
              // Supabase may return this as either an object or array
              const memberships = item.areas?.area_group_memberships
              if (memberships) {
                const membership = Array.isArray(memberships) ? memberships[0] : memberships
                categoryName = membership?.area_groups?.name || 'Keine Gruppe'
              } else {
                categoryName = 'Keine Gruppe'
              }
              break
            case 'supplier':
              categoryName = item.supplier_name || 'Kein Lieferant'
              break
            case 'feed_type':
            default:
              categoryName = item.feed_types?.name || 'Unbekannt'
              break
          }

          const current = categoryMap.get(categoryName) || 0
          categoryMap.set(categoryName, current + (item.total_cost || 0))
        })

        return Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      }

      default:
        return []
    }
  }, [data, config.chartType, config.xAxis, config.groupBy, config.aggregationLevel])

  // Chart configuration for shadcn/ui charts
  const chartConfig: ChartConfig = {
    cost: {
      label: 'Kosten',
      color: 'hsl(var(--chart-1))',
    },
    quantity: {
      label: 'Menge (kg)',
      color: 'hsl(var(--chart-2))',
    },
  }

  const [activeMetric, setActiveMetric] = useState<'cost' | 'quantity'>('cost')

  // Calculate totals for metric switching
  const totals = useMemo(() => {
    if (!chartData || chartData.length === 0) return { cost: 0, quantity: 0 }

    return chartData.reduce(
      (acc, curr: any) => ({
        cost: acc.cost + (curr.cost || 0),
        quantity: acc.quantity + (curr.quantity || 0),
      }),
      { cost: 0, quantity: 0 }
    )
  }, [chartData])

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Keine Daten verfügbar
        </div>
      )
    }

    switch (config.chartType) {
      case 'line':
        return (
          <div className="w-full h-full flex flex-col">
            {/* Metric Switcher */}
            <div className="flex gap-2 mb-4">
              {(['cost', 'quantity'] as const).map((metric) => (
                <button
                  key={metric}
                  data-active={activeMetric === metric}
                  className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border rounded-md px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setActiveMetric(metric)}
                >
                  <span className="text-muted-foreground text-xs">
                    {chartConfig[metric].label}
                  </span>
                  <span className="text-lg leading-none font-bold">
                    {metric === 'cost'
                      ? `€${totals.cost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${totals.quantity.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg`}
                  </span>
                </button>
              ))}
            </div>
            {/* Chart */}
            <div className="flex-1 min-h-0">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                  data={chartData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      // Value is already formatted from chartData
                      return value
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          // Value is already formatted from chartData
                          return value
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey={activeMetric}
                    type="monotone"
                    stroke={`var(--color-${activeMetric})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        )

      case 'bar':
        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  // Value is already formatted from chartData
                  return value
                }}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      // Value is already formatted from chartData
                      return value
                    }}
                  />
                }
              />
              {config.showLegend && <Legend />}
              <Bar dataKey="cost" fill="var(--color-cost)" name="Kosten (€)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )

      case 'area':
        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  // Value is already formatted from chartData
                  return value
                }}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      // Value is already formatted from chartData
                      return value
                    }}
                  />
                }
              />
              {config.showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--color-cost)"
                fill="var(--color-cost)"
                fillOpacity={0.6}
                name="Kosten (€)"
              />
            </AreaChart>
          </ChartContainer>
        )

      case 'pie': {
        // Add fill colors to data for shadcn pattern
        const pieData = chartData.map((entry, index) => ({
          ...entry,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }))

        return (
          <ChartContainer config={chartConfig} className="aspect-square h-full w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                label={(entry) => `${entry.name}: €${entry.value.toFixed(0)}`}
              />
            </PieChart>
          </ChartContainer>
        )
      }

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
      error={error || undefined}
    >
      <div className="h-full min-h-[200px]">{renderChart()}</div>
    </WidgetWrapper>
  )
}
