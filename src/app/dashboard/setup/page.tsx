'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createFarmAction } from '@/app/actions/farm-actions'
import { useFarmStore } from '@/lib/stores/farm-store'

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [farmName, setFarmName] = useState('')
  const [farmDescription, setFarmDescription] = useState('')
  const router = useRouter()
  const { setCurrentFarmId } = useFarmStore()

  const handleCreateFarm = async () => {
    setIsCreating(true)

    const result = await createFarmAction({
      name: farmName,
      description: farmDescription
    })

    setIsCreating(false)

    if (result.success) {
      // Auto-select the newly created farm
      if (result.farm?.id) {
        setCurrentFarmId(result.farm.id)
      }
      toast.success('Stall erfolgreich erstellt!')
      router.push('/dashboard')
    } else {
      toast.error(result.error || 'Fehler beim Erstellen des Stalls')
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