'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, DollarSign, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Tables } from '@/lib/database.types'

type PriceTier = Tables<'price_tiers'>
type FeedType = Tables<'feed_types'>
type Supplier = Tables<'suppliers'>

interface PriceTierWithFeedType extends PriceTier {
  feed_types: FeedType
  suppliers?: Supplier
}

type SortField = 'feedType' | 'supplier' | 'price' | 'validFrom' | 'validTo' | 'status'
type SortDirection = 'asc' | 'desc' | null

export default function PricesPage() {
  const [priceTiers, setPriceTiers] = useState<PriceTierWithFeedType[]>([])
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPriceTier, setEditingPriceTier] = useState<PriceTierWithFeedType | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [feedTypeId, setFeedTypeId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (currentFarmId) {
      loadPriceTiers()
      loadFeedTypes()
      loadSuppliers()
    }
  }, [currentFarmId])

  const loadPriceTiers = async () => {
    const { data, error } = await supabase
      .from('price_tiers')
      .select(`
        *,
        feed_types(*),
        suppliers(*)
      `)
      .eq('farm_id', currentFarmId!)
      .order('valid_from', { ascending: false })

    if (!error && data) {
      setPriceTiers(data as PriceTierWithFeedType[])
    }
  }

  const loadFeedTypes = async () => {
    const { data, error } = await supabase
      .from('feed_types')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setFeedTypes(data)
    }
  }

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .eq('is_active', true)
      .order('name')

    if (!error && data) {
      setSuppliers(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingPriceTier) {
        // Update existing price tier
        const { error } = await supabase
          .from('price_tiers')
          .update({
            feed_type_id: feedTypeId,
            supplier_id: supplierId || null,
            price_per_unit: parseFloat(pricePerUnit),
            valid_from: validFrom,
            valid_to: validTo || null,
            notes: notes || null,
          })
          .eq('id', editingPriceTier.id)

        if (error) throw error
      } else {
        // Create new price tier
        const { error } = await supabase
          .from('price_tiers')
          .insert({
            farm_id: currentFarmId!,
            feed_type_id: feedTypeId,
            supplier_id: supplierId || null,
            price_per_unit: parseFloat(pricePerUnit),
            valid_from: validFrom,
            valid_to: validTo || null,
            notes: notes || null,
            created_by: user.id,
          })

        if (error) throw error
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingPriceTier(null)
      loadPriceTiers()
    } catch (error) {
      console.error('Error saving price tier:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (priceTier: PriceTierWithFeedType) => {
    if (!confirm(`Möchten Sie den Preiseintrag für "${priceTier.feed_types.name}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('price_tiers')
        .delete()
        .eq('id', priceTier.id)

      if (error) throw error
      loadPriceTiers()
    } catch (error) {
      console.error('Error deleting price tier:', error)
    }
  }

  const resetForm = () => {
    setFeedTypeId('')
    setSupplierId('')
    setPricePerUnit('')
    setValidFrom('')
    setValidTo('')
    setNotes('')
  }

  const handleEdit = (priceTier: PriceTierWithFeedType) => {
    setEditingPriceTier(priceTier)
    setFeedTypeId(priceTier.feed_type_id)
    setSupplierId(priceTier.supplier_id || '')
    setPricePerUnit(priceTier.price_per_unit.toString())
    setValidFrom(priceTier.valid_from)
    setValidTo(priceTier.valid_to || '')
    setNotes(priceTier.notes || '')
    setShowCreateDialog(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatPrice = (price: number, unit: string) => {
    const formattedPrice = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(price)
    return `${formattedPrice} €/${unit}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const isCurrentlyActive = (priceTier: PriceTierWithFeedType) => {
    const today = new Date().toISOString().split('T')[0]
    const validFrom = priceTier.valid_from
    const validTo = priceTier.valid_to

    if (!validFrom || validFrom > today) return false
    if (validTo && validTo < today) return false

    return true
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

  const getSortedPriceTiers = () => {
    if (!sortField || !sortDirection) return priceTiers

    return [...priceTiers].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'feedType':
          aValue = a.feed_types.name.toLowerCase()
          bValue = b.feed_types.name.toLowerCase()
          break
        case 'supplier':
          aValue = a.suppliers?.name?.toLowerCase() || ''
          bValue = b.suppliers?.name?.toLowerCase() || ''
          break
        case 'price':
          aValue = a.price_per_unit
          bValue = b.price_per_unit
          break
        case 'validFrom':
          aValue = a.valid_from
          bValue = b.valid_from
          break
        case 'validTo':
          aValue = a.valid_to || '9999-12-31' // Put null dates at the end
          bValue = b.valid_to || '9999-12-31'
          break
        case 'status':
          aValue = isCurrentlyActive(a) ? 1 : 0
          bValue = isCurrentlyActive(b) ? 1 : 0
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
          <h2 className="text-3xl font-bold tracking-tight">Preisstaffeln</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Futtermittelpreise mit zeitabhängigen Staffeln
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm()
            setEditingPriceTier(null)
            setShowCreateDialog(true)
          }}
          className="flex items-center gap-2"
          disabled={feedTypes.length === 0}
        >
          <Plus className="h-4 w-4" />
          Neue Preisstaffel
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preisstaffeln
            </CardTitle>
            <CardDescription>
              Übersicht aller zeitabhängigen Preise für Ihre Futtermittel
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
                      onClick={() => handleSort('feedType')}
                    >
                      Futtermittel
                      {getSortIcon('feedType')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('supplier')}
                    >
                      Lieferant
                      {getSortIcon('supplier')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('price')}
                    >
                      Preis pro Einheit
                      {getSortIcon('price')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('validFrom')}
                    >
                      Gültig von
                      {getSortIcon('validFrom')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('validTo')}
                    >
                      Gültig bis
                      {getSortIcon('validTo')}
                    </Button>
                  </TableHead>
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
                {getSortedPriceTiers().map((priceTier) => (
                  <TableRow key={priceTier.id}>
                    <TableCell className="font-medium">{priceTier.feed_types.name}</TableCell>
                    <TableCell>{priceTier.suppliers?.name || '-'}</TableCell>
                    <TableCell>{formatPrice(priceTier.price_per_unit, priceTier.feed_types.unit || 'kg')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(priceTier.valid_from)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(priceTier.valid_to)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isCurrentlyActive(priceTier) ? "default" : "secondary"}>
                        {isCurrentlyActive(priceTier) ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(priceTier)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(priceTier)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {priceTiers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {feedTypes.length === 0 
                        ? "Noch keine Futtermittel verfügbar. Importieren Sie zuerst CSV-Daten oder erstellen Sie Futtermittel."
                        : "Noch keine Preisstaffeln angelegt."
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPriceTier ? 'Preisstaffel bearbeiten' : 'Neue Preisstaffel anlegen'}
              </DialogTitle>
              <DialogDescription>
                Erstellen oder bearbeiten Sie eine zeitabhängige Preisstaffel
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="feedType">Futtermittel *</Label>
                <Select value={feedTypeId} onValueChange={setFeedTypeId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Futtermittel auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((feedType) => (
                      <SelectItem key={feedType.id} value={feedType.id}>
                        {feedType.name} ({feedType.unit || 'kg'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Lieferant</Label>
                <Select value={supplierId} onValueChange={setSupplierId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lieferant auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Lieferanten können in der <Link href="/dashboard/suppliers" className="underline">Lieferanten-Verwaltung</Link> verwaltet werden.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Preis pro Einheit (€) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.001"
                  min="0"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="z.B. 25.500"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Gültig ab *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validTo">Gültig bis (optional)</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Informationen..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingPriceTier(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !feedTypeId || !pricePerUnit || !validFrom}>
                {loading ? 'Wird gespeichert...' : editingPriceTier ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}