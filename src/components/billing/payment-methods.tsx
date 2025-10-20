'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Plus, Trash2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    funding: string
  }
  billing_details?: {
    name?: string
    email?: string
  }
  created: number
}

export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadPaymentMethods = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('get_user_payment_methods')

      if (error) {
        console.error('Error fetching payment methods:', error)
        setError(error.message)
        return
      }

      if (data?.success) {
        setPaymentMethods(data.payment_methods || [])
      } else {
        setError(data?.error || 'Failed to load payment methods')
      }
    } catch (err) {
      console.error('Error calling payment methods function:', err)
      setError('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPaymentMethods()
  }, [loadPaymentMethods])

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setDeletingId(paymentMethodId)
    
    try {
      const { data, error } = await supabase.rpc('detach_payment_method', {
        payment_method_id: paymentMethodId
      })

      if (error) {
        console.error('Error deleting payment method:', error)
        toast.error('Fehler beim Löschen der Zahlungsmethode')
        return
      }

      if (data?.success) {
        toast.success('Zahlungsmethode erfolgreich entfernt')
        // Remove from local state
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
      } else {
        toast.error(data?.error || 'Fehler beim Löschen der Zahlungsmethode')
      }
    } catch (err) {
      console.error('Error calling detach function:', err)
      toast.error('Fehler beim Löschen der Zahlungsmethode')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      const { data, error } = await supabase.rpc('create_payment_method_checkout_session')

      if (error) {
        console.error('Error creating checkout session:', error)
        toast.error('Fehler beim Erstellen der Stripe-Sitzung')
        return
      }

      if (data?.success && data.checkout_url) {
        // SECURITY: Validate that the URL is from Stripe before opening
        try {
          const url = new URL(data.checkout_url)
          if (url.hostname === 'checkout.stripe.com') {
            // Open Stripe's hosted checkout page in a new tab for adding payment methods
            window.open(data.checkout_url, '_blank')
          } else {
            console.error('Invalid checkout URL domain:', url.hostname)
            toast.error('Ungültige Checkout-URL erhalten')
          }
        } catch (error) {
          console.error('Invalid checkout URL format:', data.checkout_url)
          toast.error('Ungültige Checkout-URL erhalten')
        }
      } else {
        toast.error(data?.error || 'Fehler beim Erstellen der Stripe-Sitzung')
      }
    } catch (err) {
      console.error('Error calling checkout session function:', err)
      toast.error('Fehler beim Erstellen der Stripe-Sitzung')
    }
  }

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      case 'discover':
        return '💳'
      default:
        return '💳'
    }
  }

  const formatCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa'
      case 'mastercard':
        return 'Mastercard'
      case 'amex':
        return 'American Express'
      case 'discover':
        return 'Discover'
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1)
    }
  }

  const formatCardType = (funding: string) => {
    switch (funding.toLowerCase()) {
      case 'credit':
        return 'Kreditkarte'
      case 'debit':
        return 'Debitkarte'
      case 'prepaid':
        return 'Prepaid-Karte'
      default:
        return 'Karte'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungsmethoden
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre gespeicherten Zahlungsmethoden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Lade Zahlungsmethoden...</span>
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
            <CreditCard className="h-5 w-5" />
            Zahlungsmethoden
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre gespeicherten Zahlungsmethoden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadPaymentMethods} variant="outline">
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
              <CreditCard className="h-5 w-5" />
              Zahlungsmethoden
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre gespeicherten Zahlungsmethoden
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadPaymentMethods} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
            <Button onClick={handleAddPaymentMethod} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Zahlungsmethoden</h3>
            <p className="text-gray-600 mb-4">
              Sie haben noch keine Zahlungsmethoden gespeichert.
            </p>
            <Button onClick={handleAddPaymentMethod}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Zahlungsmethode hinzufügen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((paymentMethod) => (
              <div
                key={paymentMethod.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getCardBrandIcon(paymentMethod.card?.brand || '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCardBrand(paymentMethod.card?.brand || '')} •••• {paymentMethod.card?.last4}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {formatCardType(paymentMethod.card?.funding || '')}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Gültig bis {String(paymentMethod.card?.exp_month).padStart(2, '0')}/{paymentMethod.card?.exp_year}
                    </div>
                    {paymentMethod.billing_details?.name && (
                      <div className="text-sm text-gray-500">
                        {paymentMethod.billing_details.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === paymentMethod.id}
                      >
                        {deletingId === paymentMethod.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Zahlungsmethode entfernen</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sind Sie sicher, dass Sie diese Zahlungsmethode entfernen möchten?
                          <br />
                          <strong>
                            {formatCardBrand(paymentMethod.card?.brand || '')} •••• {paymentMethod.card?.last4}
                          </strong>
                          <br />
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Entfernen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}