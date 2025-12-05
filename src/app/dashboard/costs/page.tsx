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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, Trash2, DollarSign, Calendar, FileText, Copy, ArrowUpDown, ArrowUp, ArrowDown, FolderOpen, Import } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { calculateCycleDuration, calculateTotalAnimalsFromDetails } from '@/lib/utils/livestock-calculations'
import { toast } from 'sonner'

type CostType = {
  id: string
  name: string
  category: string | null
}

type LivestockCount = {
  id: string
  durchgang_name: string | null
  start_date: string
  end_date: string | null
}

type Supplier = {
  id: string
  name: string
}

type CostTemplateItem = {
  id: string
  template_id: string
  cost_type_id: string
  amount: number
  quantity: number | null
  unit: string | null
  description: string | null
  allocation_type: 'fixed' | 'per_animal' | 'per_day'
  cost_types?: CostType
}

type CostTemplate = {
  id: string
  name: string
  year: number | null
  description: string | null
  items?: CostTemplateItem[]
}

type LivestockCountWithDetails = LivestockCount & {
  livestock_count_details?: Array<{
    count: number
    start_date: string
    end_date: string | null
  }>
}

type CostTransaction = {
  id: string
  farm_id: string
  cost_type_id: string
  livestock_count_id: string | null
  supplier_id: string | null
  created_by: string
  transaction_date: string
  amount: number
  quantity: number | null
  unit: string | null
  description: string | null
  invoice_number: string | null
  supplier_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
  cost_types?: CostType
  livestock_counts?: LivestockCount
  suppliers?: Supplier
}

