import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Security headers middleware
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for map tiles
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Skip trace rate limiter
 * 10 requests per hour (costs money)
 */
export const skipTraceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Skip trace limit reached. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Campaign launch rate limiter
 * 20 campaigns per hour
 */
export const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'Campaign launch limit reached. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * IP blocking middleware (for repeated failures)
 */
const failedAttempts = new Map();

export const blockRepeatedFailures = (maxAttempts = 10, blockDuration = 60 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const attempts = failedAttempts.get(ip) || { count: 0, blockedUntil: null };

    // Check if IP is currently blocked
    if (attempts.blockedUntil && Date.now() < attempts.blockedUntil) {
      return res.status(403).json({
        error: 'IP temporarily blocked due to repeated failures',
        retryAfter: new Date(attempts.blockedUntil).toISOString()
      });
    }

    // Reset if block duration has passed
    if (attempts.blockedUntil && Date.now() >= attempts.blockedUntil) {
      failedAttempts.delete(ip);
    }

    // Attach method to increment failures
    req.recordFailure = () => {
      const currentAttempts = failedAttempts.get(ip) || { count: 0, blockedUntil: null };
      currentAttempts.count += 1;

      if (currentAttempts.count >= maxAttempts) {
        currentAttempts.blockedUntil = Date.now() + blockDuration;
        console.warn(`IP ${ip} blocked due to ${maxAttempts} failed attempts`);
      }

      failedAttempts.set(ip, currentAttempts);
    };

    // Attach method to clear failures
    req.clearFailures = () => {
      failedAttempts.delete(ip);
    };

    next();
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true }
};
