/**
 * Unit Tests for Feed Calculation Utilities
 *
 * These tests ensure correct price tier matching, cost calculations,
 * and consumption data processing.
 */

import { describe, it, expect } from 'vitest'
import {
  findApplicablePriceTier,
  calculateConsumptionCost,
  ensureConsumptionCosts,
  calculateWeightedAveragePrice,
  groupConsumptionData,
} from './feed-calculations'

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const mockPriceTiers = [
  {
    feed_type_id: 'feed-1',
    price_per_unit: 0.5,
    valid_from: '2024-01-01',
    valid_to: '2024-03-31',
  },
  {
    feed_type_id: 'feed-1',
    price_per_unit: 0.6,
    valid_from: '2024-04-01',
    valid_to: null, // Open-ended
  },
  {
    feed_type_id: 'feed-2',
    price_per_unit: 0.8,
    valid_from: '2024-01-01',
    valid_to: '2024-06-30',
  },
  {
    feed_type_id: 'feed-2',
    price_per_unit: 0.75,
    valid_from: '2024-07-01',
    valid_to: null,
  },
]

const mockConsumption = [
  {
    date: '2024-02-15',
    quantity: 100,
    feed_type_id: 'feed-1',
    feed_types: {
      id: 'feed-1',
      name: 'Futter A',
      unit: 'kg',
    },
  },
  {
    date: '2024-05-10',
    quantity: 150,
    feed_type_id: 'feed-1',
    feed_types: {
      id: 'feed-1',
      name: 'Futter A',
      unit: 'kg',
    },
  },
  {
    date: '2024-03-20',
    quantity: 80,
    feed_type_id: 'feed-2',
    feed_types: {
      id: 'feed-2',
      name: 'Futter B',
      unit: 'kg',
    },
  },
]

// ============================================================================
// PRICE TIER TESTS
// ============================================================================

describe('findApplicablePriceTier', () => {
  describe('basic matching', () => {
    it('should find price tier within valid date range', () => {
      const result = findApplicablePriceTier('feed-1', '2024-02-15', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.5)
      expect(result?.feed_type_id).toBe('feed-1')
    })

    it('should find price tier at start of validity period', () => {
      const result = findApplicablePriceTier('feed-1', '2024-01-01', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.5)
    })

    it('should find price tier at end of validity period', () => {
      const result = findApplicablePriceTier('feed-1', '2024-03-31', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.5)
    })

    it('should return null when no price tier exists for feed type', () => {
      const result = findApplicablePriceTier('feed-unknown', '2024-02-15', mockPriceTiers)

      expect(result).toBeNull()
    })

    it('should return null when date is before all valid periods', () => {
      const result = findApplicablePriceTier('feed-1', '2023-12-31', mockPriceTiers)

      expect(result).toBeNull()
    })

    it('should return null for empty price tiers', () => {
      const result = findApplicablePriceTier('feed-1', '2024-02-15', [])

      expect(result).toBeNull()
    })
  })

  describe('open-ended validity (null valid_to)', () => {
    it('should find price tier with null valid_to date', () => {
      const result = findApplicablePriceTier('feed-1', '2024-05-15', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.6)
      expect(result?.valid_to).toBeNull()
    })

    it('should match open-ended tier for far future dates', () => {
      const result = findApplicablePriceTier('feed-1', '2025-12-31', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.6)
    })
  })

  describe('price changes over time', () => {
    it('should return most recent price when transitioning between periods', () => {
      // Date is exactly at the transition
      const result = findApplicablePriceTier('feed-1', '2024-04-01', mockPriceTiers)

      expect(result).toBeDefined()
      expect(result?.price_per_unit).toBe(0.6) // Should use newer price
    })

    it('should handle multiple price changes correctly', () => {
      // Before price change
      const resultBefore = findApplicablePriceTier('feed-2', '2024-06-30', mockPriceTiers)
      expect(resultBefore?.price_per_unit).toBe(0.8)

      // After price change
      const resultAfter = findApplicablePriceTier('feed-2', '2024-07-01', mockPriceTiers)
      expect(resultAfter?.price_per_unit).toBe(0.75)
    })
  })

  describe('overlapping periods', () => {
    it('should return most recent valid price when multiple tiers are valid', () => {
      const overlappingTiers = [
        {
          feed_type_id: 'feed-1',
          price_per_unit: 0.5,
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
        },
        {
          feed_type_id: 'feed-1',
          price_per_unit: 0.55,
          valid_from: '2024-06-01',
          valid_to: '2024-12-31',
        },
      ]

      const result = findApplicablePriceTier('feed-1', '2024-07-15', overlappingTiers)

      // Should return the more recent one (June 1 start)
      expect(result?.price_per_unit).toBe(0.55)
    })
  })
})

