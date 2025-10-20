'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Package, Hash } from 'lucide-react'
import type { ParsedData } from '@/lib/csv-parser'

interface UploadPreviewProps {
  data: ParsedData
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}

export function UploadPreview({ data, onConfirm, onCancel, processing }: UploadPreviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload-Vorschau</CardTitle>
          <CardDescription>
            Überprüfen Sie die erkannten Daten vor dem Import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Zeitraum</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(data.dateRange.start).toLocaleDateString('de-DE')} - {new Date(data.dateRange.end).toLocaleDateString('de-DE')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Datensätze</p>
                <p className="text-sm text-muted-foreground">{data.totalRows}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Futtermittel</p>
                <p className="text-sm text-muted-foreground">{data.feedTypes.length}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Erkannte Futtermittel</h4>
            <div className="flex flex-wrap gap-2">
              {data.feedTypes.map((feed) => (
                <Badge key={feed} variant="secondary">
                  {feed}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Datenvorschau (erste 10 Zeilen)</h4>
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bereich</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Gesamt (kg)</TableHead>
                    <TableHead>Futtermittel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(row.date).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>{row.area}</TableCell>
                      <TableCell>{row.feedSystem}</TableCell>
                      <TableCell>{row.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {Object.entries(row.feeds).map(([feed, amount]) => (
                            <div key={feed}>
                              {feed}: {amount.toFixed(2)} kg
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Abbrechen
          </Button>
          <Button onClick={onConfirm} disabled={processing}>
            {processing ? 'Importiert...' : 'Daten importieren'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}