/**
 * Cycle Chart Widget Component
 *
 * Displays cycle-related charts (profit/loss, costs, performance metrics)
 * Uses shadcn/ui Chart components with Recharts
 */

'use client'

import { useMemo } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { BaseWidgetProps } from '@/types/dashboard'
import { useCycleChartWidgetData } from '@/lib/hooks/use-widget-data'
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
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const chartConfig: ChartConfig = {
  profit: {
    label: 'Gewinn',
    color: 'var(--chart-1)',
  },
  feedCost: {
    label: 'Futterkosten',
    color: 'var(--chart-2)',
  },
  animalPurchase: {
    label: 'Tierkauf',
    color: 'var(--chart-3)',
  },
  additionalCosts: {
    label: 'Weitere Kosten',
    color: 'var(--chart-4)',
  },
  vetCost: {
    label: 'Tierarztkosten',
    color: 'var(--chart-5)',
  },
  otherCost: {
    label: 'Sonstige Kosten',
    color: 'hsl(var(--chart-1))',
  },
  revenue: {
    label: 'Erlös',
    color: 'hsl(var(--chart-2))',
  },
}

export function CycleChartWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useCycleChartWidgetData(widget)
  const config = widget.config || {}

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Keine Daten verfügbar
        </div>
      )
    }

    const chartType = config.cycleChartType || 'profitLoss'

    switch (chartType) {
      case 'profitLoss':
        // Bar chart showing profit/loss per cycle
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
                dataKey="profit"
                fill="var(--color-profit)"
                name="Gewinn (€)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )

      case 'costBreakdown':
        // Pie chart showing cost distribution
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

      case 'costComparison':
        // Stacked bar chart showing all cost categories per cycle
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
                dataKey="feedCost"
                stackId="a"
                fill="var(--color-feedCost)"
                name="Futterkosten"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="animalPurchase"
                stackId="a"
                fill="var(--color-animalPurchase)"
                name="Tierkauf"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="additionalCosts"
                stackId="a"
                fill="var(--color-additionalCosts)"
                name="Weitere Kosten"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )

      case 'performance':
        // Line chart showing feed conversion ratio over time
        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
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
              <Legend />
              <Line
                type="monotone"
                dataKey="fcr"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={true}
                name="Futterverwertung"
              />
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
