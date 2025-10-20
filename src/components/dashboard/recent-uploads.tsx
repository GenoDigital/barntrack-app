'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Badge } from '@/components/ui/badge'
import { FileUp, AlertCircle, CheckCircle } from 'lucide-react'

interface Upload {
  id: string
  filename: string
  status: string
  rows_imported: number | null
  rows_updated: number | null
  error_message: string | null
  created_at: string | null
  uploaded_by: string
  farm_id: string
  file_url: string | null
}

export function RecentUploads() {
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  const loadUploads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('farm_id', currentFarmId!)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error loading uploads:', error)
      } else {
        setUploads(data || [])
      }
    } catch (error) {
      console.error('Error loading uploads:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, currentFarmId])

  useEffect(() => {
    if (currentFarmId) {
      loadUploads()
    }
  }, [currentFarmId, loadUploads])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary"><FileUp className="w-3 h-3 mr-1" />Verarbeitung</Badge>
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Fehler</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!currentFarmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Letzte Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bitte wählen Sie einen Stall aus, um Uploads zu sehen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Letzte Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Lädt...</div>
        ) : uploads.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine Uploads vorhanden
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{upload.filename}</span>
                    {getStatusBadge(upload.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {upload.created_at ? new Date(upload.created_at).toLocaleString('de-DE') : 'Unbekannt'}
                  </div>
                  {upload.status === 'completed' && (
                    <div className="text-xs text-muted-foreground">
                      {upload.rows_imported || 0} erstellt, {upload.rows_updated || 0} aktualisiert
                    </div>
                  )}
                  {upload.error_message && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {upload.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}