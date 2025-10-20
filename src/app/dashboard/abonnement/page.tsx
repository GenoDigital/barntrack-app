'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Crown, CreditCard, Receipt, Settings, Loader2, ArrowLeft, User, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Import our billing components
import { SubscriptionStatus } from '@/components/subscription/subscription-status'
import { SubscriptionCancel } from '@/components/billing/subscription-cancel'
import { PaymentMethods } from '@/components/billing/payment-methods'
import { InvoiceList } from '@/components/billing/invoice-list'
import { useSubscription } from '@/lib/hooks/use-subscription'

export default function AbonnementPage() {
  const [isFarmOwner, setIsFarmOwner] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const router = useRouter()
  const supabase = createClient()
  
  // User profile fields for Stripe customer info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUserProfile = useCallback(async () => {
    try {
      if (!user) return
      
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (error) {
        console.error('Error loading user profile:', error)
        return
      }
      
      if (userProfile) {
        setFirstName(userProfile.first_name || '')
        setLastName(userProfile.last_name || '')
        setCompanyName(userProfile.company_name || '')
        setStreetAddress(userProfile.street_address || '')
        setPostalCode(userProfile.postal_code || '')
        setCity(userProfile.city || '')
        setPhoneNumber(userProfile.phone_number || '')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }, [supabase, user])

  const checkFarmOwnerStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('is_user_farm_owner')

      if (error) {
        console.error('Error checking farm owner status:', error)
        setError('Fehler beim Überprüfen der Berechtigung')
        return
      }

      setIsFarmOwner(data || false)
      
      // Load user profile if user is farm owner
      if (data) {
        await loadUserProfile()
      }
    } catch (err) {
      console.error('Error calling farm owner check:', err)
      setError('Fehler beim Überprüfen der Berechtigung')
    } finally {
      setLoading(false)
    }
  }, [supabase, loadUserProfile])

  useEffect(() => {
    if (user) {
      checkFarmOwnerStatus()
    }
  }, [user, checkFarmOwnerStatus])

  // Redirect non-authenticated users
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Lade Abonnement-Daten...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Fehler</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Seite neu laden
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show access denied if user is not a farm owner
  if (isFarmOwner === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Zugriff verweigert</h2>
              <p className="text-gray-600 mb-4">
                Diese Seite ist nur für Stallbesitzer verfügbar. 
                Nur Benutzer mit der Rolle &quot;Besitzer&quot; können Abonnements verwalten.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zum Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            Abonnement verwalten
          </h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie Ihr Abonnement, Zahlungsmethoden und Rechnungen
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Kontoinformationen</span>
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Zahlungsmethoden</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Rechnungen</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Subscription Status */}
            <SubscriptionStatus />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
                <CardDescription>
                  Häufig verwendete Aktionen für Ihr Abonnement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/pricing">
                    <Crown className="mr-2 h-4 w-4" />
                    Plan wechseln
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const tabs = document.querySelector('[data-state="active"]')?.parentElement
                    const accountTab = tabs?.querySelector('[value="account"]') as HTMLElement
                    accountTab?.click()
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Kontoinformationen bearbeiten
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const tabs = document.querySelector('[data-state="active"]')?.parentElement
                    const paymentTab = tabs?.querySelector('[value="payment-methods"]') as HTMLElement
                    paymentTab?.click()
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Zahlungsmethoden verwalten
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const tabs = document.querySelector('[data-state="active"]')?.parentElement
                    const invoiceTab = tabs?.querySelector('[value="invoices"]') as HTMLElement
                    invoiceTab?.click()
                  }}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Rechnungen anzeigen
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Summary */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Abonnement-Zusammenfassung</CardTitle>
                <CardDescription>
                  Übersicht über Ihren aktuellen Plan und dessen Features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="font-medium">Aktueller Plan</h3>
                    <p className="text-2xl font-bold capitalize">{subscription.plan_type}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Status</h3>
                    <p className="text-lg">
                      {subscription.status === 'active' ? 'Aktiv' : 
                       subscription.status === 'trialing' ? 'Testphase' :
                       subscription.status === 'canceled' ? 'Gekündigt' : 
                       subscription.status}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Nächste Abrechnung</h3>
                    <p className="text-lg">
                      {subscription.current_period_end && subscription.current_period_end !== 'null' ?
                        new Date(subscription.current_period_end).toLocaleDateString('de-DE') :
                        'Nicht verfügbar'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Account Information Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Kontoinformationen</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Adress- und Kontaktdaten für Rechnungen und Zahlungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Mustermann"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firma/Hof</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Hof Mustermann GmbH"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Straße und Hausnummer</Label>
                  <Input
                    id="streetAddress"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Musterstraße 123"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PLZ</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="city">Ort</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Musterstadt"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefonnummer</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+49 123 456789"
                    type="tel"
                  />
                </div>
                
                <Button 
                  onClick={async () => {
                    setSaving(true)
                    try {
                      if (!user) throw new Error('Nicht authentifiziert')
                      
                      // Update local database first
                      const { error } = await supabase
                        .from('users')
                        .update({
                          first_name: firstName,
                          last_name: lastName,
                          company_name: companyName,
                          street_address: streetAddress,
                          postal_code: postalCode,
                          city: city,
                          phone_number: phoneNumber,
                        })
                        .eq('id', user.id)
                        
                      if (error) throw error
                      
                      // Stripe sync requires server-side implementation (Edge Function)
                      // The Stripe wrapper tables are read-only from the client
                      // User data has been saved locally
                      toast.success('Kontoinformationen erfolgreich aktualisiert!')
                      
                    } catch (error) {
                      console.error('Error saving account info:', error)
                      toast.error('Fehler beim Speichern der Kontoinformationen')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Speichert...' : 'Kontoinformationen speichern'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <PaymentMethods />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <InvoiceList />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <SubscriptionCancel />
          
          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Weitere Einstellungen</CardTitle>
              <CardDescription>
                Zusätzliche Optionen für Ihr Abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-gray-600">
                  Bei Fragen oder Problemen kontaktieren Sie unseren Support.
                </p>
                <Button variant="outline" size="sm">
                  Support kontaktieren
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Datenexport</h3>
                <p className="text-sm text-gray-600">
                  Exportieren Sie Ihre Abonnement- und Rechnungsdaten.
                </p>
                <Button variant="outline" size="sm">
                  Daten exportieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}