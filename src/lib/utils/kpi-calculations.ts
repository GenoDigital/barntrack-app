/**
 * Centralized KPI Calculation Utilities
 *
 * This module provides a single source of truth for all KPI calculations
 * used across evaluation pages, dashboard widgets, and reports.
 *
 * All formulas and calculation logic are documented here to ensure consistency
 * and avoid duplication across the application.
 */

import { calculateTotalAnimalsFromDetails, calculateCycleDuration } from './livestock-calculations'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface LivestockCountDetail {
  id?: string
  count: number
  start_date: string
  end_date: string | null
  area_id: string | null
  area_group_id: string | null
  animal_type?: string | null
  expected_weight_per_animal?: number | null
  actual_weight_per_animal?: number | null
  buy_price_per_animal?: number | null
  sell_price_per_animal?: number | null
  is_start_group?: boolean | null
  is_end_group?: boolean | null
  start_weight_source_detail_id?: string | null
  areas?: {
    id: string
    name: string
  } | null
  area_groups?: {
    id: string
    name: string
  } | null
}

export interface LivestockCount {
  id: string
  farm_id: string
  start_date: string
  end_date: string | null
  durchgang_name: string | null
  expected_weight_per_animal: number | null
  actual_weight_per_animal: number | null
  buy_price_per_animal: number | null
  sell_price_per_animal: number | null
  mortality_rate: number | null
  revenue: number | null
  feed_conversion_ratio: number | null
  total_lifetime_days: number | null
  slaughter_weight_kg: number | null
  livestock_count_details: LivestockCountDetail[]
}

export interface ConsumptionItem {
  date: string
  quantity: number
  total_cost: number
  area_id?: string | null
  feed_type_id: string
  feed_types: {
    id: string
    name: string
    unit?: string
  }
  areas?: {
    id: string
    name: string
    area_group_memberships?: any
  } | null
  supplier_id?: string | null
  supplier_name?: string | null
}

export interface CostTransaction {
  id: string
  amount: number
  transaction_date: string
  cost_types?: {
    name: string
    category: string | null
  }
}

export interface IncomeTransaction {
  id: string
  amount: number
  transaction_date: string
  income_type: string
}

export interface CycleMetrics {
  totalAnimals: number
  averageWeight: number
  weightGain: number
  feedConversionRatio: number
  mortalityRate: number
  totalFeedCost: number
  totalFeedQuantity: number
  feedCostPerAnimal: number
  feedCostPerKg: number
  totalRevenue: number
  totalCosts: number
  profitLoss: number
  profitMargin: number
  cycleDuration: number
  dailyFeedCost: number
  feedEfficiency: number
  animalPurchaseCost: number
  additionalCosts: number
  dailyGainGrams: number | null
  netDailyGainGrams: number | null
  /** Feed-related costs from cost_transactions (e.g., Milchaustauscher) */
  feedCategoryTransactionCosts: number
  /** Consumption-only feed costs (without cost_transactions) */
  consumptionFeedCost: number
  /** Additional income from income_transactions (Praemien, Boni, Zuschuesse) */
  additionalIncome: number
  /** Revenue from animal sales only (without additionalIncome) */
  animalSalesRevenue: number
}

export interface AreaMetrics {
  areaId: string
  areaName: string
  animalCount: number
  animalType: string
  totalFeedQuantity: number
  totalFeedCost: number
  feedCostPerAnimal: number
  totalCostPerAnimal: number
  feedCostPerDay: number
  feedCostPerKg: number
  percentageOfTotal: number
  profitLossDirectPerAnimal: number
  profitLossFullPerAnimal: number
  feedTypes: { [key: string]: { quantity: number; cost: number; name: string } }
  startWeight: number | null
  endWeight: number | null
  weightGain: number | null
  weightSource?: string
}

export interface FeedComponentSummary {
  feedTypeId: string
  feedTypeName: string
  unit: string
  totalQuantity: number
  totalCost: number
  weightedAvgPrice: number
  percentageOfTotal: number
  dailyConsumption: number
  quantityPerAnimalPerDay: number
  quantityPerAnimal: number
}

// ============================================================================
// FALLBACK LOGIC FOR DETAIL-LEVEL VALUES
// ============================================================================

