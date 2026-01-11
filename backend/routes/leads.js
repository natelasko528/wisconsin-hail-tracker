import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

const PIPELINE_STAGES = ['New', 'Contacted', 'Inspection Scheduled', 'Contract Signed', 'Lost'];

// Map old stages to new for compatibility
const STAGE_MAP = {
  'new': 'New',
  'contacted': 'Contacted',
  'qualified': 'Inspection Scheduled',
  'proposal': 'Contract Signed',
  'negotiation': 'Contract Signed',
  'closed_won': 'Contract Signed',
  'closed_lost': 'Lost'
};

// Fallback in-memory data for development without Supabase
let LEADS_DB = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Smith',
    property_address: '123 Main St, Madison, WI 53703',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    status: 'New',
    score: 85,
    hail_size: 2.5,
    property_value: 350000,
    created_at: '2024-06-16T10:00:00Z'
  }
];

// Transform Supabase lead to API format (joins with properties table)
function transformLead(lead, property = null, notes = [], skipTraceData = null) {
  // Get contact info from multiple sources
  const phone = lead.owner_phone || skipTraceData?.phones?.[0]?.number || property?.owner_phone || null;
  const email = lead.owner_email || skipTraceData?.emails?.[0]?.address || property?.owner_email || null;
  
  return {
    id: lead.id,
    property_id: lead.property_id,
    storm_id: lead.storm_id,
    storm_impact_id: lead.storm_impact_id,
    
    // Contact Info
    name: lead.owner_name || property?.owner_name || 'Property Owner',
    phone,
    email,
    
    // Address - structured
    property_address: property?.full_address || property?.address_line || lead.property_address || 'Unknown Address',
    street_address: property?.street_address,
    city: property?.city || lead.city,
    state: property?.state || lead.state || 'WI',
    zip_code: property?.zip_code || lead.zip_code,
    county: property?.county || lead.county,
    latitude: property?.latitude,
    longitude: property?.longitude,
    
    // Property Details
    property_type: property?.property_type,
    year_built: property?.year_built,
    square_footage: property?.square_footage,
    roof_type: property?.roof_type,
    roof_age_years: property?.roof_age_years,
    property_value: property?.market_value || property?.assessed_value || 0,
    
    // Storm & Damage Info
    hail_size: parseFloat(lead.hail_size) || 0,
    storm_date: lead.storm_date,
    damage_probability: lead.damage_probability,
    priority_score: lead.priority_score || calculateScore(lead),
    
    // Status
    stage: lead.status,
    status: lead.status,
    score: lead.priority_score || calculateScore(lead),
    
    // AI & Insights
    ai_insights: lead.ai_insights,
    tags: lead.tags || [],
    
    // Assignment
    assigned_to: lead.assigned_to_id,
    
    // Notes
    notes: notes,
    
    // Timestamps
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    last_contacted_at: lead.last_contacted_at,
    
    // Skip trace info (if available)
    skip_trace: skipTraceData ? {
      has_data: true,
      confidence_score: skipTraceData.confidence_score,
      phones: skipTraceData.phones,
      emails: skipTraceData.emails,
      searched_at: skipTraceData.searched_at
    } : null
  };
}

