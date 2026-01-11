/**
 * AI Intelligence Service
 * Integrates with OpenAI for sales scripts, emails, SMS, and lead analysis
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

// AI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Check if AI is configured
 */
export function isAIConfigured() {
  return !!OPENAI_API_KEY;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: options.model || OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 1000
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Generate a sales script for a lead
 */
export async function generateSalesScript(leadData) {
  const {
    ownerName = 'Property Owner',
    propertyAddress,
    hailSize,
    stormDate,
    damageProbability,
    propertyType = 'residential',
    roofAge,
    estimatedDamage
  } = leadData;

  const systemPrompt = `You are an expert sales script writer for a roofing company that helps homeowners after hail storms. 
Write natural, empathetic scripts that focus on helping homeowners understand their situation and offering a free inspection.
Never be pushy or use high-pressure tactics. Be professional, friendly, and genuinely helpful.`;

  const userPrompt = `Generate a phone call sales script for a roofing salesperson calling a homeowner after a hail storm.

Lead Details:
- Homeowner Name: ${ownerName}
- Property Address: ${propertyAddress}
- Hail Size: ${hailSize} inches
- Storm Date: ${stormDate || 'Recent'}
- Estimated Damage Probability: ${damageProbability ? (damageProbability * 100).toFixed(0) + '%' : 'Unknown'}
- Property Type: ${propertyType}
- Roof Age: ${roofAge ? roofAge + ' years' : 'Unknown'}
- Estimated Repair Cost: ${estimatedDamage ? '$' + estimatedDamage.toLocaleString() : 'TBD'}

Create a script that includes:
1. A warm, friendly introduction
2. Acknowledgment of the recent storm
3. Brief explanation of why you're calling (free inspection offer)
4. Key talking points based on the hail size and damage probability
5. Objection handling (2-3 common objections)
6. Clear call-to-action to schedule a free inspection
7. Professional closing

Keep the tone conversational and helpful, not salesy.`;

  if (!isAIConfigured()) {
    // Return mock script when API not configured
    return {
      script: getMockSalesScript(leadData),
      isMock: true
    };
  }

  try {
    const script = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.7 });

    // Save to database if configured
    if (isSupabaseConfigured()) {
      await supabase.from('ai_generated_content').insert({
        lead_id: leadData.leadId,
        content_type: 'sales_script',
        content: script,
        prompt: userPrompt,
        model: OPENAI_MODEL,
        temperature: 0.7
      });
    }

    return { script, isMock: false };
  } catch (error) {
    console.error('Error generating sales script:', error);
    return {
      script: getMockSalesScript(leadData),
      isMock: true,
      error: error.message
    };
  }
}

/**
 * Generate an email template for a lead
 */
export async function generateEmail(leadData, emailType = 'initial_outreach') {
  const {
    ownerName = 'Homeowner',
    propertyAddress,
    hailSize,
    stormDate,
    companyName = 'Wisconsin Roofing Pros'
  } = leadData;

  const emailTypes = {
    initial_outreach: 'Initial outreach email after a hail storm',
    follow_up: 'Follow-up email after no response',
    inspection_reminder: 'Reminder about scheduled inspection',
    post_inspection: 'Follow-up after completing inspection',
    proposal: 'Email accompanying a roof repair/replacement proposal'
  };

  const systemPrompt = `You are a professional email copywriter for a roofing company. 
Write clear, professional emails that are helpful and not spammy.
Keep emails concise (under 200 words) and include a clear call-to-action.`;

  const userPrompt = `Write a ${emailTypes[emailType] || 'professional outreach'} email.

Details:
- Recipient: ${ownerName}
- Property: ${propertyAddress}
- Hail Size: ${hailSize} inches
- Storm Date: ${stormDate || 'Recently'}
- Company: ${companyName}

Include:
- Compelling subject line
- Professional greeting
- Brief explanation of why you're reaching out
- Value proposition (free inspection, expertise, insurance help)
- Clear call-to-action
- Professional signature

Format the response as:
SUBJECT: [subject line]

[email body]`;

  if (!isAIConfigured()) {
    return {
      email: getMockEmail(leadData, emailType),
      isMock: true
    };
  }

  try {
    const email = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.6, maxTokens: 500 });

    if (isSupabaseConfigured()) {
      await supabase.from('ai_generated_content').insert({
        lead_id: leadData.leadId,
        content_type: 'email',
        content: email,
        prompt: userPrompt,
        model: OPENAI_MODEL,
        temperature: 0.6
      });
    }

    return { email, isMock: false };
  } catch (error) {
    console.error('Error generating email:', error);
    return {
      email: getMockEmail(leadData, emailType),
      isMock: true,
      error: error.message
    };
  }
}

/**
 * Generate an SMS message for a lead
 */
