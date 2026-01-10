-- Wisconsin Hail Tracker - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- HAIL_STORMS Table - Real NOAA Storm Data
-- ============================================
CREATE TABLE IF NOT EXISTS hail_storms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- NOAA Storm Events Database fields
  event_id TEXT UNIQUE NOT NULL,
  begin_date DATE NOT NULL,
  begin_time TIME,
  end_date DATE,
  end_time TIME,
  episode_id TEXT,
  episode_narrative TEXT,
  event_narrative TEXT,
  
  -- Location data
  state TEXT DEFAULT 'WI',
  state_fips INTEGER DEFAULT 55,
  year INTEGER,
  month_name TEXT,
  event_type TEXT DEFAULT 'Hail',
  cz_type TEXT, -- County/Zone type: C (county), Z (zone), A (marine)
  cz_fips TEXT,
  cz_name TEXT, -- County/Zone name
  
  -- Geographic coordinates
  begin_lat REAL,
  begin_lon REAL,
  end_lat REAL,
  end_lon REAL,
  
  -- Storm magnitude
  magnitude REAL, -- Hail size in inches
  magnitude_type TEXT DEFAULT 'EZ', -- E = Estimated, Z = Measured
  flood_cause TEXT,
  
  -- Category and sources
  category TEXT,
  outlook_url TEXT,
  source TEXT,
  location TEXT, -- Free-form location description
  
  -- Damage and casualties
  deaths_direct INTEGER DEFAULT 0,
  deaths_indirect INTEGER DEFAULT 0,
  injuries_direct INTEGER DEFAULT 0,
  injuries_indirect INTEGER DEFAULT 0,
  damage_property REAL DEFAULT 0,
  damage_crops REAL DEFAULT 0,
  
  -- Torndata (not used for hail but in schema)
  tor_f_scale TEXT,
  tor_length REAL,
  tor_width REAL,
  tor_other_wfo TEXT,
  tor_other_cz_state TEXT,
  tor_other_cz_fips TEXT,
  tor_other_cz_name TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_hail_storms_date ON hail_storms(begin_date DESC);
CREATE INDEX IF NOT EXISTS idx_hail_storms_magnitude ON hail_storms(magnitude DESC);
CREATE INDEX IF NOT EXISTS idx_hail_storms_county ON hail_storms(cz_name);
CREATE INDEX IF NOT EXISTS idx_hail_storms_year ON hail_storms(year);
CREATE INDEX IF NOT EXISTS idx_hail_storms_location ON hail_storms(begin_lat, begin_lon);
CREATE INDEX IF NOT EXISTS idx_hail_storms_event_id ON hail_storms(event_id);

-- ============================================
-- LEADS Table - CRM Lead Management
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Property information
  property_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'WI',
  zip_code TEXT,
  county TEXT,
  
  -- Storm impact
  affected_by_storm UUID REFERENCES hail_storms(id),
  storm_date DATE,
  hail_size REAL,
  
  -- Skiptraced owner info
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  owner_phone_type TEXT, -- mobile, landline, voip
  owner_email_quality TEXT, -- high, medium, low
  
  -- Lead status
  stage TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, closed_won, closed_lost, archived
  status TEXT DEFAULT 'open', -- open, closed
  value REAL DEFAULT 0, -- Estimated deal value
  probability INTEGER DEFAULT 50, -- 0-100
  
  -- Marketing attribution
  source TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  medium TEXT,
  
  -- Activity tracking
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_county ON leads(county);
CREATE INDEX IF NOT EXISTS idx_leads_storm ON leads(affected_by_storm);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(owner_email);

-- ============================================
-- CAMPAIGNS Table - Marketing Campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Campaign details
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- email, sms, direct_mail
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  
  -- Targeting criteria
  target_counties TEXT[],
  min_hail_size REAL DEFAULT 1.0,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Content
  subject TEXT,
  body TEXT,
  template TEXT,
  
  -- Performance metrics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  budget REAL,
  spent REAL DEFAULT 0,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

