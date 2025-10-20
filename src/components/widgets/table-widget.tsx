/**
 * Table Widget Component
 *
 * Displays data in table format
 */

'use client'

import { useState } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { useTableWidgetData } from '@/lib/hooks/use-widget-data'
import { BaseWidgetProps, TableWidgetConfig } from '@/types/dashboard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TableWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useTableWidgetData(widget)
  const config = widget.config as TableWidgetConfig
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Provide default columns based on dataSource if not configured
  const getDefaultColumns = () => {
    const dataSource = config.dataSource || 'consumption'

    if (dataSource === 'suppliers') {
      return [
        { field: 'name', label: 'Name' },
        { field: 'contact_person', label: 'Kontaktperson' },
        { field: 'email', label: 'E-Mail' },
        { field: 'phone', label: 'Telefon' },
      ]
    } else if (dataSource === 'cycleAreas') {
      return [
        { field: 'cycleName', label: 'Durchgang / Bereich' },
        { field: 'startDate', label: 'Start', format: 'date' },
        { field: 'endDate', label: 'Ende', format: 'date' },
        { field: 'animalCount', label: 'Anzahl Tiere', format: 'number' },
        { field: 'feedCost', label: 'Futterkosten', format: 'currency' },
        { field: 'feedCostPerAnimal', label: 'Kosten/Tier', format: 'currency' },
        { field: 'percentageOfTotal', label: 'Anteil', format: 'percentage' },
      ]
    } else if (dataSource === 'cycles') {
      return [
        { field: 'durchgang_name', label: 'Durchgang' },
        { field: 'start_date', label: 'Start', format: 'date' },
        { field: 'end_date', label: 'Ende', format: 'date' },
        { field: 'total_animals', label: 'Anzahl Tiere', format: 'number' },
        { field: 'total_feed_quantity', label: 'Futtermenge (kg)', format: 'number' },
        { field: 'total_feed_cost', label: 'Futterkosten', format: 'currency' },
        { field: 'animal_purchase_cost', label: 'Tierkauf', format: 'currency' },
        { field: 'additional_costs', label: 'Weitere Kosten', format: 'currency' },
        { field: 'revenue', label: 'Erlös', format: 'currency' },
        { field: 'profit_loss', label: 'Gewinn/Verlust', format: 'currency' },
      ]
    } else {
      // Default consumption columns
      return [
        { field: 'date', label: 'Datum', format: 'date' },
        { field: 'feed_types', label: 'Futtermittel' },
        { field: 'quantity', label: 'Menge', format: 'number' },
        { field: 'total_cost', label: 'Kosten', format: 'currency' },
      ]
    }
  }

  const columns = config.columns || getDefaultColumns()

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(value)

      case 'number':
        return new Intl.NumberFormat('de-DE').format(value)

      case 'percentage':
        return `${Number(value).toFixed(2)}%`

      case 'date':
        return new Date(value).toLocaleDateString('de-DE')

      default:
        return value.toString()
    }
  }

  // Flatten hierarchical data for rendering
  const flattenData = (data: any[]) => {
    if (!data) return []

    const flattened: any[] = []
    data.forEach(row => {
      flattened.push(row)
      // Add children if row is expanded
      if (row.children && expandedRows.has(row.id)) {
        flattened.push(...row.children)
      }
    })
    return flattened
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                // Right-align numeric and currency columns
                const isNumeric = column.format === 'number' || column.format === 'currency' || column.format === 'percentage'
                return (
                  <TableHead
                    key={column.field}
                    className={cn(isNumeric && 'text-right')}
                  >
                    {column.label}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              flattenData(data).map((row, index) => {
                const isParent = row.isParent
                const isChild = row.isChild
                const isExpanded = expandedRows.has(row.id)
                const hasChildren = row.children && row.children.length > 0

                return (
                  <TableRow key={row.id || index} className={cn(isChild && 'bg-muted/30')}>
                    {columns.map((column, colIndex) => {
                      // Handle nested properties (e.g., feed_types.name)
                      let value = row[column.field]

                      // Special handling for cycleAreas hierarchical first column
                      if (config.dataSource === 'cycleAreas' && column.field === 'cycleName') {
                        value = isChild ? row.areaName : row.cycleName
                      }

                      if (column.field.includes('.')) {
                        const [parent, child] = column.field.split('.')
                        value = row[parent]?.[child]
                      }
                      // Handle feed_types object
                      if (column.field === 'feed_types') {
                        value = row.feed_types?.name
                      }
                      if (column.field === 'areas') {
                        value = row.areas?.name
                      }

                      // Special rendering for cycles dataSource
                      const dataSource = config.dataSource || 'consumption'
                      const isNumeric = column.format === 'number' || column.format === 'currency' || column.format === 'percentage'

                      // First column: Add expand/collapse button for parent rows
                      if (colIndex === 0 && isParent && hasChildren) {
                        return (
                          <TableCell key={column.field} className="font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRowExpansion(row.id)}
                                className="hover:bg-muted rounded p-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              {formatValue(value, column.format)}
                              {row.areaCount && <span className="text-xs text-muted-foreground">({row.areaCount} Bereiche)</span>}
                            </div>
                          </TableCell>
                        )
                      }

                      // First column for child rows: Add indentation
                      if (colIndex === 0 && isChild) {
                        return (
                          <TableCell key={column.field} className="pl-10">
                            {formatValue(value, column.format)}
                          </TableCell>
                        )
                      }

                      // Special handling for cycle status
                      if (dataSource === 'cycles' && column.field === 'status') {
                        const endDate = row.endDate || row.end_date
                        const status = !endDate || new Date(endDate) > new Date() ? 'active' : 'completed'
                        return (
                          <TableCell key={column.field}>
                            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                              {status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                            </Badge>
                          </TableCell>
                        )
                      }

                      // Special handling for profit/loss with trending icons
                      if (dataSource === 'cycles' && column.field === 'profit_loss') {
                        const profitLoss = value || 0
                        return (
                          <TableCell key={column.field} className="text-right">
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
                              {formatValue(profitLoss, column.format)}
                            </div>
                          </TableCell>
                        )
                      }

                      // Special handling for durchgang_name/cycleName in cycles
                      if ((dataSource === 'cycles' && column.field === 'durchgang_name') || column.field === 'cycleName') {
                        return (
                          <TableCell key={column.field} className={cn('font-medium', isChild && 'font-normal')}>
                            {value || 'Unbenannt'}
                          </TableCell>
                        )
                      }

                      // Default cell rendering with proper alignment
                      return (
                        <TableCell
                          key={column.field}
                          className={cn(isNumeric && 'text-right')}
                        >
                          {formatValue(value, column.format)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground"
                >
                  Keine Daten verfügbar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </WidgetWrapper>
  )
}
