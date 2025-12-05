/**
 * Unit Tests for KPI Calculations
 *
 * These tests ensure that all KPI formulas are correct and consistent
 * across the application.
 */

import { describe, it, expect } from 'vitest'
import {
  filterConsumptionByTimeframe,
  calculateCycleMetrics,
  calculateAreaMetrics,
  calculateFeedComponentSummary,
  calculateEstimatedProfitLoss,
  type LivestockCount,
  type ConsumptionItem,
  type CostTransaction,
  type LivestockCountDetail,
} from './kpi-calculations'

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const mockLivestockCountDetails: LivestockCountDetail[] = [
  {
    count: 100,
    start_date: '2025-09-01',
    end_date: '2025-09-15',
    area_id: 'area-1',
    area_group_id: null,
    animal_type: 'Schwein',
    areas: {
      id: 'area-1',
      name: 'Stall 1',
    },
    area_groups: null,
  },
  {
    count: 50,
    start_date: '2025-09-16',
    end_date: '2025-09-30',
    area_id: 'area-2',
    area_group_id: null,
    animal_type: 'Schwein',
    areas: {
      id: 'area-2',
      name: 'Stall 2',
    },
    area_groups: null,
  },
]

const mockCycle: LivestockCount = {
  id: 'cycle-1',
  farm_id: 'farm-1',
  start_date: '2025-09-01',
  end_date: '2025-09-30',
  durchgang_name: 'Test Durchgang',
  expected_weight_per_animal: 30,
  actual_weight_per_animal: 120,
  buy_price_per_animal: 50,
  sell_price_per_animal: 200,
  mortality_rate: 2,
  revenue: 20000,
  feed_conversion_ratio: null,
  livestock_count_details: mockLivestockCountDetails,
}

// Simple mock for cycle-level calculations (single area, full cycle)
// This avoids double-counting issues with multi-area scenarios
const mockSimpleDetails: LivestockCountDetail[] = [
  {
    count: 100,
    start_date: '2025-09-01',
    end_date: '2025-09-30',
    area_id: 'area-1',
    area_group_id: null,
    animal_type: 'Schwein',
    is_start_group: true,
    is_end_group: true,
    areas: {
      id: 'area-1',
      name: 'Stall 1',
    },
    area_groups: null,
  },
]

const mockSimpleCycle: LivestockCount = {
  ...mockCycle,
  livestock_count_details: mockSimpleDetails,
}

const mockConsumption: ConsumptionItem[] = [
  {
    date: '2025-09-05',
    quantity: 100,
    total_cost: 50,
    area_id: 'area-1',
    feed_type_id: 'feed-1',
    feed_types: {
      id: 'feed-1',
      name: 'Futter A',
      unit: 'kg',
    },
    areas: {
      id: 'area-1',
      name: 'Stall 1',
    },
  },
  {
    date: '2025-09-10',
    quantity: 150,
    total_cost: 75,
    area_id: 'area-1',
    feed_type_id: 'feed-1',
    feed_types: {
      id: 'feed-1',
      name: 'Futter A',
      unit: 'kg',
    },
    areas: {
      id: 'area-1',
      name: 'Stall 1',
    },
  },
  {
    date: '2025-09-20',
    quantity: 80,
    total_cost: 40,
    area_id: 'area-2',
    feed_type_id: 'feed-2',
    feed_types: {
      id: 'feed-2',
      name: 'Futter B',
      unit: 'kg',
    },
    areas: {
      id: 'area-2',
      name: 'Stall 2',
    },
  },
  {
    date: '2025-09-25',
    quantity: 120,
    total_cost: 60,
    area_id: 'area-2',
    feed_type_id: 'feed-2',
    feed_types: {
      id: 'feed-2',
      name: 'Futter B',
      unit: 'kg',
    },
    areas: {
      id: 'area-2',
      name: 'Stall 2',
    },
  },
]

const mockCostTransactions: CostTransaction[] = [
  {
    id: 'cost-1',
    amount: 500,
    transaction_date: '2025-09-10',
    cost_types: {
      name: 'Veterinärkosten',
      category: 'health',
    },
  },
  {
    id: 'cost-2',
    amount: 300,
    transaction_date: '2025-09-20',
    cost_types: {
      name: 'Strom',
      category: 'utilities',
    },
  },
]

// Simple consumption mock for cycle metrics tests (all in area-1)
const mockSimpleConsumption: ConsumptionItem[] = mockConsumption.map(c => ({
  ...c,
  area_id: 'area-1',
  areas: {
    id: 'area-1',
    name: 'Stall 1',
  },
}))

