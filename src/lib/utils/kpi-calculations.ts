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
  count: number
  start_date: string
  end_date: string | null
  area_id: string | null
  area_group_id: string | null
  animal_type?: string | null
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
  costTransactions: CostTransaction[] = []
): CycleMetrics {
  // Calculate total animals using centralized utility
  const totalAnimals = calculateTotalAnimalsFromDetails(
    cycle.livestock_count_details,
    cycle.start_date,
    cycle.end_date
  )

  // Weight calculations
  const startWeight = cycle.expected_weight_per_animal || 0
  const endWeight = cycle.actual_weight_per_animal || 0
  const weightGain = endWeight - startWeight

  // Filter consumption to only include items from areas/groups during their active timeframes
  const filteredConsumption = filterConsumptionByTimeframe(
    consumption,
    cycle.livestock_count_details,
    cycle.end_date
  )

  // Feed cost calculations
  const totalFeedCost = filteredConsumption.reduce((sum, item) => sum + (item.total_cost || 0), 0)
  const totalFeedQuantity = filteredConsumption.reduce((sum, item) => sum + item.quantity, 0)

  // Additional cost calculations
  const additionalCosts = costTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const animalPurchaseCost = totalAnimals * (cycle.buy_price_per_animal || 0)

  // Cycle duration
  const cycleDuration = calculateCycleDuration(cycle.start_date, cycle.end_date)

  // Total cost and revenue
  const totalCosts = totalFeedCost + additionalCosts + animalPurchaseCost
  const totalRevenue = totalAnimals * (cycle.sell_price_per_animal || 0)

  // Profit calculations
  const profitLoss = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0

  // Performance metrics
  const feedConversionRatio = weightGain > 0 ? totalFeedQuantity / (totalAnimals * weightGain) : 0
  const feedCostPerAnimal = totalAnimals > 0 ? totalFeedCost / totalAnimals : 0
  const feedCostPerKg = weightGain > 0 ? totalFeedCost / (totalAnimals * weightGain) : 0
  const dailyFeedCost = cycleDuration > 0 ? totalFeedCost / cycleDuration : 0
  const feedEfficiency = totalFeedCost > 0 ? (totalAnimals * weightGain) / totalFeedCost : 0

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
    netDailyGainGrams
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
        feedTypes: {}
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
          feedTypes: {}
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
  const weightGain = (cycle.actual_weight_per_animal || 0) - (cycle.expected_weight_per_animal || 0)

  // Calculate total additional costs from cost transactions
  const totalAdditionalCosts = costTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  // Calculate total animals across all areas
  const totalAnimals = Object.values(areaMetricsMap).reduce((sum, area) => sum + area.animalCount, 0)

  Object.values(areaMetricsMap).forEach(area => {
    area.feedCostPerAnimal = area.animalCount > 0 ? area.totalFeedCost / area.animalCount : 0
    area.feedCostPerDay = cycleDuration > 0 ? area.totalFeedCost / cycleDuration : 0
    area.feedCostPerKg = weightGain > 0 && area.animalCount > 0
      ? area.totalFeedCost / (area.animalCount * weightGain)
      : 0
    area.percentageOfTotal = totalFeedCost > 0 ? (area.totalFeedCost / totalFeedCost) * 100 : 0

    // Calculate total cost per animal and profit/loss measures
    const buyPricePerAnimal = cycle.buy_price_per_animal || 0
    const sellPricePerAnimal = cycle.sell_price_per_animal || 0

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
        dailyConsumption: 0
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