/**
 * Gets the effective start weight for a livestock count detail with advanced chaining logic
 *
 * Priority order:
 * 1. Direct value on detail (expected_weight_per_animal)
 * 2. Inherited from source detail (start_weight_source_detail_id → source.actual_weight_per_animal)
 * 3. Automatic for end-groups: weighted average of all start-groups
 * 4. Cycle-level fallback (cycle.expected_weight_per_animal)
 *
 * @param detail - The livestock count detail
 * @param allDetails - All details in the cycle (for chaining logic)
 * @param cycle - The parent livestock count (cycle)
 * @returns The effective start weight, or null if not available at any level
 */
export function getEffectiveStartWeight(
  detail: LivestockCountDetail,
  allDetails: LivestockCountDetail[],
  cycle: LivestockCount
): number | null {
  // 1. Use detail-level value if directly set
  if (detail.expected_weight_per_animal !== null && detail.expected_weight_per_animal !== undefined) {
    return detail.expected_weight_per_animal
  }

  // 2. Inherit from explicitly linked source detail
  if (detail.start_weight_source_detail_id) {
    const sourceDetail = allDetails.find(d => d.id === detail.start_weight_source_detail_id)
    if (sourceDetail) {
      // IMPORTANT: Use ONLY the end weight (actual_weight_per_animal) of the source detail
      // Do NOT fall back to expected_weight (that's the START weight, not END weight!)
      // If source has no end weight, the chain is incomplete - fall through to next logic
      if (sourceDetail.actual_weight_per_animal !== null && sourceDetail.actual_weight_per_animal !== undefined) {
        return sourceDetail.actual_weight_per_animal
      }
      // Source has no end weight - chain is incomplete
      // Fall through to automatic logic or cycle fallback
    }
  }

  // 3. Automatic logic for end-groups without explicit start weight
  if (detail.is_end_group && !detail.is_start_group) {
    // Find all start-groups that have a start weight
    const startGroups = allDetails.filter(d =>
      d.is_start_group &&
      d.expected_weight_per_animal !== null &&
      d.expected_weight_per_animal !== undefined
    )

    if (startGroups.length > 0) {
      // Calculate weighted average of start weights
      const totalWeightedWeight = startGroups.reduce((sum, g) =>
        sum + (g.expected_weight_per_animal! * g.count), 0
      )
      const totalCount = startGroups.reduce((sum, g) => sum + g.count, 0)

      if (totalCount > 0) {
        return totalWeightedWeight / totalCount
      }
    }
  }

  // 4. Fall back to cycle-level value
  if (cycle.expected_weight_per_animal !== null && cycle.expected_weight_per_animal !== undefined) {
    return cycle.expected_weight_per_animal
  }

  // 5. No value available at any level
  return null
}

/**
 * Gets the effective end weight for a livestock count detail
 *
 * Priority order:
 * 1. Direct value on detail (actual_weight_per_animal)
 * 2. Cycle-level fallback (cycle.actual_weight_per_animal)
 *
 * Note: End weights are typically not chained since final weighing happens at the end.
 * However, the function signature matches getEffectiveStartWeight for consistency.
 *
 * @param detail - The livestock count detail
 * @param allDetails - All details in the cycle (for potential future chaining)
 * @param cycle - The parent livestock count (cycle)
 * @returns The effective end weight, or null if not available at any level
 */
export function getEffectiveEndWeight(
  detail: LivestockCountDetail,
  allDetails: LivestockCountDetail[],
  cycle: LivestockCount
): number | null {
  // 1. Use detail-level value if set
  if (detail.actual_weight_per_animal !== null && detail.actual_weight_per_animal !== undefined) {
    return detail.actual_weight_per_animal
  }

  // 2. Fall back to cycle-level value if set
  if (cycle.actual_weight_per_animal !== null && cycle.actual_weight_per_animal !== undefined) {
    return cycle.actual_weight_per_animal
  }

  // 3. No value available at any level
  return null
}

/**
 * Gets the buy price for a livestock count detail, with fallback to cycle-level value
 *
 * @param detail - The livestock count detail
 * @param cycle - The parent livestock count (cycle)
 * @returns The buy price per animal, or null if not available at any level
 */
export function getDetailBuyPrice(
  detail: LivestockCountDetail,
  cycle: LivestockCount
): number | null {
  // 1. Use detail-level value if set
  if (detail.buy_price_per_animal !== null && detail.buy_price_per_animal !== undefined) {
    return detail.buy_price_per_animal
  }

  // 2. Fall back to cycle-level value if set
  if (cycle.buy_price_per_animal !== null && cycle.buy_price_per_animal !== undefined) {
    return cycle.buy_price_per_animal
  }

  // 3. No value available at any level
  return null
}

