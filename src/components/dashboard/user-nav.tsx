'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut, User as UserIcon, Crown, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useSubscription } from '@/lib/hooks/use-subscription'
import Link from 'next/link'
import { safeGetUser } from '@/lib/auth-error-handler'

export function UserNav() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const { subscription, getPlanName } = useSubscription()

  useEffect(() => {
    const getUser = async () => {
      // Use safe getUser with auto-redirect on auth errors
      const user = await safeGetUser({ redirectOnError: true })
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U'

  const getPlanBadgeColor = () => {
    if (!subscription) return 'secondary'
    switch (subscription.plan_type) {
      case 'starter': return 'secondary'
      case 'professional': return 'default'
      case 'enterprise': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusBadgeColor = () => {
    if (!subscription) return 'secondary'
    switch (subscription.status) {
      case 'active': return 'default'
      case 'trialing': return 'secondary'
      case 'past_due': return 'destructive'
      case 'canceled': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user?.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            {subscription && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={getPlanBadgeColor()} className="text-xs">
                    {getPlanName()}
                  </Badge>
                  <Badge variant={getStatusBadgeColor()} className="text-xs">
                    {subscription.status === 'active' ? 'Aktiv' : 
                     subscription.status === 'trialing' ? 'Testphase' :
                     subscription.status === 'past_due' ? 'Überfällig' :
                     subscription.status === 'canceled' ? 'Gekündigt' : subscription.status}
                  </Badge>
                </div>
                {subscription.status === 'trialing' && subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    Testphase bis {new Date(subscription.current_period_end).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/farm-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Farm Einstellungen</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing">
            <Crown className="mr-2 h-4 w-4" />
            <span>Plan verwalten</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}