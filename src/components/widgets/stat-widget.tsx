/**
 * Stat Widget Component
 *
 * Displays KPI metrics like costs, counts, averages
 */

'use client'

import { useMemo } from 'react'
import { WidgetWrapper } from './base/widget-wrapper'
import { useStatWidgetData } from '@/lib/hooks/use-widget-data'
import { BaseWidgetProps, StatWidgetConfig } from '@/types/dashboard'
import { Euro, Package, TrendingUp, Calendar, Users, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  Euro,
  Package,
  TrendingUp,
  Calendar,
  Users,
  MapPin,
}

export function StatWidget({
  widget,
  isEditMode,
  onConfigure,
  onDelete,
}: BaseWidgetProps) {
  const { data, isLoading, error } = useStatWidgetData(widget)
  const config = widget.config as StatWidgetConfig

  // Get icon component
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP] || Package

  // Format value based on config
  const formattedValue = useMemo(() => {
    if (!data) return '-'

    switch (config.format) {
      case 'currency':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(data.value)

      case 'number':
        return new Intl.NumberFormat('de-DE').format(data.value)

      case 'percentage':
        return `${data.value.toFixed(1)}%`

      default:
        return data.value.toString()
    }
  }, [data, config.format])

  // Color variants
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400',
  }

  const iconColor = config.color
    ? colorClasses[config.color as keyof typeof colorClasses]
    : 'text-muted-foreground'

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
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="text-3xl font-bold tracking-tight">
            {formattedValue}
          </div>
          {data?.subtitle && (
            <p className="text-xs text-muted-foreground">{data.subtitle}</p>
          )}
          {data?.trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                data.trend.direction === 'up'
                  ? 'text-green-600'
                  : data.trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            >
              <TrendingUp
                className={cn(
                  'h-3 w-3',
                  data.trend.direction === 'down' && 'rotate-180'
                )}
              />
              <span>{Math.abs(data.trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className={cn('rounded-full p-3', iconColor)}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </WidgetWrapper>
  )
}
