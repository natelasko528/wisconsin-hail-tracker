import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import hailRoutes from './routes/hail.js';
import leadsRoutes from './routes/leads.js';
import skiptraceRoutes from './routes/skiptrace.js';
import campaignsRoutes from './routes/campaigns.js';
import ghlRoutes from './routes/ghl.js';
import statsRoutes from './routes/stats.js';
import propertiesRoutes from './routes/properties.js';
import aiRoutes from './routes/ai.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Supabase client
import { isSupabaseConfigured } from './lib/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow multiple development ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: isSupabaseConfigured() ? 'supabase' : 'in-memory',
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
app.use('/api/hail', hailRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/skiptrace', skiptraceRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/ghl', ghlRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  const supabaseStatus = isSupabaseConfigured() ? '✓ Supabase Connected' : '⚠ Using In-Memory Data';
  console.log(`
╔════════════════════════════════════════════════════════╗
║     WISCONSIN HAIL CRM - BACKEND SERVER                ║
╠════════════════════════════════════════════════════════╣
║  Status: ONLINE                                        ║
║  Port: ${PORT}                                          ║
║  Database: ${supabaseStatus.padEnd(30)}  ║
║  Time: ${new Date().toLocaleString().padEnd(32)}  ║
╠════════════════════════════════════════════════════════╣
║  FEATURES:                                             ║
║  ✓ Hail Data API (NOAA via Supabase)                   ║
║  ✓ Property Discovery (OpenStreetMap)                  ║
║  ✓ Lead Management CRM                                 ║
║  ✓ Skip Tracing (TLO/Batch)                            ║
║  ✓ AI Intelligence (Damage Scoring, Scripts)           ║
║  ✓ Marketing Campaigns (Email/SMS)                     ║
║  ✓ GoHighLevel Integration                             ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
