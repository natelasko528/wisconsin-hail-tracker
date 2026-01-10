// Supabase Configuration for Wisconsin Hail Tracker
// Copy this to your .env file or set these environment variables

export const SUPABASE_CONFIG = {
  // Project URL
  url: 'https://hekxyqhylzczirrbpldx.supabase.co',
  
  // Public Anon Key (safe to expose in frontend)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhla3h5cWh5bHpjemlycmJwbGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDUwMjMsImV4cCI6MjA3NTk4MTAyM30.EVRJEhTbDmvRKFim7FaPQaD5LbUrlTSNpsP08Zm46tM',
  
  // Database Host
  dbHost: 'db.hekxyqhylzczirrbpldx.supabase.co',
  
  // Region
  region: 'us-east-1'
};

// Environment variable template:
/*
SUPABASE_URL=https://hekxyqhylzczirrbpldx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhla3h5cWh5bHpjemlycmJwbGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDUwMjMsImV4cCI6MjA3NTk4MTAyM30.EVRJEhTbDmvRKFim7FaPQaD5LbUrlTSNpsP08Zm46tM
*/

export default SUPABASE_CONFIG;
