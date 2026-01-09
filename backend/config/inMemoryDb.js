/**
 * In-Memory Database Implementation
 * For development without PostgreSQL
 */

import logger from './logger.js';
import bcrypt from 'bcryptjs';

// In-memory data stores
const db = {
  users: new Map(),
  hailEvents: new Map(),
  leads: new Map(),
  leadNotes: new Map(),
  campaigns: new Map(),
  campaignLeads: new Map(),
  skiptraceResults: new Map(),
  ghlSyncLogs: new Map(),
  apiKeys: new Map(),
  activityLog: new Map(),
};

// Auto-increment counters
let counters = {
  users: 0,
  hailEvents: 0,
  leads: 0,
  leadNotes: 0,
  campaigns: 0,
  skiptraceResults: 0,
  ghlSyncLogs: 0,
  apiKeys: 0,
  activityLog: 0,
};

// Generate UUID-like ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Seed initial data
 */
export async function seedDatabase() {
  logger.info('Seeding in-memory database...');

  // Seed users
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminId = generateId();
  db.users.set(adminId, {
    id: adminId,
    email: 'admin@example.com',
    password_hash: passwordHash,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    phone: '555-0001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const managerId = generateId();
  db.users.set(managerId, {
    id: managerId,
    email: 'manager@example.com',
    password_hash: passwordHash,
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager',
    phone: '555-0002',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const salesId = generateId();
  db.users.set(salesId, {
    id: salesId,
    email: 'sales@example.com',
    password_hash: passwordHash,
    first_name: 'Sales',
    last_name: 'Rep',
    role: 'sales_rep',
    phone: '555-0003',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed hail events
  const hailEvents = [
    { event_date: '2023-06-15', county: 'Dane', location: 'Madison', lat: 43.0731, lng: -89.4012, hail_size: 1.75, wind_speed: 65, severity: 'severe', damages_reported: true, injuries: 2 },
    { event_date: '2023-07-22', county: 'Brown', location: 'Green Bay', lat: 44.5133, lng: -88.0133, hail_size: 2.25, wind_speed: 70, severity: 'extreme', damages_reported: true, injuries: 5 },
    { event_date: '2024-05-08', county: 'Sauk', location: 'Baraboo', lat: 43.4711, lng: -89.7445, hail_size: 1.50, wind_speed: 55, severity: 'moderate', damages_reported: true, injuries: 0 },
  ];

  const hailEventIds = [];
  for (const event of hailEvents) {
    const id = generateId();
    hailEventIds.push(id);
    db.hailEvents.set(id, {
      id,
      ...event,
      property_damage_estimate: null,
      crop_damage_estimate: null,
      noaa_event_id: null,
      source: 'SEED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed leads
  const leads = [
    { name: 'John Smith', email: 'john.smith@example.com', phone: '608-555-0101', property_address: '123 Main St', property_city: 'Madison', property_county: 'Dane', property_state: 'WI', property_zip: '53703', property_value: 285000, hail_event_id: hailEventIds[0], stage: 'qualified', score: 85, tags: ['hot-lead', 'homeowner'], assigned_to: salesId },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '920-555-0202', property_address: '456 Oak Ave', property_city: 'Green Bay', property_county: 'Brown', property_state: 'WI', property_zip: '54301', property_value: 320000, hail_event_id: hailEventIds[1], stage: 'proposal', score: 92, tags: ['hot-lead', 'insurance-approved'], assigned_to: salesId },
    { name: 'Mike Williams', email: 'mike.w@example.com', phone: '920-555-0303', property_address: '789 Elm Street', property_city: 'Appleton', property_county: 'Outagamie', property_state: 'WI', property_zip: '54911', property_value: 195000, hail_event_id: hailEventIds[2], stage: 'new', score: 72, tags: ['homeowner'], assigned_to: adminId },
  ];

  for (const lead of leads) {
    const id = generateId();
    db.leads.set(id, {
      id,
      ...lead,
      property_type: 'residential',
      property_lat: null,
      property_lng: null,
      last_contacted_at: null,
      next_follow_up_at: null,
      is_skipped_traced: false,
      is_synced_to_ghl: false,
      ghl_contact_id: null,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  logger.info(`Seeded ${db.users.size} users, ${db.hailEvents.size} hail events, ${db.leads.size} leads`);
}

/**
 * Execute query (simplified SQL-like interface)
 */
export async function query(text, params = []) {
  // Parse simple SELECT queries
  if (text.trim().toUpperCase().startsWith('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
  }

  // Parse SELECT queries
  if (text.includes('FROM users WHERE email = $1')) {
    const email = params[0];
    const user = Array.from(db.users.values()).find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (text.includes('FROM users WHERE id = $1')) {
    const id = params[0];
    const user = db.users.get(id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // INSERT INTO users
  if (text.includes('INSERT INTO users')) {
    const id = generateId();
    const user = {
      id,
      email: params[0],
      password_hash: params[1],
      first_name: params[2],
      last_name: params[3],
      phone: params[4] || null,
      role: params[5] || 'sales_rep',
      is_active: true,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.set(id, user);
    return { rows: [user], rowCount: 1 };
  }

  // UPDATE users SET last_login_at
  if (text.includes('UPDATE users SET last_login_at')) {
    const id = params[0];
    const user = db.users.get(id);
    if (user) {
      user.last_login_at = new Date().toISOString();
      user.updated_at = new Date().toISOString();
      db.users.set(id, user);
    }
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT FROM leads
  if (text.includes('FROM leads')) {
    const leads = Array.from(db.leads.values());
    return { rows: leads, rowCount: leads.length };
  }

  // SELECT FROM hail_events
  if (text.includes('FROM hail_events')) {
    const events = Array.from(db.hailEvents.values());
    return { rows: events, rowCount: events.length };
  }

  // SELECT FROM api_keys
  if (text.includes('FROM api_keys')) {
    const keys = Array.from(db.apiKeys.values());

    // Filter by user_id if specified
    if (text.includes('WHERE user_id = $1')) {
      const userId = params[0];
      const filtered = keys.filter(k => k.user_id === userId || k.user_id === null);
      return { rows: filtered, rowCount: filtered.length };
    }

    return { rows: keys, rowCount: keys.length };
  }

  // INSERT INTO api_keys
  if (text.includes('INSERT INTO api_keys')) {
    const id = generateId();
    const apiKey = {
      id,
      user_id: params[0],
      service: params[1],
      key_name: params[2],
      api_key_encrypted: params[3],
      api_secret_encrypted: params[4] || null,
      metadata: params[5] || null,
      is_active: true,
      last_used_at: null,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.apiKeys.set(id, apiKey);
    return { rows: [apiKey], rowCount: 1 };
  }

  // UPDATE api_keys
  if (text.includes('UPDATE api_keys')) {
    const id = params[params.length - 1];
    const apiKey = db.apiKeys.get(id);
    if (apiKey) {
      // Simple update - just mark as updated
      apiKey.updated_at = new Date().toISOString();
      db.apiKeys.set(id, apiKey);
      return { rows: [apiKey], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // DELETE FROM api_keys
  if (text.includes('DELETE FROM api_keys WHERE id = $1')) {
    const id = params[0];
    const deleted = db.apiKeys.delete(id);
    return { rows: [], rowCount: deleted ? 1 : 0 };
  }

  // Default fallback
  logger.warn(`Unhandled query: ${text.substring(0, 100)}`);
  return { rows: [], rowCount: 0 };
}

/**
 * Connection pool mock
 */
export const pool = {
  query,
  on: (event, callback) => {
    if (event === 'connect') {
      logger.info('✓ In-memory database connected');
    }
  },
  end: async () => {
    logger.info('In-memory database closed');
  }
};

// Initialize with seed data
await seedDatabase();

export default pool;
