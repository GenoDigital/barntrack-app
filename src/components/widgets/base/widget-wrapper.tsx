/**
 * Widget Wrapper Component
 *
 * Base wrapper for all dashboard widgets
 * Provides common UI elements: title, actions, loading, error states
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Settings, Trash2, GripVertical, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetWrapperProps } from '@/types/dashboard'

export function WidgetWrapper({
  title,
  description,
  isEditMode,
  onConfigure,
  onDelete,
  children,
  isLoading = false,
  error,
  className,
}: WidgetWrapperProps) {
  return (
    <Card className={cn('relative w-full h-full flex flex-col gap-0 py-0 min-h-0', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          {isEditMode && (
            <div className="cursor-move text-muted-foreground hover:text-foreground transition-colors">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <CardTitle className="text-sm font-medium truncate">
            {title}
          </CardTitle>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isEditMode && (
          <div className="flex gap-1">
            {onConfigure && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onConfigure}
                title="Configure widget"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                title="Delete widget"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-4 pb-6 overflow-hidden">
        <div className="h-full overflow-auto">
          {isLoading ? (
            <WidgetLoading />
          ) : error ? (
            <WidgetError error={error} />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Widget Loading State
 */
function WidgetLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Widget Error State
 */
function WidgetError({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="flex flex-col items-center gap-2 text-center p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium">Error loading widget</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    </div>
  )
}