export default function CostsPage() {
  const [costTransactions, setCostTransactions] = useState<CostTransaction[]>([])
  const [costTypes, setCostTypes] = useState<CostType[]>([])
  const [livestockCounts, setLivestockCounts] = useState<LivestockCount[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<CostTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [costTypeId, setCostTypeId] = useState('')
  const [livestockCountId, setLivestockCountId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [description, setDescription] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting state
  type SortColumn = 'transaction_date' | 'cost_type' | 'supplier' | 'durchgang' | 'amount' | 'quantity'
  type SortDirection = 'asc' | 'desc'
  const [sortColumn, setSortColumn] = useState<SortColumn>('transaction_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Template import state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [templates, setTemplates] = useState<CostTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedImportCycleId, setSelectedImportCycleId] = useState('')
  const [importPreview, setImportPreview] = useState<Array<{ item: CostTemplateItem; calculatedAmount: number }>>([])
  const [importing, setImporting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (currentFarmId) {
      loadData()
    }
  }, [currentFarmId])

  const loadData = async () => {
    await Promise.all([
      loadCostTransactions(),
      loadCostTypes(),
      loadLivestockCounts(),
      loadSuppliers()
    ])
  }

  const loadCostTransactions = async () => {
    const { data, error } = await supabase
      .from('cost_transactions')
      .select(`
        *,
        cost_types (id, name, category),
        livestock_counts (id, durchgang_name, start_date, end_date),
        suppliers (id, name)
      `)
      .eq('farm_id', currentFarmId!)
      .order('transaction_date', { ascending: false })

    if (!error && data) {
      setCostTransactions(data as any)
    }
  }

  const loadCostTypes = async () => {
    const { data, error } = await supabase
      .from('cost_types')
      .select('id, name, category')
      .eq('farm_id', currentFarmId!)
      .eq('is_active', true)
      .order('name')

    if (!error && data) {
      setCostTypes(data)
    }
  }

  const loadLivestockCounts = async () => {
    const { data, error } = await supabase
      .from('livestock_counts')
      .select('id, durchgang_name, start_date, end_date')
      .eq('farm_id', currentFarmId!)
      .order('start_date', { ascending: false })

    if (!error && data) {
      setLivestockCounts(data)
    }
  }

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('farm_id', currentFarmId!)
      .eq('is_active', true)
      .order('name')

    if (!error && data) {
      setSuppliers(data)
    }
  }

  const loadTemplates = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('cost_templates')
      .select(`
        *,
        items:cost_template_items(
          *,
          cost_types(id, name, category)
        )
      `)
      .eq('farm_id', currentFarmId!)
      .order('name') as any)

    if (!error && data) {
      setTemplates(data as CostTemplate[])
    }
  }

  const loadLivestockCountWithDetails = async (cycleId: string): Promise<LivestockCountWithDetails | null> => {
    const { data, error } = await supabase
      .from('livestock_counts')
      .select(`
        id, durchgang_name, start_date, end_date,
        livestock_count_details(count, start_date, end_date)
      `)
      .eq('id', cycleId)
      .single()

    if (error || !data) return null
    return data as LivestockCountWithDetails
  }

  const calculateImportPreview = async () => {
    if (!selectedTemplateId || !selectedImportCycleId) {
      setImportPreview([])
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template?.items?.length) {
      setImportPreview([])
      return
    }

    const cycle = await loadLivestockCountWithDetails(selectedImportCycleId)
    if (!cycle) {
      setImportPreview([])
      return
    }

    // Calculate cycle metrics
    const duration = calculateCycleDuration(cycle.start_date, cycle.end_date)
    const totalAnimals = cycle.livestock_count_details
      ? calculateTotalAnimalsFromDetails(
          cycle.livestock_count_details.map(d => ({
            count: d.count,
            start_date: d.start_date,
            end_date: d.end_date || null,
          })),
          cycle.start_date,
          cycle.end_date
        )
      : 0

    // Calculate amounts for each item
    const preview = template.items.map(item => {
      let calculatedAmount = item.amount * (item.quantity || 1)

      switch (item.allocation_type) {
        case 'per_animal':
          calculatedAmount = item.amount * totalAnimals
          break
        case 'per_day':
          calculatedAmount = item.amount * duration
          break
        // 'fixed' uses the base amount
      }

      return { item, calculatedAmount }
    })

    setImportPreview(preview)
  }

  const handleOpenImportDialog = async () => {
    await loadTemplates()
    setSelectedTemplateId('')
    setSelectedImportCycleId('')
    setImportPreview([])
    setShowImportDialog(true)
  }

  const handleImportFromTemplate = async () => {
    if (!selectedTemplateId || !selectedImportCycleId || !user || !currentFarmId) {
      toast.error('Bitte wählen Sie eine Vorlage und einen Durchgang aus')
      return
    }

    if (importPreview.length === 0) {
      toast.error('Keine Positionen zum Importieren')
      return
    }

    setImporting(true)
    try {
      const cycle = livestockCounts.find(c => c.id === selectedImportCycleId)
      const transactionDate = cycle?.start_date || new Date().toISOString().split('T')[0]

      const transactions = importPreview.map(({ item, calculatedAmount }) => ({
        farm_id: currentFarmId,
        cost_type_id: item.cost_type_id,
        livestock_count_id: selectedImportCycleId,
        transaction_date: transactionDate,
        amount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimal places
        quantity: item.quantity || 1,
        unit: item.unit || null,
        description: item.description || `Aus Vorlage: ${templates.find(t => t.id === selectedTemplateId)?.name}`,
        created_by: user.id,
      }))

      const { error } = await supabase
        .from('cost_transactions')
        .insert(transactions)

      if (error) throw error

      toast.success(`${transactions.length} Kostenbuchungen importiert`)
      setShowImportDialog(false)
      loadCostTransactions()
    } catch (err) {
      console.error('Error importing from template:', err)
      toast.error('Fehler beim Importieren')
    } finally {
      setImporting(false)
    }
  }

  // Update preview when selections change
  useEffect(() => {
    if (showImportDialog) {
      calculateImportPreview()
    }
  }, [selectedTemplateId, selectedImportCycleId, showImportDialog])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!costTypeId) {
      toast.error('Kostenart ist erforderlich')
      return
    }
    if (!amount || parseFloat(amount) < 0) {
      toast.error('Betrag ist erforderlich und muss positiv sein')
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

      const transactionData = {
        cost_type_id: costTypeId,
        livestock_count_id: livestockCountId && livestockCountId !== 'none' ? livestockCountId : null,
        supplier_id: supplierId && supplierId !== 'none' ? supplierId : null,
        transaction_date: transactionDate,
        amount: parseFloat(amount),
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
        description: description || null,
        invoice_number: invoiceNumber || null,
        supplier_name: supplierName || null,
        notes: notes || null,
      }

      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('cost_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        toast.success('Kostenbuchung erfolgreich aktualisiert!')
      } else {
        // Create new transaction
        const newTransactionData = {
          ...transactionData,
          farm_id: currentFarmId!,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('cost_transactions')
          .insert(newTransactionData)

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }
        toast.success('Kostenbuchung erfolgreich erstellt!')
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingTransaction(null)
      loadCostTransactions()
    } catch (error) {
      console.error('Error saving cost transaction:', error)

      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error('Fehler beim Speichern der Kostenbuchung')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transaction: CostTransaction) => {
    if (!confirm(`Möchten Sie diese Kostenbuchung wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cost_transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) throw error
      toast.success('Kostenbuchung erfolgreich gelöscht!')
      loadCostTransactions()
    } catch (error) {
      console.error('Error deleting cost transaction:', error)
      toast.error('Fehler beim Löschen der Kostenbuchung')
    }
  }

  const resetForm = () => {
    setCostTypeId('')
    setLivestockCountId('none')
    setSupplierId('none')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setQuantity('')
    setUnit('')
    setDescription('')
    setInvoiceNumber('')
    setSupplierName('')
    setNotes('')
  }

  const handleEdit = (transaction: CostTransaction) => {
    setEditingTransaction(transaction)
    setCostTypeId(transaction.cost_type_id)
    setLivestockCountId(transaction.livestock_count_id || 'none')
    setSupplierId(transaction.supplier_id || 'none')
    setTransactionDate(transaction.transaction_date)
    setAmount(transaction.amount.toString())
    setQuantity(transaction.quantity?.toString() || '')
    setUnit(transaction.unit || '')
    setDescription(transaction.description || '')
    setInvoiceNumber(transaction.invoice_number || '')
    setSupplierName(transaction.supplier_name || '')
    setNotes(transaction.notes || '')
    setShowCreateDialog(true)
  }

  const handleDuplicate = (transaction: CostTransaction) => {
    setEditingTransaction(null) // Set to null to create new record
    setCostTypeId(transaction.cost_type_id)
    setLivestockCountId(transaction.livestock_count_id || 'none')
    setSupplierId(transaction.supplier_id || 'none')
    setTransactionDate(new Date().toISOString().split('T')[0]) // Set to today
    setAmount(transaction.amount.toString())
    setQuantity(transaction.quantity?.toString() || '')
    setUnit(transaction.unit || '')
    setDescription(transaction.description || '')
    setInvoiceNumber('') // Clear invoice number to avoid duplicates
    setSupplierName(transaction.supplier_name || '')
    setNotes(transaction.notes || '')
    setShowCreateDialog(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getTotalCosts = () => {
    return costTransactions.reduce((sum, t) => sum + t.amount, 0)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const filteredTransactions = costTransactions
    .filter((transaction) => {
      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      return (
        transaction.cost_types?.name.toLowerCase().includes(query) ||
        transaction.cost_types?.category?.toLowerCase().includes(query) ||
        transaction.suppliers?.name.toLowerCase().includes(query) ||
        transaction.supplier_name?.toLowerCase().includes(query) ||
        transaction.livestock_counts?.durchgang_name?.toLowerCase().includes(query) ||
        transaction.description?.toLowerCase().includes(query) ||
        transaction.invoice_number?.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query) ||
        formatDate(transaction.transaction_date).includes(query)
      )
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'transaction_date':
          comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
          break
        case 'cost_type':
          comparison = (a.cost_types?.name || '').localeCompare(b.cost_types?.name || '')
          break
        case 'supplier':
          const supplierA = a.suppliers?.name || a.supplier_name || ''
          const supplierB = b.suppliers?.name || b.supplier_name || ''
          comparison = supplierA.localeCompare(supplierB)
          break
        case 'durchgang':
          comparison = (a.livestock_counts?.durchgang_name || '').localeCompare(b.livestock_counts?.durchgang_name || '')
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kostenbuchungen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre zusätzlichen Kosten und Ausgaben
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleOpenImportDialog}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Aus Vorlage
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setEditingTransaction(null)
              setShowCreateDialog(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Neue Kostenbuchung
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Zusammenfassung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Anzahl Buchungen</p>
              <p className="text-2xl font-bold">{costTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamtkosten</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalCosts())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kostenbuchungen
          </CardTitle>
          <CardDescription>
            Übersicht aller Ihrer Kostenbuchungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Suchen nach Kostenart, Lieferant, Durchgang, Beschreibung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('transaction_date')}
                >
                  <div className="flex items-center">
                    Datum
                    {getSortIcon('transaction_date')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('cost_type')}
                >
                  <div className="flex items-center">
                    Kostenart
                    {getSortIcon('cost_type')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('supplier')}
                >
                  <div className="flex items-center">
                    Lieferant
                    {getSortIcon('supplier')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('durchgang')}
                >
                  <div className="flex items-center">
                    Durchgang
                    {getSortIcon('durchgang')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Betrag
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Menge
                    {getSortIcon('quantity')}
                  </div>
                </TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.transaction_date)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.cost_types?.name || '-'}
                    {transaction.cost_types?.category && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.cost_types.category}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.suppliers?.name || transaction.supplier_name || '-'}
                  </TableCell>
                  <TableCell>
                    {transaction.livestock_counts?.durchgang_name || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.quantity
                      ? `${transaction.quantity} ${transaction.unit || ''}`
                      : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(transaction)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transaction)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Keine Kostenbuchungen gefunden.' : 'Noch keine Kostenbuchungen erfasst.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Kostenbuchung bearbeiten' : 'Neue Kostenbuchung'}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie eine Kostenbuchung für zusätzliche Ausgaben
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costTypeId">Kostenart *</Label>
                  <Select
                    value={costTypeId}
                    onValueChange={setCostTypeId}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kostenart wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                          {type.category && ` (${type.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Datum *</Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Betrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="livestockCountId">Durchgang (optional)</Label>
                  <Select
                    value={livestockCountId}
                    onValueChange={setLivestockCountId}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keinem Durchgang zuordnen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Durchgang</SelectItem>
                      {livestockCounts.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.durchgang_name || `Durchgang ${formatDate(cycle.start_date)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Menge (optional)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Einheit (optional)</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="z.B. Stunden, Liter, kg"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung der Kostenbuchung..."
                  rows={2}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="RE-2024-001"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId">Lieferant/Dienstleister</Label>
                <Select
                  value={supplierId}
                  onValueChange={setSupplierId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lieferant wählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Lieferant</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierName">Oder freier Text</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Firmenname (falls nicht in Liste)"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Notizen..."
                  rows={2}
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
                  setEditingTransaction(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !costTypeId || !amount}>
                {loading ? 'Wird gespeichert...' : editingTransaction ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import from Template Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Aus Vorlage importieren
            </DialogTitle>
            <DialogDescription>
              Wählen Sie eine Vorlage und einen Durchgang, um Kostenbuchungen zu erstellen.
              Die Beträge werden je nach Verteilungsart automatisch berechnet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorlage *</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vorlage wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Keine Vorlagen vorhanden
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.year && ` (${template.year})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durchgang *</Label>
                <Select
                  value={selectedImportCycleId}
                  onValueChange={setSelectedImportCycleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durchgang wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {livestockCounts.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.durchgang_name || `Durchgang vom ${formatDate(cycle.start_date)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Vorschau der Buchungen</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kostenart</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead>Verteilung</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map(({ item, calculatedAmount }) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.cost_types?.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.description || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded bg-muted">
                              {item.allocation_type === 'fixed' && 'Fest'}
                              {item.allocation_type === 'per_animal' && 'Pro Tier'}
                              {item.allocation_type === 'per_day' && 'Pro Tag'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(calculatedAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-semibold">
                          Summe
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            importPreview.reduce((sum, { calculatedAmount }) => sum + calculatedAmount, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {selectedTemplateId && selectedImportCycleId && importPreview.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Die ausgewählte Vorlage enthält keine Positionen.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={importing}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleImportFromTemplate}
              disabled={importing || importPreview.length === 0}
            >
              {importing ? 'Importiere...' : `${importPreview.length} Buchungen importieren`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
