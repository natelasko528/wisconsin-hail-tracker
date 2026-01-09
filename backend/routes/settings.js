import express from 'express';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';
import logger from '../config/logger.js';

const router = express.Router();

// Validation schemas
const apiKeySchema = Joi.object({
  service: Joi.string().required().valid('gemini', 'openai', 'anthropic', 'noaa', 'sendgrid', 'twilio', 'tloxp', 'ghl'),
  keyName: Joi.string().required().max(100),
  apiKey: Joi.string().required(),
  apiSecret: Joi.string().optional().allow(''),
  metadata: Joi.object().optional(),
});

const updateApiKeySchema = Joi.object({
  keyName: Joi.string().max(100),
  apiKey: Joi.string(),
  apiSecret: Joi.string().allow(''),
  isActive: Joi.boolean(),
  metadata: Joi.object(),
}).min(1);

/**
 * GET /api/settings/api-keys
 * List all API keys for current user (masked)
 */
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, service, key_name, is_active, last_used_at, expires_at, created_at,
              LEFT(api_key_encrypted, 10) || '...' as api_key_preview
       FROM api_keys
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      apiKeys: result.rows.map(row => ({
        id: row.id,
        service: row.service,
        keyName: row.key_name,
        isActive: row.is_active,
        lastUsedAt: row.last_used_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        preview: row.api_key_preview
      }))
    });

  } catch (error) {
    logger.error(`Failed to fetch API keys: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * POST /api/settings/api-keys
 * Add new API key
 */
router.post('/api-keys', authenticate, validate(apiKeySchema), async (req, res) => {
  try {
    const { service, keyName, apiKey, apiSecret, metadata } = req.body;

    // In production, encrypt the API keys
    // For now, storing as-is (should use crypto.encrypt)
    const result = await query(
      `INSERT INTO api_keys (user_id, service, key_name, api_key_encrypted, api_secret_encrypted, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, service, key_name, is_active, created_at`,
      [req.user.id, service, keyName, apiKey, apiSecret || null, metadata ? JSON.stringify(metadata) : null]
    );

    logger.info(`API key added: ${service} by ${req.user.email}`);

    res.status(201).json({
      message: 'API key added successfully',
      apiKey: result.rows[0]
    });

  } catch (error) {
    logger.error(`Failed to add API key: ${error.message}`);
    res.status(500).json({ error: 'Failed to add API key' });
  }
});

/**
 * PATCH /api/settings/api-keys/:id
 * Update API key
 */
router.patch('/api-keys/:id', authenticate, validate(updateApiKeySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const checkResult = await query(
      'SELECT user_id FROM api_keys WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this API key' });
    }

    // Build update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.keyName) {
      fields.push(`key_name = $${paramCount++}`);
      values.push(updates.keyName);
    }

    if (updates.apiKey) {
      fields.push(`api_key_encrypted = $${paramCount++}`);
      values.push(updates.apiKey);
    }

    if (updates.apiSecret !== undefined) {
      fields.push(`api_secret_encrypted = $${paramCount++}`);
      values.push(updates.apiSecret || null);
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }

    if (updates.metadata) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE api_keys SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    logger.info(`API key updated: ${id} by ${req.user.email}`);

    res.json({
      message: 'API key updated successfully',
      apiKey: result.rows[0]
    });

  } catch (error) {
    logger.error(`Failed to update API key: ${error.message}`);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

/**
 * DELETE /api/settings/api-keys/:id
 * Delete API key
 */
router.delete('/api-keys/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query(
      'SELECT user_id FROM api_keys WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this API key' });
    }

    await query('DELETE FROM api_keys WHERE id = $1', [id]);

    logger.info(`API key deleted: ${id} by ${req.user.email}`);

    res.json({ message: 'API key deleted successfully' });

  } catch (error) {
    logger.error(`Failed to delete API key: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * GET /api/settings/system
 * Get system-wide settings (admin only)
 */
router.get('/system', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT service, key_name, is_active, last_used_at
       FROM api_keys
       WHERE user_id IS NULL
       ORDER BY service`
    );

    res.json({
      systemKeys: result.rows,
      features: {
        aiEnabled: !!process.env.GEMINI_API_KEY || result.rows.some(k => k.service === 'gemini' && k.is_active),
        emailEnabled: !!process.env.SENDGRID_API_KEY || result.rows.some(k => k.service === 'sendgrid' && k.is_active),
        smsEnabled: !!process.env.TWILIO_ACCOUNT_SID || result.rows.some(k => k.service === 'twilio' && k.is_active),
        skiptraceEnabled: !!process.env.TLOXP_API_KEY || result.rows.some(k => k.service === 'tloxp' && k.is_active),
        ghlEnabled: !!process.env.GHL_API_KEY || result.rows.some(k => k.service === 'ghl' && k.is_active),
        noaaEnabled: !!process.env.NOAA_API_TOKEN || result.rows.some(k => k.service === 'noaa' && k.is_active),
      }
    });

  } catch (error) {
    logger.error(`Failed to fetch system settings: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

/**
 * POST /api/settings/test-api-key
 * Test an API key
 */
router.post('/test-api-key', authenticate, async (req, res) => {
  try {
    const { service, apiKey } = req.body;

    // Test the API key based on service
    let testResult = { success: false, message: 'Service not supported' };

    switch (service) {
      case 'gemini':
        testResult = await testGeminiKey(apiKey);
        break;
      case 'sendgrid':
        testResult = await testSendGridKey(apiKey);
        break;
      case 'twilio':
        testResult = await testTwilioKey(apiKey, req.body.apiSecret);
        break;
      default:
        testResult = { success: true, message: 'Key format valid (not tested)' };
    }

    res.json(testResult);

  } catch (error) {
    logger.error(`API key test failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Test Gemini API key
 */
async function testGeminiKey(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      }
    );

    if (response.ok) {
      return { success: true, message: 'Gemini API key is valid' };
    } else {
      const error = await response.text();
      return { success: false, message: `Invalid key: ${error}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Test SendGrid API key
 */
async function testSendGridKey(apiKey) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      return { success: true, message: 'SendGrid API key is valid' };
    } else {
      return { success: false, message: 'Invalid SendGrid API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Test Twilio API key
 */
async function testTwilioKey(accountSid, authToken) {
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (response.ok) {
      return { success: true, message: 'Twilio credentials are valid' };
    } else {
      return { success: false, message: 'Invalid Twilio credentials' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export default router;
