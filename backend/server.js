import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Config
import logger from './config/logger.js';
import pool from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import hailRoutes from './routes/hail.js';
import leadsRoutes from './routes/leads.js';
import skiptraceRoutes from './routes/skiptrace.js';
import campaignsRoutes from './routes/campaigns.js';
import ghlRoutes from './routes/ghl.js';
import statsRoutes from './routes/stats.js';
import settingsRoutes from './routes/settings.js';
import aiRoutes from './routes/ai.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, generalLimiter, authLimiter, skipTraceLimiter, blockRepeatedFailures } from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityHeaders);
app.use(blockRepeatedFailures());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      hailData: true,
      leadManagement: true,
      skiptracing: true,
      campaigns: true,
      goHighLevel: true
    }
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/hail', generalLimiter, hailRoutes);
app.use('/api/leads', generalLimiter, leadsRoutes);
app.use('/api/skiptrace', skipTraceLimiter, skiptraceRoutes);
app.use('/api/campaigns', generalLimiter, campaignsRoutes);
app.use('/api/ghl', generalLimiter, ghlRoutes);
app.use('/api/stats', generalLimiter, statsRoutes);
app.use('/api/settings', generalLimiter, settingsRoutes);
app.use('/api/ai', generalLimiter, aiRoutes);

// Error handling
app.use(errorHandler);

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Database connection failed:', err);
    logger.warn('Server starting without database connection');
  } else {
    logger.info('Database connected successfully');
  }
});

app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════════════════════╗
║     WISCONSIN HAIL CRM - BACKEND SERVER                ║
╠════════════════════════════════════════════════════════╣
║  Status: ONLINE                                        ║
║  Port: ${PORT}                                          ║
║  Environment: ${process.env.NODE_ENV || 'development'}  ║
║  Time: ${new Date().toLocaleString()}                    ║
╠════════════════════════════════════════════════════════╣
║  FEATURES:                                             ║
║  ✓ Authentication & Authorization                      ║
║  ✓ Hail Data API (NOAA)                                ║
║  ✓ Lead Management CRM                                 ║
║  ✓ Skip Tracing (TLO/Batch)                            ║
║  ✓ Marketing Campaigns (Email/SMS)                     ║
║  ✓ GoHighLevel Integration                             ║
║  ✓ Security & Rate Limiting                            ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
