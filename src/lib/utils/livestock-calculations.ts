/**
 * Livestock Calculation Utilities
 *
 * Centralized calculations for livestock counts, metrics, and evaluations
 */

export type LivestockCountDetail = {
  count: number
  start_date: string
  end_date: string | null
  area_id?: string
  area_group_id?: string
}

export type AnimalCountEntry = {
  count: number
  startDate: string
  endDate: string
}

/**
 * Calculate the maximum number of animals present at any point in time
 *
 * This accounts for animals moving between areas/groups over time.
 * For example: 100 animals in Aufzuchtbereich, then split into two areas of 50 each
 * should count as 100 total animals, not 200.
 *
 * @param entries - Animal count entries with start/end dates
 * @param cycleStartDate - Overall cycle start date (fallback for entries without start date)
 * @param cycleEndDate - Overall cycle end date (fallback for entries without end date)
 * @returns Maximum number of animals at any point in time
 */
export function calculateMaxAnimalsAtAnyTime(
  entries: AnimalCountEntry[],
  cycleStartDate: string,
  cycleEndDate?: string | null
): number {
  const validEntries = entries.filter(e => e.count > 0)

  if (validEntries.length === 0) return 0

  // Collect all unique dates (transitions)
  const allDates = new Set<number>()
  validEntries.forEach(({ startDate, endDate }) => {
    if (startDate) allDates.add(new Date(startDate).getTime())
    if (endDate) allDates.add(new Date(endDate).getTime())
  })

  // If no dates specified, just sum all counts
  if (allDates.size === 0) {
    return validEntries.reduce((sum, { count }) => sum + count, 0)
  }

  // For each date transition, count animals present at that time
  let maxAnimals = 0
  allDates.forEach(dateTime => {
    const date = new Date(dateTime)
    const animalsAtDate = validEntries
      .filter(({ startDate, endDate }) => {
        const start = startDate ? new Date(startDate) : new Date(cycleStartDate)
        const end = endDate ? new Date(endDate) : (cycleEndDate ? new Date(cycleEndDate) : null)

        const afterStart = date >= start
        const beforeEnd = !end || date <= end
        return afterStart && beforeEnd
      })
      .reduce((sum, { count }) => sum + count, 0)

    maxAnimals = Math.max(maxAnimals, animalsAtDate)
  })

  return maxAnimals
}

/**
 * Calculate total animals from livestock count details (database format)
 *
 * @param details - Livestock count details from database
 * @param cycleStartDate - Cycle start date
 * @param cycleEndDate - Cycle end date
 * @returns Maximum number of animals at any point in time
 */
export function calculateTotalAnimalsFromDetails(
  details: LivestockCountDetail[],
  cycleStartDate: string,
  cycleEndDate?: string | null
): number {
  const entries: AnimalCountEntry[] = details.map(detail => ({
    count: detail.count,
    startDate: detail.start_date,
    endDate: detail.end_date || '',
  }))

  return calculateMaxAnimalsAtAnyTime(entries, cycleStartDate, cycleEndDate)
}

/**
 * Calculate cycle duration in days
 *
 * @param startDate - Cycle start date
 * @param endDate - Cycle end date (null for ongoing cycles)
 * @returns Number of days in the cycle
 */
export function calculateCycleDuration(
  startDate: string,
  endDate?: string | null
): number {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()

  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