// ============================================================================
// CONSUMPTION COST CALCULATION TESTS
// ============================================================================

describe('calculateConsumptionCost', () => {
  it('should calculate cost correctly with valid price tier', () => {
    const item = mockConsumption[0]
    const cost = calculateConsumptionCost(item, mockPriceTiers)

    // 100 kg * 0.5 EUR/kg = 50 EUR
    expect(cost).toBe(50)
  })

  it('should return 0 when no applicable price tier found', () => {
    const item = {
      date: '2023-01-01', // Before any price tiers
      quantity: 100,
      feed_type_id: 'feed-1',
      feed_types: {
        id: 'feed-1',
        name: 'Futter A',
        unit: 'kg',
      },
    }

    const cost = calculateConsumptionCost(item, mockPriceTiers)
    expect(cost).toBe(0)
  })

  it('should return 0 for unknown feed type', () => {
    const item = {
      date: '2024-02-15',
      quantity: 100,
      feed_type_id: 'feed-unknown',
      feed_types: {
        id: 'feed-unknown',
        name: 'Unknown Feed',
        unit: 'kg',
      },
    }

    const cost = calculateConsumptionCost(item, mockPriceTiers)
    expect(cost).toBe(0)
  })

  it('should handle zero quantity', () => {
    const item = {
      ...mockConsumption[0],
      quantity: 0,
    }

    const cost = calculateConsumptionCost(item, mockPriceTiers)
    expect(cost).toBe(0)
  })

  it('should calculate cost with changed price tier', () => {
    const item = {
      date: '2024-05-15', // Uses 0.6 price
      quantity: 200,
      feed_type_id: 'feed-1',
      feed_types: {
        id: 'feed-1',
        name: 'Futter A',
        unit: 'kg',
      },
    }

    const cost = calculateConsumptionCost(item, mockPriceTiers)
    // 200 kg * 0.6 EUR/kg = 120 EUR
    expect(cost).toBe(120)
  })

  it('should handle decimal quantities', () => {
    const item = {
      date: '2024-02-15',
      quantity: 123.45,
      feed_type_id: 'feed-1',
      feed_types: {
        id: 'feed-1',
        name: 'Futter A',
        unit: 'kg',
      },
    }

    const cost = calculateConsumptionCost(item, mockPriceTiers)
    // 123.45 kg * 0.5 EUR/kg = 61.725 EUR
    expect(cost).toBeCloseTo(61.725, 3)
  })
})

// ============================================================================
// ENSURE CONSUMPTION COSTS TESTS
// ============================================================================

describe('ensureConsumptionCosts', () => {
  it('should calculate costs for items without total_cost', () => {
    const result = ensureConsumptionCosts(mockConsumption, mockPriceTiers)

    expect(result).toHaveLength(3)
    expect(result[0].total_cost).toBe(50) // 100 * 0.5
    expect(result[1].total_cost).toBe(90) // 150 * 0.6
    expect(result[2].total_cost).toBe(64) // 80 * 0.8
  })

  it('should preserve existing valid total_cost', () => {
    const consumptionWithCosts = [
      {
        ...mockConsumption[0],
        total_cost: 55, // Existing cost
      },
    ]

    const result = ensureConsumptionCosts(consumptionWithCosts, mockPriceTiers)

    // Should keep existing cost
    expect(result[0].total_cost).toBe(55)
  })

  it('should recalculate zero or negative total_cost', () => {
    const consumptionWithZeroCost = [
      {
        ...mockConsumption[0],
        total_cost: 0,
      },
      {
        ...mockConsumption[1],
        total_cost: -10,
      },
    ]

    const result = ensureConsumptionCosts(consumptionWithZeroCost, mockPriceTiers)

    expect(result[0].total_cost).toBe(50) // Recalculated
    expect(result[1].total_cost).toBe(90) // Recalculated
  })

  it('should handle empty consumption array', () => {
    const result = ensureConsumptionCosts([], mockPriceTiers)

    expect(result).toHaveLength(0)
  })

  it('should handle empty price tiers (all costs become 0)', () => {
    const result = ensureConsumptionCosts(mockConsumption, [])

    expect(result).toHaveLength(3)
    expect(result[0].total_cost).toBe(0)
    expect(result[1].total_cost).toBe(0)
    expect(result[2].total_cost).toBe(0)
  })

  it('should not mutate original consumption array', () => {
    const original = [...mockConsumption]
    const result = ensureConsumptionCosts(mockConsumption, mockPriceTiers)

    // Original should be unchanged
    expect(mockConsumption[0]).not.toHaveProperty('total_cost')
    // Result should have costs
    expect(result[0]).toHaveProperty('total_cost')
  })
})