export async function generateSMS(leadData, smsType = 'initial') {
  const {
    ownerName = 'there',
    propertyAddress,
    hailSize,
    companyName = 'WI Roofing Pros'
  } = leadData;

  const smsTypes = {
    initial: 'Initial text after storm',
    follow_up: 'Follow-up text',
    appointment_confirm: 'Appointment confirmation',
    appointment_reminder: 'Appointment reminder'
  };

  if (!isAIConfigured()) {
    return {
      sms: getMockSMS(leadData, smsType),
      isMock: true
    };
  }

  const systemPrompt = `You are writing SMS messages for a roofing company.
Keep messages under 160 characters when possible (max 320).
Be friendly, professional, and include a clear action.
Do not use excessive emojis or ALL CAPS.`;

  const userPrompt = `Write a ${smsTypes[smsType] || 'professional'} SMS message.

Context:
- Recipient: ${ownerName}
- Location: ${propertyAddress}
- Hail Size: ${hailSize}" recently hit the area
- Company: ${companyName}

Keep it brief and actionable.`;

  try {
    const sms = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.6, maxTokens: 100 });

    if (isSupabaseConfigured()) {
      await supabase.from('ai_generated_content').insert({
        lead_id: leadData.leadId,
        content_type: 'sms',
        content: sms,
        prompt: userPrompt,
        model: OPENAI_MODEL,
        temperature: 0.6
      });
    }

    return { sms, isMock: false };
  } catch (error) {
    console.error('Error generating SMS:', error);
    return {
      sms: getMockSMS(leadData, smsType),
      isMock: true,
      error: error.message
    };
  }
}

/**
 * Analyze a lead and provide AI recommendations
 */
export async function analyzeLead(leadData) {
  const {
    ownerName,
    propertyAddress,
    hailSize,
    stormDate,
    damageProbability,
    propertyValue,
    roofType,
    roofAge,
    hasPhone,
    hasEmail,
    previousAttempts = 0
  } = leadData;

  if (!isAIConfigured()) {
    return {
      analysis: getMockLeadAnalysis(leadData),
      isMock: true
    };
  }

  const systemPrompt = `You are a sales intelligence AI helping roofing sales teams prioritize and approach leads after hail storms.
Provide actionable, specific recommendations based on the lead data.
Be concise and focus on the most important factors.`;

  const userPrompt = `Analyze this lead and provide recommendations:

Lead Data:
- Name: ${ownerName || 'Unknown'}
- Address: ${propertyAddress}
- Hail Size: ${hailSize} inches
- Storm Date: ${stormDate || 'Unknown'}
- Damage Probability: ${damageProbability ? (damageProbability * 100).toFixed(0) + '%' : 'Unknown'}
- Property Value: ${propertyValue ? '$' + propertyValue.toLocaleString() : 'Unknown'}
- Roof Type: ${roofType || 'Unknown'}
- Roof Age: ${roofAge ? roofAge + ' years' : 'Unknown'}
- Has Phone: ${hasPhone ? 'Yes' : 'No'}
- Has Email: ${hasEmail ? 'Yes' : 'No'}
- Previous Contact Attempts: ${previousAttempts}

Provide:
1. Lead Quality Score (1-100) with brief explanation
2. Recommended approach strategy (phone, email, door knock)
3. Key talking points specific to this lead
4. Potential objections to prepare for
5. Best time to contact (day of week, time of day)
6. Urgency level (High, Medium, Low) with reasoning

Format as JSON.`;

  try {
    const analysis = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.5, maxTokens: 800 });

    // Try to parse as JSON
    let parsedAnalysis;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = analysis.match(/```json\n?([\s\S]*?)\n?```/) || analysis.match(/\{[\s\S]*\}/);
      parsedAnalysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysis);
    } catch {
      parsedAnalysis = { rawAnalysis: analysis };
    }

    if (isSupabaseConfigured()) {
      await supabase.from('ai_generated_content').insert({
        lead_id: leadData.leadId,
        content_type: 'lead_analysis',
        content: JSON.stringify(parsedAnalysis),
        prompt: userPrompt,
        model: OPENAI_MODEL,
        temperature: 0.5
      });
    }

    return { analysis: parsedAnalysis, isMock: false };
  } catch (error) {
    console.error('Error analyzing lead:', error);
    return {
      analysis: getMockLeadAnalysis(leadData),
      isMock: true,
      error: error.message
    };
  }
}

/**
 * Calculate damage probability using AI
 */
