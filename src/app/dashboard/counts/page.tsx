'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useFarmStore } from '@/lib/stores/farm-store'
import { Plus, Edit, Calendar, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Tables } from '@/lib/database.types'
import { MovementTimelineEditor, type AnimalMovement, type AreaOption } from '@/components/livestock/movement-timeline-editor'
import { calculateTotalAnimalsFromDetails } from '@/lib/utils/livestock-calculations'
import { calculateEstimatedProfitLoss } from '@/lib/utils/kpi-calculations'

type LivestockCount = Tables<'livestock_counts'>
type LivestockCountDetail = Tables<'livestock_count_details'>
type Area = Tables<'areas'>
type Supplier = Tables<'suppliers'>
type AreaGroup = Tables<'area_groups'>

interface LivestockCountWithDetails extends LivestockCount {
  livestock_count_details: (LivestockCountDetail & { areas: Area | null; area_groups: AreaGroup | null })[]
  suppliers?: Supplier
}

type SortField = 'durchgang' | 'startDate' | 'status' | 'supplier' | 'totalAnimals' | 'buyPrice' | 'sellPrice' | 'profitLoss'
type SortDirection = 'asc' | 'desc' | null

export default function CountsPage() {
  const [durchgaenge, setDurchgaenge] = useState<LivestockCountWithDetails[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [areaGroups, setAreaGroups] = useState<AreaGroup[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingDurchgang, setEditingDurchgang] = useState<LivestockCountWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { currentFarmId} = useFarmStore()
  const supabase = createClient()

  // Form state
  const [durchgangName, setDurchgangName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [countingMode, setCountingMode] = useState<'area' | 'group'>('group')
  const [animalCounts, setAnimalCounts] = useState<{ [key: string]: { count: number; animalType: string } }>({})
  const [inputMode, setInputMode] = useState<'simple' | 'timeline'>('simple')
  const [movements, setMovements] = useState<AnimalMovement[]>([])

  // Financial form state
  const [buyPricePerAnimal, setBuyPricePerAnimal] = useState('')
  const [sellPricePerAnimal, setSellPricePerAnimal] = useState('')
  const [expectedWeightPerAnimal, setExpectedWeightPerAnimal] = useState('')
  const [actualWeightPerAnimal, setActualWeightPerAnimal] = useState('')
  const [mortalityRate, setMortalityRate] = useState('')
  const [feedConversionRatio, setFeedConversionRatio] = useState('')
  const [totalFeedCost, setTotalFeedCost] = useState('')
  const [revenue, setRevenue] = useState('')
  const [totalLifetimeDays, setTotalLifetimeDays] = useState('')
  const [slaughterWeightKg, setSlaughterWeightKg] = useState('')

  // Calculated fields
  const [weightGain, setWeightGain] = useState<number | null>(null)
  const [totalAnimalsCount, setTotalAnimalsCount] = useState(0)
  const [calculatedProfitLoss, setCalculatedProfitLoss] = useState<number | null>(null)
  const [dailyGainGrams, setDailyGainGrams] = useState<number | null>(null)
  const [netDailyGainGrams, setNetDailyGainGrams] = useState<number | null>(null)

  // Auto-calculate weight gain when start and end weights change
  useEffect(() => {
    const startWeight = parseFloat(expectedWeightPerAnimal) // Start weight
    const endWeight = parseFloat(actualWeightPerAnimal) // End weight
    if (!isNaN(startWeight) && !isNaN(endWeight)) {
      setWeightGain(endWeight - startWeight)
    } else {
      setWeightGain(null)
    }
  }, [expectedWeightPerAnimal, actualWeightPerAnimal])

  // Auto-calculate feed conversion ratio when we have feed cost and weight gain
  useEffect(() => {
    const feedCost = parseFloat(totalFeedCost)
    if (!isNaN(feedCost) && weightGain && weightGain > 0 && totalAnimalsCount > 0) {
      // If we have actual feed consumption data, calculate FCR
      // FCR = Total Feed Used (kg) / Total Weight Gain (kg)
      // For now, we'll calculate it based on estimated feed usage from price
      // This would be more accurate with actual feed consumption data
      
      // Calculate total weight gain for all animals
      const totalWeightGain = weightGain * totalAnimalsCount
      
      // Estimate total feed consumed based on average feed price
      // This is a simplified calculation - in reality you'd want actual feed consumption data
      if (totalWeightGain > 0) {
        // Get average feed price to estimate kg of feed from cost
        calculateFeedConversionFromCost(feedCost, totalWeightGain)
      }
    }
  }, [totalFeedCost, weightGain, totalAnimalsCount])

  const calculateFeedConversionFromCost = async (feedCost: number, totalWeightGain: number) => {
    try {
      const { data: priceTiers } = await supabase
        .from('price_tiers')
        .select('price_per_unit')
        .eq('farm_id', currentFarmId!)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`)
      
      if (priceTiers && priceTiers.length > 0) {
        const avgPrice = priceTiers.reduce((sum, tier) => sum + Number(tier.price_per_unit), 0) / priceTiers.length
        if (avgPrice > 0) {
          const estimatedFeedKg = feedCost / avgPrice
          const calculatedFCR = estimatedFeedKg / totalWeightGain
          
          // Only update if the field is empty or close to our calculation
          const currentFCR = parseFloat(feedConversionRatio)
          if (isNaN(currentFCR) || Math.abs(currentFCR - calculatedFCR) > 0.5) {
            setFeedConversionRatio(calculatedFCR.toFixed(2))
          }
        }
      }
    } catch (error) {
      console.error('Error calculating feed conversion ratio:', error)
    }
  }

  // Initialize movements when switching to timeline mode
  useEffect(() => {
    if (inputMode === 'timeline' && movements.length === 0 && startDate) {
      // Create initial movements from simple counts
      const initialMovements: AnimalMovement[] = []

      Object.entries(animalCounts).forEach(([id, { count, animalType }]) => {
        if (count > 0) {
          const area = areas.find(a => a.id === id)
          const group = areaGroups.find(g => g.id === id)

          initialMovements.push({
            id: crypto.randomUUID(),
            areaId: countingMode === 'area' ? id : null,
            areaGroupId: countingMode === 'group' ? id : null,
            areaName: area?.name || group?.name || 'Unbekannt',
            count,
            animalType,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
          })
        }
      })

      if (initialMovements.length > 0) {
        setMovements(initialMovements)
      }
    }
  }, [inputMode, startDate, endDate, animalCounts, movements.length, areas, areaGroups, countingMode])

  // Auto-calculate total animals count
  useEffect(() => {
    if (inputMode === 'simple') {
      const total = Object.values(animalCounts).reduce((sum, { count }) => sum + count, 0)
      setTotalAnimalsCount(total)
    } else {
      // In timeline mode, get max animals from movements
      const total = movements.reduce((sum, movement) => sum + movement.count, 0)
      setTotalAnimalsCount(total)
    }
  }, [animalCounts, movements, inputMode])

  // Auto-calculate revenue when sell price and animal count change
  useEffect(() => {
    const sellPrice = parseFloat(sellPricePerAnimal)
    if (!isNaN(sellPrice) && totalAnimalsCount > 0) {
      const calculatedRevenue = sellPrice * totalAnimalsCount
      setRevenue(calculatedRevenue.toFixed(2))
    }
  }, [sellPricePerAnimal, totalAnimalsCount])

  // Auto-calculate feed costs based on feed conversion ratio and weight gain
  useEffect(() => {
    if (currentFarmId && totalAnimalsCount > 0 && weightGain && weightGain > 0) {
      calculateFeedCosts()
    }
  }, [currentFarmId, totalAnimalsCount, feedConversionRatio, weightGain])

  // Auto-calculate profit/loss when relevant values change
  // Uses centralized calculation to ensure consistency with evaluation page
  useEffect(() => {
    const profitLoss = calculateEstimatedProfitLoss({
      totalAnimals: totalAnimalsCount,
      buyPricePerAnimal: buyPricePerAnimal ? parseFloat(buyPricePerAnimal) : null,
      sellPricePerAnimal: sellPricePerAnimal ? parseFloat(sellPricePerAnimal) : null,
      totalFeedCost: totalFeedCost ? parseFloat(totalFeedCost) : null,
      additionalCosts: 0, // No additional costs at form entry time
    })
    setCalculatedProfitLoss(profitLoss)
  }, [sellPricePerAnimal, buyPricePerAnimal, totalFeedCost, totalAnimalsCount])

  // Auto-calculate daily gains (Zunahmen pro Tag)
  useEffect(() => {
    if (weightGain && weightGain > 0 && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      if (durationDays > 0) {
        const dailyGain = (weightGain / durationDays) * 1000 // Convert kg to grams
        setDailyGainGrams(dailyGain)
      } else {
        setDailyGainGrams(null)
      }
    } else {
      setDailyGainGrams(null)
    }
  }, [weightGain, startDate, endDate])

  // Auto-calculate net daily gains (Netto Tageszunahmen)
  useEffect(() => {
    const slaughterWeight = parseFloat(slaughterWeightKg)
    const lifetimeDays = parseInt(totalLifetimeDays)
    if (!isNaN(slaughterWeight) && !isNaN(lifetimeDays) && lifetimeDays > 0) {
      const netDailyGain = (slaughterWeight / lifetimeDays) * 1000 // Convert kg to grams
      setNetDailyGainGrams(netDailyGain)
    } else {
      setNetDailyGainGrams(null)
    }
  }, [slaughterWeightKg, totalLifetimeDays])

  const calculateFeedCosts = async () => {
    try {
      // Calculate based on feed conversion ratio and actual weight gain
      const fcr = parseFloat(feedConversionRatio)
      
      if (!isNaN(fcr) && weightGain && weightGain > 0 && totalAnimalsCount > 0) {
        // Calculate total weight gain for all animals
        const totalWeightGain = weightGain * totalAnimalsCount
        
        // Calculate total feed needed: Total Weight Gain × FCR
        const totalFeedNeeded = totalWeightGain * fcr
        
        // Get current feed prices to estimate cost
        const { data: priceTiers } = await supabase
          .from('price_tiers')
          .select(`
            price_per_unit,
            feed_types(name, unit)
          `)
          .eq('farm_id', currentFarmId!)
          .lte('valid_from', new Date().toISOString().split('T')[0])
          .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`)
          .order('price_per_unit')
        
        if (priceTiers && priceTiers.length > 0) {
          // Use average price for estimation
          const avgPrice = priceTiers.reduce((sum, tier) => sum + Number(tier.price_per_unit), 0) / priceTiers.length
          const estimatedFeedCost = totalFeedNeeded * avgPrice
          setTotalFeedCost(estimatedFeedCost.toFixed(2))
        }
      }
    } catch (error) {
      console.error('Error calculating feed costs:', error)
    }
  }

  useEffect(() => {
    if (currentFarmId) {
      loadDurchgaenge()
      loadAreas()
      loadAreaGroups()
      loadSuppliers()
    }
  }, [currentFarmId])

  const loadDurchgaenge = async () => {
    const { data, error } = await supabase
      .from('livestock_counts')
      .select(`
        *,
        livestock_count_details(
          *,
          areas(*),
          area_groups(*)
        ),
        suppliers(*)
      `)
      .eq('farm_id', currentFarmId!)
      .order('created_date', { ascending: false })

    if (!error && data) {
      setDurchgaenge(data as LivestockCountWithDetails[])
    }
  }

  const loadAreas = async () => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setAreas(data)
      // Initialize animal counts for each area if in area mode
      if (countingMode === 'area') {
        const initialCounts: { [key: string]: { count: number; animalType: string } } = {}
        data.forEach(area => {
          initialCounts[area.id] = { count: 0, animalType: '' }
        })
        setAnimalCounts(initialCounts)
      }
    }
  }

  const loadAreaGroups = async () => {
    const { data, error } = await supabase
      .from('area_groups')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .order('name')

    if (!error && data) {
      setAreaGroups(data)
      // Initialize animal counts for each group if in group mode
      if (countingMode === 'group') {
        const initialCounts: { [key: string]: { count: number; animalType: string } } = {}
        data.forEach(group => {
          initialCounts[group.id] = { count: 0, animalType: '' }
        })
        setAnimalCounts(initialCounts)
      }
    }
  }

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('farm_id', currentFarmId!)
      .eq('is_active', true)
      .order('name')

    if (!error && data) {
      setSuppliers(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let livestockCountId: string

      if (editingDurchgang) {
        // Update existing Durchgang
        const { error } = await supabase
          .from('livestock_counts')
          .update({
            durchgang_name: durchgangName,
            start_date: startDate,
            end_date: endDate || null,
            notes: notes || null,
            supplier_id: supplierId && supplierId !== 'none' ? supplierId : null,
            buy_price_per_animal: buyPricePerAnimal ? parseFloat(buyPricePerAnimal) : null,
            sell_price_per_animal: sellPricePerAnimal ? parseFloat(sellPricePerAnimal) : null,
            expected_weight_per_animal: expectedWeightPerAnimal ? parseFloat(expectedWeightPerAnimal) : null,
            actual_weight_per_animal: actualWeightPerAnimal ? parseFloat(actualWeightPerAnimal) : null,
            mortality_rate: mortalityRate ? parseFloat(mortalityRate) : null,
            feed_conversion_ratio: feedConversionRatio ? parseFloat(feedConversionRatio) : null,
            total_feed_cost: totalFeedCost ? parseFloat(totalFeedCost) : null,
            revenue: revenue ? parseFloat(revenue) : null,
            profit_loss: calculatedProfitLoss,
            total_lifetime_days: totalLifetimeDays ? parseInt(totalLifetimeDays) : null,
            slaughter_weight_kg: slaughterWeightKg ? parseFloat(slaughterWeightKg) : null,
          })
          .eq('id', editingDurchgang.id)

        if (error) throw error
        livestockCountId = editingDurchgang.id

        // Delete existing details
        await supabase
          .from('livestock_count_details')
          .delete()
          .eq('livestock_count_id', livestockCountId)
      } else {
        // Create new Durchgang
        const { data, error } = await supabase
          .from('livestock_counts')
          .insert({
            farm_id: currentFarmId!,
            created_by: user.id,
            created_date: new Date().toISOString().split('T')[0],
            durchgang_name: durchgangName,
            start_date: startDate,
            end_date: endDate || null,
            notes: notes || null,
            supplier_id: supplierId && supplierId !== 'none' ? supplierId : null,
            buy_price_per_animal: buyPricePerAnimal ? parseFloat(buyPricePerAnimal) : null,
            sell_price_per_animal: sellPricePerAnimal ? parseFloat(sellPricePerAnimal) : null,
            expected_weight_per_animal: expectedWeightPerAnimal ? parseFloat(expectedWeightPerAnimal) : null,
            actual_weight_per_animal: actualWeightPerAnimal ? parseFloat(actualWeightPerAnimal) : null,
            mortality_rate: mortalityRate ? parseFloat(mortalityRate) : null,
            feed_conversion_ratio: feedConversionRatio ? parseFloat(feedConversionRatio) : null,
            total_feed_cost: totalFeedCost ? parseFloat(totalFeedCost) : null,
            revenue: revenue ? parseFloat(revenue) : null,
            profit_loss: calculatedProfitLoss,
            total_lifetime_days: totalLifetimeDays ? parseInt(totalLifetimeDays) : null,
            slaughter_weight_kg: slaughterWeightKg ? parseFloat(slaughterWeightKg) : null,
          })
          .select()
          .single()

        if (error) throw error
        livestockCountId = data.id
      }

      // Insert livestock count details
      let details
      if (inputMode === 'timeline') {
        // Use movements from timeline editor
        details = movements.map(movement => ({
          livestock_count_id: livestockCountId,
          area_id: movement.areaId,
          area_group_id: movement.areaGroupId,
          count: movement.count,
          animal_type: movement.animalType,
          start_date: movement.startDate.toISOString().split('T')[0],
          end_date: movement.endDate ? movement.endDate.toISOString().split('T')[0] : null,
        }))
      } else {
        // Simple mode - use animalCounts with cycle dates
        details = Object.entries(animalCounts)
          .filter(([, { count }]) => count > 0)
          .map(([id, { count, animalType }]) => ({
            livestock_count_id: livestockCountId,
            area_id: countingMode === 'area' ? id : null,
            area_group_id: countingMode === 'group' ? id : null,
            count,
            animal_type: animalType || null,
            start_date: startDate,
            end_date: endDate || null,
          }))
      }

      if (details.length > 0) {
        const { error } = await supabase
          .from('livestock_count_details')
          .insert(details)

        if (error) throw error
      }

      resetForm()
      setShowCreateDialog(false)
      setEditingDurchgang(null)
      loadDurchgaenge()
    } catch (error) {
      console.error('Error saving Durchgang:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDurchgangName('')
    setStartDate('')
    setEndDate('')
    setNotes('')
    setSupplierId('none')
    setBuyPricePerAnimal('')
    setSellPricePerAnimal('')
    setExpectedWeightPerAnimal('')
    setActualWeightPerAnimal('')
    setMortalityRate('')
    setFeedConversionRatio('')
    setTotalFeedCost('')
    setRevenue('')
    setTotalLifetimeDays('')
    setSlaughterWeightKg('')
    setWeightGain(null)
    setTotalAnimalsCount(0)
    setCalculatedProfitLoss(null)
    setDailyGainGrams(null)
    setNetDailyGainGrams(null)
    setInputMode('simple')
    setMovements([])
    const initialCounts: { [key: string]: { count: number; animalType: string } } = {}
    areas.forEach(area => {
      initialCounts[area.id] = { count: 0, animalType: '' }
    })
    setAnimalCounts(initialCounts)
  }

  const handleEdit = (durchgang: LivestockCountWithDetails) => {
    setEditingDurchgang(durchgang)
    setDurchgangName(durchgang.durchgang_name || '')
    setStartDate(durchgang.start_date || '')
    setEndDate(durchgang.end_date || '')
    setNotes(durchgang.notes || '')
    setSupplierId(durchgang.supplier_id || 'none')
    setBuyPricePerAnimal(durchgang.buy_price_per_animal?.toString() || '')
    setSellPricePerAnimal(durchgang.sell_price_per_animal?.toString() || '')
    setExpectedWeightPerAnimal(durchgang.expected_weight_per_animal?.toString() || '')
    setActualWeightPerAnimal(durchgang.actual_weight_per_animal?.toString() || '')
    setMortalityRate(durchgang.mortality_rate?.toString() || '')
    setFeedConversionRatio(durchgang.feed_conversion_ratio?.toString() || '')
    setTotalFeedCost(durchgang.total_feed_cost?.toString() || '')
    setRevenue(durchgang.revenue?.toString() || '')
    setTotalLifetimeDays(durchgang.total_lifetime_days?.toString() || '')
    setSlaughterWeightKg(durchgang.slaughter_weight_kg?.toString() || '')

    // Detect counting mode based on existing details
    const hasAreaDetails = durchgang.livestock_count_details.some(d => d.area_id !== null)
    const hasGroupDetails = durchgang.livestock_count_details.some(d => d.area_group_id !== null)

    if (hasGroupDetails) {
      setCountingMode('group')
      const counts: { [key: string]: { count: number; animalType: string } } = {}
      areaGroups.forEach(group => {
        const detail = durchgang.livestock_count_details.find(d => d.area_group_id === group.id)
        counts[group.id] = {
          count: detail?.count || 0,
          animalType: detail?.animal_type || ''
        }
      })
      setAnimalCounts(counts)
    } else {
      setCountingMode('area')
      const counts: { [key: string]: { count: number; animalType: string } } = {}
      areas.forEach(area => {
        const detail = durchgang.livestock_count_details.find(d => d.area_id === area.id)
        counts[area.id] = {
          count: detail?.count || 0,
          animalType: detail?.animal_type || ''
        }
      })
      setAnimalCounts(counts)
    }

    // Load movements from livestock_count_details
    const loadedMovements: AnimalMovement[] = durchgang.livestock_count_details.map(detail => ({
      id: detail.id,
      areaId: detail.area_id,
      areaGroupId: detail.area_group_id,
      areaName: detail.areas?.name || detail.area_groups?.name || 'Unbekannt',
      count: detail.count,
      animalType: detail.animal_type,
      startDate: new Date(detail.start_date),
      endDate: detail.end_date ? new Date(detail.end_date) : null,
    }))
    setMovements(loadedMovements)

    // If there are movements with different dates, switch to timeline mode
    const hasDifferentDates = loadedMovements.some(m =>
      m.startDate.toISOString().split('T')[0] !== durchgang.start_date ||
      (m.endDate && m.endDate.toISOString().split('T')[0] !== durchgang.end_date)
    )
    if (hasDifferentDates || loadedMovements.length > areaGroups.length + areas.length) {
      setInputMode('timeline')
    }

    setShowCreateDialog(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getTotalAnimals = (durchgang: LivestockCountWithDetails) => {
    return calculateTotalAnimalsFromDetails(
      durchgang.livestock_count_details,
      durchgang.start_date,
      durchgang.end_date
    )
  }

  const isActive = (durchgang: LivestockCountWithDetails) => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = durchgang.start_date
    const endDate = durchgang.end_date
    
    if (!startDate) return false
    if (startDate > today) return false
    if (endDate && endDate < today) return false
    
    return true
  }

  // Number formatting functions
  const formatNumber = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    }).format(value)
  }

  const formatInteger = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1" />
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const getSortedDurchgaenge = () => {
    if (!sortField || !sortDirection) return durchgaenge

    return [...durchgaenge].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'durchgang':
          aValue = (a.durchgang_name || formatDate(a.created_date)).toLowerCase()
          bValue = (b.durchgang_name || formatDate(b.created_date)).toLowerCase()
          break
        case 'startDate':
          aValue = a.start_date || '9999-12-31'
          bValue = b.start_date || '9999-12-31'
          break
        case 'status':
          aValue = isActive(a) ? 1 : 0
          bValue = isActive(b) ? 1 : 0
          break
        case 'supplier':
          aValue = a.suppliers?.name?.toLowerCase() || ''
          bValue = b.suppliers?.name?.toLowerCase() || ''
          break
        case 'totalAnimals':
          aValue = getTotalAnimals(a)
          bValue = getTotalAnimals(b)
          break
        case 'buyPrice':
          aValue = a.buy_price_per_animal || 0
          bValue = b.buy_price_per_animal || 0
          break
        case 'sellPrice':
          aValue = a.sell_price_per_animal || 0
          bValue = b.sell_price_per_animal || 0
          break
        case 'profitLoss':
          aValue = a.profit_loss || 0
          bValue = b.profit_loss || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Durchgänge</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Tierbestände über verschiedene Zeiträume
          </p>
        </div>
        <Link href="/dashboard/counts/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Neuen Durchgang anlegen
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aktuelle Durchgänge
            </CardTitle>
            <CardDescription>
              Übersicht aller Durchgänge und deren Tierbestände
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('durchgang')}
                    >
                      Durchgang
                      {getSortIcon('durchgang')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('startDate')}
                    >
                      Zeitraum
                      {getSortIcon('startDate')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('supplier')}
                    >
                      Lieferant
                      {getSortIcon('supplier')}
                    </Button>
                  </TableHead>
                  <TableHead>Bereiche</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('totalAnimals')}
                    >
                      Gesamt Tiere
                      {getSortIcon('totalAnimals')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('buyPrice')}
                    >
                      Einkauf
                      {getSortIcon('buyPrice')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('sellPrice')}
                    >
                      Verkauf
                      {getSortIcon('sellPrice')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => handleSort('profitLoss')}
                    >
                      Gewinn/Verlust
                      {getSortIcon('profitLoss')}
                    </Button>
                  </TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedDurchgaenge().map((durchgang) => (
                  <TableRow key={durchgang.id}>
                    <TableCell className="font-medium">
                      {durchgang.durchgang_name || `Durchgang ${formatDate(durchgang.created_date)}`}
                    </TableCell>
                    <TableCell>
                      {formatDate(durchgang.start_date)} - {formatDate(durchgang.end_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(durchgang) ? "default" : "secondary"}>
                        {isActive(durchgang) ? "Aktiv" : "Abgeschlossen"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {durchgang.suppliers?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {durchgang.livestock_count_details.length} Bereiche
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {getTotalAnimals(durchgang)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {durchgang.buy_price_per_animal 
                        ? formatCurrency(durchgang.buy_price_per_animal)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {durchgang.sell_price_per_animal 
                        ? formatCurrency(durchgang.sell_price_per_animal)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {durchgang.profit_loss !== null
                        ? (
                          <span className={durchgang.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {durchgang.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(durchgang.profit_loss))}
                          </span>
                        )
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/counts/${durchgang.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {durchgaenge.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Noch keine Durchgänge angelegt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="overflow-hidden p-6" style={{ maxWidth: '98vw', width: '98vw', height: '95vh', maxHeight: '95vh' }}>
          <form onSubmit={handleSubmit} className="h-full overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingDurchgang ? 'Durchgang bearbeiten' : 'Neuen Durchgang anlegen'}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie einen neuen Zeitraum mit Tierbeständen pro Bereich
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durchgangName">Durchgang Name</Label>
                  <Input
                    id="durchgangName"
                    value={durchgangName}
                    onChange={(e) => setDurchgangName(e.target.value)}
                    placeholder="z.B. Durchgang Winter 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Lieferant (optional)</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lieferant auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Lieferant</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Von welchem Lieferanten stammen die Tiere für diesen Durchgang? Lieferanten können in der <Link href="/dashboard/suppliers" className="underline">Lieferanten-Verwaltung</Link> verwaltet werden.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Informationen zu diesem Durchgang..."
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Finanzielle Informationen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyPrice">Einkaufspreis pro Tier (€)</Label>
                    <Input
                      id="buyPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={buyPricePerAnimal}
                      onChange={(e) => setBuyPricePerAnimal(e.target.value)}
                      placeholder="z.B. 150.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice">Verkaufspreis pro Tier (€)</Label>
                    <Input
                      id="sellPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellPricePerAnimal}
                      onChange={(e) => setSellPricePerAnimal(e.target.value)}
                      placeholder="z.B. 280.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedWeight">Startgewicht pro Tier (kg)</Label>
                    <Input
                      id="expectedWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={expectedWeightPerAnimal}
                      onChange={(e) => setExpectedWeightPerAnimal(e.target.value)}
                      placeholder="z.B. 25.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actualWeight">Endgewicht pro Tier (kg)</Label>
                    <Input
                      id="actualWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={actualWeightPerAnimal}
                      onChange={(e) => setActualWeightPerAnimal(e.target.value)}
                      placeholder="z.B. 120.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mortalityRate">Verlustrate (%)</Label>
                    <Input
                      id="mortalityRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={mortalityRate}
                      onChange={(e) => setMortalityRate(e.target.value)}
                      placeholder="z.B. 2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedConversion">Futterverwertung (kg Futter/kg Zunahme)</Label>
                    <Input
                      id="feedConversion"
                      type="number"
                      step="0.01"
                      min="0"
                      value={feedConversionRatio}
                      onChange={(e) => setFeedConversionRatio(e.target.value)}
                      placeholder="Wird automatisch berechnet oder manuell eingeben"
                      className={parseFloat(feedConversionRatio) > 0 ? 'bg-green-50 border-green-200' : ''}
                    />
                    {parseFloat(feedConversionRatio) > 0 && weightGain && weightGain > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ Automatisch berechnet basierend auf Gewichtszunahme von {formatNumber(weightGain, 1)} kg
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalLifetimeDays">Gesamte Lebenstage (optional)</Label>
                    <Input
                      id="totalLifetimeDays"
                      type="number"
                      min="1"
                      value={totalLifetimeDays}
                      onChange={(e) => setTotalLifetimeDays(e.target.value)}
                      placeholder="z.B. 365 (für Netto Tageszunahmen)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tage seit Geburt - für Berechnung der Netto Tageszunahmen bei Bullenmast
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slaughterWeight">Schlachtgewicht (kg, optional)</Label>
                    <Input
                      id="slaughterWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={slaughterWeightKg}
                      onChange={(e) => setSlaughterWeightKg(e.target.value)}
                      placeholder="z.B. 350.0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Schlachtgewicht - für Berechnung der Netto Tageszunahmen bei Bullenmast
                    </p>
                  </div>
                </div>

                {/* Calculated Fields Display */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Berechnete Werte</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Gesamte Tiere</Label>
                      <div className="font-medium">{formatInteger(totalAnimalsCount)} Tiere</div>
                    </div>
                    {weightGain !== null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Gewichtszunahme pro Tier</Label>
                        <div className={`font-medium ${
                          weightGain >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {weightGain >= 0 ? '+' : ''}{formatNumber(weightGain, 1)} kg
                        </div>
                      </div>
                    )}
                    {weightGain !== null && weightGain > 0 && totalAnimalsCount > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Gesamte Zunahme</Label>
                        <div className="font-medium text-blue-600">
                          {formatNumber(weightGain * totalAnimalsCount, 1)} kg
                        </div>
                      </div>
                    )}
                    {parseFloat(feedConversionRatio) > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Futterverwertung</Label>
                        <div className="font-medium">{formatNumber(parseFloat(feedConversionRatio), 2)} kg/kg</div>
                      </div>
                    )}
                    {parseFloat(totalFeedCost) > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Geschätzte Futterkosten</Label>
                        <div className="font-medium">{formatCurrency(parseFloat(totalFeedCost))}</div>
                      </div>
                    )}
                    {calculatedProfitLoss !== null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Gewinn/Verlust</Label>
                        <div className={`font-medium ${
                          calculatedProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculatedProfitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(calculatedProfitLoss))}
                        </div>
                      </div>
                    )}
                    {dailyGainGrams !== null && dailyGainGrams > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Zunahmen pro Tag</Label>
                        <div className="font-medium text-blue-600">
                          {formatNumber(dailyGainGrams, 0)} g/Tag
                        </div>
                      </div>
                    )}
                    {netDailyGainGrams !== null && netDailyGainGrams > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Netto Tageszunahmen</Label>
                        <div className="font-medium text-purple-600">
                          {formatNumber(netDailyGainGrams, 0)} g/Tag
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalFeedCost">Gesamte Futterkosten (€)</Label>
                    <Input
                      id="totalFeedCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalFeedCost}
                      onChange={(e) => setTotalFeedCost(e.target.value)}
                      placeholder="Wird automatisch berechnet oder manuell eingeben"
                      className={parseFloat(totalFeedCost) > 0 ? 'bg-green-50 border-green-200' : ''}
                    />
                    {parseFloat(totalFeedCost) > 0 && weightGain && weightGain > 0 && parseFloat(feedConversionRatio) > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ Automatisch berechnet: {formatNumber(weightGain * totalAnimalsCount, 1)} kg Zunahme × {formatNumber(parseFloat(feedConversionRatio), 2)} FCR
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Gesamterlös (€)</Label>
                    <Input
                      id="revenue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      placeholder="Wird automatisch berechnet oder manuell eingeben"
                      className={parseFloat(revenue) > 0 ? 'bg-green-50 border-green-200' : ''}
                    />
                    {parseFloat(revenue) > 0 && totalAnimalsCount > 0 && parseFloat(sellPricePerAnimal) > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ Automatisch berechnet: {formatInteger(totalAnimalsCount)} Tiere × {formatCurrency(parseFloat(sellPricePerAnimal))}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Tabs value={inputMode} onValueChange={(value: 'simple' | 'timeline') => setInputMode(value)} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <Label>Tierbestände</Label>
                  <TabsList>
                    <TabsTrigger value="simple">Einfache Eingabe</TabsTrigger>
                    <TabsTrigger value="timeline">Zeitplan (Gantt)</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="simple" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Modus</Label>
                    <Select value={countingMode} onValueChange={(value: 'area' | 'group') => {
                      setCountingMode(value)
                      // Reset counts when switching mode
                      const initialCounts: { [key: string]: { count: number; animalType: string } } = {}
                      if (value === 'group') {
                        areaGroups.forEach(group => {
                          initialCounts[group.id] = { count: 0, animalType: '' }
                        })
                      } else {
                        areas.forEach(area => {
                          initialCounts[area.id] = { count: 0, animalType: '' }
                        })
                      }
                      setAnimalCounts(initialCounts)
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Nach Gruppen</SelectItem>
                        <SelectItem value="area">Nach Bereichen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4">
                    {countingMode === 'group' ? (
                    <>
                      {areaGroups.map((group) => (
                        <Card key={group.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color || '#666' }}
                              />
                              <CardTitle className="text-base">{group.name}</CardTitle>
                            </div>
                            {group.description && (
                              <CardDescription className="text-sm">
                                {group.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`count-${group.id}`}>Anzahl Tiere</Label>
                                <Input
                                  id={`count-${group.id}`}
                                  type="number"
                                  min="0"
                                  value={animalCounts[group.id]?.count || 0}
                                  onChange={(e) => setAnimalCounts(prev => ({
                                    ...prev,
                                    [group.id]: {
                                      ...prev[group.id],
                                      count: parseInt(e.target.value) || 0
                                    }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`type-${group.id}`}>Tierart (optional)</Label>
                                <Input
                                  id={`type-${group.id}`}
                                  value={animalCounts[group.id]?.animalType || ''}
                                  onChange={(e) => setAnimalCounts(prev => ({
                                    ...prev,
                                    [group.id]: {
                                      ...prev[group.id],
                                      animalType: e.target.value
                                    }
                                  }))}
                                  placeholder="z.B. Schweine, Kühe, Hühner"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {areaGroups.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Keine Gruppen verfügbar. Erstellen Sie zuerst Gruppen oder wechseln Sie zu "Nach Bereichen".
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {areas.map((area) => (
                        <Card key={area.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{area.name}</CardTitle>
                            {area.description && (
                              <CardDescription className="text-sm">
                                {area.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`count-${area.id}`}>Anzahl Tiere</Label>
                                <Input
                                  id={`count-${area.id}`}
                                  type="number"
                                  min="0"
                                  value={animalCounts[area.id]?.count || 0}
                                  onChange={(e) => setAnimalCounts(prev => ({
                                    ...prev,
                                    [area.id]: {
                                      ...prev[area.id],
                                      count: parseInt(e.target.value) || 0
                                    }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`type-${area.id}`}>Tierart (optional)</Label>
                                <Input
                                  id={`type-${area.id}`}
                                  value={animalCounts[area.id]?.animalType || ''}
                                  onChange={(e) => setAnimalCounts(prev => ({
                                    ...prev,
                                    [area.id]: {
                                      ...prev[area.id],
                                      animalType: e.target.value
                                    }
                                  }))}
                                  placeholder="z.B. Schweine, Kühe, Hühner"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {areas.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Keine Bereiche verfügbar. Erstellen Sie zuerst Bereiche für Ihren Stall.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  {startDate && (
                    <MovementTimelineEditor
                      cycleStartDate={new Date(startDate)}
                      cycleEndDate={endDate ? new Date(endDate) : null}
                      totalAnimals={totalAnimalsCount}
                      movements={movements}
                      availableAreas={[
                        ...areaGroups.map(g => ({ id: g.id, name: g.name, type: 'group' as const })),
                        ...areas.map(a => ({ id: a.id, name: a.name, type: 'area' as const }))
                      ]}
                      onMovementsChange={setMovements}
                    />
                  )}
                  {!startDate && (
                    <div className="text-center py-8 text-muted-foreground">
                      Bitte wählen Sie zuerst ein Startdatum für den Durchgang
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingDurchgang(null)
                  resetForm()
                }}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !startDate || areas.length === 0}>
                {loading ? 'Wird gespeichert...' : editingDurchgang ? 'Aktualisieren' : 'Durchgang anlegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}