import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

const integrations = [
  {
    name: 'GEA',
    description: 'Vollständige Integration mit GEA-Fütterungssystemen',
    status: 'active',
  },
  {
    name: 'Lely',
    description: 'Automatische Datenübernahme aus Lely-Systemen',
    status: 'coming-soon',
  },
  {
    name: 'DeLaval',
    description: 'Nahtlose Verbindung mit DeLaval-Anlagen',
    status: 'coming-soon',
  },
  {
    name: 'BVL',
    description: 'Import von BVL-Fütterungsdaten',
    status: 'coming-soon',
  },
  {
    name: 'Trioliet',
    description: 'Trioliet Futtermischwagen Integration',
    status: 'coming-soon',
  },
  {
    name: 'Weitere',
    description: 'Individuelle Integrationen auf Anfrage',
    status: 'request',
  },
]

const statusConfig = {
  active: {
    label: 'Verfügbar',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: true,
  },
  'coming-soon': {
    label: 'In Planung',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: false,
  },
  request: {
    label: 'Auf Anfrage',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: false,
  },
}

export function IntegrationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => {
        const config = statusConfig[integration.status as keyof typeof statusConfig]
        return (
          <Card key={integration.name} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold">{integration.name}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.className} flex items-center gap-1`}>
                  {config.icon && <Check className="h-3 w-3" />}
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
