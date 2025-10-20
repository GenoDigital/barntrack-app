'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Euro, Package, TrendingUp, Calendar } from 'lucide-react'

export function DashboardStats() {
  const { currentFarmId } = useFarmStore()
  const supabase = createClient()
  const [stats, setStats] = useState({
    monthlyTotal: 0,
    feedTypes: 0,
    averageDaily: 0,
    lastUpload: null as string | null,
  })

  const loadStats = useCallback(async () => {
    try {
      // Get feed types count
      const { count: feedTypesCount } = await supabase
        .from('feed_types')
        .select('*', { count: 'exact', head: true })
        .eq('farm_id', currentFarmId!)

      // Get last upload
      const { data: lastUploadData } = await supabase
        .from('uploads')
        .select('created_at')
        .eq('farm_id', currentFarmId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate monthly total from consumption data with real pricing
      // Get data from the last 30 days instead of current month
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: consumptionData } = await supabase
        .from('consumption')
        .select(`
          quantity,
          date,
          feed_type_id,
          feed_types!inner(name)
        `)
        .eq('farm_id', currentFarmId!)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      // Get all price tiers for this farm
      const { data: priceTiers } = await supabase
        .from('price_tiers')
        .select('feed_type_id, price_per_unit, valid_from, valid_to')
        .eq('farm_id', currentFarmId!)

      let monthlyTotal = 0
      const daysWithData = new Set()

      if (consumptionData) {
        for (const item of consumptionData) {
          try {
            // Find the applicable price tier for this feeding date and feed type
            let price = 0
            if (priceTiers && priceTiers.length > 0) {
              const feedPrices = priceTiers.filter(tier => tier.feed_type_id === item.feed_type_id)
              const validPrices = feedPrices.filter((tier: any) => {
                const validFrom = tier.valid_from <= item.date
                const validTo = !tier.valid_to || tier.valid_to >= item.date
                return validFrom && validTo
              })
              
              // Get the most recent valid price at the time of feeding
              if (validPrices.length > 0) {
                const sortedPrices = validPrices.sort((a: any, b: any) => 
                  new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()
                )
                price = parseFloat(sortedPrices[0].price_per_unit) || 0
              }
            }

            const quantity = parseFloat(item.quantity) || 0
            monthlyTotal += quantity * price
            daysWithData.add(item.date)
          } catch (error) {
            console.error('Error processing consumption item:', error, item)
          }
        }
      }

      const averageDaily = daysWithData.size > 0 ? monthlyTotal / daysWithData.size : 0

      setStats({
        monthlyTotal,
        feedTypes: feedTypesCount || 0,
        averageDaily,
        lastUpload: lastUploadData?.created_at || null,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [supabase, currentFarmId])

  useEffect(() => {
    if (currentFarmId) {
      loadStats()
    }
  }, [currentFarmId, loadStats])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monatliche Kosten
          </CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €{stats.monthlyTotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Letzte 30 Tage
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Futtermittel
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.feedTypes}</div>
          <p className="text-xs text-muted-foreground">
            Aktive Typen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Täglicher Durchschnitt
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €{stats.averageDaily.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Letzte 30 Tage
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Letzter Upload
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString('de-DE') : '-'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.lastUpload ? 'Erfolgreich' : 'Noch keine Daten'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}