// ============================================================================
// WEIGHTED AVERAGE PRICE TESTS
// ============================================================================

describe('calculateWeightedAveragePrice', () => {
  it('should calculate weighted average correctly', () => {
    const consumption = [
      {
        date: '2024-01-01',
        quantity: 100,
        total_cost: 50,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
      {
        date: '2024-01-02',
        quantity: 200,
        total_cost: 120,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
    ]

    const avg = calculateWeightedAveragePrice(consumption)

    // Total cost: 170, Total quantity: 300
    // Average: 170 / 300 = 0.5667
    expect(avg).toBeCloseTo(0.5667, 4)
  })

  it('should return 0 for empty consumption', () => {
    const avg = calculateWeightedAveragePrice([])
    expect(avg).toBe(0)
  })

  it('should return 0 when total quantity is 0', () => {
    const consumption = [
      {
        date: '2024-01-01',
        quantity: 0,
        total_cost: 50,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
    ]

    const avg = calculateWeightedAveragePrice(consumption)
    expect(avg).toBe(0)
  })

  it('should handle items with no total_cost', () => {
    const consumption = [
      {
        date: '2024-01-01',
        quantity: 100,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
      {
        date: '2024-01-02',
        quantity: 200,
        total_cost: 120,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
    ]

    const avg = calculateWeightedAveragePrice(consumption)

    // Only counts the item with total_cost: 120 / 300 = 0.4
    expect(avg).toBe(0.4)
  })

  it('should calculate correctly with single item', () => {
    const consumption = [
      {
        date: '2024-01-01',
        quantity: 100,
        total_cost: 50,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
    ]

    const avg = calculateWeightedAveragePrice(consumption)
    expect(avg).toBe(0.5)
  })
})

// ============================================================================
// GROUP CONSUMPTION DATA TESTS
// ============================================================================

describe('groupConsumptionData', () => {
  const testConsumption = [
    {
      date: '2024-01-01',
      quantity: 100,
      total_cost: 50,
      area_id: 'area-1',
      feed_type_id: 'feed-1',
      feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
    },
    {
      date: '2024-01-02',
      quantity: 150,
      total_cost: 75,
      area_id: 'area-1',
      feed_type_id: 'feed-1',
      feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
    },
    {
      date: '2024-01-03',
      quantity: 80,
      total_cost: 64,
      area_id: 'area-2',
      feed_type_id: 'feed-2',
      feed_types: { id: 'feed-2', name: 'Feed B', unit: 'kg' },
    },
  ]

  it('should group by area correctly', () => {
    const result = groupConsumptionData(
      testConsumption,
      (item) => item.area_id || 'unknown',
      (areaId, items) => ({
        areaId,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalCost: items.reduce((sum, i) => sum + (i.total_cost || 0), 0),
      })
    )

    expect(result).toHaveLength(2)

    const area1 = result.find((r) => r.areaId === 'area-1')
    expect(area1?.totalQuantity).toBe(250) // 100 + 150
    expect(area1?.totalCost).toBe(125) // 50 + 75

    const area2 = result.find((r) => r.areaId === 'area-2')
    expect(area2?.totalQuantity).toBe(80)
    expect(area2?.totalCost).toBe(64)
  })

  it('should group by feed type correctly', () => {
    const result = groupConsumptionData(
      testConsumption,
      (item) => item.feed_type_id,
      (feedTypeId, items) => ({
        feedTypeId,
        count: items.length,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      })
    )

    expect(result).toHaveLength(2)

    const feed1 = result.find((r) => r.feedTypeId === 'feed-1')
    expect(feed1?.count).toBe(2)
    expect(feed1?.totalQuantity).toBe(250)

    const feed2 = result.find((r) => r.feedTypeId === 'feed-2')
    expect(feed2?.count).toBe(1)
    expect(feed2?.totalQuantity).toBe(80)
  })

  it('should group by date correctly', () => {
    const result = groupConsumptionData(
      testConsumption,
      (item) => item.date,
      (date, items) => ({
        date,
        itemCount: items.length,
      })
    )

    expect(result).toHaveLength(3)
    expect(result.every((r) => r.itemCount === 1)).toBe(true)
  })

  it('should handle empty consumption array', () => {
    const result = groupConsumptionData(
      [],
      (item) => item.area_id || 'unknown',
      (areaId, items) => ({ areaId, count: items.length })
    )

    expect(result).toHaveLength(0)
  })

  it('should handle single group', () => {
    const singleGroup = testConsumption.filter((i) => i.area_id === 'area-1')

    const result = groupConsumptionData(
      singleGroup,
      (item) => item.area_id || 'unknown',
      (areaId, items) => ({
        areaId,
        count: items.length,
      })
    )

    expect(result).toHaveLength(1)
    expect(result[0].areaId).toBe('area-1')
    expect(result[0].count).toBe(2)
  })

  it('should handle custom aggregation function', () => {
    const result = groupConsumptionData(
      testConsumption,
      (item) => item.feed_types.name,
      (feedName, items) => ({
        feedName,
        avgQuantity: items.reduce((sum, i) => sum + i.quantity, 0) / items.length,
        avgCost: items.reduce((sum, i) => sum + (i.total_cost || 0), 0) / items.length,
      })
    )

    const feedA = result.find((r) => r.feedName === 'Feed A')
    expect(feedA?.avgQuantity).toBe(125) // (100 + 150) / 2
    expect(feedA?.avgCost).toBe(62.5) // (50 + 75) / 2
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Full workflow', () => {
  it('should correctly process consumption from raw data to costs', () => {
    // Step 1: Start with raw consumption (no costs)
    const rawConsumption = mockConsumption.map((item) => ({ ...item }))

    // Step 2: Ensure all items have costs
    const withCosts = ensureConsumptionCosts(rawConsumption, mockPriceTiers)

    // Step 3: Calculate weighted average
    const avgPrice = calculateWeightedAveragePrice(withCosts)

    // Step 4: Group by feed type
    const grouped = groupConsumptionData(
      withCosts,
      (item) => item.feed_type_id,
      (feedTypeId, items) => ({
        feedTypeId,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalCost: items.reduce((sum, i) => sum + (i.total_cost || 0), 0),
      })
    )

    // Verify results
    expect(withCosts.every((item) => item.total_cost && item.total_cost > 0)).toBe(true)
    expect(avgPrice).toBeGreaterThan(0)
    expect(grouped).toHaveLength(2)
    expect(grouped.reduce((sum, g) => sum + g.totalCost, 0)).toBe(
      withCosts.reduce((sum, i) => sum + (i.total_cost || 0), 0)
    )
  })

  it('should handle price changes over time correctly', () => {
    const consumptionOverTime = [
      {
        date: '2024-02-15', // Uses 0.5 price
        quantity: 100,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
      {
        date: '2024-05-15', // Uses 0.6 price
        quantity: 100,
        feed_type_id: 'feed-1',
        feed_types: { id: 'feed-1', name: 'Feed A', unit: 'kg' },
      },
    ]

    const withCosts = ensureConsumptionCosts(consumptionOverTime, mockPriceTiers)

    expect(withCosts[0].total_cost).toBe(50) // 100 * 0.5
    expect(withCosts[1].total_cost).toBe(60) // 100 * 0.6

    const totalCost = withCosts.reduce((sum, i) => sum + (i.total_cost || 0), 0)
    expect(totalCost).toBe(110)
  })
})
