import Joi from 'joi';

export const createLeadSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().allow('').messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  propertyAddress: Joi.string().min(5).required().messages({
    'string.min': 'Property address must be at least 5 characters',
    'any.required': 'Property address is required'
  }),
  propertyCity: Joi.string().max(100).allow(''),
  propertyCounty: Joi.string().max(100).allow(''),
  propertyZip: Joi.string().pattern(/^\d{5}(-\d{4})?$/).allow('').messages({
    'string.pattern.base': 'Please provide a valid ZIP code'
  }),
  propertyValue: Joi.number().min(0).allow(null),
  propertyType: Joi.string().valid('residential', 'commercial', 'industrial', 'mixed').allow(''),
  hailEventId: Joi.string().uuid().allow(null),
  stage: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost').default('new'),
  score: Joi.number().min(0).max(100).default(0),
  tags: Joi.array().items(Joi.string()).default([]),
  assignedTo: Joi.string().uuid().allow(null),
  nextFollowUpAt: Joi.date().iso().allow(null)
});

export const updateLeadSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email().allow(''),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow(''),
  propertyAddress: Joi.string().min(5),
  propertyCity: Joi.string().max(100).allow(''),
  propertyCounty: Joi.string().max(100).allow(''),
  propertyZip: Joi.string().pattern(/^\d{5}(-\d{4})?$/).allow(''),
  propertyValue: Joi.number().min(0).allow(null),
  propertyType: Joi.string().valid('residential', 'commercial', 'industrial', 'mixed').allow(''),
  hailEventId: Joi.string().uuid().allow(null),
  stage: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'),
  score: Joi.number().min(0).max(100),
  tags: Joi.array().items(Joi.string()),
  assignedTo: Joi.string().uuid().allow(null),
  nextFollowUpAt: Joi.date().iso().allow(null)
}).min(1);

export const addNoteSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Note cannot be empty',
    'string.max': 'Note must be less than 5000 characters',
    'any.required': 'Note text is required'
  }),
  author: Joi.string().max(255)
});

export const queryLeadsSchema = Joi.object({
  stage: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'),
  minScore: Joi.number().min(0).max(100),
  tag: Joi.string(),
  search: Joi.string(),
  assignedTo: Joi.string().uuid(),
  hailEventId: Joi.string().uuid(),
  county: Joi.string(),
  limit: Joi.number().min(1).max(100).default(50),
  offset: Joi.number().min(0).default(0)
});
