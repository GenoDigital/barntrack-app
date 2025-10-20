'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ProcessingStatusProps {
  status: {
    total: number
    processed: number
    updated: number
    created: number
    errors: string[]
  }
  onReset: () => void
}

export function ProcessingStatus({ status, onReset }: ProcessingStatusProps) {
  const progress = (status.processed / status.total) * 100
  const isComplete = status.processed === status.total
  const hasErrors = status.errors.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Import mit Warnungen abgeschlossen
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import erfolgreich abgeschlossen
              </>
            )
          ) : (
            <>
              <Info className="h-5 w-5 text-blue-500" />
              Import läuft...
            </>
          )}
        </CardTitle>
        <CardDescription>
          {status.processed} von {status.total} Datensätzen verarbeitet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Neue Datensätze</p>
            <p className="text-2xl font-bold text-green-600">{status.created}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Aktualisierte Datensätze</p>
            <p className="text-2xl font-bold text-blue-600">{status.updated}</p>
          </div>
        </div>

        {status.errors.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Warnungen ({status.errors.length}):
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {status.errors.slice(0, 5).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {status.errors.length > 5 && (
                <li>... und {status.errors.length - 5} weitere</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} className="w-full">
          Neue Datei hochladen
        </Button>
      </CardFooter>
    </Card>
  )
}