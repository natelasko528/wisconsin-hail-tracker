/**
 * Validation middleware factory
 * Validates request body, query, or params against a Joi schema
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace the property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validate multiple properties
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    for (const [property, schema] of Object.entries(schemas)) {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        errors.push(...error.details.map(detail => ({
          property,
          field: detail.path.join('.'),
          message: detail.message
        })));
      } else {
        req[property] = value;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};
