import fetch from 'node-fetch';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Get LLM configuration from database or environment
 */
async function getLLMConfig(userId = null) {
  // Try to get user-specific or system-wide config from database
  if (userId) {
    const result = await query(
      `SELECT api_key_encrypted as api_key, service, metadata
       FROM api_keys
       WHERE user_id = $1 AND service = 'gemini' AND is_active = true
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      const config = result.rows[0];
      return {
        apiKey: config.api_key, // In production, decrypt this
        model: config.metadata?.model || 'gemini-1.5-flash',
        service: config.service
      };
    }
  }

  // Fall back to environment variables
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    service: 'gemini'
  };
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, config) {
  const { apiKey, model } = config;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const text = data.candidates[0].content.parts[0].text;
    return text;

  } catch (error) {
    logger.error(`Gemini API call failed: ${error.message}`);
    throw error;
  }
}

/**
 * Score a lead using AI
 */
export async function scoreLead(lead, userId = null) {
  try {
    const config = await getLLMConfig(userId);

    const prompt = `You are a roofing contractor CRM assistant. Analyze this lead and provide a score from 0-100 and reasoning.

Lead Details:
- Name: ${lead.name}
- Property Value: $${lead.property_value?.toLocaleString() || 'Unknown'}
- Property Type: ${lead.property_type || 'Residential'}
- Location: ${lead.property_county}, Wisconsin
- Hail Event: ${lead.hail_size}" hail on ${lead.event_date}
- Current Stage: ${lead.stage}
- Days Since Event: ${lead.days_since_event || 'Unknown'}

Consider:
1. Property value (higher = more potential)
2. Hail size (larger = more damage)
3. Time since event (recent = higher urgency)
4. Current stage (contacted = engaged)

Respond in JSON format:
{
  "score": 85,
  "priority": "hot" | "warm" | "cold",
  "reasoning": "Brief explanation",
  "suggested_action": "Next step recommendation",
  "estimated_damage": "Low" | "Medium" | "High",
  "conversion_probability": 0.75
}`;

    const response = await callGemini(prompt, config);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);

      logger.info(`AI scored lead ${lead.id}: ${analysis.score}`);

      return analysis;
    }

    throw new Error('Could not parse AI response');

  } catch (error) {
    logger.error(`Lead scoring failed: ${error.message}`);

    // Return fallback scoring
    return {
      score: calculateFallbackScore(lead),
      priority: 'warm',
      reasoning: 'Auto-calculated score (AI unavailable)',
      suggested_action: 'Review manually',
      estimated_damage: estimateDamage(lead.hail_size),
      conversion_probability: 0.5,
      error: error.message
    };
  }
}

/**
 * Generate email template using AI
 */
export async function generateEmailTemplate(lead, campaignType, userId = null) {
  try {
    const config = await getLLMConfig(userId);

    const prompt = `You are a professional email copywriter for a roofing contractor. Write a compelling cold email.

Recipient Details:
- First Name: ${lead.name.split(' ')[0]}
- Property: $${lead.property_value?.toLocaleString()} home in ${lead.property_city}
- Event: ${lead.hail_size}" hail on ${lead.event_date}
- County: ${lead.property_county}, Wisconsin

Campaign Type: ${campaignType || 'cold_outreach'}

Requirements:
1. Subject line (50 chars max)
2. Professional but friendly tone
3. Empathy for storm damage
4. Offer free inspection
5. Mention insurance claim assistance
6. Clear call-to-action
7. Keep under 200 words

Format your response as:
Subject: [subject line]

[email body]

DO NOT include placeholders like [Your Name] - write complete content.`;

    const response = await callGemini(prompt, config);

    logger.info(`AI generated email template for lead ${lead.id}`);

    return response;

  } catch (error) {
    logger.error(`Email generation failed: ${error.message}`);

    // Return fallback template
    return generateFallbackEmail(lead);
  }
}

/**
 * Generate SMS template using AI
 */
export async function generateSMSTemplate(lead, userId = null) {
  try {
    const config = await getLLMConfig(userId);

    const prompt = `Write a professional SMS for a roofing contractor reaching out after a hail storm.

Recipient: ${lead.name.split(' ')[0]} in ${lead.property_city}
Event: ${lead.hail_size}" hail on ${lead.event_date}

Requirements:
1. Maximum 160 characters
2. Friendly and professional
3. Mention free inspection
4. Include call-to-action
5. No placeholders - complete message

Just write the SMS, nothing else.`;

    const response = await callGemini(prompt, config);

    // Ensure under 160 chars
    let sms = response.trim();
    if (sms.length > 160) {
      sms = sms.substring(0, 157) + '...';
    }

    logger.info(`AI generated SMS template for lead ${lead.id}`);

    return sms;

  } catch (error) {
    logger.error(`SMS generation failed: ${error.message}`);

    // Return fallback SMS
    return `Hi ${lead.name.split(' ')[0]}, we're offering free roof inspections after the ${lead.event_date} hail storm in ${lead.property_county}. Interested? Reply YES`;
  }
}

/**
 * Summarize lead notes using AI
 */
export async function summarizeNotes(notes, userId = null) {
  try {
    const config = await getLLMConfig(userId);

    const prompt = `Summarize these lead notes into key points and action items:

${notes.map(n => `- ${n.text} (${n.created_at})`).join('\n')}

Provide:
1. Summary (2-3 sentences)
2. Key action items (bullet points)
3. Important dates mentioned
4. Next follow-up recommendation

Format as JSON:
{
  "summary": "...",
  "action_items": ["...", "..."],
  "dates": ["..."],
  "next_follow_up": "..."
}`;

    const response = await callGemini(prompt, config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { summary: response };

  } catch (error) {
    logger.error(`Note summarization failed: ${error.message}`);
    return {
      summary: 'Unable to summarize notes',
      error: error.message
    };
  }
}

/**
 * Suggest tags for a lead using AI
 */
export async function suggestTags(lead, userId = null) {
  try {
    const config = await getLLMConfig(userId);

    const prompt = `Suggest 3-5 relevant tags for this roofing lead:

- Property: $${lead.property_value} ${lead.property_type} in ${lead.property_county}
- Hail: ${lead.hail_size}" on ${lead.event_date}
- Stage: ${lead.stage}

Choose from common tags like:
hot-lead, warm-lead, cold-lead, high-value, needs-follow-up, insurance-approved,
damage-confirmed, inspection-scheduled, quote-sent, homeowner, commercial, urgent, etc.

Return only JSON array: ["tag1", "tag2", "tag3"]`;

    const response = await callGemini(prompt, config);

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];

  } catch (error) {
    logger.error(`Tag suggestion failed: ${error.message}`);
    return [];
  }
}

/**
 * Fallback scoring (when AI unavailable)
 */
function calculateFallbackScore(lead) {
  let score = 50; // Base score

  // Property value scoring (0-25 points)
  if (lead.property_value) {
    if (lead.property_value >= 400000) score += 25;
    else if (lead.property_value >= 300000) score += 20;
    else if (lead.property_value >= 200000) score += 15;
    else score += 10;
  }

  // Hail size scoring (0-25 points)
  if (lead.hail_size >= 2.5) score += 25;
  else if (lead.hail_size >= 2.0) score += 20;
  else if (lead.hail_size >= 1.5) score += 15;
  else score += 10;

  // Stage scoring (0-20 points)
  const stageScores = {
    'new': 10,
    'contacted': 15,
    'qualified': 20,
    'proposal': 18,
    'negotiation': 16
  };
  score += stageScores[lead.stage] || 10;

  // Time sensitivity (0-10 points)
  if (lead.days_since_event <= 7) score += 10;
  else if (lead.days_since_event <= 14) score += 7;
  else if (lead.days_since_event <= 30) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Estimate damage based on hail size
 */
function estimateDamage(hailSize) {
  if (hailSize >= 2.0) return 'High';
  if (hailSize >= 1.5) return 'Medium';
  return 'Low';
}

/**
 * Fallback email template
 */
function generateFallbackEmail(lead) {
  const firstName = lead.name.split(' ')[0];

  return `Subject: Free Roof Inspection - Recent Hail Damage in ${lead.property_county}

Hi ${firstName},

I noticed your property in ${lead.property_city} was in the path of the recent hail storm that brought ${lead.hail_size}" hail to ${lead.property_county} County.

As a local roofing contractor, I'm offering free roof inspections to help homeowners assess potential damage. Most insurance policies cover hail damage, and we can help you file a claim if needed.

Would you be available for a quick 20-minute inspection this week?

Best regards,
Wisconsin Hail Tracker Team`;
}

export default {
  scoreLead,
  generateEmailTemplate,
  generateSMSTemplate,
  summarizeNotes,
  suggestTags
};
