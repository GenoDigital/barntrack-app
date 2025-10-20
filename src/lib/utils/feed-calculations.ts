interface PriceTier {
  feed_type_id: string
  price_per_unit: number
  valid_from: string
  valid_to: string | null
}

interface ConsumptionItem {
  date: string
  quantity: number
  feed_type_id: string
  total_cost?: number
  area_id?: string
  feed_types?: {
    id: string
    name: string
    unit?: string
  }
  areas?: {
    id: string
    name: string
  }
}

/**
 * Finds the applicable price tier for a given feed type and date
 * Returns the most recent valid price tier based on valid_from date
 */
export function findApplicablePriceTier(
  feedTypeId: string, 
  date: string, 
  priceTiers: PriceTier[]
): PriceTier | null {
  if (!priceTiers || priceTiers.length === 0) {
    return null
  }

  const feedPrices = priceTiers.filter(tier => tier.feed_type_id === feedTypeId)
  const validPrices = feedPrices.filter(tier => {
    const validFrom = tier.valid_from <= date
    const validTo = !tier.valid_to || tier.valid_to >= date
    return validFrom && validTo
  })
  
  if (validPrices.length === 0) {
    return null
  }

  // Get the most recent valid price at the time of feeding
  const sortedPrices = validPrices.sort((a, b) => 
    new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()
  )
  
  return sortedPrices[0]
}

/**
 * Calculates the cost for a consumption item using price tiers
 * Returns the calculated cost or 0 if no applicable price tier found
 */
export function calculateConsumptionCost(
  item: ConsumptionItem,
  priceTiers: PriceTier[]
): number {
  const applicablePriceTier = findApplicablePriceTier(item.feed_type_id, item.date, priceTiers)
  
  if (!applicablePriceTier) {
    return 0
  }
  
  return item.quantity * applicablePriceTier.price_per_unit
}

/**
 * Ensures all consumption items have calculated costs
 * Uses existing total_cost if available and valid, otherwise calculates from price tiers
 */
export function ensureConsumptionCosts(
  consumption: ConsumptionItem[],
  priceTiers: PriceTier[]
): ConsumptionItem[] {
  return consumption.map(item => {
    // If we already have a valid total_cost, use it
    if (item.total_cost && item.total_cost > 0) {
      return item
    }
    
    // Otherwise calculate it from price tiers
    const calculatedCost = calculateConsumptionCost(item, priceTiers)
    return {
      ...item,
      total_cost: calculatedCost
    }
  })
}

/**
 * Calculates weighted average price per unit for a set of consumption items
 */
export function calculateWeightedAveragePrice(consumption: ConsumptionItem[]): number {
  const totalQuantity = consumption.reduce((sum, item) => sum + item.quantity, 0)
  const totalCost = consumption.reduce((sum, item) => sum + (item.total_cost || 0), 0)
  
  if (totalQuantity === 0) {
    return 0
  }
  
  return totalCost / totalQuantity
}

/**
 * Groups consumption data by a specified key and aggregates quantities and costs
 */
export function groupConsumptionData<T>(
  consumption: ConsumptionItem[],
  getGroupKey: (item: ConsumptionItem) => string,
  createAggregateItem: (groupKey: string, items: ConsumptionItem[]) => T
): T[] {
  const groups: { [key: string]: ConsumptionItem[] } = {}
  
  consumption.forEach(item => {
    const key = getGroupKey(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })
  
  return Object.entries(groups).map(([groupKey, items]) => 
    createAggregateItem(groupKey, items)
  )
}

/**
 * Centralized function to load consumption data with consistent cost calculations
 * This should be used by both reports and evaluation pages to ensure consistency
 */
export async function loadConsumptionWithCosts(
  supabase: any,
  farmId: string,
  startDate: string,
  endDate: string | null,
  options?: {
    feedTypeId?: string
    areaId?: string
  }
): Promise<{ consumption: ConsumptionItem[], priceTiers: PriceTier[] }> {
  // Build the query
  const actualEndDate = endDate || new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('consumption')
    .select(`
      date,
      quantity,
      area_id,
      feed_type_id,
      feed_types!inner(id, name, unit),
      areas(
        id,
        name,
        area_group_memberships(
          area_group_id,
          area_groups(id, name)
        )
      )
    `, { count: 'exact' })
    .eq('farm_id', farmId)
    .gte('date', startDate)
    .lte('date', actualEndDate)

  // Apply filters if provided
  if (options?.feedTypeId && options.feedTypeId !== 'all') {
    query = query.eq('feed_type_id', options.feedTypeId)
  }

  if (options?.areaId && options.areaId !== 'all') {
    query = query.eq('area_id', options.areaId)
  }

  // Fetch all data by paginating if needed
  let allConsumption: any[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data: pageData, error: consumptionError, count } = await query.range(from, from + pageSize - 1)

    if (consumptionError) {
      throw new Error(`Failed to load consumption data: ${consumptionError.message}`)
    }

    if (pageData && pageData.length > 0) {
      allConsumption = [...allConsumption, ...pageData]
      from += pageSize

      // Check if there's more data
      hasMore = count ? from < count : pageData.length === pageSize
    } else {
      hasMore = false
    }
  }

  const consumption = allConsumption
  const consumptionError = null

  // Load price tiers for cost calculations (with supplier information)
  const { data: priceTiers, error: priceError } = await supabase
    .from('price_tiers')
    .select('feed_type_id, price_per_unit, valid_from, valid_to, supplier_id, suppliers(id, name)')
    .eq('farm_id', farmId)

  if (consumptionError) {
    throw new Error(`Failed to load consumption data: ${consumptionError.message}`)
  }

  if (priceError) {
    throw new Error(`Failed to load price tiers: ${priceError.message}`)
  }

  // Always ensure costs are calculated consistently using ONLY price tiers
  // This ignores any existing total_cost in the database to ensure consistency
  // Also add supplier information from the applicable price tier
  const consumptionWithCosts = (consumption || []).map(item => {
    const applicablePriceTier = findApplicablePriceTier(
      item.feed_type_id,
      item.date,
      priceTiers || []
    )

    const calculatedCost = applicablePriceTier
      ? parseFloat(item.quantity) * applicablePriceTier.price_per_unit
      : 0

    if (!applicablePriceTier && consumption.length > 0) {
      console.warn(`No price tier found for feed type ${item.feed_type_id} on date ${item.date}`)
    }

    return {
      ...item,
      total_cost: calculatedCost,
      supplier_id: applicablePriceTier?.supplier_id || null,
      supplier_name: applicablePriceTier?.suppliers?.name || null
    }
  })

  console.log('Consumption with costs sample:', consumptionWithCosts.slice(0, 3))
  

  return {
    consumption: consumptionWithCosts,
    priceTiers: priceTiers || []
  }
}