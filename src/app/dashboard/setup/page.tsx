'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [farmName, setFarmName] = useState('')
  const [farmDescription, setFarmDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleCreateFarm = async () => {
    if (!farmName.trim()) {
      toast.error('Stallname ist erforderlich')
      return
    }

    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht authentifiziert')

      // First, ensure user record exists in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
          user_type: 'owner'
        })

      if (userError) {
        console.error('Error creating user record:', userError)
        throw userError
      }

      // Create farm
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .insert({
          name: farmName.trim(),
          description: farmDescription.trim() || null,
          owner_id: user.id
        })
        .select()
        .single()

      if (farmError) {
        console.error('Error creating farm:', farmError)
        throw farmError
      }

      // Add user as farm member with owner role
      const { error: memberError } = await supabase
        .from('farm_members')
        .insert({
          farm_id: farm.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error creating farm membership:', memberError)
        throw memberError
      }

      toast.success('Stall erfolgreich erstellt!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Fehler beim Erstellen des Stalls')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Willkommen bei Feedbase</h1>
          <p className="text-gray-600 mt-2">
            Um loszulegen, müssen Sie einen Stall erstellen oder zu einem eingeladen werden.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Neuen Stall erstellen
              </CardTitle>
              <CardDescription>
                Erstellen Sie einen neuen Stall und verwalten Sie Ihre Futtermittel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="farmName">Stallname *</Label>
                <Input
                  id="farmName"
                  placeholder="z.B. Hof Mustermann"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="farmDescription">Beschreibung (optional)</Label>
                <Textarea
                  id="farmDescription"
                  placeholder="Kurze Beschreibung Ihres Stalls..."
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateFarm} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Erstelle...' : 'Stall erstellen'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Einladung erhalten?
              </CardTitle>
              <CardDescription>
                Wenn Sie eine Einladung zu einem bestehenden Stall erhalten haben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Prüfen Sie Ihre E-Mails auf eine Einladung oder wenden Sie sich an den Stallbesitzer.
              </p>
              <Button variant="outline" className="w-full">
                E-Mails prüfen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}