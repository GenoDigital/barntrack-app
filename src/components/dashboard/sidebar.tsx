'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Upload,
  DollarSign,
  Users,
  Settings,
  FileText,
  BarChart,
  Package,
  MapPin,
  Building,
  TrendingUp,
  CreditCard,
  Crown,
  ChevronDown,
  ChevronRight,
  PenSquare,
  Database,
  LineChart,
  PawPrint,
  Receipt,
  Tag,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: any
}

interface NavGroup {
  name: string
  icon: any
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    name: 'Auswertung',
    icon: LineChart,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Durchgangsauswertung', href: '/dashboard/evaluation', icon: TrendingUp },
      { name: 'Futterauswertung', href: '/dashboard/reports', icon: BarChart },
      { name: 'Verlauf', href: '/dashboard/history', icon: FileText },
    ]
  },
  {
    name: 'Dateneingabe',
    icon: PenSquare,
    items: [
      { name: 'Verbrauch', href: '/dashboard/upload', icon: Upload },
      { name: 'Tierzahlen', href: '/dashboard/counts', icon: PawPrint },
      { name: 'Preise', href: '/dashboard/prices', icon: DollarSign },
      { name: 'Kostenbuchungen', href: '/dashboard/costs', icon: Receipt },
    ]
  },
  {
    name: 'Stammdaten',
    icon: Database,
    items: [
      { name: 'Futtermittel', href: '/dashboard/feed', icon: Package },
      { name: 'Lieferanten', href: '/dashboard/suppliers', icon: Building },
      { name: 'Bereiche', href: '/dashboard/areas', icon: MapPin },
      { name: 'Kostenarten', href: '/dashboard/cost-types', icon: Tag },
    ]
  },
  {
    name: 'Einstellungen',
    icon: Settings,
    items: [
      { name: 'Betrieb', href: '/dashboard/farm-settings', icon: Settings },
      { name: 'Pläne & Preise', href: '/dashboard/pricing', icon: CreditCard },
    ]
  }
]

// Farm owner only navigation items
const ownerSettingsItems: NavItem[] = [
  { name: 'Abonnement', href: '/dashboard/abonnement', icon: Crown },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isFarmOwner, setIsFarmOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Auswertung': true,
    'Dateneingabe': true,
    'Stammdaten': true,
    'Einstellungen': true,
  })
  const supabase = createClient()

  const checkFarmOwnerStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('is_user_farm_owner')
      if (!error && data) {
        setIsFarmOwner(true)
      }
    } catch (err) {
      console.error('Error checking farm owner status:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      checkFarmOwnerStatus()
    } else {
      setLoading(false)
    }
  }, [user, checkFarmOwnerStatus])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  // Add owner-only items to settings group
  const groups = navigationGroups.map(group => {
    if (group.name === 'Einstellungen' && isFarmOwner) {
      return {
        ...group,
        items: [...group.items, ...ownerSettingsItems]
      }
    }
    return group
  })

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-6 flex-shrink-0">
        <h1 className="text-xl font-bold">barntrack</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2 overflow-auto">
        {groups.map((group) => {
          const GroupIcon = group.icon
          const isExpanded = expandedGroups[group.name]
          const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

          return (
            <div key={group.name} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <GroupIcon className="h-4 w-4" />
                <span className="flex-1 text-left">{group.name}</span>
                <ChevronIcon className="h-4 w-4" />
              </button>

              {isExpanded && (
                <div className="space-y-1 ml-2">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}