export async function calculateAIDamageProbability(propertyData) {
  const {
    hailSize,
    distanceMiles,
    roofType,
    roofAge,
    propertyAge,
    hasGutter,
    hasSiding
  } = propertyData;

  // Use rule-based calculation as baseline
  const baseProbability = calculateBaseDamageProbability(hailSize, distanceMiles, roofAge, roofType);

  if (!isAIConfigured()) {
    return {
      probability: baseProbability,
      factors: getBaseDamageFactors(propertyData),
      isMock: true
    };
  }

  // For now, use rule-based calculation (AI enhancement can be added later)
  return {
    probability: baseProbability,
    factors: getBaseDamageFactors(propertyData),
    isMock: false
  };
}

// ============================================================================
// Mock Data Functions (used when API not configured)
// ============================================================================

function getMockSalesScript(leadData) {
  const { ownerName = 'homeowner', hailSize = 1.5, propertyAddress = 'your property' } = leadData;
  
  return `
**PHONE CALL SCRIPT - ${ownerName}**

---

**INTRODUCTION:**
"Hi, is this ${ownerName}? This is [Your Name] from Wisconsin Roofing Pros. I hope I'm not catching you at a bad time. Do you have just a minute?"

**REASON FOR CALL:**
"Great! I'm calling because we've been helping homeowners in your area after the recent hail storm. We noticed that ${propertyAddress} was in an area that received ${hailSize}" hail, which is significant enough to potentially cause roof damage."

**VALUE PROPOSITION:**
"What we're offering to homeowners in affected areas is a completely free, no-obligation roof inspection. Our certified inspector will come out, take a look at your roof, and document any damage - whether it's visible or hidden. This documentation can be really valuable if you decide to file an insurance claim."

**KEY TALKING POINTS:**
• ${hailSize}" hail is large enough to damage most asphalt shingle roofs
• Hidden damage can lead to leaks and bigger problems down the road
• Insurance claims have time limits - it's best to document damage now
• Our inspection is 100% free with no pressure to use our services

**COMMON OBJECTIONS:**

*"I already had someone look at it"*
"That's great that you're being proactive! Did they provide written documentation of their findings? We'd be happy to offer a second opinion, and our detailed reports are accepted by all major insurance companies."

*"I'm not interested in replacing my roof"*
"I completely understand. Actually, many roofs just need repairs, not replacement. And if there's no damage, we'll let you know that too. Our goal is just to help you understand what condition your roof is in."

*"I don't want to deal with insurance"*
"I hear you - insurance can be complicated. But here's the thing: if you do have damage, your insurance is there to help cover the cost. We can actually help guide you through the claims process and make it as simple as possible."

**CALL TO ACTION:**
"So what works better for you - would a morning or afternoon inspection time be more convenient? We have availability this [day] or [day]."

**CLOSING:**
"Perfect, I've got you down for [date/time]. You'll receive a confirmation text shortly. The inspection takes about 30-45 minutes, and our inspector [Name] will explain everything they find. Do you have any questions for me before we wrap up?"

---
*Note: This is a demo script. Configure OPENAI_API_KEY for AI-generated personalized scripts.*
`;
}

function getMockEmail(leadData, emailType) {
  const { ownerName = 'Homeowner', propertyAddress = 'your property', hailSize = 1.5 } = leadData;
  
  return `SUBJECT: Free Roof Inspection After Recent Hail Storm - ${propertyAddress}

Dear ${ownerName},

I hope this email finds you well. I'm reaching out because our area recently experienced a significant hail storm, and your property at ${propertyAddress} appears to be in an affected zone.

With ${hailSize}" hail reported in your area, there's a real possibility that your roof may have sustained damage - even if it's not immediately visible from the ground. Hidden hail damage can lead to leaks and more expensive repairs if not addressed.

**We'd like to offer you a FREE, no-obligation roof inspection.**

Here's what you can expect:
✓ A thorough inspection by our certified roofing professional
✓ Detailed documentation of any findings (photos & written report)
✓ Honest assessment - if there's no damage, we'll tell you
✓ Guidance on next steps if damage is found

This inspection is completely free, and there's absolutely no pressure to use our services. Our goal is simply to help homeowners in our community understand the condition of their roof after this storm.

**Ready to schedule your free inspection?**
Simply reply to this email or call us at (608) 555-0123.

Best regards,

[Your Name]
Wisconsin Roofing Pros
Licensed & Insured | A+ BBB Rating
(608) 555-0123

P.S. Insurance claims have time limits. Documenting damage now, even if you're not ready to repair, can protect your ability to file a claim later.

---
*Note: This is a demo email. Configure OPENAI_API_KEY for AI-generated personalized emails.*
`;
}

