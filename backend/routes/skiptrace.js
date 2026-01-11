import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

/**
 * GET /api/skiptrace/status
 * Check if skip trace API is configured
 */
router.get('/status', (req, res) => {
  const isMockMode = !process.env.TLOXP_API_KEY;
  res.json({
    success: true,
    configured: !isMockMode,
    provider: isMockMode ? 'mock' : 'TLOxp',
    message: isMockMode 
      ? 'Skip trace is in demo mode. Configure TLOXP_API_KEY for real data.'
      : 'Skip trace API is configured and ready.'
  });
});

/**
 * POST /api/skiptrace/single
 * Single address lookup (used by skip-trace page)
 */
router.post('/single', async (req, res) => {
  try {
    const { address, leadId } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    // Check if TLOxp API is configured
    const TLOXP_API_KEY = process.env.TLOXP_API_KEY;
    const isMockMode = !TLOXP_API_KEY;
    
    let result;
    
    if (isMockMode) {
      // Generate realistic mock data based on the address
      const mockPhone = `(608) ${Math.floor(200 + Math.random() * 700)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockEmail = 'property.owner@email.com';
      
      result = {
        id: `mock-${Date.now()}`,
        address,
        status: 'success',
        owner_name: 'Property Owner',
        phones: [
          { number: mockPhone, type: 'mobile', confidence: 85 }
        ],
        emails: [
          { address: mockEmail, confidence: 75 }
        ],
        property_info: {
          property_type: 'Single Family',
          year_built: 1990 + Math.floor(Math.random() * 30),
          square_feet: 1500 + Math.floor(Math.random() * 1500),
          estimated_value: 200000 + Math.floor(Math.random() * 300000)
        },
        confidence_score: Math.floor(70 + Math.random() * 25),
        is_mock: true,
        created_at: new Date().toISOString()
      };
      
      console.log('⚠️ Skip trace using MOCK DATA - Set TLOXP_API_KEY for real data');
    } else {
      // Real API call - similar to the main endpoint
      try {
        const response = await fetch(`${process.env.TLOXP_API_URL || 'https://api.tloxp.com/v1'}/skiptrace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TLOXP_API_KEY}`
          },
          body: JSON.stringify({ address })
        });
        
        if (!response.ok) {
          throw new Error(`TLOxp API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        result = {
          id: data.id || `tlo-${Date.now()}`,
          address,
          status: data.found ? 'success' : 'not_found',
          owner_name: data.owner_name,
          phones: (data.phones || []).map(p => ({
            number: p.number,
            type: p.type,
            confidence: p.confidence || 80
          })),
          emails: (data.emails || []).map(e => ({
            address: e.address,
            confidence: e.confidence || 70
          })),
          property_info: data.property_info || {},
          confidence_score: data.confidence_score || 0,
          is_mock: false,
          created_at: new Date().toISOString()
        };
      } catch (apiError) {
        console.error('TLOxp API error:', apiError);
        return res.status(502).json({ 
          error: 'Skip trace provider unavailable', 
          details: apiError.message 
        });
      }
    }
    
    // Store in database if configured
    if (isSupabaseConfigured()) {
      const { data: saved, error } = await supabase
        .from('skip_trace_results')
        .insert({
          lead_id: leadId || null,
          property_address: address,
          status: 'completed',
          phones: result.phones,
          emails: result.emails,
          owner_info: { name: result.owner_name },
          property_info: result.property_info,
          confidence_score: result.confidence_score,
          source: result.is_mock ? 'Mock' : 'TLOxp',
          searched_at: result.created_at
        })
        .select()
        .single();
      
      if (!error && saved) {
        result.id = saved.id;
      }
    }
    
    res.json({
      success: true,
      is_mock: result.is_mock,
      data: result
    });
    
  } catch (error) {
    console.error('Error in single skip trace:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/skiptrace/history
 * Get skip trace history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    if (!isSupabaseConfigured()) {
      return res.json({ success: true, data: [] });
    }
    
    const { data, error } = await supabase
      .from('skip_trace_results')
      .select('*')
      .order('searched_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (error) throw error;
    
    // Transform to match expected format
    const results = (data || []).map(r => ({
      id: r.id,
      lead_id: r.lead_id,
      address: r.property_address,
      status: r.phones?.length > 0 || r.emails?.length > 0 ? 'success' : 'not_found',
      owner_name: r.owner_info?.name || 'Unknown',
      phones: r.phones || [],
      emails: r.emails || [],
      property_info: r.property_info || {},
      created_at: r.searched_at || r.created_at
    }));
    
    res.json({ success: true, data: results });
    
  } catch (error) {
    console.error('Error fetching skip trace history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/skiptrace
router.post('/', async (req, res) => {
  try {
    const { leadId, lead_id, propertyAddress, property_address, name } = req.body;
    
    const leadIdValue = leadId || lead_id;
    const address = propertyAddress || property_address;
    
    if (!leadIdValue && !address) {
      return res.status(400).json({ error: 'leadId or propertyAddress required' });
    }
    
    // Check if TLOxp API is configured
    const TLOXP_API_KEY = process.env.TLOXP_API_KEY;
    const isMockMode = !TLOXP_API_KEY;
    
    let result;
    
    if (isMockMode) {
      // Generate realistic mock data based on the provided info
      const ownerName = name || 'Property Owner';
      const mockPhone = `(608) ${Math.floor(200 + Math.random() * 700)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockEmail = ownerName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '') + '@gmail.com';
      
      result = {
        status: 'completed',
        is_mock: true, // Important: indicate this is mock data
        phones: [
          { number: mockPhone, type: 'mobile', verified: true }
        ],
        emails: [
          { address: mockEmail, type: 'personal', verified: true }
        ],
        owner_info: {
          name: ownerName,
          current_address: address || 'Unknown',
          ownership_type: 'probable_owner',
          length_of_residence: '3-7 years'
        },
        property_info: {
          assessed_value: Math.floor(200000 + Math.random() * 300000),
          last_sale_date: `${2015 + Math.floor(Math.random() * 8)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-15`,
          square_footage: Math.floor(1500 + Math.random() * 1500),
          year_built: 1980 + Math.floor(Math.random() * 35)
        },
        confidence_score: Math.floor(60 + Math.random() * 30),
        source: 'Mock Data (API Not Configured)',
        searched_at: new Date().toISOString()
      };
      
      console.log('⚠️ Skip trace using MOCK DATA - Set TLOXP_API_KEY for real data');
    } else {
      // Real API call to TLOxp
      try {
        const response = await fetch(`${process.env.TLOXP_API_URL || 'https://api.tloxp.com/v1'}/skiptrace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TLOXP_API_KEY}`
          },
          body: JSON.stringify({ address, name })
        });
        
        if (!response.ok) {
          throw new Error(`TLOxp API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        result = {
          status: 'completed',
          is_mock: false,
          phones: data.phones || [],
          emails: data.emails || [],
          owner_info: {
            name: data.owner_name || name,
            current_address: address,
            ownership_type: data.ownership_type || 'confirmed',
            length_of_residence: data.residence_duration || 'Unknown'
          },
          property_info: data.property_info || {},
          confidence_score: data.confidence_score || 0,
          source: 'TLOxp',
          searched_at: new Date().toISOString()
        };
      } catch (apiError) {
        console.error('TLOxp API error:', apiError);
        return res.status(502).json({ 
          error: 'Skip trace provider unavailable', 
          details: apiError.message 
        });
      }
    }
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('skip_trace_results')
        .insert({
          lead_id: leadIdValue || null,
          property_address: address,
          status: 'completed',
          phones: result.phones,
          emails: result.emails,
          owner_info: result.owner_info,
          property_info: result.property_info,
          confidence_score: result.confidence_score,
          source: result.source,
          searched_at: result.searched_at
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'skiptrace',
        entity_id: data.id,
        action: 'skiptrace_completed',
        description: `Skip trace completed for ${address || 'lead'}`,
        metadata: { confidence_score: result.confidence_score, is_mock: result.is_mock }
      });
      
      res.json({ 
        success: true, 
        is_mock: result.is_mock,
        data: { ...data, is_mock: result.is_mock }
      });
    } else {
      res.json({ 
        success: true, 
        is_mock: result.is_mock,
        data: { 
          id: `${Date.now()}`,
          ...result 
        } 
      });
    }
  } catch (error) {
    console.error('Error processing skip trace:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/skiptrace/batch
router.post('/batch', async (req, res) => {
  try {
    const { leadIds, lead_ids } = req.body;
    const ids = leadIds || lead_ids;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'leadIds array required' });
    }
    
    const batchId = `batch-${Date.now()}`;
    
    if (isSupabaseConfigured()) {
      // Create pending skip trace records for each lead
      const records = ids.map((leadId, index) => ({
        lead_id: leadId,
        status: 'pending',
        batch_id: batchId,
        source: 'TLOxp'
      }));
      
      const { data, error } = await supabase
        .from('skip_trace_results')
        .insert(records)
        .select();
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'skiptrace',
        action: 'batch_started',
        description: `Batch skip trace started: ${ids.length} leads`,
        metadata: { batch_id: batchId, count: ids.length }
      });
      
      res.json({
        success: true,
        batchId,
        total: ids.length,
        queued: ids.length,
        estimatedTime: Math.ceil(ids.length * 0.5),
        data: data.map((record, index) => ({
          id: record.id,
          leadId: record.lead_id,
          status: 'queued',
          position: index + 1
        }))
      });
    } else {
      res.json({
        success: true,
        batchId,
        total: ids.length,
        queued: ids.length,
        estimatedTime: Math.ceil(ids.length * 0.5),
        data: ids.map((id, index) => ({
          leadId: id,
          status: 'queued',
          position: index + 1,
          estimatedCompletion: new Date(Date.now() + (index + 1) * 30000).toISOString()
        }))
      });
    }
  } catch (error) {
    console.error('Error processing batch skip trace:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skiptrace/batch/:id
router.get('/batch/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('skip_trace_results')
        .select('*')
        .eq('batch_id', req.params.id);
      
      if (error) throw error;
      
      const completed = data.filter(r => r.status === 'completed').length;
      const failed = data.filter(r => r.status === 'failed').length;
      const pending = data.filter(r => r.status === 'pending' || r.status === 'processing').length;
      
      res.json({
        success: true,
        batchId: req.params.id,
        status: pending === 0 ? 'completed' : 'processing',
        progress: data.length > 0 ? Math.round((completed / data.length) * 100) : 0,
        completed,
        failed,
        remaining: pending,
        total: data.length,
        results: data
      });
    } else {
      const progress = Math.floor(Math.random() * 100);
      res.json({
        success: true,
        batchId: req.params.id,
        status: progress < 100 ? 'processing' : 'completed',
        progress,
        completed: Math.floor(Math.random() * 50),
        failed: 0,
        remaining: Math.floor(Math.random() * 50)
      });
    }
  } catch (error) {
    console.error('Error fetching batch status:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skiptrace/lead/:leadId
router.get('/lead/:leadId', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('skip_trace_results')
        .select('*')
        .eq('lead_id', req.params.leadId)
        .order('searched_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'No skip trace results found for this lead' });
        }
        throw error;
      }
      
      res.json({ success: true, data });
    } else {
      res.status(404).json({ error: 'No skip trace results found for this lead' });
    }
  } catch (error) {
    console.error('Error fetching skip trace for lead:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
