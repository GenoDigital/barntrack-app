'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Receipt, Eye, Loader2, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils/price-formatting'
import { toast } from 'sonner'

interface Invoice {
  invoice_id: string
  customer_id: string
  subscription_id: string | null
  invoice_status: string
  total_amount: number
  currency_code: string
  period_start_date: string
  period_end_date: string
  invoice_attrs: {
    number?: string
    hosted_invoice_url?: string
  } | null
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('get_user_invoices', {
        limit_param: 20
      })

      if (error) {
        console.error('Error fetching invoices:', error)
        setError(error.message)
        return
      }

      setInvoices(data || [])
    } catch (err) {
      console.error('Error calling invoice function:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const getStatusColor = (invoice_status: string) => {
    switch (invoice_status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'void': return 'bg-gray-100 text-gray-800'
      case 'uncollectible': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (invoice_status: string) => {
    switch (invoice_status.toLowerCase()) {
      case 'paid': return 'Bezahlt'
      case 'open': return 'Offen'
      case 'void': return 'Storniert'
      case 'uncollectible': return 'Uneinbringlich'
      case 'draft': return 'Entwurf'
      default: return invoice_status
    }
  }


  const handleOpenSecureUrl = (url: string) => {
    // SECURITY: Validate that the URL is from a trusted domain before opening
    try {
      const parsedUrl = new URL(url)
      const allowedDomains = ['invoice.stripe.com', 'pay.stripe.com', 'checkout.stripe.com']
      
      if (allowedDomains.includes(parsedUrl.hostname)) {
        window.open(url, '_blank')
      } else {
        console.error('Blocked attempt to open untrusted URL:', parsedUrl.hostname)
        toast.error('Ungültige URL-Domain')
      }
    } catch (error) {
      console.error('Invalid URL format:', url)
      toast.error('Ungültige URL')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungen
          </CardTitle>
          <CardDescription>
            Ihre Rechnungshistorie und Zahlungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Lade Rechnungen...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungen
          </CardTitle>
          <CardDescription>
            Ihre Rechnungshistorie und Zahlungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadInvoices} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Rechnungen
            </CardTitle>
            <CardDescription>
              Ihre Rechnungshistorie und Zahlungen
            </CardDescription>
          </div>
          <Button onClick={loadInvoices} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Rechnungen</h3>
            <p className="text-gray-600">
              Es wurden noch keine Rechnungen für Ihr Konto erstellt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.invoice_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invoice.invoice_attrs?.number || invoice.invoice_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.period_start_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.invoice_status)}>
                          {getStatusText(invoice.invoice_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatPrice(invoice.total_amount, invoice.currency_code)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(invoice.period_start_date)} - {formatDate(invoice.period_end_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.invoice_attrs?.hosted_invoice_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSecureUrl(invoice.invoice_attrs.hosted_invoice_url)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Anzeigen
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.invoice_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {invoice.invoice_attrs?.number || invoice.invoice_id}
                      </div>
                      <Badge className={getStatusColor(invoice.invoice_status)}>
                        {getStatusText(invoice.invoice_status)}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Betrag:</span>
                        <span className="font-medium">
                          {formatPrice(invoice.total_amount, invoice.currency_code)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zeitraum:</span>
                        <span>
                          {formatDate(invoice.period_start_date)} - {formatDate(invoice.period_end_date)}
                        </span>
                      </div>
                    </div>
                    {invoice.invoice_attrs?.hosted_invoice_url && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSecureUrl(invoice.invoice_attrs.hosted_invoice_url)}
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Anzeigen
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}