/**
 * Gets the sell price for a livestock count detail, with fallback to cycle-level value
 *
 * @param detail - The livestock count detail
 * @param cycle - The parent livestock count (cycle)
 * @returns The sell price per animal, or null if not available at any level
 */
export function getDetailSellPrice(
  detail: LivestockCountDetail,
  cycle: LivestockCount
): number | null {
  // 1. Use detail-level value if set
  if (detail.sell_price_per_animal !== null && detail.sell_price_per_animal !== undefined) {
    return detail.sell_price_per_animal
  }

  // 2. Fall back to cycle-level value if set
  if (cycle.sell_price_per_animal !== null && cycle.sell_price_per_animal !== undefined) {
    return cycle.sell_price_per_animal
  }

  // 3. No value available at any level
  return null
}

// ============================================================================
// TIMEFRAME FILTERING
// ============================================================================

/**
 * Filters consumption data to only include items from areas/groups during their active timeframes
 *
 * This ensures that consumption is only counted when animals are actually present in the area.
 * Handles both direct area tracking and area group tracking.
 *
 * @param consumption - All consumption records for a cycle
 * @param livestockCountDetails - Animal count details with timeframes
 * @param cycleEndDate - End date of the cycle (for calculating timeframe bounds)
 * @returns Filtered consumption records
 */
export function filterConsumptionByTimeframe(
  consumption: ConsumptionItem[],
  livestockCountDetails: LivestockCountDetail[],
  cycleEndDate: string | null
): ConsumptionItem[] {
  return consumption.filter(item => {
    // Find the livestock_count_detail for this area/group
    const detail = livestockCountDetails.find(d => {
      // Only consider details with animals (count > 0)
      if (d.count <= 0) return false

      // Direct area match
      if (item.area_id && d.area_id === item.area_id) {
        return true
      }

      // Check if consumption's area belongs to the detail's group
      if (d.area_group_id && item.areas?.area_group_memberships) {
        const membership = Array.isArray(item.areas.area_group_memberships)
          ? item.areas.area_group_memberships[0]
          : item.areas.area_group_memberships
        return membership?.area_group_id === d.area_group_id
      }

      return false
    })

    if (!detail) return false

    // Check if consumption date is within the detail's timeframe
    const consumptionDate = new Date(item.date)
    const startDate = new Date(detail.start_date)
    const endDate = detail.end_date
      ? new Date(detail.end_date)
      : (cycleEndDate ? new Date(cycleEndDate) : new Date())

    return consumptionDate >= startDate && consumptionDate <= endDate
  })
}

// ============================================================================
// CYCLE-LEVEL METRICS
// ============================================================================

/**
 * Calculates all cycle-level KPIs
 *
 * This is the single source of truth for cycle metrics calculations.
 * All widgets, evaluation pages, and reports should use this function.
 *
 * Formulas:
 * - Total Animals: Max animals present at any time (handles transitions between areas)
 * - Weight Gain: actual_weight_per_animal - expected_weight_per_animal
 * - Total Feed Cost: Sum of all consumption total_cost (filtered by timeframe)
 * - Animal Purchase Cost: totalAnimals * buy_price_per_animal
 * - Additional Costs: Sum of all cost_transactions
 * - Total Costs: feedCost + animalPurchaseCost + additionalCosts
 * - Total Revenue: totalAnimals * sell_price_per_animal
 * - Profit/Loss: totalRevenue - totalCosts
 * - Profit Margin: (profitLoss / totalRevenue) * 100
 * - Feed Conversion Ratio: totalFeedQuantity / (totalAnimals * weightGain)
 * - Feed Cost Per Animal: totalFeedCost / totalAnimals
 * - Feed Cost Per Kg: totalFeedCost / (totalAnimals * weightGain)
 * - Daily Feed Cost: totalFeedCost / cycleDuration
 * - Feed Efficiency: (totalAnimals * weightGain) / totalFeedCost
 *
 * @param cycle - Livestock count with details
 * @param consumption - All consumption records (will be filtered by timeframe)
 * @param costTransactions - Additional cost transactions for this cycle
 * @returns Calculated cycle metrics
 */
