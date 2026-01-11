/**
 * Property Discovery Service
 * Discovers properties near storm events using OpenStreetMap and Nominatim
 */

import fetch from 'node-fetch';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import logger from '../config/logger.js';

// API Configuration
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'WisconsinHailCRM/1.0 (contact@example.com)';

// Rate limiting
const RATE_LIMIT_MS = 1100; // Nominatim requires 1 request per second
let lastRequestTime = 0;

/**
 * Wait for rate limit
 */
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Calculate distance between two points in miles using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Reverse geocode coordinates to get street address using Nominatim
 */
export async function reverseGeocode(lat, lng) {
  await waitForRateLimit();
  
  try {
    const url = `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.address) {
      return null;
    }
    
    const addr = data.address;
    
    // Build proper street address
    let streetAddress = '';
    if (addr.house_number && addr.road) {
      streetAddress = `${addr.house_number} ${addr.road}`;
    } else if (addr.road) {
      streetAddress = addr.road;
    } else if (addr.building) {
      streetAddress = addr.building;
    }
    
    // Get city (try multiple fields)
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Unknown';
    
    // Get state
    const state = addr.state_code || addr.state || 'WI';
    
    // Get zip
    const zipCode = addr.postcode || null;
    
    // Get county
    const county = addr.county ? addr.county.replace(' County', '') : null;
    
    return {
      street_address: streetAddress || `Near ${data.display_name?.split(',')[0] || 'Unknown'}`,
      city,
      state: state.length === 2 ? state.toUpperCase() : 'WI',
      zip_code: zipCode,
      county,
      full_address: `${streetAddress}\n${city}, ${state} ${zipCode || ''}`.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      osm_id: data.osm_id?.toString(),
      geocode_accuracy: addr.house_number ? 'rooftop' : 'interpolated',
      raw: data
    };
  } catch (error) {
    logger.error(`Reverse geocode error for ${lat}, ${lng}: ${error.message}`);
    return null;
  }
}

/**
 * Search for addresses by query string using Nominatim
 */
export async function searchAddress(query, limit = 10) {
  await waitForRateLimit();
  
  try {
    const url = `${NOMINATIM_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=${limit}&countrycodes=us`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim search error: ${response.status}`);
    }
    
    const results = await response.json();
    
    return results.map(result => ({
      display_name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      osm_id: result.osm_id?.toString(),
      type: result.type,
      address: result.address
    }));
  } catch (error) {
    logger.error(`Address search error: ${error.message}`);
    return [];
  }
}

/**
 * Query Overpass API for buildings/addresses in a bounding box
 */
