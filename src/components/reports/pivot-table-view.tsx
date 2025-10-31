'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PivotTableData } from '@/lib/utils/pivot-engine'
import { PivotConfig, PivotDimension } from './pivot-table-config'
import { Table as TableIcon } from 'lucide-react'

// German labels for dimensions
const DIMENSION_LABELS: Record<PivotDimension, string> = {
  'date': 'Tag',
  'week': 'Woche',
  'month': 'Monat',
  'quarter': 'Quartal',
  'year': 'Jahr',
  'feed_type': 'Futtermittel',
  'area': 'Bereich',
  'area_group': 'Bereichsgruppe',
  'supplier': 'Lieferant'
}

function getDimensionLabel(dimension: PivotDimension): string {
  return DIMENSION_LABELS[dimension] || dimension
}

interface PivotTableViewProps {
  data: PivotTableData
  config: PivotConfig
  loading?: boolean
}

export default function PivotTableView({ data, config, loading }: PivotTableViewProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            Lade Pivot-Tabelle...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data.rows || data.rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <TableIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-medium">Keine Daten</h3>
            <p className="text-sm text-muted-foreground">
              Keine Daten für die ausgewählte Konfiguration gefunden.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const rowDimensionCount = config.rows.length
  const hasColumns = config.columns.length > 0
  const columnHeaders = data.columnHeaders
  const columnSpan = hasColumns ? Math.max(1, data.columnHeaders[0]?.length || 1) : config.values.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          Pivot-Tabelle
        </CardTitle>
        <CardDescription>
          {data.rows.length} Zeilen • {columnSpan} Spalten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                {/* Column headers */}
                {hasColumns ? (
                  <>
                    {columnHeaders.map((headerRow, rowIndex) => {
                      // Determine if this is the KPI labels row (last row with multiple KPIs)
                      const isKPIRow = rowIndex === columnHeaders.length - 1 && config.values.length > 1

                      return (
                        <TableRow key={rowIndex}>
                          {/* Empty cells for row dimensions */}
                          {rowIndex === 0 && rowDimensionCount > 0 && (
                            <TableHead
                              rowSpan={columnHeaders.length}
                              colSpan={rowDimensionCount}
                              className="border-r-2 bg-muted/50 font-semibold"
                            >
                              <div className="flex flex-wrap gap-1">
                                {config.rows.map(dim => (
                                  <Badge key={dim} variant="secondary" className="text-xs">
                                    {getDimensionLabel(dim)}
                                  </Badge>
                                ))}
                              </div>
                            </TableHead>
                          )}
                          {/* Column dimension values */}
                          {(() => {
                            const cells: JSX.Element[] = []
                            let skipNext = 0

                            headerRow.forEach((header, colIndex) => {
                              if (skipNext > 0) {
                                skipNext--
                                return
                              }

                              // Calculate colspan by counting consecutive identical values
                              let colspan = 1
                              if (!isKPIRow) {
                                // For dimension rows, merge consecutive identical headers
                                for (let i = colIndex + 1; i < headerRow.length; i++) {
                                  if (headerRow[i] === header) {
                                    colspan++
                                  } else {
                                    break
                                  }
                                }
                                skipNext = colspan - 1
                              }

                              cells.push(
                                <TableHead
                                  key={colIndex}
                                  colSpan={colspan}
                                  className={`text-center border-l font-semibold ${
                                    isKPIRow
                                      ? 'bg-green-50 dark:bg-green-950/20'
                                      : 'bg-blue-50 dark:bg-blue-950/20'
                                  }`}
                                >
                                  {header}
                                </TableHead>
                              )
                            })

                            return cells
                          })()}
                        </TableRow>
                      )
                    })}
                  </>
                ) : (
                  <TableRow>
                    {/* Row dimension headers */}
                    {config.rows.map((dim) => (
                      <TableHead key={dim} className="border-r bg-muted/50 font-semibold">
                        {getDimensionLabel(dim)}
                      </TableHead>
                    ))}
                    {/* Value headers */}
                    {config.values.map((value, index) => (
                      <TableHead
                        key={index}
                        className="text-right bg-green-50 dark:bg-green-950/20 font-semibold"
                      >
                        {value.label}
                      </TableHead>
                    ))}
                  </TableRow>
                )}
              </TableHeader>

              <TableBody>
                {/* Data rows */}
                {data.rows.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={row.isSubtotal ? 'bg-muted/50 font-medium' : ''}
                  >
                    {/* Row dimension values */}
                    {config.rows.map((dim, dimIndex) => (
                      <TableCell
                        key={dim}
                        className={`border-r ${dimIndex === config.rows.length - 1 ? 'border-r-2' : ''} ${
                          row.level > 0 ? `pl-${4 * (row.level + 1)}` : ''
                        }`}
                      >
                        {row.dimensions[dim] || '-'}
                      </TableCell>
                    ))}

                    {/* Cell values */}
                    {Object.entries(row.cells).map(([columnKey, cell]) => (
                      <TableCell
                        key={columnKey}
                        className="text-right font-mono border-l"
                      >
                        <span className="font-medium">{cell.formattedValue}</span>
                        {cell.count > 1 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (n={cell.count})
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Grand totals row */}
                {config.showGrandTotals && data.grandTotals && (
                  <TableRow className="bg-primary/10 font-bold border-t-2">
                    <TableCell
                      colSpan={rowDimensionCount}
                      className="border-r-2"
                    >
                      Gesamtsumme
                    </TableCell>
                    {Object.entries(data.grandTotals).map(([columnKey, cell]) => (
                      <TableCell
                        key={columnKey}
                        className="text-right font-mono border-l"
                      >
                        {cell.formattedValue}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Zeilen:</span> {data.rows.length}
          </div>
          <div>
            <span className="font-medium">Spalten:</span> {columnSpan}
          </div>
          {config.showGrandTotals && (
            <div>
              <span className="font-medium">Gesamtsummen:</span> Angezeigt
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
