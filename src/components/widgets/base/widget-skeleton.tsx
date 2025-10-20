/**
 * Widget Skeleton Component
 *
 * Loading placeholder for widgets
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function WidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </CardContent>
    </Card>
  )
}
