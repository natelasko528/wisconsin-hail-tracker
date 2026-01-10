/**
 * Wisconsin Hail Tracker - NOAA Data Loader
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const NOAA_BASE_URL = 'https://www.ncei.noaa.gov/data/storm-events/csv';
const YEARS = [2020, 2021, 2022, 2023, 2024];

async function downloadNOAAData(year) {
  const url = NOAA_BASE_URL + '/StormEvents_details-ftp_v1.0_d' + year + '_c20250217.csv.gz';
  const uncompressedUrl = url.replace('.gz', '');
  
  console.log('Downloading NOAA data for ' + year + '...');
  
  try {
    const response = await fetch(uncompressedUrl);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const csvText = await response.text();
    console.log('Downloaded ' + (csvText.length / 1024 / 1024).toFixed(2) + ' MB');
    return csvText;
  } catch (error) {
    console.error('Failed to download: ' + error.message);
    return null;
  }
}

function parseNOAACSV(csvText, year) {
  console.log('Parsing ' + year + ' CSV data...');
  
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const wisconsinHail = records.filter(function(record) {
      return (
        record.STATE === 'WISCONSIN' &&
        record.EVENT_TYPE === 'Hail' &&
        record.BEGIN_LAT &&
        record.BEGIN_LON &&
        record.MAGNITUDE &&
        parseFloat(record.MAGNITUDE) > 0
      );
    });
    
    console.log('Found ' + wisconsinHail.length + ' Wisconsin hail events in ' + year);
    
    return wisconsinHail.map(function(record) {
      return {
        event_id: record.EVENT_ID,
        begin_date: record.BEGIN_DATE_TIME ? new Date(record.BEGIN_DATE_TIME).toISOString().split('T')[0] : null,
        begin_time: record.BEGIN_TIME,
        end_date: record.END_DATE_TIME ? new Date(record.END_DATE_TIME).toISOString().split('T')[0] : null,
        end_time: record.END_TIME,
        episode_id: record.EPISODE_ID,
        episode_narrative: record.EPISODE_NARRATIVE,
        event_narrative: record.EVENT_NARRATIVE,
        state: record.STATE || 'WI',
        state_fips: parseInt(record.STATE_FIPS) || 55,
        year: year,
        month_name: record.MONTH_NAME,
        event_type: record.EVENT_TYPE || 'Hail',
        cz_type: record.CZ_TYPE,
        cz_fips: record.CZ_FIPS,
        cz_name: record.CZ_NAME,
        begin_lat: parseFloat(record.BEGIN_LAT) || null,
        begin_lon: parseFloat(record.BEGIN_LON) || null,
        end_lat: parseFloat(record.END_LAT) || null,
        end_lon: parseFloat(record.END_LON) || null,
        magnitude: parseFloat(record.MAGNITUDE) || 0,
        magnitude_type: record.MAGNITUDE_TYPE || 'EZ',
        flood_cause: record.FLOOD_CAUSE,
        category: record.CATEGORY,
        outlook_url: record.OUTLOOK_URL,
        source: record.SOURCE,
        location: record.LOCATION,
        deaths_direct: parseInt(record.DEATHS_DIRECT) || 0,
        deaths_indirect: parseInt(record.DEATHS_INDIRECT) || 0,
        injuries_direct: parseInt(record.INJURIES_DIRECT) || 0,
        injuries_indirect: parseInt(record.INJURIES_INDIRECT) || 0,
        damage_property: parseFloat(record.DAMAGE_PROPERTY) || 0,
        damage_crops: parseFloat(record.DAMAGE_CROPS) || 0,
        tor_f_scale: record.TOR_F_SCALE,
        tor_length: parseFloat(record.TOR_LENGTH) || null,
        tor_width: parseFloat(record.TOR_WIDTH) || null,
        tor_other_wfo: record.TOR_OTHER_WFO,
        tor_other_cz_state: record.TOR_OTHER_CZ_STATE,
        tor_other_cz_fips: record.TOR_OTHER_CZ_FIPS,
        tor_other_cz_name: record.TOR_OTHER_CZ_NAME
      };
    });
  } catch (error) {
    console.error('Error parsing CSV: ' + error.message);
    return [];
  }
}

async function uploadToSupabase(hailStorms, year) {
  if (hailStorms.length === 0) {
    console.log('No hail storms to upload for ' + year);
    return { success: 0 };
  }
  
  console.log('Uploading ' + hailStorms.length + ' hail storms to Supabase...');
  
  let successCount = 0;
  const batchSize = 1000;
  
  for (let i = 0; i < hailStorms.length; i += batchSize) {
    const batch = hailStorms.slice(i, i + batchSize);
    
    try {
      const result = await supabase
        .from('hail_storms')
        .upsert(batch, { onConflict: 'event_id' });
      
      if (result.error) throw result.error;
      
      successCount += batch.length;
      console.log('Batch ' + (Math.floor(i / batchSize) + 1) + ': ' + batch.length + ' records');
    } catch (error) {
      console.error('Batch error: ' + error.message);
    }
  }
  
  console.log('Uploaded ' + successCount + ' records for ' + year);
  return { success: successCount };
}

async function main() {
  console.log('Wisconsin Hail Tracker - NOAA Data Loader');
  console.log('==========================================');
  
  console.log('Testing Supabase connection...');
  try {
    const result = await supabase.from('hail_storms').select('count').single();
    if (result.error) throw result.error;
    console.log('OK - Supabase connection successful');
  } catch (error) {
    console.error('FAILED: ' + error.message);
    process.exit(1);
  }
  
  let totalSuccess = 0;
  
  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    console.log('\nProcessing ' + year + '...');
    
    const csvText = await downloadNOAAData(year);
    if (!csvText) {
      console.log('SKIP - download error');
      continue;
    }
    
    const hailStorms = parseNOAACSV(csvText, year);
    if (hailStorms.length === 0) {
      console.log('SKIP - no events found');
      continue;
    }
    
    const result = await uploadToSupabase(hailStorms, year);
    totalSuccess += result.success;
    
    if (i < YEARS.length - 1) {
      await new Promise(function(resolve) { setTimeout(resolve, 2000); });
    }
  }
  
  console.log('\n==========================================');
  console.log('TOTAL RECORDS UPLOADED: ' + totalSuccess);
  console.log('Complete!');
}

main().catch(console.error);