export function calculateCycleMetrics(
  cycle: LivestockCount,
  consumption: ConsumptionItem[],
  costTransactions: CostTransaction[] = [],
  incomeTransactions: IncomeTransaction[] = []
): CycleMetrics {
  // Calculate total animals using centralized utility
  const totalAnimals = calculateTotalAnimalsFromDetails(
    cycle.livestock_count_details,
    cycle.start_date,
    cycle.end_date
  )

  // Weight calculations - use detail-level values with fallback
  // Calculate weighted average weight gain based on animal counts in each detail
  let totalWeightedStartWeight = 0
  let totalWeightedEndWeight = 0
  let totalAnimalsWithWeights = 0

  cycle.livestock_count_details.forEach(detail => {
    const startWeight = getEffectiveStartWeight(detail, cycle.livestock_count_details, cycle)
    const endWeight = getEffectiveEndWeight(detail, cycle.livestock_count_details, cycle)

    // Only include details where we have both weights for weight gain calculation
    if (startWeight !== null && endWeight !== null) {
      totalWeightedStartWeight += startWeight * detail.count
      totalWeightedEndWeight += endWeight * detail.count
      totalAnimalsWithWeights += detail.count
    }
  })

  const startWeight = totalAnimalsWithWeights > 0
    ? totalWeightedStartWeight / totalAnimalsWithWeights
    : (cycle.expected_weight_per_animal || 0)
  const endWeight = totalAnimalsWithWeights > 0
    ? totalWeightedEndWeight / totalAnimalsWithWeights
    : (cycle.actual_weight_per_animal || 0)
  const weightGain = endWeight - startWeight

  // Filter consumption to only include items from areas/groups during their active timeframes
  const filteredConsumption = filterConsumptionByTimeframe(
    consumption,
    cycle.livestock_count_details,
    cycle.end_date
  )

  // Feed cost calculations from consumption
  const consumptionFeedCost = filteredConsumption.reduce((sum, item) => sum + (item.total_cost || 0), 0)
  const totalFeedQuantity = filteredConsumption.reduce((sum, item) => sum + item.quantity, 0)

  // Separate cost transactions: feed-related (category = 'Futterkosten') vs other costs
  // Feed-related transactions (e.g., Milchaustauscher) are added to feed costs
  const feedCategoryTransactions = costTransactions.filter(
    t => t.cost_types?.category?.toLowerCase() === 'futterkosten'
  )
  const otherCostTransactions = costTransactions.filter(
    t => t.cost_types?.category?.toLowerCase() !== 'futterkosten'
  )

  const feedCategoryTransactionCosts = feedCategoryTransactions.reduce(
    (sum, transaction) => sum + transaction.amount, 0
  )

  // Total feed cost = consumption costs + feed-category transaction costs (e.g., Milchaustauscher)
  const totalFeedCost = consumptionFeedCost + feedCategoryTransactionCosts

  // Additional costs = only non-feed cost transactions
  const additionalCosts = otherCostTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  // Calculate animal purchase cost and revenue using detail-level prices
  // IMPORTANT: Only count buy_price for start groups (is_start_group = true)
  // and sell_price for end groups (is_end_group = true) to avoid double-counting
  // when animals move between areas (e.g., Kälberstall → Fresserstall)
  //
  // FALLBACK for legacy data: If no details have is_start_group/is_end_group set,
  // use the old behavior (count all details with prices)
  let animalPurchaseCost = 0
  let animalSalesRevenue = 0

  // Check if any details have start/end group flags set
  const hasStartGroupFlags = cycle.livestock_count_details.some(d => d.is_start_group === true)
  const hasEndGroupFlags = cycle.livestock_count_details.some(d => d.is_end_group === true)

  cycle.livestock_count_details.forEach(detail => {
    const buyPrice = getDetailBuyPrice(detail, cycle)
    const sellPrice = getDetailSellPrice(detail, cycle)

    // Purchase cost: only count for start groups, or all if no flags set (legacy)
    if (buyPrice !== null) {
      if (hasStartGroupFlags) {
        // New behavior: only count start groups
        if (detail.is_start_group === true) {
          animalPurchaseCost += detail.count * buyPrice
        }
      } else {
        // Legacy fallback: count all details with buy price
        animalPurchaseCost += detail.count * buyPrice
      }
    }

    // Sales revenue: only count for end groups, or all if no flags set (legacy)
    if (sellPrice !== null) {
      if (hasEndGroupFlags) {
        // New behavior: only count end groups
        if (detail.is_end_group === true) {
          animalSalesRevenue += detail.count * sellPrice
        }
      } else {
        // Legacy fallback: count all details with sell price
        animalSalesRevenue += detail.count * sellPrice
      }
    }
  })

  // Calculate additional income from income transactions (Praemien, Boni, Zuschuesse)
  const additionalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Total revenue = animal sales + additional income (Praemien, etc.)
  const totalRevenue = animalSalesRevenue + additionalIncome

  // Cycle duration
  const cycleDuration = calculateCycleDuration(cycle.start_date, cycle.end_date)

  // Total cost
  const totalCosts = totalFeedCost + additionalCosts + animalPurchaseCost

  // Profit calculations
  const profitLoss = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0

  // Performance metrics
  // Note: Use totalAnimalsWithWeights (animals with complete weight data) for weight-based calculations
  // This ensures we only calculate ratios for animals where we can measure weight gain
  const feedConversionRatio = weightGain > 0 && totalAnimalsWithWeights > 0
    ? totalFeedQuantity / (totalAnimalsWithWeights * weightGain)
    : 0
  const feedCostPerAnimal = totalAnimals > 0 ? totalFeedCost / totalAnimals : 0
  const feedCostPerKg = weightGain > 0 && totalAnimalsWithWeights > 0
    ? totalFeedCost / (totalAnimalsWithWeights * weightGain)
    : 0
  const dailyFeedCost = cycleDuration > 0 ? totalFeedCost / cycleDuration : 0
  const feedEfficiency = totalFeedCost > 0 && totalAnimalsWithWeights > 0
    ? (totalAnimalsWithWeights * weightGain) / totalFeedCost
    : 0

  // Daily gain calculations
  // Daily gains (Zunahmen pro Tag): weight gain per day in grams
  const dailyGainGrams = cycleDuration > 0 && weightGain > 0
    ? (weightGain / cycleDuration) * 1000 // Convert kg to grams
    : null

  // Net daily gains (Netto Tageszunahmen): for cattle fattening, calculated from total lifetime
  // This is slaughter weight / total lifetime days (different from daily gain during the cycle)
  const netDailyGainGrams = cycle.slaughter_weight_kg && cycle.total_lifetime_days && cycle.total_lifetime_days > 0
    ? (cycle.slaughter_weight_kg / cycle.total_lifetime_days) * 1000 // Convert kg to grams
    : null

  return {
    totalAnimals,
    averageWeight: endWeight,
    weightGain,
    feedConversionRatio,
    mortalityRate: cycle.mortality_rate || 0,
    totalFeedCost,
    totalFeedQuantity,
    feedCostPerAnimal,
    feedCostPerKg,
    totalRevenue,
    totalCosts,
    profitLoss,
    profitMargin,
    cycleDuration,
    dailyFeedCost,
    feedEfficiency,
    animalPurchaseCost,
    additionalCosts,
    dailyGainGrams,
    netDailyGainGrams,
    feedCategoryTransactionCosts,
    consumptionFeedCost,
    additionalIncome,
    animalSalesRevenue
  }
}

