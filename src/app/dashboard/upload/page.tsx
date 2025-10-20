'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CSVUploader } from '@/components/upload/csv-uploader'
import { UploadPreview } from '@/components/upload/upload-preview'
import { ProcessingStatus } from '@/components/upload/processing-status'
import { useFarmStore } from '@/lib/stores/farm-store'
import type { ParsedData } from '@/lib/csv-parser'
import { ErrorBoundary } from '@/components/error-boundary'
import { Info } from 'lucide-react'
import Link from 'next/link'

function UploadContent() {
  const { currentFarmId } = useFarmStore()
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    total: number
    processed: number
    updated: number
    created: number
    errors: string[]
  } | null>(null)

  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data)
    setUploadStatus(null)
  }

  const handleConfirmUpload = async () => {
    if (!parsedData) return
    
    if (!currentFarmId) {
      setUploadStatus({
        total: parsedData.totalRows,
        processed: 0,
        updated: 0,
        created: 0,
        errors: ['Bitte wählen Sie zuerst einen Stall aus oder erstellen Sie einen neuen.']
      })
      return
    }
    
    setProcessing(true)
    
    try {
      // Import the actual upload function
      const { uploadConsumptionData } = await import('@/lib/upload-processor')
      
      const result = await uploadConsumptionData(parsedData, currentFarmId)
      
      setUploadStatus({
        total: parsedData.totalRows,
        processed: result.processed,
        updated: result.updated,
        created: result.created,
        errors: result.errors
      })
      
      setParsedData(null)
    } catch (error) {
      setUploadStatus({
        total: parsedData.totalRows,
        processed: 0,
        updated: 0,
        created: 0,
        errors: [error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload']
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setParsedData(null)
    setUploadStatus(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Daten-Upload</h2>
        <p className="text-muted-foreground">
          Laden Sie Ihre GEA-Exportdateien hoch
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Unterstützte Fütterungssysteme</AlertTitle>
        <AlertDescription>
          Der Datenimport ist aktuell für <strong>GEA-Systeme</strong> eingerichtet.
          Nutzen Sie ein anderes Fütterungssystem? Melden Sie sich über das{' '}
          <Link href="/demo" className="underline font-medium hover:text-primary">
            Kontaktformular
          </Link>{' '}
          und wir richten den Import für Ihr System umgehend ein.
        </AlertDescription>
      </Alert>

      {!parsedData && !uploadStatus && (
        <Card>
          <CardHeader>
            <CardTitle>CSV-Datei hochladen</CardTitle>
            <CardDescription>
              Wählen Sie eine CSV-Datei aus dem GEA-System aus. 
              Die Datei sollte Spalten für Datum, Stallgruppe und Futtermengen enthalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CSVUploader onDataParsed={handleDataParsed} />
          </CardContent>
        </Card>
      )}

      {parsedData && !uploadStatus && (
        <UploadPreview
          data={parsedData}
          onConfirm={handleConfirmUpload}
          onCancel={handleReset}
          processing={processing}
        />
      )}

      {uploadStatus && (
        <ProcessingStatus
          status={uploadStatus}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default function UploadPage() {
  return (
    <ErrorBoundary>
      <UploadContent />
    </ErrorBoundary>
  )
}