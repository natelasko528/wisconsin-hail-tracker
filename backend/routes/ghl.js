import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// In-memory fallback
let GHL_SYNC_LOGS = [];

// POST /api/ghl/sync/contact - Sync contact to GHL
router.post('/sync/contact', async (req, res) => {
  try {
    const { leadId, lead_id, contact } = req.body;
    const leadIdValue = leadId || lead_id;
    
    // Simulate GHL API call
    const ghlContactId = `ghl-${Date.now()}`;
    const syncedContact = {
      ghl_contact_id: ghlContactId,
      ...contact,
      synced_at: new Date().toISOString(),
      location_id: process.env.GHL_LOCATION_ID || 'default'
    };
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ghl_sync_log')
        .insert({
          lead_id: leadIdValue,
          ghl_contact_id: ghlContactId,
          action: 'sync_contact',
          status: 'success',
          location_id: syncedContact.location_id,
          request_data: contact,
          response_data: syncedContact
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Contact synced to GoHighLevel',
        data: { ...syncedContact, id: data.id }
      });
    } else {
      GHL_SYNC_LOGS.push({
        id: `${Date.now()}`,
        action: 'sync_contact',
        lead_id: leadIdValue,
        ghl_contact_id: ghlContactId,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      
      res.json({
        success: true,
        message: 'Contact synced to GoHighLevel',
        data: syncedContact
      });
    }
  } catch (error) {
    console.error('Error syncing contact to GHL:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ghl/sync/batch - Batch sync leads to GHL
router.post('/sync/batch', async (req, res) => {
  try {
    const { leadIds, lead_ids } = req.body;
    const ids = leadIds || lead_ids;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'leadIds array required' });
    }
    
    const results = ids.map(id => ({
      lead_id: id,
      status: 'synced',
      ghl_contact_id: `ghl-${Date.now()}-${id}`,
      timestamp: new Date().toISOString()
    }));
    
    if (isSupabaseConfigured()) {
      const syncLogs = results.map(r => ({
        lead_id: r.lead_id,
        ghl_contact_id: r.ghl_contact_id,
        action: 'batch_sync',
        status: 'success',
        location_id: process.env.GHL_LOCATION_ID || 'default'
      }));
      
      const { error } = await supabase
        .from('ghl_sync_log')
        .insert(syncLogs);
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'ghl',
        action: 'batch_sync_completed',
        description: `Batch GHL sync completed: ${ids.length} contacts`,
        metadata: { synced_count: ids.length }
      });
    }
    
    res.json({
      success: true,
      synced: results.length,
      failed: 0,
      data: results
    });
  } catch (error) {
    console.error('Error batch syncing to GHL:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ghl/sync/logs - Get sync logs
router.get('/sync/logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    if (isSupabaseConfigured()) {
      const { data, error, count } = await supabase
        .from('ghl_sync_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (error) throw error;
      
      res.json({ success: true, count: count || data.length, data });
    } else {
      res.json({ success: true, count: GHL_SYNC_LOGS.length, data: GHL_SYNC_LOGS });
    }
  } catch (error) {
    console.error('Error fetching GHL sync logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ghl/webhook - Handle GHL webhooks
router.post('/webhook', async (req, res) => {
  try {
    const { event, contact, data } = req.body;
    
    if (isSupabaseConfigured()) {
      await supabase.from('ghl_sync_log').insert({
        ghl_contact_id: contact?.id || data?.contactId,
        action: `webhook_${event}`,
        status: 'received',
        request_data: req.body
      });
    } else {
      GHL_SYNC_LOGS.push({
        id: `${Date.now()}`,
        source: 'ghl_webhook',
        event,
        contact_id: contact?.id,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing GHL webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ghl/status - Get GHL integration status
router.get('/status', async (req, res) => {
  try {
    const isConfigured = Boolean(
      process.env.GHL_API_KEY && 
      process.env.GHL_LOCATION_ID
    );
    
    let syncStats = { total: 0, successful: 0, failed: 0 };
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ghl_sync_log')
        .select('status');
      
      if (!error && data) {
        syncStats = {
          total: data.length,
          successful: data.filter(l => l.status === 'success').length,
          failed: data.filter(l => l.status === 'failed').length
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        locationId: process.env.GHL_LOCATION_ID || null,
        syncStats,
        lastSync: syncStats.total > 0 ? new Date().toISOString() : null
      }
    });
  } catch (error) {
    console.error('Error fetching GHL status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