export async function findBuildingsInArea(centerLat, centerLng, radiusMiles = 2) {
  // Convert miles to degrees (approximate)
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos(centerLat * Math.PI / 180));
  
  const south = centerLat - latDelta;
  const north = centerLat + latDelta;
  const west = centerLng - lngDelta;
  const east = centerLng + lngDelta;
  
  // Overpass query for buildings with addresses
  const query = `
    [out:json][timeout:60];
    (
      way["building"]["addr:housenumber"](${south},${west},${north},${east});
      node["addr:housenumber"](${south},${west},${north},${east});
    );
    out center body;
  `;
  
  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
      throw new Error(`Overpass error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.elements.map(el => {
      const lat = el.center?.lat || el.lat;
      const lng = el.center?.lon || el.lon;
      const tags = el.tags || {};
      
      return {
        osm_id: el.id.toString(),
        osm_type: el.type,
        latitude: lat,
        longitude: lng,
        street_address: tags['addr:housenumber'] && tags['addr:street'] 
          ? `${tags['addr:housenumber']} ${tags['addr:street']}`
          : null,
        city: tags['addr:city'] || null,
        state: tags['addr:state'] || 'WI',
        zip_code: tags['addr:postcode'] || null,
        building_type: tags['building'],
        distance_miles: calculateDistance(centerLat, centerLng, lat, lng)
      };
    }).filter(b => b.street_address); // Only return buildings with addresses
    
  } catch (error) {
    logger.error(`Overpass query error: ${error.message}`);
    return [];
  }
}

/**
 * Generate sample residential addresses near a point
 * Uses Nominatim reverse geocoding on nearby coordinates
 */
export async function generatePropertiesNearPoint(centerLat, centerLng, radiusMiles = 3, count = 50) {
  const properties = [];
  const processedLocations = new Set();
  
  // Generate random points within radius
  for (let i = 0; i < count * 2 && properties.length < count; i++) {
    // Random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusMiles;
    
    // Calculate offset (approximate)
    const latOffset = (distance / 69) * Math.cos(angle);
    const lngOffset = (distance / (69 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    
    const newLat = centerLat + latOffset;
    const newLng = centerLng + lngOffset;
    
    // Round to avoid duplicates
    const locationKey = `${newLat.toFixed(4)},${newLng.toFixed(4)}`;
    if (processedLocations.has(locationKey)) continue;
    processedLocations.add(locationKey);
    
    // Reverse geocode
    const address = await reverseGeocode(newLat, newLng);
    
    if (address && address.street_address && !address.street_address.startsWith('Near')) {
      address.distance_miles = calculateDistance(centerLat, centerLng, newLat, newLng);
      properties.push(address);
      logger.info(`Found property: ${address.street_address}, ${address.city} (${address.distance_miles.toFixed(2)} mi)`);
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return properties;
}

/**
 * Discover properties near a storm event
 */
export async function discoverPropertiesNearStorm(stormEventId, radiusMiles = 5, maxProperties = 100) {
  if (!isSupabaseConfigured()) {
    throw new Error('Database not configured');
  }
  
  logger.info(`Discovering properties near storm ${stormEventId} within ${radiusMiles} miles`);
  
  // Get storm event
  const { data: stormEvent, error: stormError } = await supabase
    .from('storm_events')
    .select('*')
    .eq('event_id', stormEventId)
    .single();
  
  if (stormError || !stormEvent) {
    throw new Error(`Storm event not found: ${stormEventId}`);
  }
  
  const centerLat = parseFloat(stormEvent.latitude);
  const centerLng = parseFloat(stormEvent.longitude);
  const hailSize = parseFloat(stormEvent.magnitude) || 1.0;
  
  if (!centerLat || !centerLng) {
    throw new Error('Storm event missing coordinates');
  }
  
  // First try Overpass API for existing addresses
  logger.info('Querying Overpass API for existing addresses...');
  let properties = await findBuildingsInArea(centerLat, centerLng, Math.min(radiusMiles, 3));
  
  // If not enough results, use reverse geocoding
  if (properties.length < maxProperties / 2) {
    logger.info('Generating additional properties via reverse geocoding...');
    const additional = await generatePropertiesNearPoint(
      centerLat, 
      centerLng, 
      radiusMiles, 
      maxProperties - properties.length
    );
    properties = [...properties, ...additional];
  }
  
  // Remove duplicates
  const uniqueProperties = Array.from(
    new Map(properties.map(p => [p.street_address?.toLowerCase() + p.zip_code, p])).values()
  );
  
  logger.info(`Found ${uniqueProperties.length} unique properties`);
  
  // Save properties to database and create storm impacts
  const savedProperties = [];
  const impacts = [];
  
  for (const prop of uniqueProperties.slice(0, maxProperties)) {
    try {
      // Check if property already exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('street_address', prop.street_address)
        .eq('city', prop.city)
        .eq('zip_code', prop.zip_code)
        .single();
      
      let propertyId;
      
      if (existing) {
        propertyId = existing.id;
      } else {
        // Insert new property
        const { data: newProperty, error: insertError } = await supabase
          .from('properties')
          .insert({
            street_address: prop.street_address,
            city: prop.city,
            state: prop.state || 'WI',
            zip_code: prop.zip_code,
            county: prop.county || stormEvent.county,
            latitude: prop.latitude,
            longitude: prop.longitude,
            osm_id: prop.osm_id,
            geocode_accuracy: prop.geocode_accuracy || 'approximate',
            data_source: 'osm',
            property_type: 'residential',
            roof_type: 'asphalt_shingle',
            roof_age_years: Math.floor(10 + Math.random() * 15) // Estimate 10-25 years
          })
          .select()
          .single();
        
        if (insertError) {
          logger.error(`Failed to insert property: ${insertError.message}`);
          continue;
        }
        
        propertyId = newProperty.id;
        savedProperties.push(newProperty);
      }
      
      // Calculate damage probability
      const distance = prop.distance_miles || calculateDistance(centerLat, centerLng, prop.latitude, prop.longitude);
      const roofAge = 15; // Default estimate
      const damageProbability = calculateDamageProbability(hailSize, distance, roofAge);
      const priorityScore = calculatePriorityScore(damageProbability, 250000, 0, false);
      
      // Create or update storm impact
      const { data: impact, error: impactError } = await supabase
        .from('storm_property_impacts')
        .upsert({
          storm_event_id: stormEventId,
          property_id: propertyId,
          distance_miles: distance,
          hail_size_at_location: Math.max(0, hailSize - (distance * 0.1)),
          damage_probability: damageProbability,
          priority_score: priorityScore,
          priority_factors: {
            hail_size: hailSize,
            distance_miles: distance,
            roof_age_estimate: roofAge,
            base_probability: damageProbability
          }
        }, {
          onConflict: 'storm_event_id,property_id'
        })
        .select()
        .single();
      
      if (!impactError) {
        impacts.push(impact);
      }
      
    } catch (err) {
      logger.error(`Error processing property: ${err.message}`);
    }
  }
  
  logger.info(`Saved ${savedProperties.length} new properties, ${impacts.length} storm impacts`);
  
  return {
    stormEvent,
    propertiesFound: uniqueProperties.length,
    propertiesSaved: savedProperties.length,
    impactsCreated: impacts.length,
    properties: savedProperties.slice(0, 10), // Return first 10 as sample
    impacts: impacts.slice(0, 10)
  };
}

/**
 * Calculate damage probability based on multiple factors
 */
export function calculateDamageProbability(hailSize, distanceMiles, roofAgeYears = 15, roofType = 'asphalt_shingle') {
  // Base probability from hail size
  let baseProbability;
  if (hailSize >= 2.5) baseProbability = 0.95;
  else if (hailSize >= 2.0) baseProbability = 0.85;
  else if (hailSize >= 1.5) baseProbability = 0.70;
  else if (hailSize >= 1.0) baseProbability = 0.50;
  else if (hailSize >= 0.75) baseProbability = 0.30;
  else baseProbability = 0.15;
  
  // Distance decay (probability decreases with distance)
  const distanceFactor = Math.max(0.3, 1.0 - (distanceMiles * 0.1));
  
  // Roof age factor (older roofs more vulnerable)
  let ageFactor;
  if (roofAgeYears >= 20) ageFactor = 1.3;
  else if (roofAgeYears >= 15) ageFactor = 1.2;
  else if (roofAgeYears >= 10) ageFactor = 1.1;
  else if (roofAgeYears >= 5) ageFactor = 1.0;
  else ageFactor = 0.9;
  
  // Roof type factor
  const typeFactors = {
    'asphalt_shingle': 1.2,
    'wood': 1.3,
    'metal': 0.7,
    'tile': 0.8,
    'flat': 1.0
  };
  const typeFactor = typeFactors[roofType] || 1.0;
  
  // Calculate final probability (capped at 0.99)
  return Math.min(0.99, baseProbability * distanceFactor * ageFactor * typeFactor);
}

/**
 * Calculate lead priority score
 */
export function calculatePriorityScore(damageProbability, propertyValue = 250000, daysSinceStorm = 0, hasPhone = false) {
  // Base score from damage probability (0-40 points)
  let score = Math.floor(damageProbability * 40);
  
  // Property value factor (0-20 points)
  score += Math.min(20, Math.floor(propertyValue / 25000));
  
  // Recency factor (0-25 points, more recent = higher)
  score += Math.max(0, 25 - daysSinceStorm);
  
  // Contact info bonus (0-15 points)
  if (hasPhone) {
    score += 15;
  }
  
  return Math.min(100, Math.max(1, score));
}

/**
 * Create leads from discovered properties
 */
export async function createLeadsFromProperties(stormEventId, minDamageProbability = 0.3, limit = 100) {
  if (!isSupabaseConfigured()) {
    throw new Error('Database not configured');
  }
  
  // Get high-probability impacts
  const { data: impacts, error: impactError } = await supabase
    .from('storm_property_impacts')
    .select(`
      *,
      properties (*)
    `)
    .eq('storm_event_id', stormEventId)
    .gte('damage_probability', minDamageProbability)
    .order('priority_score', { ascending: false })
    .limit(limit);
  
  if (impactError) {
    throw new Error(`Failed to fetch impacts: ${impactError.message}`);
  }
  
  const createdLeads = [];
  
  for (const impact of impacts || []) {
    const property = impact.properties;
    
    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('property_id', property.id)
      .eq('storm_impact_id', impact.id)
      .single();
    
    if (existingLead) continue;
    
    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        property_id: property.id,
        storm_impact_id: impact.id,
        property_address: property.street_address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code,
        county: property.county,
        owner_name: property.owner_name || 'Property Owner',
        hail_size: impact.hail_size_at_location,
        storm_date: new Date().toISOString().split('T')[0],
        damage_probability: impact.damage_probability,
        priority_score: impact.priority_score,
        stage: 'new',
        status: 'open',
        source: 'storm_discovery',
        ai_insights: {
          damage_probability: impact.damage_probability,
          distance_from_storm: impact.distance_miles,
          priority_factors: impact.priority_factors
        }
      })
      .select(`
        *,
        properties (*)
      `)
      .single();
    
    if (!leadError && lead) {
      createdLeads.push(lead);
      
      // Log activity
      await supabase.from('activities').insert({
        lead_id: lead.id,
        type: 'status_change',
        description: `Lead created from storm event ${stormEventId}`,
        metadata: {
          storm_event_id: stormEventId,
          damage_probability: impact.damage_probability,
          distance_miles: impact.distance_miles
        }
      });
    }
  }
  
  logger.info(`Created ${createdLeads.length} leads from storm ${stormEventId}`);
  
  return {
    leadsCreated: createdLeads.length,
    leads: createdLeads
  };
}

export default {
  reverseGeocode,
  searchAddress,
  findBuildingsInArea,
  generatePropertiesNearPoint,
  discoverPropertiesNearStorm,
  calculateDamageProbability,
  calculatePriorityScore,
  createLeadsFromProperties
};
