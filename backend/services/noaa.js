import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

const cache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache

const NOAA_API_URL = process.env.NOAA_API_URL || 'https://www.ncdc.noaa.gov/cdo-web/api/v2';
const NOAA_API_TOKEN = process.env.NOAA_API_TOKEN;

// Wisconsin boundaries
const WI_BOUNDS = {
  minLat: 42.5,
  maxLat: 47.1,
  minLng: -92.9,
  maxLng: -86.2
};

/**
 * Fetch hail events from NOAA API
 */
export async function fetchNOAAHailData(options = {}) {
  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    state = 'WI'
  } = options;

  if (!NOAA_API_TOKEN) {
    logger.warn('NOAA API token not configured, using cached/database data only');
    return [];
  }

  const cacheKey = `noaa_${startDate}_${endDate}_${state}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    logger.debug('Returning cached NOAA data');
    return cached;
  }

  try {
    logger.info(`Fetching NOAA hail data for ${state} from ${startDate} to ${endDate}`);

    const url = `${NOAA_API_URL}/data?datasetid=GHCND&datatypeid=HAIL&locationid=FIPS:55&startdate=${startDate}&enddate=${endDate}&limit=1000`;

    const response = await fetch(url, {
      headers: {
        'token': NOAA_API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.results || [];

    logger.info(`Fetched ${events.length} hail events from NOAA`);

    // Transform NOAA data to our format
    const transformed = events.map(event => ({
      noaaEventId: event.datatype,
      eventDate: event.date.split('T')[0],
      location: event.station,
      value: event.value,
      // Additional processing needed based on actual NOAA response structure
    }));

    cache.set(cacheKey, transformed);
    return transformed;

  } catch (error) {
    logger.error(`Failed to fetch NOAA data: ${error.message}`);
    return [];
  }
}

/**
 * Sync NOAA data to database
 */
export async function syncNOAAData(options = {}) {
  try {
    logger.info('Starting NOAA data sync');

    const events = await fetchNOAAHailData(options);

    if (events.length === 0) {
      logger.info('No new events to sync');
      return { synced: 0, skipped: 0, errors: 0 };
    }

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const event of events) {
      try {
        // Check if event already exists
        const existing = await query(
          'SELECT id FROM hail_events WHERE noaa_event_id = $1',
          [event.noaaEventId]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert new event
        await query(
          `INSERT INTO hail_events
           (event_date, location, noaa_event_id, source)
           VALUES ($1, $2, $3, $4)`,
          [event.eventDate, event.location, event.noaaEventId, 'NOAA']
        );

        synced++;
      } catch (error) {
        logger.error(`Failed to sync event ${event.noaaEventId}: ${error.message}`);
        errors++;
      }
    }

    logger.info(`NOAA sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);

    return { synced, skipped, errors };

  } catch (error) {
    logger.error(`NOAA sync failed: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate hail severity based on size and wind speed
 */
export function calculateHailSeverity(hailSize, windSpeed = 0) {
  if (hailSize >= 2.0 || windSpeed >= 75) {
    return 'extreme';
  } else if (hailSize >= 1.5 || windSpeed >= 60) {
    return 'severe';
  } else if (hailSize >= 1.0 || windSpeed >= 40) {
    return 'moderate';
  } else {
    return 'minor';
  }
}

export default {
  fetchNOAAHailData,
  syncNOAAData,
  calculateHailSeverity
};