// ============================================================================
// AREA-LEVEL METRICS
// ============================================================================

/**
 * Calculates per-area or per-group metrics
 *
 * This function aggregates consumption and calculates KPIs for each area or group.
 * It properly handles timeframe filtering to ensure consumption is only counted
 * when animals are present.
 *
 * Area Filtering:
 * - If areaFilter is provided, only includes areas in the filter
 * - If areaFilter is empty, includes all areas
 *
 * Formulas:
 * - Feed Cost Per Animal: totalFeedCost / animalCount
 * - Feed Cost Per Day: totalFeedCost / cycleDuration
 * - Feed Cost Per Kg: totalFeedCost / (animalCount * weightGain)
 * - Percentage of Total: (areaFeedCost / totalFeedCost) * 100
 * - Total Cost Per Animal: buyPrice + feedCostPerAnimal + proportionalAdditionalCosts
 * - Profit/Loss (Direct): sellPrice - buyPrice - feedCostPerAnimal
 * - Profit/Loss (Full): sellPrice - totalCostPerAnimal
 *
 * @param cycle - Livestock count with details
 * @param consumption - All consumption records (will be filtered by timeframe)
 * @param costTransactions - Additional cost transactions for this cycle
 * @param areaFilter - Optional array of area IDs to include (empty = all areas)
 * @returns Array of area metrics
 */
