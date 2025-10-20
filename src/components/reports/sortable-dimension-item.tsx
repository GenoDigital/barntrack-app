'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SortableDimensionItemProps {
  id: string
  label?: string
  onRemove: () => void
  variant?: 'secondary' | 'outline' | 'default'
  children?: ReactNode
}

export function SortableDimensionItem({
  id,
  label,
  onRemove,
  variant = 'secondary',
  children
}: SortableDimensionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 group',
        isDragging && 'opacity-50'
      )}
    >
      <button
        className={cn(
          'cursor-grab active:cursor-grabbing',
          'text-muted-foreground hover:text-foreground',
          'transition-colors touch-none',
          'flex items-center'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Badge
        variant={variant}
        className={cn(
          'flex-1 justify-between text-xs transition-all',
          isDragging && 'ring-2 ring-primary'
        )}
      >
        {children || <span>{label}</span>}
        <button
          onClick={onRemove}
          className="ml-1 hover:text-destructive transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    </div>
  )
}
