'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, FolderOpen, Copy, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CostType {
  id: string
  name: string
  category: string | null
}

interface CostTemplateItem {
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

interface CostTemplate {
  id: string
  farm_id: string
  name: string
  year: number | null
  description: string | null
  items?: CostTemplateItem[]
}

const ALLOCATION_TYPES = [
  { value: 'fixed', label: 'Fester Betrag', description: 'Betrag wird 1:1 übernommen' },
  { value: 'per_animal', label: 'Pro Tier', description: 'Betrag × Anzahl Tiere im Durchgang' },
  { value: 'per_day', label: 'Pro Tag', description: 'Betrag × Mastdauer in Tagen' },
]

export default function CostTemplatesPage() {
  const { currentFarmId } = useFarmStore()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<CostTemplate[]>([])
  const [costTypes, setCostTypes] = useState<CostType[]>([])
  const [loading, setLoading] = useState(true)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CostTemplate | null>(null)
  const [editingItem, setEditingItem] = useState<CostTemplateItem | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<CostTemplate | null>(null)
  const [itemToDelete, setItemToDelete] = useState<CostTemplateItem | null>(null)

  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    description: '',
  })
  const [itemForm, setItemForm] = useState({
    cost_type_id: '',
    amount: '',
    quantity: '1',
    unit: '',
    description: '',
    allocation_type: 'fixed' as 'fixed' | 'per_animal' | 'per_day',
  })

  const supabase = createClient()

  const loadData = useCallback(async () => {
    if (!currentFarmId) return

    setLoading(true)
    try {
      // Load templates with items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: templatesData, error: templatesError } = await (supabase
        .from('cost_templates')
        .select(`
          *,
          items:cost_template_items(
            *,
            cost_types(id, name, category)
          )
        `)
        .eq('farm_id', currentFarmId)
        .order('year', { ascending: false })
        .order('name') as any)

      if (templatesError) throw templatesError
      setTemplates((templatesData || []) as CostTemplate[])

      // Load cost types
      const { data: costTypesData, error: costTypesError } = await supabase
        .from('cost_types')
        .select('id, name, category')
        .eq('farm_id', currentFarmId)
        .eq('is_active', true)
        .order('name')

      if (costTypesError) throw costTypesError
      setCostTypes(costTypesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }, [currentFarmId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      year: new Date().getFullYear(),
      description: '',
    })
    setIsTemplateDialogOpen(true)
  }

  const handleEditTemplate = (template: CostTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      year: template.year || new Date().getFullYear(),
      description: template.description || '',
    })
    setIsTemplateDialogOpen(true)
  }

  const handleDuplicateTemplate = async (template: CostTemplate) => {
    if (!currentFarmId || !user) return

    try {
      // Create new template
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newTemplate, error: templateError } = await (supabase
        .from('cost_templates')
        .insert({
          farm_id: currentFarmId,
          name: `${template.name} (Kopie)`,
          year: template.year,
          description: template.description,
          created_by: user.id,
        })
        .select()
        .single() as any)

      if (templateError) throw templateError

      // Copy items
      if (template.items && template.items.length > 0) {
        const itemsToInsert = template.items.map(item => ({
          template_id: newTemplate.id,
          cost_type_id: item.cost_type_id,
          amount: item.amount,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description,
          allocation_type: item.allocation_type,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: itemsError } = await (supabase
          .from('cost_template_items')
          .insert(itemsToInsert) as any)

        if (itemsError) throw itemsError
      }

      toast.success('Vorlage dupliziert')
      loadData()
    } catch (err) {
      console.error('Error duplicating template:', err)
      toast.error('Fehler beim Duplizieren')
    }
  }

  const handleSaveTemplate = async () => {
    if (!currentFarmId || !user) return
    if (!templateForm.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    try {
      if (editingTemplate) {
        // Update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('cost_templates')
          .update({
            name: templateForm.name.trim(),
            year: templateForm.year,
            description: templateForm.description.trim() || null,
          })
          .eq('id', editingTemplate.id) as any)

        if (error) throw error
        toast.success('Vorlage aktualisiert')
      } else {
        // Create
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('cost_templates')
          .insert({
            farm_id: currentFarmId,
            name: templateForm.name.trim(),
            year: templateForm.year,
            description: templateForm.description.trim() || null,
            created_by: user.id,
          }) as any)

        if (error) throw error
        toast.success('Vorlage erstellt')
      }

      setIsTemplateDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error('Fehler beim Speichern')
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('cost_templates')
        .delete()
        .eq('id', templateToDelete.id) as any)

      if (error) throw error
      toast.success('Vorlage gelöscht')
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
      loadData()
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error('Fehler beim Löschen')
    }
  }

  const handleAddItem = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setEditingItem(null)
    setItemForm({
      cost_type_id: '',
      amount: '',
      quantity: '1',
      unit: '',
      description: '',
      allocation_type: 'fixed',
    })
    setIsItemDialogOpen(true)
  }

  const handleEditItem = (item: CostTemplateItem) => {
    setSelectedTemplateId(item.template_id)
    setEditingItem(item)
    setItemForm({
      cost_type_id: item.cost_type_id,
      amount: item.amount.toString(),
      quantity: item.quantity?.toString() || '1',
      unit: item.unit || '',
      description: item.description || '',
      allocation_type: item.allocation_type,
    })
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!selectedTemplateId) return
    if (!itemForm.cost_type_id) {
      toast.error('Bitte wählen Sie eine Kostenart')
      return
    }
    if (!itemForm.amount || parseFloat(itemForm.amount) <= 0) {
      toast.error('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    try {
      const itemData = {
        template_id: selectedTemplateId,
        cost_type_id: itemForm.cost_type_id,
        amount: parseFloat(itemForm.amount),
        quantity: parseFloat(itemForm.quantity) || 1,
        unit: itemForm.unit.trim() || null,
        description: itemForm.description.trim() || null,
        allocation_type: itemForm.allocation_type,
      }

      if (editingItem) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('cost_template_items')
          .update(itemData)
          .eq('id', editingItem.id) as any)

        if (error) throw error
        toast.success('Position aktualisiert')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('cost_template_items')
          .insert(itemData) as any)

        if (error) throw error
        toast.success('Position hinzugefügt')
      }

      setIsItemDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving item:', err)
      toast.error('Fehler beim Speichern')
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('cost_template_items')
        .delete()
        .eq('id', itemToDelete.id) as any)

      if (error) throw error
      toast.success('Position gelöscht')
      setItemToDelete(null)
      loadData()
    } catch (err) {
      console.error('Error deleting item:', err)
      toast.error('Fehler beim Löschen')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const getAllocationLabel = (type: string) => {
    const found = ALLOCATION_TYPES.find(t => t.value === type)
    return found?.label || type
  }

  const getAllocationBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'fixed': return 'secondary'
      case 'per_animal': return 'default'
      case 'per_day': return 'outline'
      default: return 'secondary'
    }
  }

  const calculateTemplateTotal = (items: CostTemplateItem[] | undefined) => {
    if (!items) return 0
    return items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0)
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kostenvorlagen</h1>
          <p className="text-muted-foreground">
            Erstellen Sie wiederverwendbare Kostenvorlagen für wiederkehrende Kosten
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Vorlage
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Vorlagen vorhanden</h3>
            <p className="text-muted-foreground text-center mb-4">
              Erstellen Sie Ihre erste Kostenvorlage für wiederkehrende Kosten wie<br />
              Einstreu, Gebäudekosten, Versicherungen etc.
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Vorlage erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {templates.map((template) => (
            <AccordionItem
              key={template.id}
              value={template.id}
              className="border rounded-lg px-4"
            >
              <div className="flex items-center justify-between py-4">
                <AccordionTrigger className="hover:no-underline flex-1 py-0 [&>svg]:hidden">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.year && `Jahr ${template.year} · `}
                        {template.items?.length || 0} Positionen ·{' '}
                        Summe: {formatCurrency(calculateTemplateTotal(template.items))}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateTemplate(template)
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplizieren</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditTemplate(template)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTemplateToDelete(template)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <AccordionContent>
                <div className="pt-2 pb-4 space-y-4">
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Positionen</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem(template.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Position hinzufügen
                    </Button>
                  </div>

                  {template.items && template.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kostenart</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                          <TableHead>Verteilung</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.cost_types?.name}
                              {item.cost_types?.category && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({item.cost_types.category})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.amount)}
                              {item.quantity && item.quantity !== 1 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  × {item.quantity}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getAllocationBadgeVariant(item.allocation_type)}>
                                {getAllocationLabel(item.allocation_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setItemToDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keine Positionen vorhanden. Fügen Sie Kostenpositionen hinzu.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Vorlage für wiederkehrende Kosten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="z.B. Jährliche Fixkosten"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Jahr</Label>
              <Input
                id="year"
                type="number"
                value={templateForm.year}
                onChange={(e) => setTemplateForm({ ...templateForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Optionale Beschreibung der Vorlage"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Position bearbeiten' : 'Neue Position hinzufügen'}
            </DialogTitle>
            <DialogDescription>
              Fügen Sie eine Kostenposition zur Vorlage hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cost_type">Kostenart *</Label>
              <Select
                value={itemForm.cost_type_id}
                onValueChange={(value) => setItemForm({ ...itemForm, cost_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kostenart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.name}
                      {ct.category && (
                        <span className="text-muted-foreground ml-2">({ct.category})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Betrag (EUR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.amount}
                  onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Menge</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="allocation_type">Verteilungsart *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Wie wird der Betrag berechnet?</p>
                      <ul className="text-sm space-y-1">
                        <li><strong>Fester Betrag:</strong> Wird 1:1 übernommen</li>
                        <li><strong>Pro Tier:</strong> Betrag × Anzahl Tiere</li>
                        <li><strong>Pro Tag:</strong> Betrag × Mastdauer in Tagen</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={itemForm.allocation_type}
                onValueChange={(value: 'fixed' | 'per_animal' | 'per_day') =>
                  setItemForm({ ...itemForm, allocation_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_description">Beschreibung</Label>
              <Input
                id="item_description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Optionale Beschreibung"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Vorlage &quot;{templateToDelete?.name}&quot; wirklich löschen?
              Alle zugehörigen Positionen werden ebenfalls gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Position löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Position wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