export function calculateAreaMetrics(
  cycle: LivestockCount,
  consumption: ConsumptionItem[],
  costTransactions: CostTransaction[] = [],
  areaFilter: string[] = []
): AreaMetrics[] {
  const areaMetricsMap: { [key: string]: AreaMetrics } = {}

  // Calculate cycle duration
  const cycleDuration = calculateCycleDuration(cycle.start_date, cycle.end_date)

  // Helper function to check if area should be included
  const shouldIncludeArea = (areaId: string) => {
    return areaFilter.length === 0 || areaFilter.includes(areaId)
  }

  // Initialize area metrics with animal counts (filtered by selected groups)
  cycle.livestock_count_details.forEach(detail => {
    // Only include areas/groups with animals (count > 0)
    if (detail.count <= 0) return

    // Handle direct area tracking
    if (detail.area_id && shouldIncludeArea(detail.area_id)) {
      areaMetricsMap[detail.area_id] = {
        areaId: detail.area_id,
        areaName: detail.areas?.name || 'Unbekannt',
        animalCount: detail.count,
        animalType: detail.animal_type || 'Nicht spezifiziert',
        totalFeedQuantity: 0,
        totalFeedCost: 0,
        feedCostPerAnimal: 0,
        totalCostPerAnimal: 0,
        feedCostPerDay: 0,
        feedCostPerKg: 0,
        percentageOfTotal: 0,
        profitLossDirectPerAnimal: 0,
        profitLossFullPerAnimal: 0,
        feedTypes: {},
        startWeight: null,
        endWeight: null,
        weightGain: null,
      }
    }
    // Handle group-level tracking
    else if (detail.area_group_id && detail.area_groups) {
      const groupId = detail.area_group_id
      if (!areaMetricsMap[groupId]) {
        areaMetricsMap[groupId] = {
          areaId: groupId,
          areaName: detail.area_groups.name || 'Unbekannte Gruppe',
          animalCount: detail.count,
          animalType: detail.animal_type || 'Nicht spezifiziert',
          totalFeedQuantity: 0,
          totalFeedCost: 0,
          feedCostPerAnimal: 0,
          totalCostPerAnimal: 0,
          feedCostPerDay: 0,
          feedCostPerKg: 0,
          percentageOfTotal: 0,
          profitLossDirectPerAnimal: 0,
          profitLossFullPerAnimal: 0,
          feedTypes: {},
          startWeight: null,
          endWeight: null,
          weightGain: null,
        }
      }
    }
  })

  // Calculate feed consumption per area (filtered by timeframes)
  consumption.forEach(item => {
    // Determine which entry in areaMetricsMap to use
    let targetId = item.area_id

    // Check if this area belongs to a group that's being tracked
    if (item.areas?.area_group_memberships) {
      const membership = Array.isArray(item.areas.area_group_memberships)
        ? item.areas.area_group_memberships[0]
        : item.areas.area_group_memberships
      const groupId = membership?.area_group_id

      // If the group is being tracked in areaMetricsMap, use group ID instead of area ID
      if (groupId && areaMetricsMap[groupId]) {
        targetId = groupId
      }
    }

    // If no target yet, try to match by area name
    if (!targetId && item.areas?.name) {
      targetId = cycle.livestock_count_details.find(d => d.areas?.name === item.areas!.name)?.area_id || null
    }

    // If we have a targetId and it exists in our metrics map, check timeframe and add consumption
    if (targetId && areaMetricsMap[targetId]) {
      // Find the livestock_count_detail for this area/group to check timeframe
      const detail = cycle.livestock_count_details.find(d => {
        // Direct area match
        if (d.area_id === targetId) return true

        // Check if target is a group ID
        if (d.area_group_id === targetId) return true

        // Check if area belongs to the detail's group
        if (d.area_group_id && item.areas?.area_group_memberships) {
          const membership = Array.isArray(item.areas.area_group_memberships)
            ? item.areas.area_group_memberships[0]
            : item.areas.area_group_memberships
          return membership?.area_group_id === d.area_group_id
        }

        return false
      })

      if (detail && detail.count > 0) {
        // Check if consumption date is within the detail's timeframe
        const consumptionDate = new Date(item.date)
        const startDate = new Date(detail.start_date)
        const endDate = detail.end_date
          ? new Date(detail.end_date)
          : (cycle.end_date ? new Date(cycle.end_date) : new Date())

        // Only count consumption if it falls within this area's active timeframe
        if (consumptionDate >= startDate && consumptionDate <= endDate) {
          areaMetricsMap[targetId].totalFeedQuantity += item.quantity
          areaMetricsMap[targetId].totalFeedCost += item.total_cost || 0

          // Track feed types
          const feedTypeName = item.feed_types.name
          if (!areaMetricsMap[targetId].feedTypes[feedTypeName]) {
            areaMetricsMap[targetId].feedTypes[feedTypeName] = {
              name: feedTypeName,
              quantity: 0,
              cost: 0
            }
          }
          areaMetricsMap[targetId].feedTypes[feedTypeName].quantity += item.quantity
          areaMetricsMap[targetId].feedTypes[feedTypeName].cost += item.total_cost || 0
        }
      }
    }
  })

  // Calculate derived metrics
  const totalFeedCost = Object.values(areaMetricsMap).reduce((sum, area) => sum + area.totalFeedCost, 0)

  // Calculate total additional costs from cost transactions
  const totalAdditionalCosts = costTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  // Calculate total animals across all areas
  const totalAnimals = Object.values(areaMetricsMap).reduce((sum, area) => sum + area.animalCount, 0)

  Object.values(areaMetricsMap).forEach(area => {
    // Find the corresponding detail for this area to get weights and prices
    const areaDetail = cycle.livestock_count_details.find(d => {
      if (d.area_id === area.areaId) return true
      if (d.area_group_id === area.areaId) return true
      return false
    })

    // Get weights using fallback logic with chaining support
    const startWeight = areaDetail ? getEffectiveStartWeight(areaDetail, cycle.livestock_count_details, cycle) : null
    const endWeight = areaDetail ? getEffectiveEndWeight(areaDetail, cycle.livestock_count_details, cycle) : null
    const weightGain = (startWeight !== null && endWeight !== null) ? endWeight - startWeight : 0

    // Store weights in area metrics for display
    area.startWeight = startWeight
    area.endWeight = endWeight
    area.weightGain = weightGain > 0 ? weightGain : null

    // Determine weight source for UI display
    if (areaDetail) {
      if (areaDetail.expected_weight_per_animal !== null && areaDetail.expected_weight_per_animal !== undefined) {
        area.weightSource = 'Direkt'
      } else if (areaDetail.start_weight_source_detail_id) {
        const source = cycle.livestock_count_details.find(d => d.id === areaDetail.start_weight_source_detail_id)
        area.weightSource = source ? `🔗 ${source.areas?.name || source.area_groups?.name || 'Verknüpft'}` : 'Verknüpft'
      } else if (areaDetail.is_end_group && !areaDetail.is_start_group && startWeight !== null) {
        area.weightSource = 'Auto (Start-Bereiche)'
      } else if (startWeight === cycle.expected_weight_per_animal) {
        area.weightSource = 'Standard'
      }
    }

    // Get prices using fallback logic
    const buyPricePerAnimal = areaDetail ? (getDetailBuyPrice(areaDetail, cycle) || 0) : 0
    const sellPricePerAnimal = areaDetail ? (getDetailSellPrice(areaDetail, cycle) || 0) : 0

    area.feedCostPerAnimal = area.animalCount > 0 ? area.totalFeedCost / area.animalCount : 0
    area.feedCostPerDay = cycleDuration > 0 ? area.totalFeedCost / cycleDuration : 0
    area.feedCostPerKg = weightGain > 0 && area.animalCount > 0
      ? area.totalFeedCost / (area.animalCount * weightGain)
      : 0
    area.percentageOfTotal = totalFeedCost > 0 ? (area.totalFeedCost / totalFeedCost) * 100 : 0

    // Calculate proportional share of additional costs based on animal count
    const animalShare = totalAnimals > 0 ? area.animalCount / totalAnimals : 0
    const additionalCostPerAnimal = area.animalCount > 0
      ? (totalAdditionalCosts * animalShare) / area.animalCount
      : 0

    // Total cost per animal = buy price + feed costs + proportional additional costs
    area.totalCostPerAnimal = buyPricePerAnimal + area.feedCostPerAnimal + additionalCostPerAnimal

    // 1. Direct costs only: sellPrice - buyPrice - feedCost (area-specific, no additional costs)
    area.profitLossDirectPerAnimal = sellPricePerAnimal - buyPricePerAnimal - area.feedCostPerAnimal

    // 2. Full costs: sellPrice - totalCost (includes proportional additional costs)
    area.profitLossFullPerAnimal = sellPricePerAnimal - area.totalCostPerAnimal
  })

  return Object.values(areaMetricsMap)
}

