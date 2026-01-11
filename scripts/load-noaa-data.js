/**
 * Wisconsin Hail Tracker - NOAA Data Loader
 * 
 * Downloads historical hail event data from NOAA's Storm Events Database
 * and uploads it to Supabase for the Wisconsin Hail CRM application.
 * 
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/load-noaa-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Example:');
  console.error('   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/load-noaa-data.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// NOAA Storm Events Database URLs
// Files are available at: https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/
const NOAA_BASE_URL = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles';
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

// Alternative fallback URL pattern
const NOAA_ALT_URL = 'https://www.ncei.noaa.gov/data/storm-events/csv';

/**
 * Attempt to download NOAA storm events CSV for a given year
 */
async function downloadNOAAData(year) {
  // Try multiple URL patterns since NOAA updates file names
  const urlPatterns = [
    `${NOAA_BASE_URL}/StormEvents_details-ftp_v1.0_d${year}_c20250101.csv`,
    `${NOAA_BASE_URL}/StormEvents_details-ftp_v1.0_d${year}_c20241201.csv`,
    `${NOAA_BASE_URL}/StormEvents_details-ftp_v1.0_d${year}_c20240901.csv`,
    `${NOAA_ALT_URL}/StormEvents_details-ftp_v1.0_d${year}_c20250217.csv`,
  ];
  
  console.log(`📥 Downloading NOAA data for ${year}...`);
  
  for (const url of urlPatterns) {
    try {
      console.log(`   Trying: ${url.split('/').pop()}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Wisconsin-Hail-Tracker/1.0 (https://github.com/wisconsin-hail-tracker)'
        }
      });
      
      if (response.ok) {
        const csvText = await response.text();
        const sizeMB = (csvText.length / 1024 / 1024).toFixed(2);
        console.log(`   ✅ Downloaded ${sizeMB} MB`);
        return csvText;
      }
    } catch (error) {
      // Continue to next URL pattern
    }
  }
  
  console.log(`   ⚠️ Could not download ${year} data - file may not exist yet`);
  return null;
}

/**
 * Parse NOAA CSV and filter for Wisconsin hail events
 */
function parseNOAACSV(csvText, year) {
  console.log(`📊 Parsing ${year} CSV data...`);
  
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
    
    // Filter for Wisconsin hail events with valid coordinates
    const wisconsinHail = records.filter(record => {
      return (
        record.STATE === 'WISCONSIN' &&
        record.EVENT_TYPE === 'Hail' &&
        record.BEGIN_LAT &&
        record.BEGIN_LON &&
        record.MAGNITUDE &&
        parseFloat(record.MAGNITUDE) > 0
      );
    });
    
    console.log(`   Found ${wisconsinHail.length} Wisconsin hail events`);
    
    // Transform to our database schema (storm_events table)
    return wisconsinHail.map(record => {
      // Parse date/time fields
      let beginDateTime = null;
      let endDateTime = null;
      
      try {
        if (record.BEGIN_DATE_TIME) {
          beginDateTime = new Date(record.BEGIN_DATE_TIME).toISOString();
        } else if (record.BEGIN_YEARMONTH && record.BEGIN_DAY) {
          const dateStr = `${record.BEGIN_YEARMONTH}-${record.BEGIN_DAY.padStart(2, '0')}`;
          if (record.BEGIN_TIME) {
            const time = record.BEGIN_TIME.padStart(4, '0');
            beginDateTime = new Date(`${dateStr}T${time.slice(0,2)}:${time.slice(2,4)}:00`).toISOString();
          } else {
            beginDateTime = new Date(`${dateStr}T00:00:00`).toISOString();
          }
        }
        
        if (record.END_DATE_TIME) {
          endDateTime = new Date(record.END_DATE_TIME).toISOString();
        }
      } catch (e) {
        // Use fallback date
        beginDateTime = new Date(`${year}-06-01T12:00:00`).toISOString();
      }
      
      return {
        event_id: record.EVENT_ID,
        episode_id: record.EPISODE_ID,
        event_type: record.EVENT_TYPE || 'Hail',
        
        // Date/time
        begin_date_time: beginDateTime,
        end_date_time: endDateTime,
        
        // Location
        state: record.STATE || 'WI',
        county: record.CZ_NAME || record.COUNTY,
        location: record.BEGIN_LOCATION || record.LOCATION,
        
        // Coordinates (critical for storm paths!)
        latitude: parseFloat(record.BEGIN_LAT) || null,
        longitude: parseFloat(record.BEGIN_LON) || null,
        begin_lat: parseFloat(record.BEGIN_LAT) || null,
        begin_lon: parseFloat(record.BEGIN_LON) || null,
        end_lat: parseFloat(record.END_LAT) || null,
        end_lon: parseFloat(record.END_LON) || null,
        
        // Storm magnitude
        magnitude: parseFloat(record.MAGNITUDE) || 0,
        magnitude_type: record.MAGNITUDE_TYPE || 'inches',
        
        // Damage reports
        damage_property: record.DAMAGE_PROPERTY || null,
        damage_crops: record.DAMAGE_CROPS || null,
        
        // Narrative/description
        event_narrative: record.EVENT_NARRATIVE || null,
        episode_narrative: record.EPISODE_NARRATIVE || null,
        
        // Source info
        source: record.SOURCE || 'NOAA',
        data_source: 'NCEI Storm Events Database',
        
        // Metadata
        year: year,
        month_name: record.MONTH_NAME
      };
    });
  } catch (error) {
    console.error(`   ❌ Error parsing CSV: ${error.message}`);
    return [];
  }
}

/**
 * Upload storm events to Supabase in batches
 */
async function uploadToSupabase(stormEvents, year) {
  if (stormEvents.length === 0) {
    console.log(`   No storm events to upload for ${year}`);
    return { success: 0, errors: 0 };
  }
  
  console.log(`📤 Uploading ${stormEvents.length} storm events to Supabase...`);
  
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 500;
  
  for (let i = 0; i < stormEvents.length; i += batchSize) {
    const batch = stormEvents.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(stormEvents.length / batchSize);
    
    try {
      // Try storm_events table first (used by routes)
      const { data, error } = await supabase
        .from('storm_events')
        .upsert(batch, { 
          onConflict: 'event_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        // Fallback to hail_storms table
        const { error: fallbackError } = await supabase
          .from('hail_storms')
          .upsert(batch, { 
            onConflict: 'event_id',
            ignoreDuplicates: false 
          });
        
        if (fallbackError) {
          throw fallbackError;
        }
      }
      
      successCount += batch.length;
      console.log(`   Batch ${batchNum}/${totalBatches}: ${batch.length} records ✓`);
    } catch (error) {
      errorCount += batch.length;
      console.error(`   Batch ${batchNum}/${totalBatches}: ERROR - ${error.message}`);
    }
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < stormEvents.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`   ✅ Uploaded: ${successCount}, ❌ Errors: ${errorCount}`);
  return { success: successCount, errors: errorCount };
}

/**
 * Main entry point
 */
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Wisconsin Hail Tracker - NOAA Data Loader          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Test Supabase connection
  console.log('🔌 Testing Supabase connection...');
  try {
    // Try to count from storm_events first
    let result = await supabase.from('storm_events').select('*', { count: 'exact', head: true });
    
    if (result.error) {
      // Fallback to hail_storms table
      result = await supabase.from('hail_storms').select('*', { count: 'exact', head: true });
    }
    
    if (result.error) throw result.error;
    
    const currentCount = result.count || 0;
    console.log(`   ✅ Connected! Current records: ${currentCount}`);
  } catch (error) {
    console.error(`   ❌ Connection failed: ${error.message}`);
    console.error('');
    console.error('   Make sure your Supabase credentials are correct and the');
    console.error('   storm_events or hail_storms table exists.');
    process.exit(1);
  }
  
  console.log('');
  console.log(`📅 Processing years: ${YEARS.join(', ')}`);
  console.log('');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const year of YEARS) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📆 Processing ${year}`);
    console.log(`${'─'.repeat(50)}`);
    
    // Download CSV
    const csvText = await downloadNOAAData(year);
    if (!csvText) {
      console.log(`   ⏭️ Skipping ${year}`);
      continue;
    }
    
    // Parse CSV
    const stormEvents = parseNOAACSV(csvText, year);
    if (stormEvents.length === 0) {
      console.log(`   ⏭️ No Wisconsin hail events found for ${year}`);
      continue;
    }
    
    // Upload to Supabase
    const result = await uploadToSupabase(stormEvents, year);
    totalSuccess += result.success;
    totalErrors += result.errors;
    
    // Delay between years to be nice to NOAA servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('');
  console.log('═'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`   ✅ Total records uploaded: ${totalSuccess.toLocaleString()}`);
  if (totalErrors > 0) {
    console.log(`   ❌ Total errors: ${totalErrors.toLocaleString()}`);
  }
  console.log('');
  console.log('🎉 Data load complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Start the backend: cd backend && npm run dev');
  console.log('  2. Start the frontend: cd frontend && npm run dev');
  console.log('  3. Open http://localhost:3000 to see your hail data!');
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
