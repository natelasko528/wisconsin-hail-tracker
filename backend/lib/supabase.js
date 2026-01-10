import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { SUPABASE_CONFIG } from '../config/supabase.config.js';

dotenv.config();

// Use environment variables or fallback to config file
const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseKey = process.env.SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Using mock data mode.');
} else {
  console.log('✓ Supabase configured:', supabaseUrl);
}

// Public client (respects RLS)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Service client (bypasses RLS - use for admin operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};

export default supabase;
