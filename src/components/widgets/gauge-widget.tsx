/**
 * Gauge Widget Component
 *
 * Displays a circular gauge chart for KPI metrics with target thresholds.
 * Used for cycle performance metrics like profit margin, FCR, feed efficiency, etc.
 */

'use client'

import { useEffect } from 'react'
import { BaseWidgetProps } from '@/types/dashboard'
import { useGaugeWidgetData } from '@/lib/hooks/use-widget-data'
import { WidgetWrapper } from './base/widget-wrapper'

export function GaugeWidget({ widget, isEditMode, onConfigure, onDelete }: BaseWidgetProps) {
  const { data, isLoading, error, refetch } = useGaugeWidgetData(widget)

  useEffect(() => {
    refetch()
  }, [widget.config, refetch])

  // Calculate percentage for gauge fill (only if data exists)
  const percentage = data && data.target > 0 ? (data.value / data.target) * 100 : 0
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  // Determine color based on thresholds
  const getColor = () => {
    if (!data) return 'text-blue-500'
    const config = widget.config as any
    if (config.thresholds) {
      if (data.value >= config.thresholds.high) return 'text-green-500'
      if (data.value >= config.thresholds.medium) return 'text-yellow-500'
      return 'text-red-500'
    }
    return 'text-blue-500'
  }

  const getFillColor = () => {
    if (!data) return '#3b82f6'
    const config = widget.config as any
    if (config.thresholds) {
      if (data.value >= config.thresholds.high) return '#22c55e' // green-500
      if (data.value >= config.thresholds.medium) return '#eab308' // yellow-500
      return '#ef4444' // red-500
    }
    return '#3b82f6' // blue-500
  }

  // SVG gauge calculation
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference

  return (
    <WidgetWrapper
      title={widget.title}
      description={data?.label || widget.config?.description}
      isEditMode={isEditMode}
      onConfigure={onConfigure}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error || undefined}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {/* Circular Gauge */}
        <div className="relative w-[180px] h-[180px]">
          <svg className="transform -rotate-90" width="180" height="180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={getFillColor()}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${getColor()}`}>
              {data?.value.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-muted-foreground">
              {widget.config.unit || ''}
            </div>
          </div>
        </div>

        {/* Target info */}
        {data && data.target > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">
              Ziel: <span className="font-medium text-foreground">{data.target}{widget.config.unit || ''}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {clampedPercentage.toFixed(0)}% erreicht
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}

export default GaugeWidget