// ============================================================================
// TIMEFRAME FILTERING TESTS
// ============================================================================

describe('filterConsumptionByTimeframe', () => {
  it('should filter consumption to only include items within area timeframes', () => {
    const filtered = filterConsumptionByTimeframe(
      mockConsumption,
      mockLivestockCountDetails,
      mockCycle.end_date
    )

    // All mock consumption items are within their respective area timeframes
    expect(filtered).toHaveLength(4)
  })

  it('should exclude consumption outside area timeframes', () => {
    const consumptionWithOutOfRange: ConsumptionItem[] = [
      ...mockConsumption,
      {
        date: '2025-08-31', // Before area-1 starts
        quantity: 50,
        total_cost: 25,
        area_id: 'area-1',
        feed_type_id: 'feed-1',
        feed_types: {
          id: 'feed-1',
          name: 'Futter A',
          unit: 'kg',
        },
        areas: {
          id: 'area-1',
          name: 'Stall 1',
        },
      },
      {
        date: '2025-09-16', // After area-1 ends
        quantity: 50,
        total_cost: 25,
        area_id: 'area-1',
        feed_type_id: 'feed-1',
        feed_types: {
          id: 'feed-1',
          name: 'Futter A',
          unit: 'kg',
        },
        areas: {
          id: 'area-1',
          name: 'Stall 1',
        },
      },
    ]

    const filtered = filterConsumptionByTimeframe(
      consumptionWithOutOfRange,
      mockLivestockCountDetails,
      mockCycle.end_date
    )

    // Should exclude the 2 out-of-range items
    expect(filtered).toHaveLength(4)
  })

  it('should handle consumption for unknown areas', () => {
    const consumptionWithUnknownArea: ConsumptionItem[] = [
      {
        date: '2025-09-10',
        quantity: 50,
        total_cost: 25,
        area_id: 'area-unknown',
        feed_type_id: 'feed-1',
        feed_types: {
          id: 'feed-1',
          name: 'Futter A',
          unit: 'kg',
        },
        areas: {
          id: 'area-unknown',
          name: 'Unknown Area',
        },
      },
    ]

    const filtered = filterConsumptionByTimeframe(
      consumptionWithUnknownArea,
      mockLivestockCountDetails,
      mockCycle.end_date
    )

    // Should exclude unknown area
    expect(filtered).toHaveLength(0)
  })
})

// ============================================================================
// CYCLE METRICS TESTS
// ============================================================================

describe('calculateCycleMetrics', () => {
  it('should calculate basic cycle metrics correctly', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, mockCostTransactions)

    // Total animals: 100 (single detail with is_start_group=true)
    expect(metrics.totalAnimals).toBe(100)

    // Weight gain: 120 - 30 = 90 kg
    expect(metrics.weightGain).toBe(90)

    // Total feed cost: 50 + 75 + 40 + 60 = 225
    expect(metrics.totalFeedCost).toBe(225)

    // Additional costs: 500 + 300 = 800
    expect(metrics.additionalCosts).toBe(800)

    // Animal purchase cost: 100 * 50 = 5000
    expect(metrics.animalPurchaseCost).toBe(5000)

    // Cycle duration: 30 days (Sept 1-30)
    expect(metrics.cycleDuration).toBe(30)
  })

  it('should calculate profit/loss correctly', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, mockCostTransactions)

    // Total costs: feedCost(225) + additionalCosts(800) + animalPurchase(5000) = 6025
    expect(metrics.totalCosts).toBe(6025)

    // Revenue: 100 * 200 = 20000
    expect(metrics.totalRevenue).toBe(20000)

    // Profit: 20000 - 6025 = 13975
    expect(metrics.profitLoss).toBe(13975)

    // Profit margin: (13975 / 20000) * 100 = 69.875%
    expect(metrics.profitMargin).toBeCloseTo(69.875, 2)
  })

  it('should calculate per-animal metrics correctly', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, mockCostTransactions)

    // Feed cost per animal: 225 / 100 = 2.25
    expect(metrics.feedCostPerAnimal).toBe(2.25)

    // Daily feed cost: 225 / 30 = 7.5
    expect(metrics.dailyFeedCost).toBe(7.5)
  })

  it('should calculate feed conversion ratio correctly', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, mockCostTransactions)

    // Total feed quantity: 100 + 150 + 80 + 120 = 450 kg
    // Total weight gain: 100 animals * 90 kg = 9000 kg
    // FCR: 450 / 9000 = 0.05
    expect(metrics.feedConversionRatio).toBeCloseTo(0.05, 4)
  })

  it('should calculate feed cost per kg correctly', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, mockCostTransactions)

    // Total weight gain: 100 animals * 90 kg = 9000 kg
    // Feed cost per kg: 225 / 9000 = 0.025
    expect(metrics.feedCostPerKg).toBeCloseTo(0.025, 4)
  })

  it('should handle cycles with no additional costs', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, mockSimpleConsumption, [])

    expect(metrics.additionalCosts).toBe(0)
    // Total costs: 225 + 0 + 5000 = 5225
    expect(metrics.totalCosts).toBe(5225)
    // Profit: 20000 - 5225 = 14775
    expect(metrics.profitLoss).toBe(14775)
  })

  it('should handle cycles with no consumption', () => {
    const metrics = calculateCycleMetrics(mockSimpleCycle, [], mockCostTransactions)

    expect(metrics.totalFeedCost).toBe(0)
    expect(metrics.feedCostPerAnimal).toBe(0)
    expect(metrics.feedConversionRatio).toBe(0)
    expect(metrics.feedCostPerKg).toBe(0)
  })

  it('should handle ongoing cycles (no end date)', () => {
    const ongoingCycle = { ...mockSimpleCycle, end_date: null }
    const metrics = calculateCycleMetrics(ongoingCycle, mockSimpleConsumption, mockCostTransactions)

    // Should still calculate metrics with current date as end
    expect(metrics.cycleDuration).toBeGreaterThan(0)
    expect(metrics.totalFeedCost).toBe(225)
  })
})

