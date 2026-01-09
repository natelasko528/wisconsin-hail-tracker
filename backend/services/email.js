import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@wisconsinhailtracker.com';
const FROM_NAME = process.env.FROM_NAME || 'Wisconsin Hail Tracker';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Create transporter
let transporter;

if (SENDGRID_API_KEY) {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: SENDGRID_API_KEY
    }
  });
} else {
  logger.warn('SendGrid not configured, emails will be logged only');
  transporter = null;
}

/**
 * Send email
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!transporter) {
      logger.info(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      logger.debug(`Body: ${text || html}`);
      return { messageId: 'mock-' + Date.now(), status: 'mocked' };
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      html: html || text
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);

    return {
      messageId: info.messageId,
      status: 'sent'
    };

  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
}

/**
 * Send campaign email with template
 */
export async function sendCampaignEmail({ to, subject, template, variables }) {
  try {
    // Replace variables in template
    let html = template;
    for (const [key, value] of Object.entries(variables || {})) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    }

    return await sendEmail({ to, subject, html });

  } catch (error) {
    logger.error(`Failed to send campaign email: ${error.message}`);
    throw error;
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emails) {
  const results = {
    successful: [],
    failed: []
  };

  for (const email of emails) {
    try {
      const result = await sendCampaignEmail(email);
      results.successful.push({ ...email, result });
    } catch (error) {
      results.failed.push({ ...email, error: error.message });
    }

    // Rate limiting - wait 100ms between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info(`Bulk email complete: ${results.successful.length}/${emails.length} sent`);

  return results;
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  if (!transporter) {
    return { configured: false, verified: false };
  }

  try {
    await transporter.verify();
    return { configured: true, verified: true };
  } catch (error) {
    logger.error(`Email verification failed: ${error.message}`);
    return { configured: true, verified: false, error: error.message };
  }
}

export default {
  sendEmail,
  sendCampaignEmail,
  sendBulkEmails,
  verifyEmailConfig
};
