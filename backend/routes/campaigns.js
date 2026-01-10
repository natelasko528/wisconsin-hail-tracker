import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// Fallback in-memory campaigns
let CAMPAIGNS_DB = [
  {
    id: '1',
    name: 'June Hail Storm - Madison Area',
    type: 'email',
    status: 'active',
    leads_count: 45,
    stats: { sent: 45, opened: 28, clicked: 12, bounced: 2, delivered: 43 },
    template: { subject: 'Hail Damage Assessment', body: 'Dear {{name}}, we detected significant hail activity...' },
    created_at: '2024-06-17T08:00:00Z'
  }
];

// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;
    
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      res.json({ success: true, count: count || data.length, data });
    } else {
      let filtered = [...CAMPAIGNS_DB];
      if (type) filtered = filtered.filter(c => c.type === type);
      if (status) filtered = filtered.filter(c => c.status === status);
      res.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_leads (
            lead_id,
            status,
            sent_at,
            opened_at,
            clicked_at
          )
        `)
        .eq('id', req.params.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Campaign not found' });
        }
        throw error;
      }
      
      res.json({ success: true, data });
    } else {
      const campaign = CAMPAIGNS_DB.find(c => c.id === req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      res.json({ success: true, data: campaign });
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns
router.post('/', async (req, res) => {
  try {
    const { name, type, leads, template, scheduled_for, scheduledFor } = req.body;
    
    if (!name || !type || !template) {
      return res.status(400).json({ error: 'Name, type, and template are required' });
    }
    
    const scheduledTime = scheduled_for || scheduledFor;
    
    const newCampaign = {
      name,
      type,
      status: scheduledTime ? 'scheduled' : 'draft',
      leads_count: Array.isArray(leads) ? leads.length : 0,
      template,
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 },
      scheduled_for: scheduledTime || null
    };
    
    if (isSupabaseConfigured()) {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(newCampaign)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add leads to campaign if provided
      if (Array.isArray(leads) && leads.length > 0) {
        const campaignLeads = leads.map(leadId => ({
          campaign_id: campaign.id,
          lead_id: leadId,
          status: 'pending'
        }));
        
        await supabase.from('campaign_leads').insert(campaignLeads);
      }
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'campaign',
        entity_id: campaign.id,
        action: 'campaign_created',
        description: `Campaign "${name}" created`,
        metadata: { type, leads_count: newCampaign.leads_count }
      });
      
      res.status(201).json({ success: true, data: campaign });
    } else {
      const campaign = {
        ...newCampaign,
        id: `${Date.now()}`,
        created_at: new Date().toISOString()
      };
      CAMPAIGNS_DB.push(campaign);
      res.status(201).json({ success: true, data: campaign });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/campaigns/:id
router.patch('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ success: true, data });
    } else {
      const index = CAMPAIGNS_DB.findIndex(c => c.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Campaign not found' });
      CAMPAIGNS_DB[index] = { ...CAMPAIGNS_DB[index], ...req.body, updated_at: new Date().toISOString() };
      res.json({ success: true, data: CAMPAIGNS_DB[index] });
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/launch
router.post('/:id/launch', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          launched_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'campaign',
        entity_id: data.id,
        action: 'campaign_launched',
        description: `Campaign "${data.name}" launched`,
        metadata: { leads_count: data.leads_count }
      });
      
      res.json({ success: true, message: 'Campaign launched', data });
    } else {
      const campaign = CAMPAIGNS_DB.find(c => c.id === req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      campaign.status = 'active';
      campaign.launched_at = new Date().toISOString();
      res.json({ success: true, message: 'Campaign launched', data: campaign });
    }
  } catch (error) {
    console.error('Error launching campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Campaign paused', data });
    } else {
      const campaign = CAMPAIGNS_DB.find(c => c.id === req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      campaign.status = 'paused';
      res.json({ success: true, message: 'Campaign paused', data: campaign });
    }
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', req.params.id);
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Campaign deleted' });
    } else {
      const index = CAMPAIGNS_DB.findIndex(c => c.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Campaign not found' });
      CAMPAIGNS_DB.splice(index, 1);
      res.json({ success: true, message: 'Campaign deleted' });
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