// ============================================================================
// AREA METRICS TESTS
// ============================================================================

describe('calculateAreaMetrics', () => {
  it('should calculate metrics for each area correctly', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions)

    expect(metrics).toHaveLength(2)

    // Area 1 metrics
    const area1 = metrics.find(m => m.areaId === 'area-1')
    expect(area1).toBeDefined()
    expect(area1!.animalCount).toBe(100)
    expect(area1!.totalFeedQuantity).toBe(250) // 100 + 150
    expect(area1!.totalFeedCost).toBe(125) // 50 + 75

    // Area 2 metrics
    const area2 = metrics.find(m => m.areaId === 'area-2')
    expect(area2).toBeDefined()
    expect(area2!.animalCount).toBe(50)
    expect(area2!.totalFeedQuantity).toBe(200) // 80 + 120
    expect(area2!.totalFeedCost).toBe(100) // 40 + 60
  })

  it('should calculate per-animal costs correctly', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions)

    const area1 = metrics.find(m => m.areaId === 'area-1')
    // Feed cost per animal: 125 / 100 = 1.25
    expect(area1!.feedCostPerAnimal).toBe(1.25)

    const area2 = metrics.find(m => m.areaId === 'area-2')
    // Feed cost per animal: 100 / 50 = 2.0
    expect(area2!.feedCostPerAnimal).toBe(2.0)
  })

  it('should calculate percentage of total correctly', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions)

    const area1 = metrics.find(m => m.areaId === 'area-1')
    // Percentage: (125 / 225) * 100 = 55.56%
    expect(area1!.percentageOfTotal).toBeCloseTo(55.56, 1)

    const area2 = metrics.find(m => m.areaId === 'area-2')
    // Percentage: (100 / 225) * 100 = 44.44%
    expect(area2!.percentageOfTotal).toBeCloseTo(44.44, 1)
  })

  it('should calculate profit/loss per animal correctly', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions)

    const area1 = metrics.find(m => m.areaId === 'area-1')
    // Direct profit: sellPrice(200) - buyPrice(50) - feedCostPerAnimal(1.25) = 148.75
    expect(area1!.profitLossDirectPerAnimal).toBeCloseTo(148.75, 2)

    // Total animals across all areas: 100 + 50 = 150
    // Area 1 share: 100 / 150 = 0.6667
    // Additional cost per animal for area 1: (800 * 0.6667) / 100 = 5.33
    // Total cost per animal: 50 + 1.25 + 5.33 = 56.58
    // Full profit: 200 - 56.58 = 143.42
    expect(area1!.profitLossFullPerAnimal).toBeCloseTo(143.42, 1)
  })

  it('should track feed types per area', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions)

    const area1 = metrics.find(m => m.areaId === 'area-1')
    expect(Object.keys(area1!.feedTypes)).toHaveLength(1)
    expect(area1!.feedTypes['Futter A']).toBeDefined()
    expect(area1!.feedTypes['Futter A'].quantity).toBe(250)
    expect(area1!.feedTypes['Futter A'].cost).toBe(125)

    const area2 = metrics.find(m => m.areaId === 'area-2')
    expect(Object.keys(area2!.feedTypes)).toHaveLength(1)
    expect(area2!.feedTypes['Futter B']).toBeDefined()
    expect(area2!.feedTypes['Futter B'].quantity).toBe(200)
    expect(area2!.feedTypes['Futter B'].cost).toBe(100)
  })

  it('should support area filtering', () => {
    // Filter to only include area-1
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions, ['area-1'])

    expect(metrics).toHaveLength(1)
    expect(metrics[0].areaId).toBe('area-1')
  })

  it('should handle empty area filter (include all)', () => {
    const metrics = calculateAreaMetrics(mockCycle, mockConsumption, mockCostTransactions, [])

    expect(metrics).toHaveLength(2)
  })
})

