'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'

declare global {
  interface Window {
    Stripe?: unknown
  }
}

function CheckoutContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const clientSecret = searchParams.get('client_secret')
  const subscriptionId = searchParams.get('subscription_id')

  useEffect(() => {
    if (!clientSecret) {
      setStatus('error')
      setMessage('Kein Client Secret gefunden')
      return
    }

    const loadStripe = async () => {
      try {
        // Load Stripe
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.onload = async () => {
          const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
          
          // Retrieve the PaymentIntent
          const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)
          
          if (error) {
            console.error('Error retrieving PaymentIntent:', error)
            setStatus('error')
            setMessage(error.message || 'Fehler beim Abrufen der Zahlungsinformation')
            return
          }

          switch (paymentIntent.status) {
            case 'succeeded':
              setStatus('success')
              setMessage('Zahlung erfolgreich! Ihr Abonnement ist jetzt aktiv.')
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                router.push('/dashboard?payment_success=true')
              }, 3000)
              break
            
            case 'processing':
              setMessage('Ihre Zahlung wird verarbeitet...')
              // Poll for status updates
              setTimeout(() => window.location.reload(), 2000)
              break
            
            case 'requires_payment_method':
              setStatus('error')
              setMessage('Zahlungsmethode erforderlich. Bitte versuchen Sie es erneut.')
              break
            
            default:
              setStatus('error')
              setMessage('Unerwarteter Zahlungsstatus. Bitte kontaktieren Sie den Support.')
              break
          }
        }
        
        script.onerror = () => {
          setStatus('error')
          setMessage('Fehler beim Laden von Stripe')
        }
        
        document.head.appendChild(script)
      } catch (err) {
        console.error('Error in loadStripe:', err)
        setStatus('error')
        setMessage('Ein unerwarteter Fehler ist aufgetreten')
      }
    }

    loadStripe()
  }, [clientSecret, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Zahlung wird verarbeitet...'}
            {status === 'success' && 'Zahlung erfolgreich!'}
            {status === 'error' && 'Zahlung fehlgeschlagen'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sie werden in Kürze zum Dashboard weitergeleitet...
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Zum Dashboard
                </Link>
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/pricing">
                    Zurück zu Preisen
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/contact">
                    Support kontaktieren
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Bitte warten Sie, während wir Ihre Zahlung verarbeiten...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Lädt...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </ProtectedRoute>
  )
}