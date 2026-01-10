import fetch from 'node-fetch';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

const SKIPTRACE_PROVIDER = process.env.SKIPTRACE_PROVIDER || 'tloxp';
const TLOXP_API_KEY = process.env.TLOXP_API_KEY;
const TLOXP_API_URL = process.env.TLOXP_API_URL || 'https://api.tloxp.com/v1';
const SKIPTRACE_COST = parseFloat(process.env.SKIPTRACE_COST_PER_LOOKUP) || 0.25;

/**
 * Perform skip trace lookup
 */
export async function skipTrace(leadId, propertyAddress, name) {
  try {
    logger.info(`Skip tracing lead ${leadId}: ${propertyAddress}`);

    // Check if already skip traced
    const existing = await query(
      'SELECT id FROM skiptrace_results WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1',
      [leadId]
    );

    if (existing.rows.length > 0) {
      logger.warn(`Lead ${leadId} already skip traced`);
      // Return existing result or allow re-skip trace based on business logic
    }

    let result;

    if (!TLOXP_API_KEY) {
      logger.warn('Skip trace API not configured, returning mock data');
      result = generateMockSkipTraceResult(name, propertyAddress);
    } else {
      result = await performRealSkipTrace(propertyAddress, name);
    }

    // Store result in database
    await query(
      `INSERT INTO skiptrace_results
       (lead_id, provider, phones, emails, property_owner, ownership_type,
        residence_duration, confidence_score, cost, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        leadId,
        SKIPTRACE_PROVIDER,
        JSON.stringify(result.phones),
        JSON.stringify(result.emails),
        result.propertyOwner,
        result.ownershipType,
        result.residenceDuration,
        result.confidence,
        SKIPTRACE_COST,
        JSON.stringify(result.raw || {})
      ]
    );

    // Update lead
    await query(
      'UPDATE leads SET is_skipped_traced = true WHERE id = $1',
      [leadId]
    );

    logger.info(`Skip trace completed for lead ${leadId}`);

    return {
      leadId,
      ...result,
      cost: SKIPTRACE_COST
    };

  } catch (error) {
    logger.error(`Skip trace failed for lead ${leadId}: ${error.message}`);
    throw error;
  }
}

/**
 * Perform real skip trace via TLOxp
 */
async function performRealSkipTrace(address, name) {
  try {
    const response = await fetch(`${TLOXP_API_URL}/skiptrace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TLOXP_API_KEY}`
      },
      body: JSON.stringify({
        address,
        name
      })
    });

    if (!response.ok) {
      throw new Error(`TLOxp API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform TLOxp response to our format
    return {
      phones: data.phones || [],
      emails: data.emails || [],
      propertyOwner: data.owner_name || name,
      ownershipType: data.ownership_type || 'Unknown',
      residenceDuration: data.residence_duration || 'Unknown',
      confidence: data.confidence_score || 0,
      raw: data
    };

  } catch (error) {
    logger.error(`TLOxp API error: ${error.message}`);
    throw error;
  }
}

/**
 * Generate mock skip trace result (for development/testing)
 */
function generateMockSkipTraceResult(name, address) {
  return {
    phones: [
      {
        number: `608-555-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'mobile',
        status: 'active',
        carrier: 'Verizon'
      },
      {
        number: `608-555-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'home',
        status: 'active',
        carrier: 'AT&T'
      }
    ],
    emails: [
      {
        address: name.toLowerCase().replace(/\s+/g, '.') + '@example.com',
        status: 'valid',
        type: 'personal'
      }
    ],
    propertyOwner: name,
    ownershipType: 'Individual',
    residenceDuration: '5-10 years',
    confidence: Math.floor(85 + Math.random() * 15),
    raw: {
      mock: true,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Batch skip trace
 */
export async function batchSkipTrace(leadIds) {
  const results = {
    successful: [],
    failed: [],
    total: leadIds.length
  };

  for (const leadId of leadIds) {
    try {
      // Get lead info
      const leadResult = await query(
        'SELECT name, property_address FROM leads WHERE id = $1',
        [leadId]
      );

      if (leadResult.rows.length === 0) {
        results.failed.push({ leadId, error: 'Lead not found' });
        continue;
      }

      const lead = leadResult.rows[0];
      const result = await skipTrace(leadId, lead.property_address, lead.name);

      results.successful.push({ leadId, result });

    } catch (error) {
      logger.error(`Batch skip trace failed for lead ${leadId}: ${error.message}`);
      results.failed.push({ leadId, error: error.message });
    }
  }

  logger.info(`Batch skip trace complete: ${results.successful.length}/${results.total} successful`);

  return results;
}

export default {
  skipTrace,
  batchSkipTrace
};
