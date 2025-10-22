'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModeSelection } from '@/components/onboarding/mode-selection'
import { TrialSetup } from '@/components/onboarding/trial-setup'
import { PaidSetup } from '@/components/onboarding/paid-setup'

export default function OnboardingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'trial' | 'paid'>('choose')

  const handleComplete = () => {
    router.push('/dashboard/setup')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 py-12">
        <div className="container mx-auto px-4">
          {mode === 'choose' && (
            <ModeSelection onSelect={(selectedMode) => setMode(selectedMode)} />
          )}

          {mode === 'trial' && (
            <TrialSetup onComplete={handleComplete} />
          )}

          {mode === 'paid' && (
            <PaidSetup onComplete={handleComplete} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}