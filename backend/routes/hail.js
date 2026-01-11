import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// Configure multer for file uploads (memory storage for CSV parsing)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Helper to determine severity from magnitude (hail size in inches)
function getSeverity(magnitude) {
  if (magnitude >= 2.5) return 'critical';
  if (magnitude >= 1.75) return 'high';
  if (magnitude >= 1.0) return 'medium';
  return 'low';
}

// Transform storm_events to our API format
function transformStormEvent(event) {
  return {
    id: event.id,
    event_id: event.event_id,
    event_date: event.begin_date_time,
    city: event.location || 'Unknown',
    county: event.county,
    state: event.state || 'WI',
    latitude: parseFloat(event.latitude) || 0,
    longitude: parseFloat(event.longitude) || 0,
    hail_size: parseFloat(event.magnitude) || 0,
    severity: getSeverity(parseFloat(event.magnitude) || 0),
    damage_property: event.damage_property,
    damage_crops: event.damage_crops,
    source: event.data_source || 'NOAA',
    narrative: event.event_narrative,
    year: event.year,
    month: event.month_name
  };
}

// Wisconsin counties for reference
const WISCONSIN_COUNTIES = [
  'ADAMS', 'ASHLAND', 'BARRON', 'BAYFIELD', 'BROWN', 'BUFFALO', 'BURNETT', 'CALUMET',
  'CHIPPEWA', 'CLARK', 'COLUMBIA', 'CRAWFORD', 'DANE', 'DODGE', 'DOOR', 'DOUGLAS',
  'DUNN', 'EAU CLAIRE', 'FLORENCE', 'FOND DU LAC', 'FOREST', 'GRANT', 'GREEN',
  'GREEN LAKE', 'IOWA', 'IRON', 'JACKSON', 'JEFFERSON', 'JUNEAU', 'KENOSHA',
  'KEWAUNEE', 'LA CROSSE', 'LAFAYETTE', 'LANGLADE', 'LINCOLN', 'MANITOWOC',
  'MARATHON', 'MARINETTE', 'MARQUETTE', 'MENOMINEE', 'MILWAUKEE', 'MONROE',
  'OCONTO', 'ONEIDA', 'OUTAGAMIE', 'OZAUKEE', 'PEPIN', 'PIERCE', 'POLK', 'PORTAGE',
  'PRICE', 'RACINE', 'RICHLAND', 'ROCK', 'RUSK', 'SAUK', 'SAWYER', 'SHAWANO',
  'SHEBOYGAN', 'ST. CROIX', 'TAYLOR', 'TREMPEALEAU', 'VERNON', 'VILAS', 'WALWORTH',
  'WASHBURN', 'WASHINGTON', 'WAUKESHA', 'WAUPACA', 'WAUSHARA', 'WINNEBAGO', 'WOOD'
];