-- ============================================
-- SKIPTRACE_HISTORY Table
-- ============================================
CREATE TABLE IF NOT EXISTS skiptrace_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  lead_id UUID REFERENCES leads(id),
  service TEXT DEFAULT 'tloxp',
  query_data JSONB,
  result_data JSONB,
  success BOOLEAN,
  found BOOLEAN,
  cost REAL DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skiptrace_lead ON skiptrace_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_skiptrace_created ON skiptrace_history(created_at DESC);

-- ============================================
-- ACTIVITIES Table - Lead Activity Log
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, sms, note, status_change
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE hail_storms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE skiptrace_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Public read access for hail storms (public government data)
CREATE POLICY "Allow public read access to hail storms" 
ON hail_storms FOR SELECT USING (true);

-- Authenticated users can insert/update hail storms
CREATE POLICY "Allow authenticated insert to hail storms" 
ON hail_storms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update hail storms" 
ON hail_storms FOR UPDATE USING (auth.role() = 'authenticated');

-- Full access for authenticated users on all other tables
CREATE POLICY "Full access for authenticated users on leads" 
ON leads FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated users on campaigns" 
ON campaigns FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated users on skiptrace_history" 
ON skiptrace_history FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated users on activities" 
ON activities FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Functions and Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hail_storms_updated_at 
BEFORE UPDATE ON hail_storms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Get hail storms by date range
CREATE OR REPLACE FUNCTION get_hail_by_date_range(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  min_magnitude REAL DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  begin_date DATE,
  begin_lat REAL,
  begin_lon REAL,
  magnitude REAL,
  cz_name TEXT,
  location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.event_id,
    hs.begin_date,
    hs.begin_lat,
    hs.begin_lon,
    hs.magnitude,
    hs.cz_name,
    hs.location
  FROM hail_storms hs
  WHERE 
    (start_date IS NULL OR hs.begin_date >= start_date)
    AND (end_date IS NULL OR hs.begin_date <= end_date)
    AND hs.magnitude >= min_magnitude
  ORDER BY hs.begin_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get stats dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_storms', (SELECT COUNT(*) FROM hail_storms),
    'total_leads', (SELECT COUNT(*) FROM leads),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
    'avg_hail_size', (SELECT COALESCE(AVG(magnitude), 0) FROM hail_storms WHERE magnitude > 0),
    'max_hail_size', (SELECT COALESCE(MAX(magnitude), 0) FROM hail_storms),
    'total_damage', (SELECT COALESCE(SUM(damage_property), 0) FROM hail_storms),
    'storms_by_year', (
      SELECT json_object_agg(year, count) 
      FROM (
        SELECT year, COUNT(*) as count 
        FROM hail_storms 
        GROUP BY year
      ) sub
    ),
    'leads_by_stage', (
      SELECT json_object_agg(stage, count) 
      FROM (
        SELECT stage, COUNT(*) as count 
        FROM leads 
        GROUP BY stage
      ) sub
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample Data (for testing - remove in production)
-- ============================================

-- Insert sample Wisconsin hail storms
INSERT INTO hail_storms (
  event_id, begin_date, begin_time, episode_id,
  state_fips, year, month_name, event_type,
  cz_type, cz_fips, cz_name,
  begin_lat, begin_lon, magnitude, magnitude_type,
  damage_property, location
) VALUES
  ('1', '2024-06-15', '14:30:00', 'EP001',
   55, 2024, 'June', 'Hail',
   'C', '025', 'Dane',
   43.0748, -89.3844, 2.5, 'EZ',
   50000, 'MADISON AREA'),
  ('2', '2024-07-20', '16:45:00', 'EP002',
   55, 2024, 'July', 'Hail',
   'C', '059', 'Milwaukee',
   43.0389, -87.9065, 1.75, 'EZ',
   25000, 'MILWAUKEE SOUTH'),
  ('3', '2024-05-10', '12:00:00', 'EP003',
   55, 2024, 'May', 'Hail',
   'C', '001', 'Adams',
   43.9394, -89.8161, 1.25, 'EZ',
   10000, 'ADAMS COUNTY')
ON CONFLICT (event_id) DO NOTHING;

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