function calculateScore(lead) {
  // Simple scoring based on hail size and status
  let score = 50;
  const hailSize = parseFloat(lead.hail_size) || 0;
  if (hailSize >= 2.5) score += 30;
  else if (hailSize >= 1.5) score += 20;
  else if (hailSize >= 1.0) score += 10;
  
  if (lead.status === 'Contract Signed') score += 20;
  else if (lead.status === 'Inspection Scheduled') score += 10;
  
  return Math.min(score, 100);
}

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const { stage, status, minScore, search, limit = 100, offset = 0 } = req.query;
    
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('leads')
        .select(`
          *,
          properties (id, full_address, owner_name, latitude, longitude)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      // Handle stage parameter (map old format to new)
      const statusFilter = status || (stage ? STAGE_MAP[stage] || stage : null);
      if (statusFilter) query = query.eq('status', statusFilter);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform leads
      let transformed = (data || []).map(lead => transformLead(lead, lead.properties));
      
      // Filter by score if needed
      if (minScore) {
        transformed = transformed.filter(l => l.score >= parseInt(minScore));
      }
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        transformed = transformed.filter(l => 
          l.name.toLowerCase().includes(searchLower) ||
          l.property_address.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by score
      transformed.sort((a, b) => b.score - a.score);
      
      res.json({ 
        success: true, 
        count: count || transformed.length, 
        stages: PIPELINE_STAGES, 
        data: transformed 
      });
    } else {
      // Fallback to in-memory
      let filtered = [...LEADS_DB];
      const statusFilter = status || (stage ? STAGE_MAP[stage] || stage : null);
      if (statusFilter) filtered = filtered.filter(l => l.status === statusFilter);
      if (minScore) filtered = filtered.filter(l => l.score >= parseInt(minScore));
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(l => 
          l.name.toLowerCase().includes(searchLower) ||
          l.property_address.toLowerCase().includes(searchLower)
        );
      }
      filtered.sort((a, b) => b.score - a.score);
      res.json({ success: true, count: filtered.length, stages: PIPELINE_STAGES, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/stats
router.get('/stats', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('status, hail_size');
      
      if (error) throw error;
      
      const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage] = (leads || []).filter(l => l.status === stage).length;
        return acc;
      }, {});
      
      const totalLeads = (leads || []).length;
      const avgScore = totalLeads > 0 
        ? Math.round((leads || []).reduce((sum, l) => sum + calculateScore(l), 0) / totalLeads)
        : 0;
      
      const closedWon = stageCounts['Contract Signed'] || 0;
      
      res.json({
        success: true,
        data: {
          totalLeads,
          pipelineValue: 0, // Would need property values
          averageScore: avgScore,
          stageBreakdown: stageCounts,
          conversionRate: totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0
        }
      });
    } else {
      // Fallback
      const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage] = LEADS_DB.filter(l => l.status === stage).length;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          totalLeads: LEADS_DB.length,
          pipelineValue: LEADS_DB.reduce((sum, l) => sum + (l.property_value || 0), 0),
          averageScore: Math.round(LEADS_DB.reduce((sum, l) => sum + l.score, 0) / LEADS_DB.length),
          stageBreakdown: stageCounts,
          conversionRate: 0
        }
      });
    }
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data: lead, error } = await supabase
        .from('leads')
        .select(`
          *,
          properties (
            id, 
            street_address, 
            city, 
            state, 
            zip_code, 
            county,
            full_address, 
            address_line,
            owner_name,
            owner_phone,
            owner_email,
            latitude, 
            longitude,
            property_type,
            year_built,
            square_footage,
            roof_type,
            roof_age_years,
            assessed_value,
            market_value
          ),
          storm_property_impacts (
            id,
            distance_miles,
            hail_size_at_location,
            damage_probability,
            priority_score,
            priority_factors
          )
        `)
        .eq('id', req.params.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Lead not found' });
        }
        throw error;
      }
      
      // Get notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('created_at', { ascending: false });
      
      // Get skip trace data
      const { data: skipTraceData } = await supabase
        .from('skip_trace_results')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('searched_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get communication history
      const { data: communications } = await supabase
        .from('communication_log')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Get activity log
      const { data: activities } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'lead')
        .eq('entity_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      const transformedLead = transformLead(lead, lead.properties, notes || [], skipTraceData);
      
      // Add storm impact data if available
      if (lead.storm_property_impacts?.[0]) {
        transformedLead.storm_impact = lead.storm_property_impacts[0];
      }
      
      // Add communication history
      transformedLead.communications = communications || [];
      
      // Add activity log
      transformedLead.activities = activities || [];
      
      res.json({ success: true, data: transformedLead });
    } else {
      const lead = LEADS_DB.find(l => l.id === req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      res.json({ success: true, data: lead });
    }
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const { 
      name, property_address, propertyAddress, 
      storm_id, stormId, hailEventId,
      hail_size, hailSize,
      latitude, longitude
    } = req.body;
    
    const address = property_address || propertyAddress;
    const stormIdValue = storm_id || stormId || hailEventId;
    const hailSizeValue = hail_size || hailSize || 0;
    
    if (!address) {
      return res.status(400).json({ error: 'Property address is required' });
    }
    
    if (isSupabaseConfigured()) {
      // First create or find property
      let propertyId = null;
      
      const { data: existingProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('full_address', address)
        .single();
      
      if (existingProperty) {
        propertyId = existingProperty.id;
      } else {
        const { data: newProperty, error: propError } = await supabase
          .from('properties')
          .insert({
            full_address: address,
            owner_name: name || 'Unknown',
            latitude: latitude || 0,
            longitude: longitude || 0
          })
          .select()
          .single();
        
        if (propError) throw propError;
        propertyId = newProperty.id;
      }
      
      // Create lead
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          property_id: propertyId,
          storm_id: stormIdValue,
          status: 'New',
          hail_size: hailSizeValue
        })
        .select(`
          *,
          properties (id, full_address, owner_name)
        `)
        .single();
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'lead',
        entity_id: lead.id,
        action: 'lead_created',
        description: `New lead created: ${address}`,
        metadata: { source: 'api' }
      });
      
      res.status(201).json({ success: true, data: transformLead(lead, lead.properties) });
    } else {
      const newLead = { 
        id: `${Date.now()}`,
        name: name || 'Unknown',
        property_address: address,
        status: 'New',
        score: 60,
        hail_size: hailSizeValue,
        created_at: new Date().toISOString()
      };
      LEADS_DB.push(newLead);
      res.status(201).json({ success: true, data: newLead });
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, stage, hail_size, hailSize, assigned_to, assignedTo } = req.body;
    
    // Map stage to status if provided
    let statusValue = status || (stage ? STAGE_MAP[stage] || stage : null);
    
    const updates = {};
    if (statusValue) updates.status = statusValue;
    if (hail_size || hailSize) updates.hail_size = hail_size || hailSize;
    if (assigned_to || assignedTo) updates.assigned_to_id = assigned_to || assignedTo;
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', req.params.id)
        .select(`
          *,
          properties (id, full_address, owner_name)
        `)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Lead not found' });
        }
        throw error;
      }
      
      // Log stage changes
      if (statusValue) {
        await supabase.from('activity_log').insert({
          entity_type: 'lead',
          entity_id: data.id,
          action: 'stage_updated',
          description: `Lead status updated to ${statusValue}`,
          metadata: { new_status: statusValue }
        });
      }
      
      res.json({ success: true, data: transformLead(data, data.properties) });
    } else {
      const leadIndex = LEADS_DB.findIndex(l => l.id === req.params.id);
      if (leadIndex === -1) return res.status(404).json({ error: 'Lead not found' });
      LEADS_DB[leadIndex] = { ...LEADS_DB[leadIndex], ...updates, updated_at: new Date().toISOString() };
      res.json({ success: true, data: LEADS_DB[leadIndex] });
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', req.params.id);
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Lead deleted' });
    } else {
      const leadIndex = LEADS_DB.findIndex(l => l.id === req.params.id);
      if (leadIndex === -1) return res.status(404).json({ error: 'Lead not found' });
      LEADS_DB.splice(leadIndex, 1);
      res.json({ success: true, message: 'Lead deleted' });
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/:id/notes
router.post('/:id/notes', async (req, res) => {
  try {
    const { text, author } = req.body;
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          lead_id: req.params.id,
          text,
          author_id: null // Would be user ID in authenticated system
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ success: true, data: { ...data, author: author || 'System' } });
    } else {
      const lead = LEADS_DB.find(l => l.id === req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      
      if (!lead.notes) lead.notes = [];
      const note = { 
        id: `${Date.now()}`, 
        text, 
        author: author || 'System', 
        created_at: new Date().toISOString() 
      };
      lead.notes.push(note);
      res.json({ success: true, data: note });
    }
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/:id/notes
router.get('/:id/notes', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({ success: true, data: data || [] });
    } else {
      const lead = LEADS_DB.find(l => l.id === req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      res.json({ success: true, data: lead.notes || [] });
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMUNICATION ENDPOINTS
// ============================================================================

// POST /api/leads/:id/call - Log a phone call
router.post('/:id/call', async (req, res) => {
  try {
    const { 
      phone_number, 
      direction = 'outbound',
      duration_seconds,
      outcome,
      notes 
    } = req.body;

    if (!isSupabaseConfigured()) {
      return res.json({
        success: true,
        message: 'Call logged (demo mode)',
        data: { id: Date.now().toString(), type: 'call', status: 'completed' }
      });
    }

    // Log the communication
    const { data: commLog, error: commError } = await supabase
      .from('communication_log')
      .insert({
        lead_id: req.params.id,
        type: 'call',
        direction,
        status: 'completed',
        phone_number,
        call_duration_seconds: duration_seconds,
        call_outcome: outcome,
        body: notes,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commError) throw commError;

    // Update lead's last_contacted_at
    await supabase
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: 'call_logged',
      description: `${direction === 'outbound' ? 'Outbound' : 'Inbound'} call - ${outcome || 'completed'}`,
      metadata: { communication_id: commLog.id, outcome, duration_seconds }
    });

    res.json({
      success: true,
      message: 'Call logged successfully',
      data: commLog
    });

  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/:id/email - Send/log an email
router.post('/:id/email', async (req, res) => {
  try {
    const { 
      email_address,
      subject,
      body,
      template_id,
      ai_generated = false,
      send_now = false
    } = req.body;

    if (!email_address && !send_now) {
      // Just logging, not sending
    } else if (!email_address) {
      return res.status(400).json({ error: 'email_address is required to send' });
    }

    if (!isSupabaseConfigured()) {
      return res.json({
        success: true,
        message: 'Email logged (demo mode)',
        data: { id: Date.now().toString(), type: 'email', status: 'sent' }
      });
    }

    // TODO: Integrate with SendGrid/email provider when configured
    const emailStatus = send_now ? 'sent' : 'draft';

    // Log the communication
    const { data: commLog, error: commError } = await supabase
      .from('communication_log')
      .insert({
        lead_id: req.params.id,
        type: 'email',
        direction: 'outbound',
        status: emailStatus,
        email_address,
        subject,
        body,
        template_id,
        ai_generated,
        completed_at: send_now ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (commError) throw commError;

    if (send_now) {
      // Update lead's last_contacted_at
      await supabase
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', req.params.id);
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: send_now ? 'email_sent' : 'email_drafted',
      description: `Email ${send_now ? 'sent' : 'drafted'}: ${subject}`,
      metadata: { communication_id: commLog.id, ai_generated }
    });

    res.json({
      success: true,
      message: send_now ? 'Email sent successfully' : 'Email draft saved',
      data: commLog
    });

  } catch (error) {
    console.error('Error with email:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/:id/sms - Send/log an SMS
router.post('/:id/sms', async (req, res) => {
  try {
    const { 
      phone_number,
      body,
      template_id,
      ai_generated = false,
      send_now = false
    } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    if (send_now && !phone_number) {
      return res.status(400).json({ error: 'phone_number is required to send' });
    }

    if (!isSupabaseConfigured()) {
      return res.json({
        success: true,
        message: 'SMS logged (demo mode)',
        data: { id: Date.now().toString(), type: 'sms', status: 'sent' }
      });
    }

    // TODO: Integrate with Twilio when configured
    const smsStatus = send_now ? 'sent' : 'draft';

    // Log the communication
    const { data: commLog, error: commError } = await supabase
      .from('communication_log')
      .insert({
        lead_id: req.params.id,
        type: 'sms',
        direction: 'outbound',
        status: smsStatus,
        phone_number,
        body,
        template_id,
        ai_generated,
        sms_delivered: send_now,
        completed_at: send_now ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (commError) throw commError;

    if (send_now) {
      // Update lead's last_contacted_at
      await supabase
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', req.params.id);
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: send_now ? 'sms_sent' : 'sms_drafted',
      description: `SMS ${send_now ? 'sent' : 'drafted'}: ${body.substring(0, 50)}...`,
      metadata: { communication_id: commLog.id, ai_generated }
    });

    res.json({
      success: true,
      message: send_now ? 'SMS sent successfully' : 'SMS draft saved',
      data: commLog
    });

  } catch (error) {
    console.error('Error with SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/:id/communications - Get communication history
router.get('/:id/communications', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({ success: true, data: [] });
    }

    const { type, limit = 50 } = req.query;

    let query = supabase
      .from('communication_log')
      .select('*')
      .eq('lead_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads/:id/schedule-callback - Schedule a callback
router.post('/:id/schedule-callback', async (req, res) => {
  try {
    const { scheduled_for, notes, phone_number } = req.body;

    if (!scheduled_for) {
      return res.status(400).json({ error: 'scheduled_for is required' });
    }

    if (!isSupabaseConfigured()) {
      return res.json({
        success: true,
        message: 'Callback scheduled (demo mode)',
        data: { id: Date.now().toString(), scheduled_for }
      });
    }

    // Log the scheduled communication
    const { data: commLog, error: commError } = await supabase
      .from('communication_log')
      .insert({
        lead_id: req.params.id,
        type: 'call',
        direction: 'outbound',
        status: 'scheduled',
        phone_number,
        body: notes,
        scheduled_for
      })
      .select()
      .single();

    if (commError) throw commError;

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: 'callback_scheduled',
      description: `Callback scheduled for ${new Date(scheduled_for).toLocaleString()}`,
      metadata: { communication_id: commLog.id }
    });

    res.json({
      success: true,
      message: 'Callback scheduled',
      data: commLog
    });

  } catch (error) {
    console.error('Error scheduling callback:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
