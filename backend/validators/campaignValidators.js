import Joi from 'joi';

export const createCampaignSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Campaign name must be at least 3 characters',
    'any.required': 'Campaign name is required'
  }),
  type: Joi.string().valid('email', 'sms', 'direct_mail', 'ringless_voicemail').required().messages({
    'any.required': 'Campaign type is required',
    'any.only': 'Campaign type must be email, sms, direct_mail, or ringless_voicemail'
  }),
  template: Joi.string().min(10).required().messages({
    'string.min': 'Template must be at least 10 characters',
    'any.required': 'Template is required'
  }),
  subject: Joi.string().max(500).when('type', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Subject is required for email campaigns'
  }),
  leads: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'At least one lead is required',
    'any.required': 'Leads array is required'
  }),
  scheduledFor: Joi.date().iso().min('now').allow(null).messages({
    'date.min': 'Scheduled date must be in the future'
  }),
  status: Joi.string().valid('draft', 'scheduled', 'active').default('draft')
});

export const updateCampaignSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  template: Joi.string().min(10),
  subject: Joi.string().max(500),
  scheduledFor: Joi.date().iso().min('now').allow(null),
  status: Joi.string().valid('draft', 'scheduled', 'active', 'paused', 'cancelled')
}).min(1);

export const queryCampaignsSchema = Joi.object({
  type: Joi.string().valid('email', 'sms', 'direct_mail', 'ringless_voicemail'),
  status: Joi.string().valid('draft', 'scheduled', 'active', 'completed', 'paused', 'cancelled'),
  limit: Joi.number().min(1).max(100).default(50),
  offset: Joi.number().min(0).default(0)
});
