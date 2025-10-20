'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <h2 className="text-3xl font-bold">Seite nicht gefunden</h2>
          <p className="text-muted-foreground">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Brauchen Sie Hilfe?{' '}
            <Link href="mailto:support@barntrack.app" className="text-primary hover:underline">
              Kontaktieren Sie den Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
