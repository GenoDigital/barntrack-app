/**
 * Widget Library Dialog
 *
 * Dialog for browsing and adding widgets to dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, BarChart3, PieChart, Table2, Activity, Grid3x3, TrendingDown, ScatterChart } from 'lucide-react'
import { getWidgetTemplates } from '@/lib/services/dashboard-service'
import { WidgetTemplate } from '@/types/dashboard'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'

const WIDGET_ICONS = {
  stat: Activity,
  chart: BarChart3,
  table: Table2,
  pie: PieChart,
  gauge: Activity,
  activity: Activity,
  heatmap: Grid3x3,
  waterfall: TrendingDown,
  scatter: ScatterChart,
}

const CATEGORY_LABELS = {
  cost: 'Kosten',
  feed: 'Futter',
  supplier: 'Lieferanten',
  analysis: 'Analyse',
  general: 'Allgemein',
  cycle: 'Durchgänge',
}

interface WidgetLibraryDialogProps {
  children?: React.ReactNode
}

export function WidgetLibraryDialog({ children }: WidgetLibraryDialogProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<WidgetTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<WidgetTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { addWidget, currentDashboard, widgets } = useDashboardStore()

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      try {
        const data = await getWidgetTemplates()
        setTemplates(data)
        setFilteredTemplates(data)
      } catch (error) {
        console.error('Error loading widget templates:', error)
        toast.error('Fehler beim Laden der Widget-Vorlagen')
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadTemplates()
    }
  }, [open])

  useEffect(() => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter((t) =>
        t.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }, [searchTerm, selectedCategory, templates])

  const handleAddWidget = async (template: WidgetTemplate) => {
    if (!currentDashboard) {
      toast.error('Kein Dashboard ausgewählt')
      return
    }

    try {
      // Find position for new widget (bottom of layout)
      const maxY = widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0)

      await addWidget({
        widget_type: template.widget_type,
        template_name: template.name,
        title: template.display_name,
        layout_x: 0,
        layout_y: maxY,
        layout_w: template.default_width,
        layout_h: template.default_height,
        config: {
          ...template.default_config,
          description: template.description,
        },
      })

      toast.success(`Widget "${template.display_name}" hinzugefügt`)
      setOpen(false)
    } catch (error) {
      console.error('Error adding widget:', error)
      toast.error('Fehler beim Hinzufügen des Widgets')
    }
  }

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Widget hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Widget hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Widget aus der Bibliothek, um es zu Ihrem Dashboard hinzuzufügen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Widgets durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Alle
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              </Button>
            ))}
          </div>

          {/* Widget Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Lade Widgets...</p>
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => {
                  const Icon = WIDGET_ICONS[template.widget_type] || Activity
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddWidget(template)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm">
                              {template.display_name}
                            </CardTitle>
                          </div>
                          {template.is_premium && (
                            <Badge variant="secondary" className="text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Keine Widgets gefunden</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