// ============================================================================
// POST /api/hail/import - Import NOAA CSV file
// ============================================================================
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = [];
    
    // Parse CSV
    await new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      })
      .on('data', (row) => {
        // Only process hail events
        if (row.EVENT_TYPE?.toUpperCase() === 'HAIL' || row.event_type?.toUpperCase() === 'HAIL') {
          records.push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
    });

    if (records.length === 0) {
      return res.status(400).json({ 
        error: 'No hail events found in CSV. Make sure the file contains EVENT_TYPE = "Hail"' 
      });
    }

    // Transform NOAA CSV format to our database format
    const transformedRecords = records.map(row => {
      // Handle different column naming conventions in NOAA data
      const eventId = row.EVENT_ID || row.event_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const beginDateTime = row.BEGIN_DATE_TIME || row.begin_date_time || 
        `${row.BEGIN_YEARMONTH || row.YEAR || '2024'}${row.BEGIN_DAY ? '-' + row.BEGIN_DAY : '-01'}T${row.BEGIN_TIME || '00:00:00'}`;
      
      return {
        event_id: String(eventId),
        event_type: 'Hail',
        event_narrative: row.EVENT_NARRATIVE || row.event_narrative || null,
        magnitude: parseFloat(row.MAGNITUDE || row.magnitude) || null,
        magnitude_type: row.MAGNITUDE_TYPE || row.magnitude_type || 'inches',
        location: row.BEGIN_LOCATION || row.CZ_NAME || row.cz_name || null,
        county: (row.CZ_NAME || row.cz_name || '').toUpperCase(),
        state: row.STATE || row.state || 'WI',
        begin_date_time: beginDateTime,
        end_date_time: row.END_DATE_TIME || row.end_date_time || null,
        latitude: parseFloat(row.BEGIN_LAT || row.begin_lat) || null,
        longitude: parseFloat(row.BEGIN_LON || row.begin_lon) || null,
        source: row.SOURCE || row.source || null,
        episode_id: row.EPISODE_ID || row.episode_id || null,
        year: parseInt(row.YEAR || row.year) || new Date().getFullYear(),
        month_name: row.MONTH_NAME || row.month_name || null,
        damage_property: row.DAMAGE_PROPERTY || row.damage_property || null,
        damage_crops: row.DAMAGE_CROPS || row.damage_crops || null,
        data_source: 'NCEI Storm Events Database'
      };
    });

    // Batch insert with upsert (update if exists based on event_id)
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('storm_events')
        .upsert(batch, { 
          onConflict: 'event_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
      }
    }

    res.json({
      success: true,
      message: `Import complete`,
      stats: {
        totalProcessed: records.length,
        inserted,
        updated,
        errors
      }
    });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/search - Advanced search with all filters
// ============================================================================
router.get('/search', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      state,
      county,
      city,
      zipCode,
      minSize,
      maxSize,
      severity,
      hasDamage,
      limit = 100,
      offset = 0,
      sortBy = 'begin_date_time',
      sortOrder = 'desc'
    } = req.query;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    let query = supabase
      .from('storm_events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'Hail');

    // Apply filters
    if (startDate) {
      query = query.gte('begin_date_time', startDate);
    }
    if (endDate) {
      query = query.lte('begin_date_time', endDate);
    }
    if (state) {
      query = query.ilike('state', state);
    }
    if (county) {
      // Support comma-separated counties
      const counties = county.split(',').map(c => c.trim().toUpperCase());
      if (counties.length === 1) {
        query = query.ilike('county', `%${counties[0]}%`);
      } else {
        query = query.or(counties.map(c => `county.ilike.%${c}%`).join(','));
      }
    }
    if (city) {
      query = query.ilike('location', `%${city}%`);
    }
    if (minSize) {
      query = query.gte('magnitude', parseFloat(minSize));
    }
    if (maxSize) {
      query = query.lte('magnitude', parseFloat(maxSize));
    }
    if (hasDamage === 'true') {
      query = query.not('damage_property', 'is', null);
    }

    // Sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform and filter by severity if needed
    let transformed = (data || []).map(transformStormEvent);
    
    if (severity) {
      const severities = severity.split(',');
      transformed = transformed.filter(h => severities.includes(h.severity));
    }

    res.json({
      success: true,
      count: count || transformed.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: transformed
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/hail/convert-to-leads - Convert storm events to leads
// Enhanced: Now uses property discovery for real addresses
// ============================================================================
router.post('/convert-to-leads', async (req, res) => {
  try {
    const { 
      stormEventIds, 
      usePropertyDiscovery = true,  // New: opt-in to property discovery
      radiusMiles = 3,              // New: radius for property discovery
      minDamageProbability = 0.3    // New: minimum damage probability for leads
    } = req.body;

    if (!stormEventIds || !Array.isArray(stormEventIds) || stormEventIds.length === 0) {
      return res.status(400).json({ error: 'stormEventIds array is required' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Fetch the storm events
    const { data: stormEvents, error: fetchError } = await supabase
      .from('storm_events')
      .select('*')
      .in('id', stormEventIds);

    if (fetchError) throw fetchError;

    if (!stormEvents || stormEvents.length === 0) {
      return res.status(404).json({ error: 'No storm events found with provided IDs' });
    }

    const createdLeads = [];
    const errors = [];
    let propertiesDiscovered = 0;

    for (const event of stormEvents) {
      try {
        const hailSize = parseFloat(event.magnitude) || 1.0;
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);

        // Check if we should use property discovery (requires valid coordinates)
        if (usePropertyDiscovery && lat && lng && Math.abs(lat) > 0.1 && Math.abs(lng) > 0.1) {
          // Check if we already have properties linked to this storm
          const { data: existingImpacts } = await supabase
            .from('storm_property_impacts')
            .select('id')
            .eq('storm_event_id', event.event_id)
            .limit(1);

          if (!existingImpacts || existingImpacts.length === 0) {
            // Discover properties near storm (limit to prevent rate limiting)
            const propertyCount = Math.min(50, Math.ceil(hailSize * 15));
            
            // Call property discovery service (via API to reuse the logic)
            try {
              const discoverResult = await discoverPropertiesNearStorm(
                event.event_id,
                radiusMiles,
                propertyCount
              );
              propertiesDiscovered += discoverResult?.propertiesSaved || 0;
            } catch (discoverError) {
              console.warn(`Property discovery warning for ${event.event_id}:`, discoverError.message);
              // Continue with fallback method
            }
          }

          // Create leads from discovered properties with high damage probability
          const { data: impacts } = await supabase
            .from('storm_property_impacts')
            .select(`
              *,
              properties (*)
            `)
            .eq('storm_event_id', event.event_id)
            .gte('damage_probability', minDamageProbability)
            .order('priority_score', { ascending: false })
            .limit(20);

          if (impacts && impacts.length > 0) {
            for (const impact of impacts) {
              // Check if lead already exists for this property + storm
              const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('property_id', impact.property_id)
                .eq('storm_id', event.event_id)
                .single();

              if (existingLead) continue;

              const property = impact.properties;
              
              // Create lead with real property data
              const { data: lead, error: leadError } = await supabase
                .from('leads')
                .insert({
                  property_id: property.id,
                  storm_id: event.event_id,
                  storm_impact_id: impact.id,
                  status: 'New',
                  hail_size: impact.hail_size_at_location || hailSize,
                  damage_probability: impact.damage_probability,
                  priority_score: impact.priority_score,
                  ai_insights: {
                    damage_probability: impact.damage_probability,
                    distance_from_storm: impact.distance_miles,
                    priority_factors: impact.priority_factors,
                    source: 'property_discovery'
                  }
                })
                .select(`
                  *,
                  properties (id, street_address, city, state, zip_code, full_address, owner_name, latitude, longitude)
                `)
                .single();

              if (leadError) {
                errors.push({ property_id: property.id, error: leadError.message });
                continue;
              }

              // Log activity
              await supabase.from('activity_log').insert({
                entity_type: 'lead',
                entity_id: lead.id,
                action: 'lead_created_from_storm',
                description: `Lead created: ${property.street_address}, ${property.city} - ${hailSize}" hail, ${Math.round(impact.damage_probability * 100)}% damage probability`,
                metadata: { 
                  storm_event_id: event.id, 
                  hail_size: hailSize,
                  damage_probability: impact.damage_probability,
                  distance_miles: impact.distance_miles
                }
              });

              createdLeads.push({
                id: lead.id,
                property_address: property.full_address || `${property.street_address}, ${property.city}, ${property.state} ${property.zip_code}`,
                street_address: property.street_address,
                city: property.city,
                hail_size: lead.hail_size,
                damage_probability: lead.damage_probability,
                priority_score: lead.priority_score,
                status: lead.status,
                storm_event_id: event.id
              });
            }
            
            // If we created leads from properties, continue to next event
            if (createdLeads.length > 0) continue;
          }
        }

        // Fallback: Create lead with county-level address (when no properties discovered)
        const fallbackAddress = `${event.location || 'Unknown'}, ${event.county || ''} County, ${event.state || 'WI'}`;
        
        // Check if property exists
        const { data: existingProperty } = await supabase
          .from('properties')
          .select('id')
          .eq('full_address', fallbackAddress)
          .single();

        let propertyId;
        if (existingProperty) {
          propertyId = existingProperty.id;
        } else {
          // Create new property with available data
          const { data: newProperty, error: propError } = await supabase
            .from('properties')
            .insert({
              street_address: event.location || `Near ${event.county} County Center`,
              city: event.county || 'Unknown',
              state: event.state || 'WI',
              county: event.county,
              full_address: fallbackAddress,
              latitude: lat || 0,
              longitude: lng || 0,
              data_source: 'storm_event_fallback',
              geocode_accuracy: 'approximate'
            })
            .select()
            .single();

          if (propError) throw propError;
          propertyId = newProperty.id;
        }

        // Calculate damage probability for fallback lead
        const damageProbability = calculateDamageProbability(hailSize, 0, 15, 'asphalt_shingle');
        const priorityScore = calculatePriorityScore(damageProbability, 250000, 0, false);

        // Create lead
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .insert({
            property_id: propertyId,
            storm_id: event.event_id,
            status: 'New',
            hail_size: hailSize,
            damage_probability: damageProbability,
            priority_score: priorityScore,
            ai_insights: {
              damage_probability: damageProbability,
              source: 'county_level_fallback',
              note: 'Address is approximate - recommend property discovery for better targeting'
            }
          })
          .select(`
            *,
            properties (id, full_address, owner_name, latitude, longitude)
          `)
          .single();

        if (leadError) throw leadError;

        // Log activity
        await supabase.from('activity_log').insert({
          entity_type: 'lead',
          entity_id: lead.id,
          action: 'lead_created_from_storm',
          description: `Lead created from storm event: ${event.location || event.county}, ${hailSize}" hail (county-level)`,
          metadata: { storm_event_id: event.id, hail_size: hailSize, is_fallback: true }
        });

        createdLeads.push({
          id: lead.id,
          property_address: lead.properties?.full_address,
          hail_size: lead.hail_size,
          damage_probability: lead.damage_probability,
          priority_score: lead.priority_score,
          status: lead.status,
          storm_event_id: event.id,
          is_approximate: true
        });

      } catch (err) {
        errors.push({ storm_event_id: event.id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Created ${createdLeads.length} leads from ${stormEvents.length} storm events`,
      stats: {
        leadsCreated: createdLeads.length,
        propertiesDiscovered,
        errors: errors.length
      },
      leads: createdLeads,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Convert to leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to discover properties (imported from service)
async function discoverPropertiesNearStorm(stormEventId, radiusMiles, maxProperties) {
  // Dynamic import to avoid circular dependency
  const { discoverPropertiesNearStorm: discover } = await import('../services/propertyDiscovery.js');
  return discover(stormEventId, radiusMiles, maxProperties);
}

// Helper function to calculate damage probability
function calculateDamageProbability(hailSize, distanceMiles = 0, roofAge = 15, roofType = 'asphalt_shingle') {
  let baseProbability;
  if (hailSize >= 2.5) baseProbability = 0.95;
  else if (hailSize >= 2.0) baseProbability = 0.85;
  else if (hailSize >= 1.5) baseProbability = 0.70;
  else if (hailSize >= 1.0) baseProbability = 0.50;
  else if (hailSize >= 0.75) baseProbability = 0.30;
  else baseProbability = 0.15;

  const distanceFactor = Math.max(0.3, 1.0 - (distanceMiles * 0.1));
  
  let ageFactor;
  if (roofAge >= 20) ageFactor = 1.3;
  else if (roofAge >= 15) ageFactor = 1.2;
  else if (roofAge >= 10) ageFactor = 1.1;
  else if (roofAge >= 5) ageFactor = 1.0;
  else ageFactor = 0.9;

  const typeFactors = {
    'asphalt_shingle': 1.2,
    'wood': 1.3,
    'metal': 0.7,
    'tile': 0.8,
    'flat': 1.0
  };
  const typeFactor = typeFactors[roofType] || 1.0;

  return Math.min(0.99, baseProbability * distanceFactor * ageFactor * typeFactor);
}

// Helper function to calculate priority score
function calculatePriorityScore(damageProbability, propertyValue = 250000, daysSinceStorm = 0, hasPhone = false) {
  let score = Math.floor(damageProbability * 40);
  score += Math.min(20, Math.floor(propertyValue / 25000));
  score += Math.max(0, 25 - daysSinceStorm);
  if (hasPhone) score += 15;
  return Math.min(100, Math.max(1, score));
}

// ============================================================================
// GET /api/hail/export - Export filtered results as CSV
// ============================================================================
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, state, county, minSize, maxSize, severity } = req.query;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    let query = supabase
      .from('storm_events')
      .select('*')
      .eq('event_type', 'Hail')
      .order('begin_date_time', { ascending: false })
      .limit(10000);

    if (startDate) query = query.gte('begin_date_time', startDate);
    if (endDate) query = query.lte('begin_date_time', endDate);
    if (state) query = query.ilike('state', state);
    if (county) query = query.ilike('county', `%${county}%`);
    if (minSize) query = query.gte('magnitude', parseFloat(minSize));
    if (maxSize) query = query.lte('magnitude', parseFloat(maxSize));

    const { data, error } = await query;

    if (error) throw error;

    // Generate CSV
    const headers = ['event_id', 'date', 'location', 'county', 'state', 'hail_size', 'severity', 'damage_property', 'latitude', 'longitude'];
    const csvRows = [headers.join(',')];

    for (const event of data || []) {
      const transformed = transformStormEvent(event);
      if (severity && !severity.split(',').includes(transformed.severity)) continue;
      
      csvRows.push([
        transformed.event_id,
        transformed.event_date,
        `"${transformed.city}"`,
        `"${transformed.county}"`,
        transformed.state,
        transformed.hail_size,
        transformed.severity,
        `"${transformed.damage_property || ''}"`,
        transformed.latitude,
        transformed.longitude
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=hail_events_export.csv');
    res.send(csvRows.join('\n'));

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/counties - Get list of counties with storm events
// ============================================================================
router.get('/counties', async (req, res) => {
  try {
    const { state = 'WI' } = req.query;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('storm_events')
        .select('county')
        .eq('event_type', 'Hail')
        .ilike('state', state)
        .not('county', 'is', null);

      if (error) throw error;

      const counties = [...new Set((data || []).map(h => h.county).filter(Boolean))].sort();
      res.json({ success: true, data: counties });
    } else {
      res.json({ success: true, data: WISCONSIN_COUNTIES });
    }
  } catch (error) {
    console.error('Error fetching counties:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/stats - Get hail statistics
// ============================================================================
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, state, county } = req.query;

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('storm_events')
        .select('magnitude, county, damage_property, begin_date_time')
        .eq('event_type', 'Hail');

      if (startDate) query = query.gte('begin_date_time', startDate);
      if (endDate) query = query.lte('begin_date_time', endDate);
      if (state) query = query.ilike('state', state);
      if (county) query = query.ilike('county', `%${county}%`);

      const { data: events, error } = await query;

      if (error) throw error;

      const transformedEvents = (events || []).map(e => ({
        hail_size: parseFloat(e.magnitude) || 0,
        severity: getSeverity(parseFloat(e.magnitude) || 0),
        county: e.county,
        has_damage: !!e.damage_property
      }));

      const stats = {
        totalReports: transformedEvents.length,
        averageSize: transformedEvents.length > 0
          ? parseFloat((transformedEvents.reduce((sum, h) => sum + h.hail_size, 0) / transformedEvents.length).toFixed(2))
          : 0,
        maxSize: transformedEvents.length > 0
          ? Math.max(...transformedEvents.map(h => h.hail_size))
          : 0,
        withDamage: transformedEvents.filter(h => h.has_damage).length,
        severityBreakdown: {
          critical: transformedEvents.filter(h => h.severity === 'critical').length,
          high: transformedEvents.filter(h => h.severity === 'high').length,
          medium: transformedEvents.filter(h => h.severity === 'medium').length,
          low: transformedEvents.filter(h => h.severity === 'low').length
        },
        countyBreakdown: transformedEvents.reduce((acc, h) => {
          if (h.county) {
            acc[h.county] = (acc[h.county] || 0) + 1;
          }
          return acc;
        }, {})
      };

      res.json({ success: true, data: stats });
    } else {
      res.json({
        success: true,
        data: {
          totalReports: 0,
          averageSize: 0,
          maxSize: 0,
          withDamage: 0,
          severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
          countyBreakdown: {}
        }
      });
    }
  } catch (error) {
    console.error('Error fetching hail stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail - Fetch hail reports (legacy endpoint)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, minSize, county, severity, limit = 100, offset = 0 } = req.query;

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('storm_events')
        .select('*', { count: 'exact' })
        .eq('event_type', 'Hail')
        .order('begin_date_time', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (startDate) query = query.gte('begin_date_time', startDate);
      if (endDate) query = query.lte('begin_date_time', endDate);
      if (minSize) query = query.gte('magnitude', parseFloat(minSize));
      if (county) query = query.ilike('county', `%${county}%`);

      const { data, error, count } = await query;

      if (error) throw error;

      let transformed = (data || []).map(transformStormEvent);
      if (severity) {
        transformed = transformed.filter(h => h.severity === severity);
      }

      res.json({ success: true, count: count || transformed.length, data: transformed });
    } else {
      res.json({ success: true, count: 0, data: [] });
    }
  } catch (error) {
    console.error('Error fetching hail events:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/paths - Get storm paths as GeoJSON
// ============================================================================
router.get('/paths', async (req, res) => {
  try {
    const { startDate, endDate, minSize, county, limit = 1000 } = req.query;

    if (!isSupabaseConfigured()) {
      return res.json({ 
        success: true, 
        type: 'FeatureCollection',
        features: [] 
      });
    }

    let query = supabase
      .from('storm_events')
      .select('id, event_id, latitude, longitude, begin_lat, begin_lon, end_lat, end_lon, magnitude, begin_date_time, location, county')
      .eq('event_type', 'Hail')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('begin_date_time', { ascending: false })
      .limit(parseInt(limit));

    if (startDate) query = query.gte('begin_date_time', startDate);
    if (endDate) query = query.lte('begin_date_time', endDate);
    if (minSize) query = query.gte('magnitude', parseFloat(minSize));
    if (county) query = query.ilike('county', `%${county}%`);

    const { data, error } = await query;

    if (error) throw error;

    // Convert to GeoJSON FeatureCollection
    const features = (data || [])
      .filter(event => {
        const beginLat = event.begin_lat || event.latitude;
        const beginLon = event.begin_lon || event.longitude;
        const endLat = event.end_lat || event.latitude;
        const endLon = event.end_lon || event.longitude;
        
        // Only include if there's actual path data (different start/end points)
        return beginLat && beginLon && (
          beginLat !== endLat || beginLon !== endLon
        );
      })
      .map(event => {
        const beginLat = event.begin_lat || event.latitude;
        const beginLon = event.begin_lon || event.longitude;
        const endLat = event.end_lat || event.latitude;
        const endLon = event.end_lon || event.longitude;
        const magnitude = parseFloat(event.magnitude) || 1;
        
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [parseFloat(beginLon), parseFloat(beginLat)],
              [parseFloat(endLon), parseFloat(endLat)]
            ]
          },
          properties: {
            id: event.id,
            event_id: event.event_id,
            magnitude: magnitude,
            event_date: event.begin_date_time,
            location: event.location,
            county: event.county,
            width_miles: Math.max(0.5, magnitude * 0.5), // Width based on hail size
            severity: getSeverity(magnitude)
          }
        };
      });

    res.json({
      success: true,
      type: 'FeatureCollection',
      features: features,
      count: features.length
    });

  } catch (error) {
    console.error('Error fetching storm paths:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/heatmap - Get heatmap data (weighted points)
// ============================================================================
router.get('/heatmap', async (req, res) => {
  try {
    const { startDate, endDate, minSize, county, limit = 5000 } = req.query;

    if (!isSupabaseConfigured()) {
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    let query = supabase
      .from('storm_events')
      .select('latitude, longitude, magnitude')
      .eq('event_type', 'Hail')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('begin_date_time', { ascending: false })
      .limit(parseInt(limit));

    if (startDate) query = query.gte('begin_date_time', startDate);
    if (endDate) query = query.lte('begin_date_time', endDate);
    if (minSize) query = query.gte('magnitude', parseFloat(minSize));
    if (county) query = query.ilike('county', `%${county}%`);

    const { data, error } = await query;

    if (error) throw error;

    // Convert to heatmap format: [lat, lng, intensity]
    // Intensity is normalized based on hail size (0.0 - 1.0)
    const heatmapData = (data || [])
      .filter(event => event.latitude && event.longitude)
      .map(event => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        const magnitude = parseFloat(event.magnitude) || 0.5;
        
        // Normalize intensity: 0.5" = 0.2, 2.5" = 1.0
        const intensity = Math.min(1, Math.max(0.2, magnitude / 2.5));
        
        return [lat, lng, intensity];
      });

    res.json({
      success: true,
      data: heatmapData,
      count: heatmapData.length
    });

  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/hail/:id - Get single hail event
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('storm_events')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Hail report not found' });
        }
        throw error;
      }

      res.json({ success: true, data: transformStormEvent(data) });
    } else {
      res.status(404).json({ error: 'Hail report not found' });
    }
  } catch (error) {
    console.error('Error fetching hail event:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
