import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// Fallback sample hail data for development
const SAMPLE_HAIL_DATA = [
  { id: '1', event_date: '2024-06-15T14:30:00Z', city: 'Madison', county: 'Dane', latitude: 43.0731, longitude: -89.4012, hail_size: 2.5, severity: 'high', wind_speed: 60 },
  { id: '2', event_date: '2024-07-22T16:45:00Z', city: 'Green Bay', county: 'Brown', latitude: 44.5233, longitude: -87.9105, hail_size: 1.75, severity: 'medium', wind_speed: 45 },
  { id: '3', event_date: '2024-08-03T12:15:00Z', city: 'Reedsburg', county: 'Sauk', latitude: 43.5324, longitude: -90.0026, hail_size: 3.0, severity: 'critical', wind_speed: 70 },
  { id: '4', event_date: '2024-05-10T18:20:00Z', city: 'Appleton', county: 'Outagamie', latitude: 44.2619, longitude: -88.4154, hail_size: 2.0, severity: 'high', wind_speed: 55 },
  { id: '5', event_date: '2023-09-18T15:00:00Z', city: 'La Crosse', county: 'La Crosse', latitude: 43.7925, longitude: -91.2408, hail_size: 1.5, severity: 'medium', wind_speed: 40 }
];

// Helper to determine severity from magnitude
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
    event_date: event.begin_date_time,
    city: event.location || 'Unknown',
    county: event.county,
    state: event.state || 'WI',
    latitude: parseFloat(event.latitude),
    longitude: parseFloat(event.longitude),
    hail_size: parseFloat(event.magnitude) || 0,
    severity: getSeverity(parseFloat(event.magnitude) || 0),
    wind_speed: null,
    source: event.data_source || 'NOAA',
    narrative: event.event_narrative
  };
}

// GET /api/hail - Fetch hail reports with filters
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
      
      // Transform and filter by severity if needed
      let transformed = (data || []).map(transformStormEvent);
      if (severity) {
        transformed = transformed.filter(h => h.severity === severity);
      }
      
      res.json({ success: true, count: count || transformed.length, data: transformed });
    } else {
      // Fallback
      let filtered = [...SAMPLE_HAIL_DATA];
      if (startDate) filtered = filtered.filter(h => new Date(h.event_date) >= new Date(startDate));
      if (endDate) filtered = filtered.filter(h => new Date(h.event_date) <= new Date(endDate));
      if (minSize) filtered = filtered.filter(h => h.hail_size >= parseFloat(minSize));
      if (county) filtered = filtered.filter(h => h.county.toLowerCase().includes(county.toLowerCase()));
      if (severity) filtered = filtered.filter(h => h.severity === severity);
      
      res.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching hail events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hail/stats
router.get('/stats', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data: events, error } = await supabase
        .from('storm_events')
        .select('magnitude, county')
        .eq('event_type', 'Hail');
      
      if (error) throw error;
      
      const transformedEvents = (events || []).map(e => ({
        hail_size: parseFloat(e.magnitude) || 0,
        severity: getSeverity(parseFloat(e.magnitude) || 0),
        county: e.county
      }));
      
      const stats = {
        totalReports: transformedEvents.length,
        averageSize: transformedEvents.length > 0 
          ? (transformedEvents.reduce((sum, h) => sum + h.hail_size, 0) / transformedEvents.length).toFixed(2)
          : 0,
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
      // Fallback
      const stats = {
        totalReports: SAMPLE_HAIL_DATA.length,
        averageSize: (SAMPLE_HAIL_DATA.reduce((sum, h) => sum + h.hail_size, 0) / SAMPLE_HAIL_DATA.length).toFixed(2),
        severityBreakdown: {
          critical: SAMPLE_HAIL_DATA.filter(h => h.severity === 'critical').length,
          high: SAMPLE_HAIL_DATA.filter(h => h.severity === 'high').length,
          medium: SAMPLE_HAIL_DATA.filter(h => h.severity === 'medium').length,
          low: SAMPLE_HAIL_DATA.filter(h => h.severity === 'low').length
        },
        countyBreakdown: SAMPLE_HAIL_DATA.reduce((acc, h) => {
          acc[h.county] = (acc[h.county] || 0) + 1;
          return acc;
        }, {})
      };
      res.json({ success: true, data: stats });
    }
  } catch (error) {
    console.error('Error fetching hail stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hail/counties
router.get('/counties', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('storm_events')
        .select('county')
        .eq('event_type', 'Hail')
        .not('county', 'is', null);
      
      if (error) throw error;
      
      const counties = [...new Set((data || []).map(h => h.county).filter(Boolean))].sort();
      res.json({ success: true, data: counties });
    } else {
      const counties = [...new Set(SAMPLE_HAIL_DATA.map(h => h.county))].sort();
      res.json({ success: true, data: counties });
    }
  } catch (error) {
    console.error('Error fetching counties:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hail/:id
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
      const report = SAMPLE_HAIL_DATA.find(h => h.id === req.params.id);
      if (!report) return res.status(404).json({ error: 'Hail report not found' });
      res.json({ success: true, data: report });
    }
  } catch (error) {
    console.error('Error fetching hail event:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hail - Create new hail event
router.post('/', async (req, res) => {
  try {
    const { event_date, city, county, latitude, longitude, hail_size, severity, wind_speed, source } = req.body;
    
    if (!event_date || !county || !latitude || !longitude || !hail_size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('storm_events')
        .insert({
          event_type: 'Hail',
          begin_date_time: event_date,
          location: city,
          county,
          state: 'WI',
          latitude,
          longitude,
          magnitude: hail_size,
          magnitude_type: 'inches',
          data_source: source || 'Manual Entry'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.status(201).json({ success: true, data: transformStormEvent(data) });
    } else {
      const newEvent = {
        id: `${Date.now()}`,
        event_date,
        city: city || 'Unknown',
        county,
        latitude,
        longitude,
        hail_size,
        severity: severity || getSeverity(hail_size),
        wind_speed: wind_speed || null
      };
      SAMPLE_HAIL_DATA.push(newEvent);
      res.status(201).json({ success: true, data: newEvent });
    }
  } catch (error) {
    console.error('Error creating hail event:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
