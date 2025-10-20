'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  GanttProvider,
  GanttHeader,
  GanttTimeline,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttToday,
  createTimelineDataForRange,
  type GanttFeature,
  type GanttStatus,
} from '@/components/ui/shadcn-io/gantt'
import { MapPin } from 'lucide-react'

type TimelineEntry = {
  id: string
  areaId: string | null
  areaGroupId: string | null
  areaName: string
  count: number
  animalType: string | null
  startDate: Date
  endDate: Date | null
}

type TimelineKanbanProps = {
  entries: TimelineEntry[]
  cycleStartDate: Date
  cycleEndDate: Date | null
}

const AREA_COLORS: Record<string, string> = {
  aufzucht: '#10b981',
  mast: '#f59e0b',
  ferkel: '#3b82f6',
  default: '#6366f1',
}

export function TimelineKanban({ entries, cycleStartDate, cycleEndDate }: TimelineKanbanProps) {
  // Calculate actual end date for the timeline
  const actualEndDate = useMemo(() => {
    if (cycleEndDate) return cycleEndDate

    // Find the latest end date from entries
    const latestEntryDate = entries.reduce((latest, entry) => {
      const entryEnd = entry.endDate || new Date()
      return entryEnd > latest ? entryEnd : latest
    }, cycleStartDate)

    return latestEntryDate
  }, [cycleEndDate, entries, cycleStartDate])

  // Create timeline data for the date range
  const timelineData = useMemo(() => {
    return createTimelineDataForRange(cycleStartDate, actualEndDate)
  }, [cycleStartDate, actualEndDate])

  // Convert entries to Gantt features
  const ganttFeatures: GanttFeature[] = useMemo(() => {
    return entries.map((entry) => {
      const colorKey = entry.areaName.toLowerCase()
      const color = Object.keys(AREA_COLORS).find(key => colorKey.includes(key))
        ? AREA_COLORS[colorKey.includes('aufzucht') ? 'aufzucht' : colorKey.includes('mast') ? 'mast' : colorKey.includes('ferkel') ? 'ferkel' : 'default']
        : AREA_COLORS.default

      const status: GanttStatus = {
        id: entry.areaName.toLowerCase(),
        name: entry.areaName,
        color,
      }

      // Ensure dates are within the cycle range
      const startAt = entry.startDate < cycleStartDate ? cycleStartDate : entry.startDate
      const endAt = entry.endDate
        ? (entry.endDate > actualEndDate ? actualEndDate : entry.endDate)
        : actualEndDate

      return {
        id: entry.id,
        name: `${entry.count} ${entry.animalType || 'Tiere'}`,
        startAt,
        endAt,
        status,
        lane: entry.areaId || entry.areaGroupId || undefined,
      }
    })
  }, [entries, cycleStartDate, actualEndDate])

  // Group features by area/group
  const featuresByArea = useMemo(() => {
    const grouped: Record<string, { name: string; features: GanttFeature[] }> = {}

    entries.forEach((entry, index) => {
      const key = entry.areaId || entry.areaGroupId || 'unassigned'
      if (!grouped[key]) {
        grouped[key] = {
          name: entry.areaName,
          features: [],
        }
      }
      grouped[key].features.push(ganttFeatures[index])
    })

    return Object.entries(grouped).map(([id, data]) => ({
      id,
      name: data.name,
      features: data.features,
    }))
  }, [entries, ganttFeatures])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Zeitliche Verteilung der Tiere
        </CardTitle>
        <CardDescription>
          Visualisierung der Tierbewegungen über verschiedene Bereiche und Zeiträume
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Keine Tierbewegungen vorhanden
          </div>
        ) : (
          <div className="h-[500px]">
            <GanttProvider
              range="daily"
              zoom={100}
              initialTimelineData={timelineData}
            >
            <GanttSidebar>
              <GanttSidebarGroup name="Bereiche / Gruppen">
                {featuresByArea.map((area) => {
                  const representativeFeature = area.features[0]
                  return (
                    <GanttSidebarItem
                      key={area.id}
                      feature={representativeFeature}
                    />
                  )
                })}
              </GanttSidebarGroup>
            </GanttSidebar>

            <GanttTimeline>
              <GanttHeader />
              <GanttFeatureList>
                <GanttFeatureListGroup>
                  {featuresByArea.map((area) => (
                    <GanttFeatureRow
                      key={area.id}
                      features={area.features}
                    >
                      {(feature) => {
                        const entry = entries.find(e => e.id === feature.id)
                        return (
                          <div className="flex items-center justify-between w-full gap-2 px-2">
                            <span className="font-medium text-xs truncate">
                              {entry?.areaName}
                            </span>
                            <span className="text-xs shrink-0">
                              {entry?.count} {entry?.animalType || 'Tiere'}
                            </span>
                          </div>
                        )
                      }}
                    </GanttFeatureRow>
                  ))}
                </GanttFeatureListGroup>
              </GanttFeatureList>
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
