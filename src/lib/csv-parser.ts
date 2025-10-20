export interface ParsedRow {
  date: string
  area: string
  feedSystem: string
  feeds: Record<string, number>
  total: number
}

export interface ParsedData {
  rows: ParsedRow[]
  feedTypes: string[]
  dateRange: {
    start: string
    end: string
  }
  totalRows: number
}

export function parseGEAExport(csvContent: string): ParsedData {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV-Datei ist leer oder hat keine Daten')
  }
  
  // Detect delimiter (tab or comma)
  const firstLine = lines[0]
  const isTabDelimited = firstLine.includes('\t')
  const delimiter = isTabDelimited ? '\t' : ','
  
  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result
  }
  
  // Parse header to extract feed component names
  const header = parseCSVLine(lines[0])
  const feedColumns: { name: string; index: number }[] = []
  
  // Find columns with "abgegebene Menge (kg)" in the header
  header.forEach((col, index) => {
    if (col.includes('abgegebene Menge (kg)') && !col.startsWith('Insgesamt')) {
      // Extract feed name (everything before "abgegebene Menge")
      const feedName = col.replace(' abgegebene Menge (kg)', '').trim()
      if (feedName && feedName !== 'Wasser') { // Exclude water
        feedColumns.push({ name: feedName, index })
      }
    }
  })
  
  const rows: ParsedRow[] = []
  let minDate: string | null = null
  let maxDate: string | null = null
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const cells = parseCSVLine(line)
    
    // Parse date (DD.MM.YYYY to YYYY-MM-DD)
    const dateParts = cells[2]?.split('.')
    if (!dateParts || dateParts.length !== 3) continue
    
    const date = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
    
    // Update date range
    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date
    
    // Parse feeds
    const feeds: Record<string, number> = {}
    let hasValidData = false
    
    feedColumns.forEach(({ name, index }) => {
      const value = parseFloat(cells[index]?.replace(',', '.').replace('"', '') || '0')
      if (value > 0) {
        feeds[name] = value
        hasValidData = true
      }
    })
    
    // Only add row if it has valid feed data
    if (hasValidData) {
      rows.push({
        date,
        area: cells[0], // Stallgruppe
        feedSystem: cells[1], // Futtersystem
        feeds,
        total: parseFloat(cells[3]?.replace(',', '.').replace('"', '') || '0') // Insgesamt
      })
    }
  }
  
  if (rows.length === 0) {
    throw new Error('Keine gültigen Datenzeilen gefunden')
  }
  
  // Get unique feed types
  const feedTypesSet = new Set<string>()
  rows.forEach(row => {
    Object.keys(row.feeds).forEach(feed => feedTypesSet.add(feed))
  })
  
  return {
    rows,
    feedTypes: Array.from(feedTypesSet).sort(),
    dateRange: {
      start: minDate!,
      end: maxDate!
    },
    totalRows: rows.length
  }
}