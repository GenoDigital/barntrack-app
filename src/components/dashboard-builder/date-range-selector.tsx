/**
 * Date Range Selector Component
 *
 * Allows users to select a global date range for dashboard widgets
 */

'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

export function DateRangeSelector() {
  const { globalDateRange, setGlobalDateRange } = useDashboardStore()

  // Initialize with last 30 days if not set
  useEffect(() => {
    if (!globalDateRange) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      setGlobalDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
    }
  }, [globalDateRange, setGlobalDateRange])

  const handleStartDateChange = (value: string) => {
    setGlobalDateRange({
      startDate: value,
      endDate: globalDateRange?.endDate || new Date().toISOString().split('T')[0],
    })
  }

  const handleEndDateChange = (value: string) => {
    setGlobalDateRange({
      startDate: globalDateRange?.startDate || new Date().toISOString().split('T')[0],
      endDate: value,
    })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="dashboardStartDate" className="text-xs whitespace-nowrap">
          Von
        </Label>
        <Input
          id="dashboardStartDate"
          type="date"
          value={globalDateRange?.startDate || ''}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="w-[140px] h-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="dashboardEndDate" className="text-xs whitespace-nowrap">
          Bis
        </Label>
        <Input
          id="dashboardEndDate"
          type="date"
          value={globalDateRange?.endDate || ''}
          onChange={(e) => handleEndDateChange(e.target.value)}
          className="w-[140px] h-9"
        />
      </div>
    </div>
  )
}
