import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// POST /api/skiptrace
router.post('/', async (req, res) => {
  try {
    const { leadId, lead_id, propertyAddress, property_address, name } = req.body;
    
    const leadIdValue = leadId || lead_id;
    const address = propertyAddress || property_address;
    
    if (!leadIdValue && !address) {
      return res.status(400).json({ error: 'leadId or propertyAddress required' });
    }
    
    // Simulate skip trace result (in production, call TLO or similar API)
    const result = {
      status: 'completed',
      phones: [
        { number: '(555) 123-4567', type: 'mobile', verified: true },
        { number: '(555) 987-6543', type: 'home', verified: false }
      ],
      emails: [
        { address: 'homeowner@email.com', type: 'personal', verified: true }
      ],
      owner_info: {
        name: name || 'John Smith',
        current_address: address || 'Unknown',
        ownership_type: 'confirmed',
        length_of_residence: '5-10 years'
      },
      property_info: {
        assessed_value: 350000,
        last_sale_date: '2019-05-15',
        square_footage: 2150,
        year_built: 1995
      },
      confidence_score: 92,
      source: 'TLOxp',
      searched_at: new Date().toISOString()
    };
    
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
        metadata: { confidence_score: result.confidence_score }
      });
      
      res.json({ success: true, data });
    } else {
      res.json({ 
        success: true, 
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
