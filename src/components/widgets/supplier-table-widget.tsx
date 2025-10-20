/**
 * Supplier Table Widget Component
 *
 * Displays supplier procurement summary in table format
 * Shows: Supplier, Quantity, Costs, Feed Types Count, Last Delivery
 */

'use client'

import { WidgetWrapper } from './base/widget-wrapper'
import { useSupplierWidgetData } from '@/lib/hooks/use-widget-data'
import { BaseWidgetProps } from '@/types/dashboard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function SupplierTableWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useSupplierWidgetData(widget)
  const config = widget.config || {}

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE').format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lieferant</TableHead>
              <TableHead className="text-right">Menge (kg)</TableHead>
              <TableHead className="text-right">Kosten</TableHead>
              <TableHead className="text-right">Futtermittel</TableHead>
              <TableHead className="text-right">Letzte Lieferung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplier.name || 'Unbekannt'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(supplier.total_quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(supplier.total_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {supplier.feed_types_count || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDate(supplier.last_delivery)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Keine Lieferanten-Daten verfügbar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </WidgetWrapper>
  )
}