function getMockSMS(leadData, smsType) {
  const { ownerName = '', hailSize = 1.5 } = leadData;
  const name = ownerName ? `Hi ${ownerName.split(' ')[0]}! ` : '';
  
  const messages = {
    initial: `${name}Recent ${hailSize}" hail may have damaged your roof. We offer FREE inspections to homeowners in your area. Reply YES to schedule or call (608) 555-0123. -WI Roofing Pros`,
    follow_up: `${name}Just following up on our free roof inspection offer. Many neighbors have found hidden hail damage. Still interested? Reply or call (608) 555-0123.`,
    appointment_confirm: `${name}Your FREE roof inspection is confirmed for [DATE] at [TIME]. Our inspector will call when on the way. Questions? (608) 555-0123`,
    appointment_reminder: `${name}Reminder: Your roof inspection is tomorrow at [TIME]. Please ensure access to any gates. See you then! -WI Roofing Pros`
  };
  
  return messages[smsType] || messages.initial;
}

function getMockLeadAnalysis(leadData) {
  const { hailSize = 1.5, damageProbability = 0.5, hasPhone = false, propertyValue = 250000 } = leadData;
  
  const score = Math.min(100, Math.round(
    (hailSize >= 2 ? 30 : hailSize >= 1.5 ? 20 : 10) +
    (damageProbability * 40) +
    (hasPhone ? 15 : 0) +
    (propertyValue > 300000 ? 15 : propertyValue > 200000 ? 10 : 5)
  ));

  return {
    leadQualityScore: score,
    scoreExplanation: `Based on ${hailSize}" hail size, ${Math.round(damageProbability * 100)}% damage probability, and property value.`,
    recommendedApproach: hasPhone ? 'phone_call' : 'door_knock',
    approachReasoning: hasPhone 
      ? 'Phone contact is most efficient when number is available'
      : 'Door knock recommended since no phone number on file',
    keyTalkingPoints: [
      `${hailSize}" hail is ${hailSize >= 2 ? 'large enough to cause significant damage' : 'capable of causing hidden damage'}`,
      'Free inspection with no obligation',
      'Insurance claims have time limits',
      'We help with the entire claims process'
    ],
    potentialObjections: [
      'Already had it checked',
      'Not ready to repair right now',
      'Dont want to deal with insurance'
    ],
    bestContactTime: {
      dayOfWeek: 'Tuesday or Wednesday',
      timeOfDay: 'Late afternoon (4-6 PM)'
    },
    urgency: score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low',
    urgencyReasoning: score >= 70 
      ? 'High damage probability and good contact info - act quickly'
      : score >= 50 
        ? 'Moderate potential - worth pursuing'
        : 'Lower priority - nurture over time'
  };
}

function calculateBaseDamageProbability(hailSize, distanceMiles = 0, roofAge = 15, roofType = 'asphalt_shingle') {
  // Base probability from hail size
  let baseProbability;
  if (hailSize >= 2.5) baseProbability = 0.95;
  else if (hailSize >= 2.0) baseProbability = 0.85;
  else if (hailSize >= 1.5) baseProbability = 0.70;
  else if (hailSize >= 1.0) baseProbability = 0.50;
  else if (hailSize >= 0.75) baseProbability = 0.30;
  else baseProbability = 0.15;

  // Distance decay
  const distanceFactor = Math.max(0.3, 1.0 - (distanceMiles * 0.1));

  // Roof age factor
  let ageFactor;
  if (roofAge >= 20) ageFactor = 1.3;
  else if (roofAge >= 15) ageFactor = 1.2;
  else if (roofAge >= 10) ageFactor = 1.1;
  else if (roofAge >= 5) ageFactor = 1.0;
  else ageFactor = 0.9;

  // Roof type factor
  const typeFactors = {
    'asphalt_shingle': 1.2,
    'wood': 1.3,
    'metal': 0.7,
    'tile': 0.8,
    'flat': 1.0
  };
  const typeFactor = typeFactors[roofType] || 1.0;

  return Math.min(0.99, baseProbability * distanceFactor * ageFactor * typeFactor);
}

function getBaseDamageFactors(propertyData) {
  const { hailSize, distanceMiles, roofType, roofAge } = propertyData;
  
  return {
    hailSizeImpact: hailSize >= 2.0 ? 'High' : hailSize >= 1.5 ? 'Moderate' : 'Low',
    distanceImpact: distanceMiles <= 2 ? 'High (very close to storm path)' : 
                    distanceMiles <= 5 ? 'Moderate' : 'Lower',
    roofVulnerability: roofAge >= 15 ? 'Higher (older roof)' : 
                       roofAge >= 10 ? 'Moderate' : 'Lower (newer roof)',
    roofTypeRisk: roofType === 'asphalt_shingle' ? 'Higher (asphalt susceptible to hail)' :
                  roofType === 'metal' ? 'Lower (metal more resistant)' : 'Moderate'
  };
}

export default {
  isAIConfigured,
  generateSalesScript,
  generateEmail,
  generateSMS,
  analyzeLead,
  calculateAIDamageProbability
};
