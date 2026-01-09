import twilio from 'twilio';
import logger from '../config/logger.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMS_COST = parseFloat(process.env.SMS_COST_PER_MESSAGE) || 0.0079;

let client;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  logger.warn('Twilio not configured, SMS will be logged only');
  client = null;
}

/**
 * Send SMS
 */
export async function sendSMS({ to, body }) {
  try {
    if (!client) {
      logger.info(`[MOCK SMS] To: ${to}, Body: ${body}`);
      return { sid: 'mock-' + Date.now(), status: 'mocked', cost: 0 };
    }

    if (!TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    const message = await client.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to
    });

    logger.info(`SMS sent to ${to}: ${message.sid}`);

    return {
      sid: message.sid,
      status: message.status,
      cost: SMS_COST
    };

  } catch (error) {
    logger.error(`Failed to send SMS to ${to}: ${error.message}`);
    throw error;
  }
}

/**
 * Send campaign SMS with template
 */
export async function sendCampaignSMS({ to, template, variables }) {
  try {
    // Replace variables in template
    let body = template;
    for (const [key, value] of Object.entries(variables || {})) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, value);
    }

    // SMS length limit: 160 characters per segment
    if (body.length > 1600) {
      logger.warn(`SMS too long (${body.length} chars), truncating`);
      body = body.substring(0, 1597) + '...';
    }

    return await sendSMS({ to, body });

  } catch (error) {
    logger.error(`Failed to send campaign SMS: ${error.message}`);
    throw error;
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(messages) {
  const results = {
    successful: [],
    failed: [],
    totalCost: 0
  };

  for (const message of messages) {
    try {
      const result = await sendCampaignSMS(message);
      results.successful.push({ ...message, result });
      results.totalCost += result.cost;
    } catch (error) {
      results.failed.push({ ...message, error: error.message });
    }

    // Rate limiting - wait 1 second between messages (Twilio limit: 1 msg/sec)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.info(`Bulk SMS complete: ${results.successful.length}/${messages.length} sent, $${results.totalCost.toFixed(2)}`);

  return results;
}

/**
 * Verify SMS configuration
 */
export async function verifySMSConfig() {
  if (!client) {
    return { configured: false, verified: false };
  }

  try {
    // Verify account is active
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();

    return {
      configured: true,
      verified: true,
      status: account.status,
      balance: account.balance
    };
  } catch (error) {
    logger.error(`SMS verification failed: ${error.message}`);
    return { configured: true, verified: false, error: error.message };
  }
}

export default {
  sendSMS,
  sendCampaignSMS,
  sendBulkSMS,
  verifySMSConfig
};
