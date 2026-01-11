/**
 * Properties API Routes
 * Handles property discovery, listing, and management
 */

import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import propertyDiscovery from '../services/propertyDiscovery.js';

const router = express.Router();

/**
 * GET /api/properties
 * List properties with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    const {
      search,
      city,
      county,
      zip_code,
      min_damage_prob,
      storm_event_id,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    let query = supabase
      .from('properties')
      .select(`
        *,
        storm_property_impacts (
          storm_event_id,
          distance_miles,
          damage_probability,
          priority_score
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`street_address.ilike.%${search}%,city.ilike.%${search}%,zip_code.ilike.%${search}%`);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (county) {
      query = query.ilike('county', `%${county}%`);
    }
    if (zip_code) {
      query = query.eq('zip_code', zip_code);
    }
    
    // Sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });
    
    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Transform to include formatted address
    const properties = (data || []).map(p => ({
      ...p,
      formatted_address: `${p.street_address}\n${p.city}, ${p.state} ${p.zip_code || ''}`.trim(),
      address_line: `${p.street_address}, ${p.city}, ${p.state} ${p.zip_code || ''}`.trim()
    }));
    
    res.json({
      success: true,
      count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: properties
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/properties/:id
 * Get single property with all details
 */
router.get('/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        storm_property_impacts (
          *,
          storm_events:storm_event_id (
            event_id,
            magnitude,
            begin_date_time,
            location,
            county
          )
        ),
        leads (
          id,
          stage,
          status,
          owner_name,
          owner_phone,
          owner_email
        )
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Property not found' });
      }
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        ...data,
        formatted_address: `${data.street_address}\n${data.city}, ${data.state} ${data.zip_code || ''}`.trim()
      }
    });
    
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties
 * Create a new property
 */
router.post('/', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    const {
      street_address,
      city,
      state = 'WI',
      zip_code,
      county,
      latitude,
      longitude,
      owner_name,
      property_type = 'residential',
      roof_type,
      roof_age_years,
      year_built
    } = req.body;
    
    if (!street_address || !city) {
      return res.status(400).json({ error: 'street_address and city are required' });
    }
    
    const { data, error } = await supabase
      .from('properties')
      .insert({
        street_address,
        city,
        state,
        zip_code,
        county,
        latitude,
        longitude,
        owner_name,
        property_type,
        roof_type,
        roof_age_years,
        year_built,
        data_source: 'manual'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/properties/:id
 * Update property
 */
router.put('/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties/discover
 * Discover properties near storm events
 */
router.post('/discover', async (req, res) => {
  try {
    const { storm_event_ids, radius_miles = 5, max_properties = 100 } = req.body;
    
    if (!storm_event_ids || !Array.isArray(storm_event_ids) || storm_event_ids.length === 0) {
      return res.status(400).json({ error: 'storm_event_ids array is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const stormId of storm_event_ids) {
      try {
        const result = await propertyDiscovery.discoverPropertiesNearStorm(
          stormId,
          radius_miles,
          max_properties
        );
        results.push({ storm_event_id: stormId, ...result });
      } catch (err) {
        errors.push({ storm_event_id: stormId, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${storm_event_ids.length} storm events`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error discovering properties:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties/create-leads
 * Create leads from discovered properties
 */
router.post('/create-leads', async (req, res) => {
  try {
    const { 
      storm_event_id, 
      min_damage_probability = 0.3,
      limit = 100 
    } = req.body;
    
    if (!storm_event_id) {
      return res.status(400).json({ error: 'storm_event_id is required' });
    }
    
    const result = await propertyDiscovery.createLeadsFromProperties(
      storm_event_id,
      min_damage_probability,
      limit
    );
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error creating leads from properties:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/properties/geocode
 * Geocode an address
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address, latitude, longitude } = req.body;
    
    if (latitude && longitude) {
      // Reverse geocode
      const result = await propertyDiscovery.reverseGeocode(latitude, longitude);
      
      if (!result) {
        return res.status(404).json({ error: 'Could not geocode coordinates' });
      }
      
      res.json({
        success: true,
        data: result
      });
    } else if (address) {
      // Forward geocode
      const results = await propertyDiscovery.searchAddress(address);
      
      res.json({
        success: true,
        data: results
      });
    } else {
      res.status(400).json({ error: 'Provide either address or latitude/longitude' });
    }
    
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/properties/search/radius
 * Search properties within radius of a point
 */
router.get('/search/radius', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    const { latitude, longitude, radius_miles = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    
    // Use PostGIS function for radius search
    const { data, error } = await supabase.rpc('find_properties_in_radius', {
      center_lat: parseFloat(latitude),
      center_lon: parseFloat(longitude),
      radius_miles: parseFloat(radius_miles)
    });
    
    if (error) throw error;
    
    res.json({
      success: true,
      center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      radius_miles: parseFloat(radius_miles),
      count: data?.length || 0,
      data
    });
    
  } catch (error) {
    console.error('Error searching properties by radius:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/properties/stats
 * Get property statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({
        success: true,
        data: {
          total: 0,
          by_city: {},
          by_county: {},
          with_damage_assessment: 0
        }
      });
    }
    
    // Get total count
    const { count: total } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    // Get counts by city
    const { data: cityData } = await supabase
      .from('properties')
      .select('city')
      .not('city', 'is', null);
    
    const byCity = (cityData || []).reduce((acc, { city }) => {
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    
    // Get counts by county
    const { data: countyData } = await supabase
      .from('properties')
      .select('county')
      .not('county', 'is', null);
    
    const byCounty = (countyData || []).reduce((acc, { county }) => {
      acc[county] = (acc[county] || 0) + 1;
      return acc;
    }, {});
    
    // Get count with damage assessment
    const { count: withDamage } = await supabase
      .from('storm_property_impacts')
      .select('*', { count: 'exact', head: true })
      .gt('damage_probability', 0);
    
    res.json({
      success: true,
      data: {
        total: total || 0,
        by_city: byCity,
        by_county: byCounty,
        with_damage_assessment: withDamage || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
