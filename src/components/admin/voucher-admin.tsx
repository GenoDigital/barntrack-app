'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface VoucherCode {
  id: string
  code: string
  stripe_coupon_id: string
  description: string | null
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export function VoucherAdmin() {
  const [vouchers, setVouchers] = useState<VoucherCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<VoucherCode | null>(null)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    stripe_coupon_id: '',
    description: '',
    max_uses: 1,
    expires_at: ''
  })

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('voucher_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVouchers(data || [])
    } catch (error) {
      console.error('Error loading vouchers:', error)
      toast.error('Fehler beim Laden der Gutscheine')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        max_uses: parseInt(formData.max_uses.toString()),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      }

      if (editingVoucher) {
        const { error } = await supabase
          .from('voucher_codes')
          .update(submitData)
          .eq('id', editingVoucher.id)
        
        if (error) throw error
        toast.success('Gutschein aktualisiert')
      } else {
        const { error } = await supabase
          .from('voucher_codes')
          .insert(submitData)
        
        if (error) throw error
        toast.success('Gutschein erstellt')
      }

      resetForm()
      loadVouchers()
    } catch (error: any) {
      console.error('Error saving voucher:', error)
      toast.error(error.message || 'Fehler beim Speichern')
    }
  }

  const toggleVoucherStatus = async (voucher: VoucherCode) => {
    try {
      const { error } = await supabase
        .from('voucher_codes')
        .update({ is_active: !voucher.is_active })
        .eq('id', voucher.id)

      if (error) throw error
      toast.success(`Gutschein ${voucher.is_active ? 'deaktiviert' : 'aktiviert'}`)
      loadVouchers()
    } catch (error) {
      console.error('Error toggling voucher status:', error)
      toast.error('Fehler beim Ändern des Status')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      stripe_coupon_id: '',
      description: '',
      max_uses: 1,
      expires_at: ''
    })
    setShowCreateForm(false)
    setEditingVoucher(null)
  }

  const startEdit = (voucher: VoucherCode) => {
    setFormData({
      code: voucher.code,
      stripe_coupon_id: voucher.stripe_coupon_id,
      description: voucher.description || '',
      max_uses: voucher.max_uses,
      expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().split('T')[0] : ''
    })
    setEditingVoucher(voucher)
    setShowCreateForm(true)
  }

  if (loading) {
    return <div>Lädt Gutscheine...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gutschein-Verwaltung</h2>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Gutscheincodes</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Gutschein
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVoucher ? 'Gutschein bearbeiten' : 'Neuer Gutschein'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Gutscheincode</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="z.B. WELCOME2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stripe_coupon_id">Stripe Coupon ID</Label>
                  <Input
                    id="stripe_coupon_id"
                    value={formData.stripe_coupon_id}
                    onChange={(e) => setFormData({...formData, stripe_coupon_id: e.target.value})}
                    placeholder="z.B. coupon_123"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="z.B. 50% Rabatt für 3 Monate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max. Verwendungen</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value) || 1})}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Ablaufdatum</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingVoucher ? 'Aktualisieren' : 'Erstellen'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gutscheine</CardTitle>
          <CardDescription>Übersicht aller Gutscheincodes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Verwendungen</TableHead>
                <TableHead>Ablauf</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-mono font-medium">
                    {voucher.code}
                  </TableCell>
                  <TableCell>{voucher.description}</TableCell>
                  <TableCell>
                    {voucher.used_count} / {voucher.max_uses}
                  </TableCell>
                  <TableCell>
                    {voucher.expires_at 
                      ? new Date(voucher.expires_at).toLocaleDateString('de-DE')
                      : 'Kein Ablauf'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                      {voucher.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startEdit(voucher)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleVoucherStatus(voucher)}
                      >
                        {voucher.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}