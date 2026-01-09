import fetch from 'node-fetch';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_URL = process.env.GHL_API_URL || 'https://rest.gohighlevel.com/v1';
const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET;

/**
 * Sync contact to GoHighLevel
 */
export async function syncContactToGHL(leadId) {
  try {
    logger.info(`Syncing lead ${leadId} to GoHighLevel`);

    // Get lead data
    const result = await query(
      `SELECT l.*, u.email as assigned_email
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      throw new Error('Lead not found');
    }

    const lead = result.rows[0];

    if (!GHL_API_KEY) {
      logger.warn('GoHighLevel not configured, logging sync only');

      // Create mock sync log
      await query(
        `INSERT INTO ghl_sync_logs
         (lead_id, action, direction, status, ghl_contact_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [leadId, 'sync', 'push', 'success', 'mock-' + Date.now()]
      );

      return { success: true, mock: true, contactId: 'mock-' + Date.now() };
    }

    // Prepare contact data for GHL
    const contactData = {
      firstName: lead.name.split(' ')[0],
      lastName: lead.name.split(' ').slice(1).join(' '),
      email: lead.email,
      phone: lead.phone,
      address1: lead.property_address,
      city: lead.property_city,
      state: lead.property_state,
      postalCode: lead.property_zip,
      source: 'Wisconsin Hail Tracker',
      tags: lead.tags || [],
      customFields: [
        { key: 'property_value', value: lead.property_value?.toString() },
        { key: 'hail_event_id', value: lead.hail_event_id },
        { key: 'stage', value: lead.stage },
        { key: 'score', value: lead.score?.toString() }
      ]
    };

    let response;
    let action;

    // Check if contact already synced
    if (lead.ghl_contact_id) {
      // Update existing contact
      action = 'update';
      response = await fetch(`${GHL_API_URL}/contacts/${lead.ghl_contact_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          ...contactData
        })
      });
    } else {
      // Create new contact
      action = 'create';
      response = await fetch(`${GHL_API_URL}/contacts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          ...contactData
        })
      });
    }

    if (!response.ok) {
      throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const contactId = data.contact?.id || data.id;

    // Update lead with GHL contact ID
    await query(
      'UPDATE leads SET ghl_contact_id = $1, is_synced_to_ghl = true WHERE id = $2',
      [contactId, leadId]
    );

    // Log sync
    await query(
      `INSERT INTO ghl_sync_logs
       (lead_id, action, direction, status, ghl_contact_id, response_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [leadId, action, 'push', 'success', contactId, JSON.stringify(data)]
    );

    logger.info(`Lead ${leadId} synced to GHL: ${contactId}`);

    return { success: true, contactId, action };

  } catch (error) {
    logger.error(`Failed to sync lead ${leadId} to GHL: ${error.message}`);

    // Log failed sync
    await query(
      `INSERT INTO ghl_sync_logs
       (lead_id, action, direction, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [leadId, 'sync', 'push', 'failed', error.message]
    );

    throw error;
  }
}

/**
 * Batch sync contacts
 */
export async function batchSyncToGHL(leadIds) {
  const results = {
    successful: [],
    failed: [],
    total: leadIds.length
  };

  for (const leadId of leadIds) {
    try {
      const result = await syncContactToGHL(leadId);
      results.successful.push({ leadId, ...result });
    } catch (error) {
      results.failed.push({ leadId, error: error.message });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logger.info(`Batch GHL sync complete: ${results.successful.length}/${results.total} successful`);

  return results;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature) {
  if (!GHL_WEBHOOK_SECRET) {
    logger.warn('GHL webhook secret not configured, skipping verification');
    return true;
  }

  // Implement signature verification based on GHL documentation
  // This is a placeholder
  return true;
}

/**
 * Handle webhook event
 */
export async function handleWebhookEvent(event, contact) {
  try {
    logger.info(`Processing GHL webhook: ${event}`);

    // Find lead by GHL contact ID
    const result = await query(
      'SELECT id FROM leads WHERE ghl_contact_id = $1',
      [contact.id]
    );

    if (result.rows.length === 0) {
      logger.warn(`Lead not found for GHL contact: ${contact.id}`);
      return;
    }

    const leadId = result.rows[0].id;

    // Update lead based on event type
    switch (event) {
      case 'contact.updated':
        await query(
          `UPDATE leads
           SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            `${contact.firstName} ${contact.lastName}`.trim(),
            contact.email,
            contact.phone,
            leadId
          ]
        );
        break;

      case 'contact.deleted':
        await query(
          'UPDATE leads SET ghl_contact_id = NULL, is_synced_to_ghl = false WHERE id = $1',
          [leadId]
        );
        break;

      default:
        logger.debug(`Unhandled GHL event: ${event}`);
    }

    // Log webhook event
    await query(
      `INSERT INTO ghl_sync_logs
       (lead_id, action, direction, status, ghl_contact_id, request_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [leadId, event, 'pull', 'success', contact.id, JSON.stringify(contact)]
    );

  } catch (error) {
    logger.error(`Failed to handle GHL webhook: ${error.message}`);
    throw error;
  }
}

export default {
  syncContactToGHL,
  batchSyncToGHL,
  verifyWebhookSignature,
  handleWebhookEvent
};
