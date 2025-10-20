'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Crown, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useSubscription } from '@/lib/hooks/use-subscription'

interface PlanUpgradeBannerProps {
  feature: 'advanced_analytics' | 'api_access' | 'priority_support'
  message: string
  className?: string
}

export function PlanUpgradeBanner({ feature, message, className }: PlanUpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { subscription } = useSubscription()

  if (!subscription) return null
  if (dismissed) return null

  // Check if user has access to the feature
  const hasFeature = () => {
    switch (feature) {
      case 'advanced_analytics':
        return subscription.has_advanced_analytics
      case 'api_access':
        return subscription.has_api_access
      case 'priority_support':
        return subscription.has_priority_support
      default:
        return false
    }
  }

  if (hasFeature()) return null

  const getRecommendedPlan = () => {
    switch (feature) {
      case 'advanced_analytics':
        return 'Professional oder Enterprise'
      case 'api_access':
        return 'Enterprise'
      case 'priority_support':
        return 'Professional oder Enterprise'
      default:
        return 'höheren Plan'
    }
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <Crown className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-amber-800">
            {message} Upgraden Sie auf {getRecommendedPlan()}, um diese Funktion zu nutzen.
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Link href="/pricing">
              Jetzt upgraden
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-700"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}