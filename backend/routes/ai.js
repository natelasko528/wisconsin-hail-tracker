import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { scoreLead, generateEmailTemplate, generateSMSTemplate, summarizeNotes, suggestTags } from '../services/llm.js';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/ai/score-lead
 * Score a lead using AI
 */
router.post('/score-lead', authenticate, async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get lead details with hail event info
    const result = await query(
      `SELECT l.*, h.event_date, h.hail_size, h.county,
              EXTRACT(DAY FROM CURRENT_DATE - h.event_date) as days_since_event
       FROM leads l
       LEFT JOIN hail_events h ON l.hail_event_id = h.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Score using AI
    const analysis = await scoreLead(lead, req.user.id);

    // Update lead score in database
    if (!analysis.error) {
      await query(
        'UPDATE leads SET score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [analysis.score, leadId]
      );
    }

    logger.info(`AI scored lead ${leadId}: ${analysis.score}`);

    res.json({
      leadId,
      analysis
    });

  } catch (error) {
    logger.error(`AI scoring failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to score lead',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/generate-email
 * Generate email template for a lead
 */
router.post('/generate-email', authenticate, async (req, res) => {
  try {
    const { leadId, campaignType } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get lead details
    const result = await query(
      `SELECT l.*, h.event_date, h.hail_size
       FROM leads l
       LEFT JOIN hail_events h ON l.hail_event_id = h.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Generate email
    const template = await generateEmailTemplate(lead, campaignType, req.user.id);

    logger.info(`AI generated email for lead ${leadId}`);

    res.json({
      leadId,
      template
    });

  } catch (error) {
    logger.error(`Email generation failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to generate email',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/generate-sms
 * Generate SMS template for a lead
 */
router.post('/generate-sms', authenticate, async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get lead details
    const result = await query(
      `SELECT l.*, h.event_date, h.hail_size
       FROM leads l
       LEFT JOIN hail_events h ON l.hail_event_id = h.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Generate SMS
    const template = await generateSMSTemplate(lead, req.user.id);

    logger.info(`AI generated SMS for lead ${leadId}`);

    res.json({
      leadId,
      template
    });

  } catch (error) {
    logger.error(`SMS generation failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to generate SMS',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/summarize-notes
 * Summarize lead notes using AI
 */
router.post('/summarize-notes', authenticate, async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get notes
    const result = await query(
      `SELECT text, author_name, created_at
       FROM lead_notes
       WHERE lead_id = $1
       ORDER BY created_at DESC`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.json({
        leadId,
        summary: {
          summary: 'No notes to summarize',
          action_items: [],
          dates: []
        }
      });
    }

    const notes = result.rows;

    // Summarize
    const summary = await summarizeNotes(notes, req.user.id);

    logger.info(`AI summarized notes for lead ${leadId}`);

    res.json({
      leadId,
      summary
    });

  } catch (error) {
    logger.error(`Note summarization failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to summarize notes',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/suggest-tags
 * Suggest tags for a lead using AI
 */
router.post('/suggest-tags', authenticate, async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get lead details
    const result = await query(
      `SELECT l.*, h.event_date, h.hail_size
       FROM leads l
       LEFT JOIN hail_events h ON l.hail_event_id = h.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Suggest tags
    const tags = await suggestTags(lead, req.user.id);

    logger.info(`AI suggested ${tags.length} tags for lead ${leadId}`);

    res.json({
      leadId,
      tags
    });

  } catch (error) {
    logger.error(`Tag suggestion failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to suggest tags',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/status
 * Check AI service status
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    // Check if Gemini is configured
    const hasEnvKey = !!process.env.GEMINI_API_KEY;

    let hasUserKey = false;
    if (req.user.id) {
      const result = await query(
        `SELECT COUNT(*) as count
         FROM api_keys
         WHERE (user_id = $1 OR user_id IS NULL)
         AND service = 'gemini'
         AND is_active = true`,
        [req.user.id]
      );
      hasUserKey = result.rows[0].count > 0;
    }

    const isConfigured = hasEnvKey || hasUserKey;

    res.json({
      configured: isConfigured,
      source: hasUserKey ? 'user' : hasEnvKey ? 'environment' : 'none',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      features: {
        leadScoring: isConfigured,
        emailGeneration: isConfigured,
        smsGeneration: isConfigured,
        noteSummarization: isConfigured,
        tagSuggestion: isConfigured
      }
    });

  } catch (error) {
    logger.error(`AI status check failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check AI status'
    });
  }
});

export default router;
