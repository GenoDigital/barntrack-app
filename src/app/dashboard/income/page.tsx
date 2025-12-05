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
import { Plus, Edit, Trash2, TrendingUp, Calendar, FileText, Copy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

type LivestockCount = {
  id: string
  durchgang_name: string | null
  start_date: string
  end_date: string | null
}

type IncomeTransaction = {
  id: string
  farm_id: string
  created_by: string
  livestock_count_id: string | null
  income_type: string
  transaction_date: string
  amount: number
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
  livestock_counts?: LivestockCount
}

const INCOME_TYPES = [
  'Praemie',
  'Bonus',
  'Zuschuss',
  'Foerderung',
  'Sonstiges'
]

const INCOME_TYPE_LABELS: Record<string, string> = {
  'Praemie': 'Praemie',
  'Bonus': 'Bonus',
  'Zuschuss': 'Zuschuss',
  'Foerderung': 'Foerderung',
  'Sonstiges': 'Sonstiges'
}

export default function IncomePage() {
  const [incomeTransactions, setIncomeTransactions] = useState<IncomeTransaction[]>([])
  const [livestockCounts, setLivestockCounts] = useState<LivestockCount[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<IncomeTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()

  // Form state
  const [incomeType, setIncomeType] = useState('')
  const [livestockCountId, setLivestockCountId] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting state
  type SortColumn = 'transaction_date' | 'income_type' | 'durchgang' | 'amount'
  type SortDirection = 'asc' | 'desc'
  const [sortColumn, setSortColumn] = useState<SortColumn>('transaction_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    if (currentFarmId) {
      loadData()
    }
  }, [currentFarmId])

  const loadData = async () => {
    await Promise.all([
      loadIncomeTransactions(),
      loadLivestockCounts()
    ])
  }

  const loadIncomeTransactions = async () => {
    const { data, error } = await supabase
      .from('income_transactions')
      .select(`
        *,
        livestock_counts (id, durchgang_name, start_date, end_date)
      `)
      .eq('farm_id', currentFarmId!)
      .order('transaction_date', { ascending: false })

    if (!error && data) {
      setIncomeTransactions(data as any)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incomeType) {
      toast.error('Einnahmenart ist erforderlich')
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
        toast.error('Kein Stall ausgewaehlt')
        return
      }

      const transactionData = {
        income_type: incomeType,
        livestock_count_id: livestockCountId && livestockCountId !== 'none' ? livestockCountId : null,
        transaction_date: transactionDate,
        amount: parseFloat(amount),
        description: description || null,
        notes: notes || null,
      }

      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('income_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        toast.success('Einnahme erfolgreich aktualisiert!')
      } else {
        // Create new transaction
        const newTransactionData = {
          ...transactionData,
          farm_id: currentFarmId!,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('income_transactions')
          .insert(newTransactionData)

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }
        toast.success('Einnahme erfolgreich erstellt!')
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingTransaction(null)
      loadIncomeTransactions()
    } catch (error) {
      console.error('Error saving income transaction:', error)

      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error('Fehler beim Speichern der Einnahme')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transaction: IncomeTransaction) => {
    if (!confirm(`Moechten Sie diese Einnahme wirklich loeschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('income_transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) throw error
      toast.success('Einnahme erfolgreich geloescht!')
      loadIncomeTransactions()
    } catch (error) {
      console.error('Error deleting income transaction:', error)
      toast.error('Fehler beim Loeschen der Einnahme')
    }
  }

  const resetForm = () => {
    setIncomeType('')
    setLivestockCountId('none')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setDescription('')
    setNotes('')
  }

  const handleEdit = (transaction: IncomeTransaction) => {
    setEditingTransaction(transaction)
    setIncomeType(transaction.income_type)
    setLivestockCountId(transaction.livestock_count_id || 'none')
    setTransactionDate(transaction.transaction_date)
    setAmount(transaction.amount.toString())
    setDescription(transaction.description || '')
    setNotes(transaction.notes || '')
    setShowCreateDialog(true)
  }

  const handleDuplicate = (transaction: IncomeTransaction) => {
    setEditingTransaction(null) // Set to null to create new record
    setIncomeType(transaction.income_type)
    setLivestockCountId(transaction.livestock_count_id || 'none')
    setTransactionDate(new Date().toISOString().split('T')[0]) // Set to today
    setAmount(transaction.amount.toString())
    setDescription(transaction.description || '')
    setNotes(transaction.notes || '')
    setShowCreateDialog(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getTotalIncome = () => {
    return incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
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

  const filteredTransactions = incomeTransactions
    .filter((transaction) => {
      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      return (
        transaction.income_type.toLowerCase().includes(query) ||
        transaction.livestock_counts?.durchgang_name?.toLowerCase().includes(query) ||
        transaction.description?.toLowerCase().includes(query) ||
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
        case 'income_type':
          comparison = a.income_type.localeCompare(b.income_type)
          break
        case 'durchgang':
          comparison = (a.livestock_counts?.durchgang_name || '').localeCompare(b.livestock_counts?.durchgang_name || '')
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Einnahmen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre zusaetzlichen Einnahmen (Praemien, Boni, Zuschuesse)
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setEditingTransaction(null)
            setShowCreateDialog(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Neue Einnahme
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Zusammenfassung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Anzahl Buchungen</p>
              <p className="text-2xl font-bold">{incomeTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamteinnahmen</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Einnahmen
          </CardTitle>
          <CardDescription>
            Uebersicht aller Ihrer Einnahmen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Suchen nach Einnahmenart, Durchgang, Beschreibung..."
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
                  onClick={() => handleSort('income_type')}
                >
                  <div className="flex items-center">
                    Einnahmenart
                    {getSortIcon('income_type')}
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
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Keine Einnahmen gefunden' : 'Noch keine Einnahmen erfasst'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(transaction.transaction_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {INCOME_TYPE_LABELS[transaction.income_type] || transaction.income_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.livestock_counts?.durchgang_name || '-'}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(transaction)}
                          title="Duplizieren"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Einnahme bearbeiten' : 'Neue Einnahme'}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? 'Bearbeiten Sie die Einnahme.'
                : 'Erfassen Sie eine neue Einnahme (Praemie, Bonus, Zuschuss, etc.).'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incomeType">Einnahmenart *</Label>
                <Select value={incomeType} onValueChange={setIncomeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Einnahmenart waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {INCOME_TYPE_LABELS[type] || type}
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Betrag (EUR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="livestockCount">Durchgang (optional)</Label>
                <Select value={livestockCountId} onValueChange={setLivestockCountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durchgang waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Durchgang</SelectItem>
                    {livestockCounts.map((count) => (
                      <SelectItem key={count.id} value={count.id}>
                        {count.durchgang_name || `Durchgang ${formatDate(count.start_date)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. QS-Praemie 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zusaetzliche Informationen..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingTransaction(null)
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Speichern...' : editingTransaction ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
