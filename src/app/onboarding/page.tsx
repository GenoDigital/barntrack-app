'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubscriptionSetup } from '@/components/onboarding/subscription-setup'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PlanSelection } from '@/components/onboarding/plan-selection'

interface PendingPlanSelection {
  isTrialMode: boolean
  selectedPlan: string
  voucherCode: string
  userEmail: string
  userName: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [pendingPlan, setPendingPlan] = useState<PendingPlanSelection | null>(null)
  const [showPlanSelection, setShowPlanSelection] = useState(false)

  useEffect(() => {
    // Check if user has pending plan selection from signup
    const pending = localStorage.getItem('pendingPlanSelection')
    if (pending) {
      try {
        const planData = JSON.parse(pending)
        setPendingPlan(planData)
        setShowPlanSelection(true)
        // Clear from localStorage
        localStorage.removeItem('pendingPlanSelection')
      } catch (err) {
        console.error('Error parsing pending plan selection:', err)
      }
    }
  }, [])

  const handlePlanSelectionComplete = () => {
    setShowPlanSelection(false)
  }

  const handleComplete = () => {
    router.push('/dashboard/setup')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Konto-Einrichtung</h1>
            <p className="text-muted-foreground">
              Lassen Sie uns Ihr barntrack-Konto fertig einrichten
            </p>
          </div>
          
          {showPlanSelection && pendingPlan ? (
            <PlanSelection 
              pendingPlan={pendingPlan} 
              onComplete={handlePlanSelectionComplete} 
            />
          ) : (
            <SubscriptionSetup onComplete={handleComplete} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}