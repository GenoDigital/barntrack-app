'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { parseGEAExport, type ParsedData } from '@/lib/csv-parser'

interface CSVUploaderProps {
  onDataParsed: (data: ParsedData) => void
}

export function CSVUploader({ onDataParsed }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Bitte wählen Sie eine CSV- oder TXT-Datei')
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = parseGEAExport(content)
        onDataParsed(parsedData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Parsen der Datei')
      }
    }
    
    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei')
    }
    
    reader.readAsText(file, 'UTF-8')
  }, [onDataParsed])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  return (
    <div>
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="csv-upload"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          {isDragging ? (
            <Upload className="mx-auto h-12 w-12 text-primary" />
          ) : (
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          
          <p className="mt-4 text-sm font-medium">
            Datei hierher ziehen oder klicken zum Auswählen
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            CSV-Export aus dem GEA-System (Tab-getrennt)
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}