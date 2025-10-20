import { createClient } from '@/lib/supabase/client'
import type { ParsedData } from '@/lib/csv-parser'

export interface UploadResult {
  processed: number
  created: number
  updated: number
  errors: string[]
}

export async function uploadConsumptionData(data: ParsedData, farmId?: string): Promise<UploadResult> {
  const supabase = createClient()
  
  const result: UploadResult = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: []
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Benutzer nicht angemeldet')
    }

    // Use provided farmId or get the first farm for the user
    let activeFarmId = farmId
    if (!activeFarmId) {
      const { data: farms, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)

      if (farmError || !farms || farms.length === 0) {
        throw new Error('Kein Stall gefunden. Bitte erstellen Sie zuerst einen Stall.')
      }
      activeFarmId = farms[0].id
    }

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        farm_id: activeFarmId,
        filename: `import_${new Date().toISOString().split('T')[0]}.csv`,
        status: 'processing',
        uploaded_by: user.id
      })
      .select()
      .single()

    if (uploadError) {
      throw new Error(`Fehler beim Erstellen des Upload-Datensatzes: ${uploadError.message}`)
    }

    // Process each feed type first
    const feedTypeMap = new Map<string, string>()
    
    for (const feedTypeName of data.feedTypes) {
      try {
        // Try to get existing feed type
        let { data: existingFeedType } = await supabase
          .from('feed_types')
          .select('id')
          .eq('farm_id', activeFarmId)
          .eq('name', feedTypeName)
          .single()

        if (!existingFeedType) {
          // Create new feed type
          const { data: newFeedType, error: feedTypeError } = await supabase
            .from('feed_types')
            .insert({
              farm_id: activeFarmId,
              name: feedTypeName,
              unit: 'kg'
            })
            .select()
            .single()

          if (feedTypeError) {
            result.errors.push(`Fehler beim Erstellen des Futtermittels ${feedTypeName}: ${feedTypeError.message}`)
            continue
          }
          existingFeedType = newFeedType
        }

        feedTypeMap.set(feedTypeName, existingFeedType.id)
      } catch (error) {
        result.errors.push(`Fehler bei Futtermittel ${feedTypeName}: ${error instanceof Error ? error.message : 'Unbekannt'}`)
      }
    }

    // Process areas - automatically create areas found in the data
    const areaMap = new Map<string, string>()
    const uniqueAreas = [...new Set(data.rows.map(row => row.area).filter(area => area && area.trim()))]
    
    for (const areaName of uniqueAreas) {
      try {
        // Try to get existing area
        let { data: existingArea } = await supabase
          .from('areas')
          .select('id')
          .eq('farm_id', activeFarmId)
          .eq('name', areaName)
          .single()

        if (!existingArea) {
          // Create new area
          const { data: newArea, error: areaError } = await supabase
            .from('areas')
            .insert({
              farm_id: activeFarmId,
              name: areaName,
              description: `Automatisch erstellt beim CSV-Import`
            })
            .select()
            .single()

          if (areaError) {
            result.errors.push(`Fehler beim Erstellen des Bereichs ${areaName}: ${areaError.message}`)
            continue
          }
          existingArea = newArea
        }

        areaMap.set(areaName, existingArea.id)
      } catch (error) {
        result.errors.push(`Fehler bei Bereich ${areaName}: ${error instanceof Error ? error.message : 'Unbekannt'}`)
      }
    }

    // Process consumption data in batches for performance
    const batchSize = 1000
    const consumptionRecords: any[] = []
    
    // Prepare all consumption records
    for (const row of data.rows) {
      try {
        for (const [feedName, quantity] of Object.entries(row.feeds)) {
          const feedTypeId = feedTypeMap.get(feedName)
          if (!feedTypeId) {
            result.errors.push(`Futtermittel ${feedName} konnte nicht gefunden werden`)
            continue
          }

          const areaId = areaMap.get(row.area)
          
          consumptionRecords.push({
            farm_id: activeFarmId,
            feed_type_id: feedTypeId,
            date: row.date,
            quantity: quantity,
            group_name: row.area,
            pen_name: row.feedSystem,
            area_id: areaId || null,
            upload_id: upload.id
          })
        }
      } catch (error) {
        result.errors.push(`Fehler bei Zeile ${row.date}: ${error instanceof Error ? error.message : 'Unbekannt'}`)
      }
    }

    // Insert records in batches using upsert
    console.log(`Verarbeite ${consumptionRecords.length} Datensätze in Batches von ${batchSize}...`)
    
    for (let i = 0; i < consumptionRecords.length; i += batchSize) {
      const batch = consumptionRecords.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(consumptionRecords.length / batchSize)
      
      console.log(`Verarbeite Batch ${batchNumber}/${totalBatches} (${batch.length} Datensätze)...`)
      
      try {
        const { error: upsertError, count } = await supabase
          .from('consumption')
          .upsert(batch, {
            onConflict: 'farm_id,date,feed_type_id,group_name,pen_name',
            count: 'exact'
          })

        if (upsertError) {
          result.errors.push(`Batch-Fehler bei Datensätzen ${i + 1}-${i + batch.length}: ${upsertError.message}`)
        } else {
          result.created += count || batch.length
          result.processed += batch.length
          console.log(`Batch ${batchNumber} erfolgreich verarbeitet (${count || batch.length} Datensätze)`)
        }
      } catch (error) {
        result.errors.push(`Batch-Verarbeitungsfehler: ${error instanceof Error ? error.message : 'Unbekannt'}`)
      }
    }

    // Update upload status
    await supabase
      .from('uploads')
      .update({
        status: result.errors.length > 0 ? 'completed' : 'completed',
        rows_imported: result.created,
        rows_updated: result.updated,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null
      })
      .eq('id', upload.id)

    console.log('Upload completed:', result)

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unbekannter Fehler')
  }

  return result
}