import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  role: Joi.string().valid('admin', 'manager', 'sales_rep', 'viewer').default('sales_rep')
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'New password is required'
  })
});
