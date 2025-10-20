'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateFarmDialog } from '@/components/farms/create-farm-dialog'
import { useFarmStore } from '@/lib/stores/farm-store'

interface Farm {
  id: string
  name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
  owner_id: string
}

export function FarmSelector() {
  const supabase = createClient()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { currentFarmId, setCurrentFarmId } = useFarmStore()

  const loadFarms = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Query farms directly - RLS policy will filter based on ownership/membership
    const { data, error } = await supabase
      .from('farms')
      .select('id, name, description, created_at, updated_at, owner_id')
      .order('name')

    console.log('Farm selector query result:', { data, error })

    if (!error && data) {
      setFarms(data)
      if (data.length > 0 && !currentFarmId) {
        setCurrentFarmId(data[0].id)
      }
    } else if (error) {
      console.error('Error loading farms:', error)
    }
    setLoading(false)
  }, [supabase, currentFarmId, setCurrentFarmId])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  if (loading) return <div>Lädt...</div>

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={currentFarmId || ''} onValueChange={setCurrentFarmId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Stall wählen" />
          </SelectTrigger>
          <SelectContent>
            {farms.map((farm) => (
              <SelectItem key={farm.id} value={farm.id}>
                {farm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateFarmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadFarms()
          setShowCreateDialog(false)
        }}
      />
    </>
  )
}