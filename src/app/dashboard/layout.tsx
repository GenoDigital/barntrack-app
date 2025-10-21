'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UserNav } from '@/components/dashboard/user-nav'
import { FarmSelector } from '@/components/dashboard/farm-selector'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { setupAuthErrorListener, refreshSessionIfNeeded } from '@/lib/auth-error-handler'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Setup global auth listener
  useEffect(() => {
    const cleanup = setupAuthErrorListener()

    // Check session validity every 5 minutes
    const intervalId = setInterval(() => {
      refreshSessionIfNeeded()
    }, 5 * 60 * 1000)

    return () => {
      cleanup?.()
      clearInterval(intervalId)
    }
  }, [])

  return (
    <ProtectedRoute requiresFarm={true}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b h-14 flex items-center px-6 justify-between">
            <FarmSelector />
            <UserNav />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}