// ============================================================================
// FEED COMPONENT SUMMARY TESTS
// ============================================================================

describe('calculateFeedComponentSummary', () => {
  it('should aggregate consumption by feed type', () => {
    const summary = calculateFeedComponentSummary(mockCycle, mockConsumption)

    expect(summary).toHaveLength(2)

    const futter1 = summary.find(s => s.feedTypeName === 'Futter A')
    expect(futter1).toBeDefined()
    expect(futter1!.totalQuantity).toBe(250) // 100 + 150
    expect(futter1!.totalCost).toBe(125) // 50 + 75

    const futter2 = summary.find(s => s.feedTypeName === 'Futter B')
    expect(futter2).toBeDefined()
    expect(futter2!.totalQuantity).toBe(200) // 80 + 120
    expect(futter2!.totalCost).toBe(100) // 40 + 60
  })

  it('should calculate weighted average price correctly', () => {
    const summary = calculateFeedComponentSummary(mockCycle, mockConsumption)

    const futter1 = summary.find(s => s.feedTypeName === 'Futter A')
    // Weighted avg: 125 / 250 = 0.5
    expect(futter1!.weightedAvgPrice).toBe(0.5)

    const futter2 = summary.find(s => s.feedTypeName === 'Futter B')
    // Weighted avg: 100 / 200 = 0.5
    expect(futter2!.weightedAvgPrice).toBe(0.5)
  })

  it('should calculate percentage of total correctly', () => {
    const summary = calculateFeedComponentSummary(mockCycle, mockConsumption)

    const futter1 = summary.find(s => s.feedTypeName === 'Futter A')
    // Percentage: (125 / 225) * 100 = 55.56%
    expect(futter1!.percentageOfTotal).toBeCloseTo(55.56, 1)

    const futter2 = summary.find(s => s.feedTypeName === 'Futter B')
    // Percentage: (100 / 225) * 100 = 44.44%
    expect(futter2!.percentageOfTotal).toBeCloseTo(44.44, 1)
  })

  it('should calculate daily consumption correctly', () => {
    const summary = calculateFeedComponentSummary(mockCycle, mockConsumption)

    const futter1 = summary.find(s => s.feedTypeName === 'Futter A')
    // Daily: 250 / 30 = 8.33 kg/day
    expect(futter1!.dailyConsumption).toBeCloseTo(8.33, 2)

    const futter2 = summary.find(s => s.feedTypeName === 'Futter B')
    // Daily: 200 / 30 = 6.67 kg/day
    expect(futter2!.dailyConsumption).toBeCloseTo(6.67, 2)
  })

  it('should sort by total cost descending', () => {
    const summary = calculateFeedComponentSummary(mockCycle, mockConsumption)

    // Futter A (125) should come before Futter B (100)
    expect(summary[0].feedTypeName).toBe('Futter A')
    expect(summary[1].feedTypeName).toBe('Futter B')
  })

  it('should handle empty consumption', () => {
    const summary = calculateFeedComponentSummary(mockCycle, [])

    expect(summary).toHaveLength(0)
  })

  it('should handle single feed type', () => {
    const singleFeed = mockConsumption.filter(c => c.feed_type_id === 'feed-1')
    const summary = calculateFeedComponentSummary(mockCycle, singleFeed)

    expect(summary).toHaveLength(1)
    expect(summary[0].feedTypeName).toBe('Futter A')
  })
})

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should handle zero animals', () => {
    const cycleWithNoAnimals = {
      ...mockCycle,
      livestock_count_details: [],
    }

    const metrics = calculateCycleMetrics(cycleWithNoAnimals, mockConsumption, mockCostTransactions)

    expect(metrics.totalAnimals).toBe(0)
    expect(metrics.feedCostPerAnimal).toBe(0)
    expect(metrics.animalPurchaseCost).toBe(0)
  })

  it('should handle zero weight gain', () => {
    const cycleWithNoGain = {
      ...mockCycle,
      expected_weight_per_animal: 100,
      actual_weight_per_animal: 100,
    }

    const metrics = calculateCycleMetrics(cycleWithNoGain, mockConsumption, mockCostTransactions)

    expect(metrics.weightGain).toBe(0)
    expect(metrics.feedConversionRatio).toBe(0)
    expect(metrics.feedCostPerKg).toBe(0)
  })

  it('should handle zero revenue', () => {
    const cycleWithNoRevenue = {
      ...mockCycle,
      revenue: 0,
      sell_price_per_animal: 0,
    }

    const metrics = calculateCycleMetrics(cycleWithNoRevenue, mockConsumption, mockCostTransactions)

    expect(metrics.totalRevenue).toBe(0)
    expect(metrics.profitLoss).toBeLessThan(0) // Should be negative (costs only)
    expect(metrics.profitMargin).toBe(0)
  })

  it('should handle null/undefined prices', () => {
    const cycleWithNullPrices = {
      ...mockCycle,
      buy_price_per_animal: null,
      sell_price_per_animal: null,
    }

    const metrics = calculateCycleMetrics(cycleWithNullPrices as any, mockConsumption, mockCostTransactions)

    expect(metrics.animalPurchaseCost).toBe(0)
    expect(metrics.totalRevenue).toBe(0)
  })
})

