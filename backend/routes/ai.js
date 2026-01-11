/**
 * AI Intelligence Routes
 * Endpoints for AI-powered content generation and lead analysis
 */

import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import aiService from '../services/ai.js';

const router = express.Router();

/**
 * GET /api/ai/status
 * Check if AI is configured and available
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    configured: aiService.isAIConfigured(),
    features: {
      salesScripts: true,
      emailGeneration: true,
      smsGeneration: true,
      leadAnalysis: true,
      damageProbability: true
    },
    note: aiService.isAIConfigured() 
      ? 'AI features are fully operational'
      : 'AI is in demo mode - set OPENAI_API_KEY for full functionality'
  });
});

/**
 * POST /api/ai/generate-script
 * Generate a sales script for a lead
 */
router.post('/generate-script', async (req, res) => {
  try {
    const {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      stormDate,
      damageProbability,
      propertyType,
      roofAge,
      estimatedDamage
    } = req.body;

    if (!propertyAddress) {
      return res.status(400).json({ error: 'propertyAddress is required' });
    }

    // If leadId provided, fetch lead data
    let leadData = {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      stormDate,
      damageProbability,
      propertyType,
      roofAge,
      estimatedDamage
    };

    if (leadId && isSupabaseConfigured()) {
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          *,
          properties (*)
        `)
        .eq('id', leadId)
        .single();

      if (lead) {
        leadData = {
          ...leadData,
          ownerName: lead.owner_name || lead.properties?.owner_name || ownerName,
          propertyAddress: lead.property_address || lead.properties?.full_address || propertyAddress,
          hailSize: lead.hail_size || hailSize,
          damageProbability: lead.damage_probability || damageProbability,
          roofAge: lead.properties?.roof_age_years || roofAge
        };
      }
    }

    const result = await aiService.generateSalesScript(leadData);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error generating sales script:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/generate-email
 * Generate an email template for a lead
 */
router.post('/generate-email', async (req, res) => {
  try {
    const {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      stormDate,
      emailType = 'initial_outreach',
      companyName
    } = req.body;

    if (!propertyAddress && !leadId) {
      return res.status(400).json({ error: 'propertyAddress or leadId is required' });
    }

    let leadData = {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      stormDate,
      companyName
    };

    if (leadId && isSupabaseConfigured()) {
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          *,
          properties (*)
        `)
        .eq('id', leadId)
        .single();

      if (lead) {
        leadData = {
          ...leadData,
          ownerName: lead.owner_name || lead.properties?.owner_name || ownerName,
          propertyAddress: lead.property_address || lead.properties?.full_address || propertyAddress,
          hailSize: lead.hail_size || hailSize
        };
      }
    }

    const result = await aiService.generateEmail(leadData, emailType);

    res.json({
      success: true,
      emailType,
      ...result
    });

  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/generate-sms
 * Generate an SMS message for a lead
 */
router.post('/generate-sms', async (req, res) => {
  try {
    const {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      smsType = 'initial',
      companyName
    } = req.body;

    if (!propertyAddress && !leadId) {
      return res.status(400).json({ error: 'propertyAddress or leadId is required' });
    }

    let leadData = {
      leadId,
      ownerName,
      propertyAddress,
      hailSize,
      companyName
    };

    if (leadId && isSupabaseConfigured()) {
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          *,
          properties (*)
        `)
        .eq('id', leadId)
        .single();

      if (lead) {
        leadData = {
          ...leadData,
          ownerName: lead.owner_name || lead.properties?.owner_name || ownerName,
          propertyAddress: lead.property_address || lead.properties?.full_address || propertyAddress,
          hailSize: lead.hail_size || hailSize
        };
      }
    }

    const result = await aiService.generateSMS(leadData, smsType);

    res.json({
      success: true,
      smsType,
      ...result
    });

  } catch (error) {
    console.error('Error generating SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/analyze-lead
 * Get AI recommendations for a lead
 */
router.post('/analyze-lead', async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    let leadData = { leadId };

    if (isSupabaseConfigured()) {
      const { data: lead, error } = await supabase
        .from('leads')
        .select(`
          *,
          properties (*),
          communication_log (count)
        `)
        .eq('id', leadId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      leadData = {
        leadId,
        ownerName: lead.owner_name || lead.properties?.owner_name,
        propertyAddress: lead.property_address || lead.properties?.full_address,
        hailSize: lead.hail_size,
        stormDate: lead.storm_date,
        damageProbability: lead.damage_probability,
        propertyValue: lead.properties?.market_value || lead.properties?.assessed_value,
        roofType: lead.properties?.roof_type,
        roofAge: lead.properties?.roof_age_years,
        hasPhone: !!lead.owner_phone,
        hasEmail: !!lead.owner_email,
        previousAttempts: lead.communication_log?.[0]?.count || 0
      };
    }

    const result = await aiService.analyzeLead(leadData);

    // Update lead with AI insights if configured
    if (isSupabaseConfigured() && result.analysis && !result.isMock) {
      await supabase
        .from('leads')
        .update({
          ai_insights: result.analysis,
          priority_score: result.analysis.leadQualityScore
        })
        .eq('id', leadId);
    }

    res.json({
      success: true,
      leadId,
      ...result
    });

  } catch (error) {
    console.error('Error analyzing lead:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/calculate-damage
 * Calculate AI-enhanced damage probability
 */
router.post('/calculate-damage', async (req, res) => {
  try {
    const {
      hailSize,
      distanceMiles,
      roofType,
      roofAge,
      propertyAge,
      hasGutter,
      hasSiding
    } = req.body;

    if (!hailSize) {
      return res.status(400).json({ error: 'hailSize is required' });
    }

    const result = await aiService.calculateAIDamageProbability({
      hailSize: parseFloat(hailSize),
      distanceMiles: parseFloat(distanceMiles) || 0,
      roofType,
      roofAge: parseInt(roofAge) || 15,
      propertyAge: parseInt(propertyAge),
      hasGutter,
      hasSiding
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error calculating damage probability:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/content/:leadId
 * Get all AI-generated content for a lead
 */
router.get('/content/:leadId', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'Database not configured'
      });
    }

    const { data, error } = await supabase
      .from('ai_generated_content')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/content/:id/rate
 * Rate AI-generated content
 */
router.post('/content/:id/rate', async (req, res) => {
  try {
    const { rating, used } = req.body;

    if (!isSupabaseConfigured()) {
      return res.json({ success: true, message: 'Rating saved (demo mode)' });
    }

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (used !== undefined) updates.used = used;

    const { data, error } = await supabase
      .from('ai_generated_content')
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
    console.error('Error rating content:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/chat
 * AI chatbot for general questions
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, contextType, contextId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // For now, return a helpful response about the system
    const response = {
      success: true,
      message: aiService.isAIConfigured()
        ? 'AI chat is available. This feature is coming soon!'
        : 'AI chat requires OPENAI_API_KEY to be configured.',
      sessionId: sessionId || `session-${Date.now()}`
    };

    res.json(response);

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
