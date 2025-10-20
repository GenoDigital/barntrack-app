/**
 * Tests for Livestock Calculation Utilities
 *
 * These tests ensure correct calculations for livestock counts, metrics, and evaluations
 * particularly with time-based animal movements between areas/groups.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMaxAnimalsAtAnyTime,
  calculateTotalAnimalsFromDetails,
  calculateCycleDuration,
  type AnimalCountEntry,
  type LivestockCountDetail,
} from './livestock-calculations'

describe('calculateMaxAnimalsAtAnyTime', () => {
  describe('basic scenarios', () => {
    it('should return 0 when no entries provided', () => {
      const result = calculateMaxAnimalsAtAnyTime(
        [],
        '2024-01-01',
        '2024-02-01'
      )
      expect(result).toBe(0)
    })

    it('should return 0 when all entries have count of 0', () => {
      const entries: AnimalCountEntry[] = [
        { count: 0, startDate: '2024-01-01', endDate: '2024-01-31' },
        { count: 0, startDate: '2024-02-01', endDate: '2024-02-28' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-02-28'
      )
      expect(result).toBe(0)
    })

    it('should return total count when there are no date transitions (all animals in one entry)', () => {
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-12-31' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-12-31'
      )
      expect(result).toBe(100)
    })

    it('should return sum when no dates are specified', () => {
      const entries: AnimalCountEntry[] = [
        { count: 50, startDate: '', endDate: '' },
        { count: 50, startDate: '', endDate: '' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-12-31'
      )
      expect(result).toBe(100)
    })
  })

  describe('animal movement scenarios', () => {
    it('should correctly calculate max when animals move from one area to another (sequential)', () => {
      // Scenario: 100 animals start in Area A, then all move to Area B
      // At any point in time, there should be max 100 animals, not 200
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-01-31' }, // Area A
        { count: 100, startDate: '2024-02-01', endDate: '2024-02-28' }, // Area B
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-02-28'
      )
      expect(result).toBe(100)
    })

    it('should correctly calculate max when animals split between areas', () => {
      // Scenario: 100 animals in Aufzucht, then split into two Mast areas of 50 each
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-01-31' }, // Aufzucht
        { count: 50, startDate: '2024-02-01', endDate: '2024-03-31' },  // Mast 1
        { count: 50, startDate: '2024-02-01', endDate: '2024-03-31' },  // Mast 2
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-03-31'
      )
      expect(result).toBe(100)
    })

    it('should correctly handle overlapping timeframes', () => {
      // Scenario: Animals in different areas with overlapping dates
      const entries: AnimalCountEntry[] = [
        { count: 50, startDate: '2024-01-01', endDate: '2024-02-15' }, // Area A
        { count: 50, startDate: '2024-02-01', endDate: '2024-03-15' }, // Area B (overlaps)
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-03-15'
      )
      // During overlap (Feb 1-15), there are 100 animals total
      expect(result).toBe(100)
    })

    it('should correctly handle multiple transitions', () => {
      // Scenario: Complex movements
      // 100 animals start together, split into 3 groups at different times, then regroup
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-01-15' }, // Initial
        { count: 40, startDate: '2024-01-16', endDate: '2024-02-15' },  // Group 1
        { count: 30, startDate: '2024-01-16', endDate: '2024-02-15' },  // Group 2
        { count: 30, startDate: '2024-01-16', endDate: '2024-02-15' },  // Group 3
        { count: 100, startDate: '2024-02-16', endDate: '2024-03-31' }, // Regrouped
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-03-31'
      )
      expect(result).toBe(100)
    })

    it('should handle gradual reduction in animal count (mortality/sales)', () => {
      // Scenario: 100 animals, some die/sold over time
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-01-31' },
        { count: 90, startDate: '2024-02-01', endDate: '2024-02-28' },
        { count: 85, startDate: '2024-03-01', endDate: '2024-03-31' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-03-31'
      )
      expect(result).toBe(100) // Max at the beginning
    })
  })

  describe('edge cases with dates', () => {
    it('should handle entries with only start dates (no end date)', () => {
      const entries: AnimalCountEntry[] = [
        { count: 50, startDate: '2024-01-01', endDate: '' },
        { count: 50, startDate: '2024-02-01', endDate: '' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-12-31'
      )
      // Both are active from their start dates until cycle end
      expect(result).toBe(100)
    })

    it('should use cycle end date when entry has no end date', () => {
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-01-31' },
        { count: 100, startDate: '2024-02-01', endDate: '' }, // No end date
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-03-31'
      )
      expect(result).toBe(100)
    })

    it('should use cycle start date for entries without start date', () => {
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '', endDate: '2024-01-31' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-02-28'
      )
      expect(result).toBe(100)
    })

    it('should handle null cycle end date (ongoing cycle)', () => {
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '' },
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        null
      )
      expect(result).toBe(100)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical pig farming cycle: Ferkel → Aufzucht → Mast', () => {
      // Scenario: 100 piglets bought, raised through stages
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-02-15' }, // Ferkelaufzucht (6 weeks)
        { count: 100, startDate: '2024-02-16', endDate: '2024-04-15' }, // Aufzucht (8 weeks)
        { count: 50, startDate: '2024-04-16', endDate: '2024-07-31' },  // Mast Area 1
        { count: 50, startDate: '2024-04-16', endDate: '2024-07-31' },  // Mast Area 2
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-07-31'
      )
      expect(result).toBe(100)
    })

    it('should handle partial sales during fattening period', () => {
      // Scenario: Start with 100, sell 20 after 2 months, sell remaining 80 after 2 more months
      const entries: AnimalCountEntry[] = [
        { count: 100, startDate: '2024-01-01', endDate: '2024-03-01' }, // Initial
        { count: 80, startDate: '2024-03-02', endDate: '2024-05-01' },  // After first sale
        { count: 0, startDate: '2024-05-02', endDate: '2024-05-31' },   // All sold
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-05-31'
      )
      expect(result).toBe(100)
    })

    it('should handle staggered starts in multiple areas', () => {
      // Scenario: Different batches starting at different times
      const entries: AnimalCountEntry[] = [
        { count: 50, startDate: '2024-01-01', endDate: '2024-04-30' },  // Batch 1
        { count: 50, startDate: '2024-02-01', endDate: '2024-05-31' },  // Batch 2 (overlaps)
        { count: 50, startDate: '2024-03-01', endDate: '2024-06-30' },  // Batch 3 (overlaps)
      ]
      const result = calculateMaxAnimalsAtAnyTime(
        entries,
        '2024-01-01',
        '2024-06-30'
      )
      // During March-April, all three batches are active
      expect(result).toBe(150)
    })
  })
})

describe('calculateTotalAnimalsFromDetails', () => {
  it('should convert database format and calculate correctly', () => {
    const details: LivestockCountDetail[] = [
      {
        count: 100,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        area_id: 'area-1',
        area_group_id: undefined,
      },
      {
        count: 100,
        start_date: '2024-02-01',
        end_date: '2024-02-28',
        area_id: 'area-2',
        area_group_id: undefined,
      },
    ]
    const result = calculateTotalAnimalsFromDetails(
      details,
      '2024-01-01',
      '2024-02-28'
    )
    expect(result).toBe(100) // Sequential, so max is 100
  })

  it('should handle null end dates', () => {
    const details: LivestockCountDetail[] = [
      {
        count: 50,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        area_id: 'area-1',
        area_group_id: undefined,
      },
      {
        count: 50,
        start_date: '2024-02-01',
        end_date: null,
        area_id: 'area-2',
        area_group_id: undefined,
      },
    ]
    const result = calculateTotalAnimalsFromDetails(
      details,
      '2024-01-01',
      '2024-12-31'
    )
    expect(result).toBe(50) // Sequential with null end date
  })

  it('should handle area groups correctly', () => {
    const details: LivestockCountDetail[] = [
      {
        count: 30,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        area_id: undefined,
        area_group_id: 'group-1',
      },
      {
        count: 70,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        area_id: 'area-1',
        area_group_id: undefined,
      },
    ]
    const result = calculateTotalAnimalsFromDetails(
      details,
      '2024-01-01',
      '2024-12-31'
    )
    expect(result).toBe(100) // Both active simultaneously
  })

  it('should handle empty details array', () => {
    const result = calculateTotalAnimalsFromDetails(
      [],
      '2024-01-01',
      '2024-12-31'
    )
    expect(result).toBe(0)
  })
})

describe('calculateCycleDuration', () => {
  it('should calculate duration correctly for completed cycle', () => {
    const result = calculateCycleDuration('2024-01-01', '2024-01-31')
    expect(result).toBe(31) // January has 31 days (inclusive)
  })

  it('should calculate duration for leap year February', () => {
    const result = calculateCycleDuration('2024-02-01', '2024-02-29')
    expect(result).toBe(29) // 2024 is a leap year
  })

  it('should calculate duration for non-leap year February', () => {
    const result = calculateCycleDuration('2025-02-01', '2025-02-28')
    expect(result).toBe(28)
  })

  it('should use current date when end date is null', () => {
    const startDate = '2024-01-01'
    const result = calculateCycleDuration(startDate, null)

    // Calculate expected duration
    const start = new Date(startDate)
    const today = new Date()
    const expectedDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    expect(result).toBe(expectedDays)
  })

  it('should calculate single day duration', () => {
    const result = calculateCycleDuration('2024-01-01', '2024-01-01')
    expect(result).toBe(1) // Same day counts as 1 day
  })

  it('should calculate multi-month duration', () => {
    const result = calculateCycleDuration('2024-01-01', '2024-06-30')
    expect(result).toBe(182) // 31+29+31+30+31+30 = 182 days in first half of 2024
  })

  it('should calculate year-long cycle', () => {
    const result = calculateCycleDuration('2024-01-01', '2024-12-31')
    expect(result).toBe(366) // 2024 is a leap year
  })

  it('should handle cycles spanning year boundary', () => {
    const result = calculateCycleDuration('2024-11-01', '2025-01-31')
    expect(result).toBe(92) // Nov: 30, Dec: 31, Jan: 31 = 92 days
  })
})

describe('integration tests - complex scenarios', () => {
  it('should correctly calculate for a realistic complete pig cycle with multiple moves', () => {
    // Realistic scenario:
    // - 100 piglets arrive (Ferkel)
    // - Raised in Aufzucht area for 8 weeks
    // - Split into 2 Mast areas (50 each) for 16 weeks
    // - Some mortality: lose 3 animals during Mast period
    const entries: AnimalCountEntry[] = [
      // Week 1-8: Aufzucht
      { count: 100, startDate: '2024-01-01', endDate: '2024-02-25' },

      // Week 9-24: Mast (with mortality after week 16)
      { count: 50, startDate: '2024-02-26', endDate: '2024-05-05' },  // Mast Area 1 (full period)
      { count: 50, startDate: '2024-02-26', endDate: '2024-05-05' },  // Mast Area 2 (full period)

      // Week 17-24: After mortality (3 died from Mast Area 1)
      { count: -3, startDate: '2024-04-15', endDate: '2024-04-15' },  // Mortality adjustment (conceptually)
    ]

    // Filter out negative counts (mortality tracking is separate)
    const validEntries = entries.filter(e => e.count > 0)

    const result = calculateMaxAnimalsAtAnyTime(
      validEntries,
      '2024-01-01',
      '2024-05-05'
    )

    expect(result).toBe(100) // Max was 100 at the start and during Mast before mortality
  })

  it('should handle continuous production with rolling batches', () => {
    // Scenario: Continuous production facility with staggered batches
    // New batch every month, each stays for 3 months
    const entries: AnimalCountEntry[] = [
      { count: 50, startDate: '2024-01-01', endDate: '2024-03-31' },  // Batch 1
      { count: 50, startDate: '2024-02-01', endDate: '2024-04-30' },  // Batch 2
      { count: 50, startDate: '2024-03-01', endDate: '2024-05-31' },  // Batch 3
      { count: 50, startDate: '2024-04-01', endDate: '2024-06-30' },  // Batch 4
    ]

    const result = calculateMaxAnimalsAtAnyTime(
      entries,
      '2024-01-01',
      '2024-06-30'
    )

    // From March onwards, there are always 3 batches active (150 animals)
    expect(result).toBe(150)
  })
})
