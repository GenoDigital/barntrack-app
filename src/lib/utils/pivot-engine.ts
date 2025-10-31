import { PivotDimension, PivotValue, PivotAggregation, PivotConfig } from '@/components/reports/pivot-table-config'
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, getQuarter } from 'date-fns'
import { de } from 'date-fns/locale'

export interface ConsumptionDataRow {
  date: string
  feed_type_id: string
  feed_type_name: string
  area_id?: string
  area_name?: string
  area_group_id?: string
  area_group_name?: string
  supplier_id?: string
  supplier_name?: string
  quantity: number
  total_cost: number
  price_per_unit?: number
}

export interface PivotCell {
  value: number
  count: number
  formattedValue?: string
}

export interface PivotRow {
  dimensions: { [key: string]: string }
  cells: { [key: string]: PivotCell }
  subtotals?: { [key: string]: PivotCell }
  level: number
  isSubtotal?: boolean
  isTotalRow?: boolean
}

export interface PivotTableData {
  columnHeaders: string[][]
  rows: PivotRow[]
  grandTotals?: { [key: string]: PivotCell }
}

/**
 * Extract dimension value from a data row
 */
function getDimensionValue(row: ConsumptionDataRow, dimension: PivotDimension): string {
  const date = new Date(row.date)

  switch (dimension) {
    case 'date':
      return row.date
    case 'week':
      const weekStart = startOfWeek(date, { weekStartsOn: 1, locale: de })
      return format(weekStart, 'yyyy-\'W\'II', { locale: de })
    case 'month':
      return format(date, 'yyyy-MM')
    case 'quarter':
      const quarter = getQuarter(date)
      return `${date.getFullYear()}-Q${quarter}`
    case 'year':
      return date.getFullYear().toString()
    case 'feed_type':
      return row.feed_type_name || 'Unbekannt'
    case 'area':
      return row.area_name || 'Ohne Bereich'
    case 'area_group':
      return row.area_group_name || 'Ohne Gruppe'
    case 'supplier':
      return row.supplier_name || 'Ohne Lieferant'
    default:
      return 'Unbekannt'
  }
}

/**
 * Format dimension value for display
 */
function formatDimensionValue(value: string, dimension: PivotDimension): string {
  switch (dimension) {
    case 'date':
      try {
        return format(new Date(value), 'dd.MM.yyyy', { locale: de })
      } catch {
        return value
      }
    case 'week':
      // Format as "KW 40, 2025"
      try {
        const match = value.match(/(\d{4})-W(\d+)/)
        if (match) {
          return `KW ${match[2]}, ${match[1]}`
        }
        return value
      } catch {
        return value
      }
    case 'month':
      try {
        const [year, month] = value.split('-')
        return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: de })
      } catch {
        return value
      }
    case 'quarter':
      return value.replace('-Q', ' Q') // "2025-Q3" -> "2025 Q3"
    case 'year':
      return value
    default:
      return value
  }
}

/**
 * Get field value from a data row
 */
function getFieldValue(row: ConsumptionDataRow, field: PivotValue): number {
  switch (field) {
    case 'quantity':
      return row.quantity
    case 'cost':
      return row.total_cost
    case 'avg_price':
      return row.price_per_unit || (row.quantity > 0 ? row.total_cost / row.quantity : 0)
    case 'count':
      return 1
    case 'min_price':
      return row.price_per_unit || 0
    case 'max_price':
      return row.price_per_unit || 0
    default:
      return 0
  }
}

/**
 * Aggregate values based on aggregation function
 */
function aggregateValues(
  values: number[],
  aggregation: PivotAggregation,
  field: PivotValue
): number {
  if (values.length === 0) return 0

  switch (aggregation) {
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0)
    case 'avg':
      return values.reduce((sum, v) => sum + v, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'count':
      return values.length
    case 'weighted_avg':
      // Weighted average should be calculated differently (see calculateWeightedAverage)
      return values.reduce((sum, v) => sum + v, 0) / values.length
    default:
      return 0
  }
}

/**
 * Calculate weighted average price from consumption data
 */
function calculateWeightedAverage(
  cellData: ConsumptionDataRow[]
): number {
  const totalCost = cellData.reduce((sum, row) => sum + row.total_cost, 0)
  const totalQuantity = cellData.reduce((sum, row) => sum + row.quantity, 0)

  if (totalQuantity === 0) return 0
  return totalCost / totalQuantity
}

/**
 * Format a pivot cell value based on field type
 */
