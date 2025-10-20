'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/lib/stores/farm-store'
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Tables } from '@/lib/database.types'

type Upload = Tables<'uploads'>

export default function HistoryPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  useEffect(() => {
    if (currentFarmId) {
      loadUploads()
    }
  }, [currentFarmId])

  const loadUploads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUploads(data)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('de-DE')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Erfolgreich</Badge>
      case 'failed':
        return <Badge variant="destructive">Fehlgeschlagen</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Verarbeitung</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProcessingStats = (upload: Upload) => {
    const imported = upload.rows_imported || 0
    const updated = upload.rows_updated || 0
    const total = imported + updated
    
    if (total === 0) return '-'
    
    return (
      <div className="text-sm">
        <div>{total} Datensätze</div>
        <div className="text-muted-foreground text-xs">
          {imported > 0 && `${imported} neu`}
          {imported > 0 && updated > 0 && ', '}
          {updated > 0 && `${updated} aktualisiert`}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload-Historie</h2>
        <p className="text-muted-foreground">
          Übersicht über alle Datenimporte und deren Status
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload-Historie
            </CardTitle>
            <CardDescription>
              Chronologische Übersicht aller CSV-Importe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Lade Upload-Historie...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Dateiname</TableHead>
                    <TableHead>Verarbeitet</TableHead>
                    <TableHead>Upload-Zeit</TableHead>
                    <TableHead>Fehler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(upload.status)}
                          {getStatusBadge(upload.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {upload.filename}
                        </div>
                        {upload.file_url && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <a 
                              href={upload.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Datei anzeigen
                            </a>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getProcessingStats(upload)}
                      </TableCell>
                      <TableCell>
                        {formatDate(upload.created_at)}
                      </TableCell>
                      <TableCell>
                        {upload.error_message ? (
                          <div className="max-w-xs">
                            <div className="text-sm text-red-600 truncate" title={upload.error_message}>
                              {upload.error_message}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {uploads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Noch keine Uploads durchgeführt. Starten Sie Ihren ersten CSV-Import über die Upload-Seite.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {uploads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload-Statistiken</CardTitle>
              <CardDescription>
                Zusammenfassung aller Imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploads.filter(u => u.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Erfolgreich</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {uploads.filter(u => u.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploads.reduce((sum, u) => sum + (u.rows_imported || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Neue Datensätze</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {uploads.reduce((sum, u) => sum + (u.rows_updated || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktualisierungen</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}