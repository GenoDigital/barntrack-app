/**
 * Cycle Table Widget Component
 *
 * Displays livestock cycles (Durchgänge) in table format with key metrics
 * Uses shadcn/ui Table components
 */

'use client'

import { useMemo } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { BaseWidgetProps } from '@/types/dashboard'
import { useTableWidgetData } from '@/lib/hooks/use-widget-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CycleData {
  id: string
  durchgang_name: string
  start_date: string
  end_date: string | null
  total_feed_cost: number | null
  animal_purchase_cost: number | null
  additional_costs: number | null
  total_animals: number | null
  revenue: number | null
  profit_loss: number | null
  feed_conversion_ratio: number | null
  mortality_rate: number | null
}

export function CycleTableWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useTableWidgetData(widget)

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `${value.toFixed(1)}%`
  }

  const formatRatio = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return value.toFixed(2)
  }

  const getCycleStatus = (endDate: string | null) => {
    if (!endDate) return 'active'
    const end = new Date(endDate)
    return end > new Date() ? 'active' : 'completed'
  }

  return (
    <WidgetWrapper
      title={widget.title}
      description={widget.config?.description}
      isEditMode={isEditMode}
      onConfigure={onConfigure}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error}
    >
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Durchgang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Ende</TableHead>
              <TableHead className="text-right">Anzahl Tiere</TableHead>
              <TableHead className="text-right">Futterkosten</TableHead>
              <TableHead className="text-right">Tierkauf</TableHead>
              <TableHead className="text-right">Weitere Kosten</TableHead>
              <TableHead className="text-right">Erlös</TableHead>
              <TableHead className="text-right">Gewinn/Verlust</TableHead>
              <TableHead className="text-right">FVW</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((cycle) => {
                const status = getCycleStatus(cycle.end_date)
                const profitLoss = cycle.profit_loss || 0

                return (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">
                      {cycle.durchgang_name || 'Unbenannt'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={status === 'active' ? 'default' : 'secondary'}
                      >
                        {status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(cycle.start_date)}</TableCell>
                    <TableCell>
                      {cycle.end_date ? formatDate(cycle.end_date) : 'Laufend'}
                    </TableCell>
                    <TableCell className="text-right">
                      {cycle.total_animals || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cycle.total_feed_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cycle.animal_purchase_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cycle.additional_costs)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cycle.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          'flex items-center justify-end gap-1',
                          profitLoss > 0 && 'text-green-600',
                          profitLoss < 0 && 'text-red-600'
                        )}
                      >
                        {profitLoss > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : profitLoss < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        {formatCurrency(profitLoss)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRatio(cycle.feed_conversion_ratio)}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  Keine Durchgänge vorhanden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </WidgetWrapper>
  )
}