function formatCellValue(value: number, field: PivotValue, aggregation: PivotAggregation): string {
  switch (field) {
    case 'cost':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
      }).format(value)
    case 'quantity':
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(value)
    case 'avg_price':
    case 'min_price':
    case 'max_price':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 3
      }).format(value)
    case 'count':
      return new Intl.NumberFormat('de-DE').format(value)
    default:
      return value.toFixed(2)
  }
}

/**
 * Generate column headers from column dimensions
 */
function generateColumnHeaders(
  data: ConsumptionDataRow[],
  columnDimensions: PivotDimension[],
  valueConfigs: PivotConfig['values']
): string[][] {
  if (columnDimensions.length === 0) {
    // No column dimensions, just value labels
    return [valueConfigs.map(v => v.label || v.field)]
  }

  // Get unique sorted values for each column dimension
  const dimensionValues: string[][] = columnDimensions.map(dim => {
    const uniqueValues = new Set<string>()
    data.forEach(row => {
      uniqueValues.add(getDimensionValue(row, dim))
    })
    return Array.from(uniqueValues).sort()
  })

  // Calculate total number of columns (combinations * values)
  const numCombinations = dimensionValues.reduce((acc, vals) => acc * vals.length, 1)
  const numKPIs = valueConfigs.length
  const totalColumns = numCombinations * numKPIs

  // Build header rows
  const headers: string[][] = []

  // Build dimension header rows
  for (let dimIndex = 0; dimIndex < columnDimensions.length; dimIndex++) {
    const row: string[] = []
    const dim = columnDimensions[dimIndex]
    const values = dimensionValues[dimIndex]

    // Calculate repeat pattern for this dimension level
    const repeatBefore = dimensionValues.slice(0, dimIndex).reduce((acc, vals) => acc * vals.length, 1)
    const repeatAfter = dimensionValues.slice(dimIndex + 1).reduce((acc, vals) => acc * vals.length, 1) * numKPIs

    for (let r = 0; r < repeatBefore; r++) {
      for (const value of values) {
        const formatted = formatDimensionValue(value, dim)
        // Repeat each value for all sub-dimensions and KPIs
        for (let a = 0; a < repeatAfter; a++) {
          row.push(formatted)
        }
      }
    }

    headers.push(row)
  }

  // Add KPI labels row if there are multiple KPIs
  if (numKPIs > 1) {
    const kpiRow: string[] = []
    for (let c = 0; c < numCombinations; c++) {
      valueConfigs.forEach(v => {
        kpiRow.push(v.label || v.field)
      })
    }
    headers.push(kpiRow)
  }

  return headers
}

/**
 * Generate column keys for data lookup
 */
function generateColumnKeys(
  data: ConsumptionDataRow[],
  columnDimensions: PivotDimension[],
  valueConfigs: PivotConfig['values']
): string[] {
  if (columnDimensions.length === 0) {
    return valueConfigs.map((_, i) => `value_${i}`)
  }

  const columnValues: string[][] = []

  for (const dim of columnDimensions) {
    const uniqueValues = new Set<string>()
    data.forEach(row => {
      uniqueValues.add(getDimensionValue(row, dim))
    })
    columnValues.push(Array.from(uniqueValues).sort())
  }

  // Generate all combinations
  function combinations(index: number, current: string[]): string[][] {
    if (index === columnDimensions.length) {
      if (valueConfigs.length > 1) {
        return valueConfigs.map((_, i) => [...current, `v${i}`])
      }
      return [current]
    }

    const result: string[][] = []
    for (const value of columnValues[index]) {
      result.push(...combinations(index + 1, [...current, value]))
    }
    return result
  }

  return combinations(0, []).map(combo => combo.join('|'))
}

/**
 * Main function to generate pivot table data
 */