// ============================================================================
// FEED COMPONENT SUMMARY
// ============================================================================

/**
 * Calculates feed component summary (aggregated by feed type)
 *
 * This function aggregates all consumption by feed type and calculates:
 * - Total quantity and cost per feed type
 * - Weighted average price per feed type
 * - Percentage of total cost
 * - Daily consumption
 *
 * Results are sorted by total cost (descending).
 *
 * @param cycle - Livestock count with details
 * @param consumption - All consumption records (should already be filtered by timeframe)
 * @returns Array of feed component summaries, sorted by cost
 */
export function calculateFeedComponentSummary(
  cycle: LivestockCount,
  consumption: ConsumptionItem[]
): FeedComponentSummary[] {
  const feedComponentsMap: { [key: string]: FeedComponentSummary } = {}

  const cycleDuration = calculateCycleDuration(cycle.start_date, cycle.end_date)

  // Calculate total animal-days across all livestock count details
  const totalAnimalDays = cycle.livestock_count_details.reduce((sum, detail) => {
    const startDate = new Date(detail.start_date)
    const endDate = detail.end_date
      ? new Date(detail.end_date)
      : (cycle.end_date ? new Date(cycle.end_date) : new Date())
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return sum + (detail.count * days)
  }, 0)

  // Aggregate consumption by feed type
  consumption.forEach(item => {
    const feedTypeId = item.feed_type_id
    if (!feedComponentsMap[feedTypeId]) {
      feedComponentsMap[feedTypeId] = {
        feedTypeId: feedTypeId,
        feedTypeName: item.feed_types.name,
        unit: item.feed_types.unit || 'kg',
        totalQuantity: 0,
        totalCost: 0,
        weightedAvgPrice: 0,
        percentageOfTotal: 0,
        dailyConsumption: 0,
        quantityPerAnimalPerDay: 0,
        quantityPerAnimal: 0
      }
    }

    feedComponentsMap[feedTypeId].totalQuantity += item.quantity
    feedComponentsMap[feedTypeId].totalCost += item.total_cost || 0
  })

  // Calculate weighted average prices and percentages
  const totalFeedCost = Object.values(feedComponentsMap).reduce((sum, comp) => sum + comp.totalCost, 0)

  Object.values(feedComponentsMap).forEach(component => {
    component.weightedAvgPrice = component.totalQuantity > 0
      ? component.totalCost / component.totalQuantity
      : 0
    component.percentageOfTotal = totalFeedCost > 0
      ? (component.totalCost / totalFeedCost) * 100
      : 0
    component.dailyConsumption = cycleDuration > 0
      ? component.totalQuantity / cycleDuration
      : 0
    component.quantityPerAnimalPerDay = totalAnimalDays > 0
      ? component.totalQuantity / totalAnimalDays
      : 0
    // quantityPerAnimal is the total feed quantity per animal over the entire cycle
    // Mathematically equivalent to: (totalQuantity * cycleDuration) / totalAnimalDays
    // But clearer as: quantityPerAnimalPerDay * cycleDuration
    component.quantityPerAnimal = component.quantityPerAnimalPerDay * cycleDuration
  })

  // Sort by total cost descending
  return Object.values(feedComponentsMap).sort((a, b) => b.totalCost - a.totalCost)
}

