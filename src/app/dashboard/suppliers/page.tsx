'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, Trash2, Building, Phone, Mail, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { toast } from 'sonner'

type Supplier = Tables<'suppliers'>
type SortField = 'name' | 'contactPerson' | 'status'
type SortDirection = 'asc' | 'desc' | null

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Deutschland')
  const [website, setWebsite] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('')
  const [defaultDeliveryTimeDays, setDefaultDeliveryTimeDays] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (currentFarmId) {
      loadSuppliers()
    }
  }, [currentFarmId])

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setSuppliers(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Lieferantenname ist erforderlich')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Nicht authentifiziert')
        return
      }

      if (!currentFarmId) {
        toast.error('Kein Stall ausgewählt')
        return
      }

      const supplierData = {
        name: name.trim(),
        contact_person: contactPerson || null,
        phone: phone || null,
        email: email || null,
        street_address: streetAddress || null,
        postal_code: postalCode || null,
        city: city || null,
        country: country || null,
        website: website || null,
        tax_number: taxNumber || null,
        payment_terms: paymentTerms || null,
        delivery_terms: deliveryTerms || null,
        minimum_order_quantity: minimumOrderQuantity ? parseFloat(minimumOrderQuantity) : null,
        default_delivery_time_days: defaultDeliveryTimeDays ? parseInt(defaultDeliveryTimeDays) : null,
        notes: notes || null,
        is_active: isActive,
      }

      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id)

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        toast.success('Lieferant erfolgreich aktualisiert!')
      } else {
        // Create new supplier
        const newSupplierData = {
          ...supplierData,
          farm_id: currentFarmId!,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('suppliers')
          .insert(newSupplierData)

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }
        toast.success('Lieferant erfolgreich erstellt!')
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingSupplier(null)
      loadSuppliers()
    } catch (error) {
      console.error('Supplier save failed:', error instanceof Error ? error.message : 'Unknown error')

      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error('Fehler beim Speichern des Lieferanten')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Möchten Sie "${supplier.name}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id)

      if (error) throw error
      toast.success('Lieferant erfolgreich gelöscht!')
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Fehler beim Löschen des Lieferanten')
    }
  }

  const resetForm = () => {
    setName('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setStreetAddress('')
    setPostalCode('')
    setCity('')
    setCountry('Deutschland')
    setWebsite('')
    setTaxNumber('')
    setPaymentTerms('')
    setDeliveryTerms('')
    setMinimumOrderQuantity('')
    setDefaultDeliveryTimeDays('')
    setNotes('')
    setIsActive(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setName(supplier.name)
    setContactPerson(supplier.contact_person || '')
    setPhone(supplier.phone || '')
    setEmail(supplier.email || '')
    setStreetAddress(supplier.street_address || '')
    setPostalCode(supplier.postal_code || '')
    setCity(supplier.city || '')
    setCountry(supplier.country || 'Deutschland')
    setWebsite(supplier.website || '')
    setTaxNumber(supplier.tax_number || '')
    setPaymentTerms(supplier.payment_terms || '')
    setDeliveryTerms(supplier.delivery_terms || '')
    setMinimumOrderQuantity(supplier.minimum_order_quantity?.toString() || '')
    setDefaultDeliveryTimeDays(supplier.default_delivery_time_days?.toString() || '')
    setNotes(supplier.notes || '')
    setIsActive(supplier.is_active || true)
    setShowCreateDialog(true)
  }

  const formatAddress = (supplier: Supplier) => {
    const parts = [
      supplier.street_address,
      [supplier.postal_code, supplier.city].filter(Boolean).join(' '),
      supplier.country
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '-'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1" />
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const getSortedSuppliers = () => {
    if (!sortField || !sortDirection) return suppliers

    return [...suppliers].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'contactPerson':
          aValue = a.contact_person?.toLowerCase() || ''
          bValue = b.contact_person?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lieferanten</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Futtermittel-Lieferanten und deren Konditionen
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm()
            setEditingSupplier(null)
            setShowCreateDialog(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Neuer Lieferant
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Lieferanten
            </CardTitle>
            <CardDescription>
              Übersicht aller Ihrer Futtermittel-Lieferanten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('contactPerson')}
                    >
                      Ansprechpartner
                      {getSortIcon('contactPerson')}
                    </Button>
                  </TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedSuppliers().map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {formatAddress(supplier)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(supplier)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Noch keine Lieferanten angelegt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Lieferant bearbeiten' : 'Neuen Lieferant anlegen'}
              </DialogTitle>
              <DialogDescription>
                Verwalten Sie die Informationen und Konditionen Ihres Lieferanten
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Grundinformationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Firmenname *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Futtermittel GmbH"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Ansprechpartner</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Max Mustermann"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Kontaktdaten</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kontakt@lieferant.de"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.lieferant.de"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Adresse</h3>
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Straße und Hausnummer</Label>
                  <Input
                    id="streetAddress"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Musterstraße 123"
                    disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ort</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Musterstadt"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Deutschland"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Geschäftsinformationen</h3>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Steuernummer</Label>
                  <Input
                    id="taxNumber"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="DE123456789"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Zahlungsbedingungen</Label>
                    <Input
                      id="paymentTerms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="30 Tage netto"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTerms">Lieferbedingungen</Label>
                    <Input
                      id="deliveryTerms"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="frei Haus"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumOrderQuantity">Mindestbestellmenge</Label>
                    <Input
                      id="minimumOrderQuantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minimumOrderQuantity}
                      onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                      placeholder="1000"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultDeliveryTimeDays">Standard-Lieferzeit (Tage)</Label>
                    <Input
                      id="defaultDeliveryTimeDays"
                      type="number"
                      min="1"
                      value={defaultDeliveryTimeDays}
                      onChange={(e) => setDefaultDeliveryTimeDays(e.target.value)}
                      placeholder="7"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Notes and Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Zusätzliche Informationen</h3>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen zum Lieferanten..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="isActive">Aktiver Lieferant</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingSupplier(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Wird gespeichert...' : editingSupplier ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}