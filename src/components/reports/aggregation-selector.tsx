'use client'

import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PivotAggregation } from './pivot-table-config'

interface AggregationSelectorProps {
  currentAggregation: PivotAggregation
  onSelect: (aggregation: PivotAggregation) => void
}

const AGGREGATION_OPTIONS: Array<{
  value: PivotAggregation
  label: string
  description: string
}> = [
  { value: 'sum', label: 'Summe', description: 'Summe aller Werte' },
  { value: 'avg', label: 'Durchschnitt', description: 'Arithmetisches Mittel' },
  { value: 'weighted_avg', label: 'Ø (gewichtet)', description: 'Nach Menge gewichtet' },
  { value: 'min', label: 'Minimum', description: 'Niedrigster Wert' },
  { value: 'max', label: 'Maximum', description: 'Höchster Wert' },
  { value: 'count', label: 'Anzahl', description: 'Anzahl der Einträge' },
]

export function AggregationSelector({
  currentAggregation,
  onSelect
}: AggregationSelectorProps) {
  const currentOption = AGGREGATION_OPTIONS.find(opt => opt.value === currentAggregation)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 hover:bg-accent rounded px-1 transition-colors">
        <span className="text-xs font-medium">
          {currentAggregation === 'weighted_avg' ? 'Ø' : currentOption?.label}
        </span>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {AGGREGATION_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="flex flex-col items-start"
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-xs text-muted-foreground">{option.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
