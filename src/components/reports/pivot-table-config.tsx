'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Settings2,
  GripVertical,
  X,
  Plus,
  BarChart3,
  Table as TableIcon
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SortableDimensionItem } from './sortable-dimension-item'
import { AggregationSelector } from './aggregation-selector'

export type PivotDimension =
  | 'date'
  | 'week'
  | 'month'
  | 'year'
  | 'quarter'
  | 'feed_type'
  | 'area'
  | 'area_group'
  | 'supplier'

export type PivotValue =
  | 'quantity'
  | 'cost'
  | 'avg_price'
  | 'count'
  | 'min_price'
  | 'max_price'

export type PivotAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'weighted_avg'

export interface PivotConfig {
  rows: PivotDimension[]
  columns: PivotDimension[]
  values: Array<{
    field: PivotValue
    aggregation: PivotAggregation
    label?: string
  }>
  showGrandTotals: boolean
  showSubtotals: boolean
}

interface PivotTableConfigProps {
  config: PivotConfig
  onChange: (config: PivotConfig) => void
  availableDimensions: Array<{ value: PivotDimension; label: string; description?: string }>
  availableValues: Array<{ value: PivotValue; label: string; description?: string }>
}

export default function PivotTableConfig({
  config,
  onChange,
  availableDimensions,
  availableValues
}: PivotTableConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor)
  )

  const addRow = (dimension: PivotDimension) => {
    if (!config.rows.includes(dimension)) {
      onChange({ ...config, rows: [...config.rows, dimension] })
    }
  }

  const removeRow = (index: number) => {
    onChange({ ...config, rows: config.rows.filter((_, i) => i !== index) })
  }

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = config.rows.indexOf(active.id as PivotDimension)
      const newIndex = config.rows.indexOf(over.id as PivotDimension)

      const newRows = arrayMove(config.rows, oldIndex, newIndex)
      onChange({ ...config, rows: newRows })
    }
  }

  const addColumn = (dimension: PivotDimension) => {
    if (!config.columns.includes(dimension)) {
      onChange({ ...config, columns: [...config.columns, dimension] })
    }
  }

  const removeColumn = (index: number) => {
    onChange({ ...config, columns: config.columns.filter((_, i) => i !== index) })
  }

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = config.columns.indexOf(active.id as PivotDimension)
      const newIndex = config.columns.indexOf(over.id as PivotDimension)

      const newColumns = arrayMove(config.columns, oldIndex, newIndex)
      onChange({ ...config, columns: newColumns })
    }
  }

  const addValue = (field: PivotValue, aggregation?: PivotAggregation) => {
    // Auto-select weighted_avg for price fields
    const isPriceField = field === 'avg_price' || field === 'min_price' || field === 'max_price'
    const defaultAggregation = isPriceField ? 'weighted_avg' : 'sum'
    const finalAggregation = aggregation || defaultAggregation

    const valueLabel = availableValues.find(v => v.value === field)?.label || field
    const aggLabel = finalAggregation === 'weighted_avg' ? 'Ø' : finalAggregation
    onChange({
      ...config,
      values: [
        ...config.values,
        { field, aggregation: finalAggregation, label: `${aggLabel}(${valueLabel})` }
      ]
    })
  }

  const removeValue = (index: number) => {
    onChange({ ...config, values: config.values.filter((_, i) => i !== index) })
  }

  const updateValueAggregation = (index: number, aggregation: PivotAggregation) => {
    const newValues = [...config.values]
    const field = newValues[index].field
    const valueLabel = availableValues.find(v => v.value === field)?.label || field
    const aggLabel = aggregation === 'weighted_avg' ? 'Ø' : aggregation
    newValues[index] = {
      ...newValues[index],
      aggregation,
      label: `${aggLabel}(${valueLabel})`
    }
    onChange({ ...config, values: newValues })
  }

  const handleValueDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = config.values.findIndex(v => `${v.field}-${v.aggregation}` === active.id)
      const newIndex = config.values.findIndex(v => `${v.field}-${v.aggregation}` === over.id)

      const newValues = arrayMove(config.values, oldIndex, newIndex)
      onChange({ ...config, values: newValues })
    }
  }

  const getDimensionLabel = (dimension: PivotDimension) => {
    return availableDimensions.find(d => d.value === dimension)?.label || dimension
  }

  const getAvailableDimensionsForRows = () => {
    return availableDimensions.filter(d => !config.rows.includes(d.value) && !config.columns.includes(d.value))
  }

  const getAvailableDimensionsForColumns = () => {
    return availableDimensions.filter(d => !config.columns.includes(d.value) && !config.rows.includes(d.value))
  }

  const getAvailableValues = () => {
    return availableValues.filter(v => !config.values.some(cv => cv.field === v.value))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Zeilen</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRowDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={config.rows}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {config.rows.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2 border-2 border-dashed rounded text-center">
                  Keine Zeilen
                </div>
              ) : (
                config.rows.map((row, index) => (
                  <SortableDimensionItem
                    key={row}
                    id={row}
                    label={getDimensionLabel(row)}
                    onRemove={() => removeRow(index)}
                    variant="secondary"
                  />
                ))
              )}
              {getAvailableDimensionsForRows().length > 0 && (
                <Select onValueChange={(value) => addRow(value as PivotDimension)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Hinzufügen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDimensionsForRows().map((dim) => (
                      <SelectItem key={dim.value} value={dim.value}>
                        {dim.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Spalten</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={config.columns}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {config.columns.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2 border-2 border-dashed rounded text-center">
                  Keine Spalten
                </div>
              ) : (
                config.columns.map((col, index) => (
                  <SortableDimensionItem
                    key={col}
                    id={col}
                    label={getDimensionLabel(col)}
                    onRemove={() => removeColumn(index)}
                    variant="secondary"
                  />
                ))
              )}
              {getAvailableDimensionsForColumns().length > 0 && (
                <Select onValueChange={(value) => addColumn(value as PivotDimension)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Hinzufügen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDimensionsForColumns().map((dim) => (
                      <SelectItem key={dim.value} value={dim.value}>
                        {dim.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Werte</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleValueDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={config.values.map(v => `${v.field}-${v.aggregation}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {config.values.map((value, index) => {
                const id = `${value.field}-${value.aggregation}`
                return (
                  <SortableDimensionItem
                    key={id}
                    id={id}
                    onRemove={() => removeValue(index)}
                    variant="outline"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <AggregationSelector
                        currentAggregation={value.aggregation}
                        onSelect={(agg) => updateValueAggregation(index, agg)}
                      />
                      <span className="text-xs font-mono">
                        {availableValues.find(v => v.value === value.field)?.label || value.field}
                      </span>
                    </div>
                  </SortableDimensionItem>
                )
              })}
              {getAvailableValues().length > 0 && (
                <Select onValueChange={(value) => addValue(value as PivotValue)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Hinzufügen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableValues().map((val) => (
                      <SelectItem key={val.value} value={val.value}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Checkbox
            id="grandTotals"
            checked={config.showGrandTotals}
            onCheckedChange={(checked) =>
              onChange({ ...config, showGrandTotals: checked as boolean })
            }
          />
          <Label htmlFor="grandTotals" className="text-xs font-normal cursor-pointer">
            Gesamtsummen anzeigen
          </Label>
        </div>
      </div>
    </div>
  )
}