// ============================================================================
// ESTIMATED/FORM CALCULATIONS
// ============================================================================

/**
 * Calculates estimated profit/loss from manual form inputs
 *
 * This function is used in data entry forms (like the counts page) to give
 * users a preview of profit/loss before actual consumption data is available.
 *
 * IMPORTANT: This uses the same formula as calculateCycleMetrics() to ensure
 * consistency between form previews and actual calculated values.
 *
 * Formula: profitLoss = revenue - (animalPurchaseCost + feedCost + additionalCosts)
 *
 * @param params - Form input parameters
 * @returns Estimated profit/loss
 */
export function calculateEstimatedProfitLoss(params: {
  totalAnimals: number
  buyPricePerAnimal?: number | null
  sellPricePerAnimal?: number | null
  totalFeedCost?: number | null
  additionalCosts?: number
}): number | null {
  const {
    totalAnimals,
    buyPricePerAnimal = 0,
    sellPricePerAnimal = 0,
    totalFeedCost = 0,
    additionalCosts = 0,
  } = params

  if (totalAnimals === 0) return null

  const revenue = totalAnimals * (sellPricePerAnimal || 0)
  const animalPurchaseCost = totalAnimals * (buyPricePerAnimal || 0)
  const feedCost = totalFeedCost || 0
  const otherCosts = additionalCosts || 0

  return revenue - animalPurchaseCost - feedCost - otherCosts
}