export function generatePivotTable(
  data: ConsumptionDataRow[],
  config: PivotConfig
): PivotTableData {
  const { rows: rowDimensions, columns: columnDimensions, values: valueConfigs } = config

  // Generate column headers and keys
  const columnHeaders = generateColumnHeaders(data, columnDimensions, valueConfigs)
  const columnKeys = generateColumnKeys(data, columnDimensions, valueConfigs)

  // Group data by row dimensions
  const rowGroups = new Map<string, ConsumptionDataRow[]>()

  data.forEach(row => {
    const rowKey = rowDimensions.map(dim => getDimensionValue(row, dim)).join('|')
    if (!rowGroups.has(rowKey)) {
      rowGroups.set(rowKey, [])
    }
    rowGroups.get(rowKey)!.push(row)
  })

  // Generate pivot rows
  const pivotRows: PivotRow[] = []
  const grandTotalData: { [key: string]: number[] } = {}
  const grandTotalRawData: { [key: string]: ConsumptionDataRow[] } = {}

  // Sort row keys
  const sortedRowKeys = Array.from(rowGroups.keys()).sort()

  for (const rowKey of sortedRowKeys) {
    const rowData = rowGroups.get(rowKey)!
    const dimensions: { [key: string]: string } = {}

    // Extract dimension values
    rowKey.split('|').forEach((value, index) => {
      dimensions[rowDimensions[index]] = formatDimensionValue(value, rowDimensions[index])
    })

    // Calculate cell values
    const cells: { [key: string]: PivotCell } = {}

    for (const columnKey of columnKeys) {
      const columnParts = columnKey.split('|')

      // Determine value index
      let valueIndex = 0
      if (columnDimensions.length === 0) {
        // No column dimensions, key format is "value_0", "value_1", etc.
        valueIndex = parseInt(columnKey.substring(6)) // Extract number after "value_"
      } else if (valueConfigs.length > 1) {
        // Has column dimensions, extract from last part (e.g., "v0", "v1")
        valueIndex = parseInt(columnParts[columnParts.length - 1].substring(1))
      }

      const valueConfig = valueConfigs[valueIndex]

      // Skip if no value config found
      if (!valueConfig) {
        continue
      }

      // Filter data for this cell
      let cellData = rowData

      if (columnDimensions.length > 0) {
        const colDimCount = columnDimensions.length
        cellData = rowData.filter(row => {
          for (let i = 0; i < colDimCount; i++) {
            if (getDimensionValue(row, columnDimensions[i]) !== columnParts[i]) {
              return false
            }
          }
          return true
        })
      }

      // Calculate aggregated value
      let aggregatedValue: number

      if (valueConfig.aggregation === 'weighted_avg') {
        // Use weighted average for price fields
        aggregatedValue = calculateWeightedAverage(cellData)
      } else {
        // Extract field values and aggregate normally
        const fieldValues = cellData.map(row => getFieldValue(row, valueConfig.field))
        aggregatedValue = aggregateValues(fieldValues, valueConfig.aggregation, valueConfig.field)
      }

      cells[columnKey] = {
        value: aggregatedValue,
        count: cellData.length,
        formattedValue: formatCellValue(aggregatedValue, valueConfig.field, valueConfig.aggregation)
      }

      // Accumulate for grand totals
      if (!grandTotalRawData[columnKey]) {
        grandTotalRawData[columnKey] = []
      }
      grandTotalRawData[columnKey].push(...cellData)
    }

    pivotRows.push({
      dimensions,
      cells,
      level: 0
    })
  }

  // Calculate grand totals
  let grandTotals: { [key: string]: PivotCell } | undefined
  if (config.showGrandTotals) {
    grandTotals = {}
    for (const columnKey of columnKeys) {
      const columnParts = columnKey.split('|')

      // Determine value index
      let valueIndex = 0
      if (columnDimensions.length === 0) {
        // No column dimensions, key format is "value_0", "value_1", etc.
        valueIndex = parseInt(columnKey.substring(6)) // Extract number after "value_"
      } else if (valueConfigs.length > 1) {
        // Has column dimensions, extract from last part (e.g., "v0", "v1")
        valueIndex = parseInt(columnParts[columnParts.length - 1].substring(1))
      }

      const valueConfig = valueConfigs[valueIndex]

      // Skip if no value config found
      if (!valueConfig) {
        continue
      }

      const rawData = grandTotalRawData[columnKey] || []
      let aggregatedValue: number

      if (valueConfig.aggregation === 'weighted_avg') {
        // Use weighted average for grand totals
        aggregatedValue = calculateWeightedAverage(rawData)
      } else {
        // Extract field values and aggregate normally
        const values = rawData.map(row => getFieldValue(row, valueConfig.field))
        aggregatedValue = aggregateValues(values, valueConfig.aggregation, valueConfig.field)
      }

      grandTotals[columnKey] = {
        value: aggregatedValue,
        count: rawData.length,
        formattedValue: formatCellValue(aggregatedValue, valueConfig.field, valueConfig.aggregation)
      }
    }
  }

  return {
    columnHeaders,
    rows: pivotRows,
    grandTotals
  }
}