// ============================================================================
// ESTIMATED PROFIT/LOSS TESTS
// ============================================================================

describe('calculateEstimatedProfitLoss', () => {
  it('should calculate profit correctly with all inputs', () => {
    const result = calculateEstimatedProfitLoss({
      totalAnimals: 100,
      buyPricePerAnimal: 50,
      sellPricePerAnimal: 200,
      totalFeedCost: 500,
      additionalCosts: 300,
    })

    // Revenue: 100 * 200 = 20000
    // Costs: (100 * 50) + 500 + 300 = 5800
    // Profit: 20000 - 5800 = 14200
    expect(result).toBe(14200)
  })

  it('should match calculateCycleMetrics formula', () => {
    // Both functions should produce the same result for the same inputs
    const params = {
      totalAnimals: 100,
      buyPricePerAnimal: 50,
      sellPricePerAnimal: 200,
      totalFeedCost: 225,
      additionalCosts: 800,
    }

    const estimatedResult = calculateEstimatedProfitLoss(params)

    // Calculate what the cycle metrics would produce
    const expectedRevenue = params.totalAnimals * params.sellPricePerAnimal
    const expectedAnimalCost = params.totalAnimals * params.buyPricePerAnimal
    const expectedTotalCosts = expectedAnimalCost + params.totalFeedCost + params.additionalCosts
    const expectedProfit = expectedRevenue - expectedTotalCosts

    expect(estimatedResult).toBe(expectedProfit)
  })

  it('should handle zero animals', () => {
    const result = calculateEstimatedProfitLoss({
      totalAnimals: 0,
      buyPricePerAnimal: 50,
      sellPricePerAnimal: 200,
      totalFeedCost: 500,
    })

    expect(result).toBeNull()
  })

  it('should handle null prices', () => {
    const result = calculateEstimatedProfitLoss({
      totalAnimals: 100,
      buyPricePerAnimal: null,
      sellPricePerAnimal: null,
      totalFeedCost: 500,
    })

    // Revenue: 0, Costs: 500, Profit: -500
    expect(result).toBe(-500)
  })

  it('should handle missing optional parameters', () => {
    const result = calculateEstimatedProfitLoss({
      totalAnimals: 100,
    })

    // No costs or revenue: 0 - 0 = 0
    expect(result).toBe(0)
  })

  it('should handle negative profit (loss)', () => {
    const result = calculateEstimatedProfitLoss({
      totalAnimals: 100,
      buyPricePerAnimal: 80,
      sellPricePerAnimal: 50, // Selling at a loss
      totalFeedCost: 1000,
    })

    // Revenue: 5000, Costs: 8000 + 1000 = 9000, Loss: -4000
    expect(result).toBe(-4000)
  })
})
