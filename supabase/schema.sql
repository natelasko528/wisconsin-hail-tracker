-- ============================================================================
-- Wisconsin Hail Tracker - Supabase Database Schema
-- Compatible with NOAA Storm Events Database format
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- HAIL STORMS TABLE (matches NOAA Storm Events Database fields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hail_storms (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id INTEGER UNIQUE NOT NULL, -- NOAA Event ID
  
  -- Event details
  episode_id INTEGER, -- NOAA Episode ID
  event_type VARCHAR(50) DEFAULT 'Hail',
  state VARCHAR(50) DEFAULT 'WISCONSIN',
  state_fips INTEGER DEFAULT 55,
  year INTEGER NOT NULL,
  month_name VARCHAR(20),
  
  -- Timing
  begin_date_time TIMESTAMP WITH TIME ZONE,
  begin_year INTEGER,
  begin_month INTEGER,
  begin_day INTEGER,
  begin_time VARCHAR(10),
  
  end_date_time TIMESTAMP WITH TIME ZONE,
  end_year INTEGER,
  end_month INTEGER,
  end_day INTEGER,
  end_time VARCHAR(10),
  
  -- Location (with PostGIS)
  cz_name VARCHAR(100), -- County/zone name
  cz_fips INTEGER, -- County FIPS code
  cz_type VARCHAR(20), -- County/zone type
  
  -- Direct coordinates from NOAA
  begin_lat DECIMAL(10, 6),
  begin_lon DECIMAL(10, 6),
  end_lat DECIMAL(10, 6),
  end_lon DECIMAL(10, 6),
  
  -- PostGIS point for spatial queries
  location GEOGRAPHY(POINT, 4326),
  
  -- Hail specifics
  magnitude DECIMAL(5, 2), -- Hail size in inches
  magnitude_type VARCHAR(20) DEFAULT 'E', -- E = Estimated, M = Measured
  
  -- Damage and impact
  injuries_direct INTEGER DEFAULT 0,
  injuries_indirect INTEGER DEFAULT 0,
  deaths_direct INTEGER DEFAULT 0,
  deaths_indirect INTEGER DEFAULT 0,
  damage_property DECIMAL(12, 2),
  damage_crops DECIMAL(12, 2),
  
  -- NOAA metadata
  tor_f_scale INTEGER, -- Fujita scale (for tornadoes, NULL for hail)
  tor_length DECIMAL(10, 2),
  tor_width INTEGER,
  tor_other_wfo VARCHAR(10),
  tor_other_cz_state VARCHAR(50),
  tor_other_cz_fips INTEGER,
  tor_other_cz_name VARCHAR(100),
  
  -- Additional info
  source VARCHAR(255),
  magnitude_location VARCHAR(255),
  notes TEXT,
  event_narrative TEXT,
  episode_narrative TEXT,
  
  -- Internal timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_magnitude CHECK (magnitude >= 0 AND magnitude <= 20),
  CONSTRAINT check_latitude CHECK (begin_lat BETWEEN -90 AND 90),
  CONSTRAINT check_longitude CHECK (begin_lon BETWEEN -180 AND 180)
);

-- ============================================================================
-- LEADS TABLE (CRM functionality)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Contact info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Property address
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50) DEFAULT 'WI',
  zip_code VARCHAR(10),
  county VARCHAR(100),
  
  -- Property details
  property_type VARCHAR(50), -- Residential, Commercial, etc.
  roof_age INTEGER,
  roof_material VARCHAR(50),
  square_footage INTEGER,
  
  -- Storm association
  associated_storm_id UUID REFERENCES hail_storms(id),
  hail_size DECIMAL(5, 2), -- Size of hail at this location
  storm_date DATE,
  
  -- Lead status
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, proposal, closed, lost
  source VARCHAR(100), -- Website, Referral, etc.
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  
  -- GoHighLevel integration
  ghl_contact_id VARCHAR(255),
  ghl_pipeline_id VARCHAR(255),
  ghl_stage_id VARCHAR(255),
  
  -- Skip tracing status
  skiptraced BOOLEAN DEFAULT FALSE,
  skiptrace_date TIMESTAMP WITH TIME ZONE,
  skiptrace_provider VARCHAR(50),
  
  -- Metadata
  notes TEXT,
  last_contacted DATE,
  estimated_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CAMPAIGNS TABLE (Marketing automation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- email, sms, direct_mail, etc.
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
  
  -- Targeting
  target_counties TEXT[], -- Array of county names
  min_hail_size DECIMAL(5, 2),
  date_range_start DATE,
  date_range_end DATE,
  
  -- Metrics
  total_leads INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  converted INTEGER DEFAULT 0,
  
  -- GoHighLevel integration
  ghl_campaign_id VARCHAR(255),
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SKIPTRACE HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS skiptrace_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  provider VARCHAR(50), -- TLOxp, FindYourLead, etc.
  search_type VARCHAR(50), -- person, property, etc.
  
  -- Results
  phones_found TEXT[],
  emails_found TEXT[],
  new_address VARCHAR(255),
  new_city VARCHAR(100),
  new_state VARCHAR(50),
  new_zip VARCHAR(10),
  
  status VARCHAR(50), -- success, partial, failed
  cost DECIMAL(6, 2),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITIES TABLE (Activity logging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  type VARCHAR(50), -- call, email, sms, visit, note, etc.
  subject VARCHAR(255),
  description TEXT,
  
  outcome VARCHAR(100), -- interested, not_interested, follow_up, etc.
  next_action_date DATE,
  
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Hail storms indexes
CREATE INDEX IF NOT EXISTS idx_hail_storms_date ON hail_storms(begin_date_time DESC);
CREATE INDEX IF NOT EXISTS idx_hail_storms_magnitude ON hail_storms(magnitude DESC);
CREATE INDEX IF NOT EXISTS idx_hail_storms_county ON hail_storms(cz_name);
CREATE INDEX IF NOT EXISTS idx_hail_storms_year ON hail_storms(year);
CREATE INDEX IF NOT EXISTS idx_hail_storms_location ON hail_storms USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_hail_storms_event_id ON hail_storms(event_id);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_county ON leads(county);
CREATE INDEX IF NOT EXISTS idx_leads_storm_date ON leads(storm_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_ghl_id ON leads(ghl_contact_id);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE hail_storms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE skiptrace_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Public read access for hail storms (weather data is public)
CREATE POLICY "Public read access for hail storms"
  ON hail_storms FOR SELECT
  USING (true);

-- Allow authenticated users to insert leads
CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read leads
CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT
  USING (true);

-- Allow authenticated users to update leads
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (true);

-- Similar policies for campaigns, activities, skiptrace_history
CREATE POLICY "Authenticated users can manage campaigns"
  ON campaigns FOR ALL
  USING (true);

CREATE POLICY "Authenticated users can manage activities"
  ON activities FOR ALL
  USING (true);

CREATE POLICY "Authenticated users can manage skiptrace"
  ON skiptrace_history FOR ALL
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update location point from lat/lon
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.begin_lat IS NOT NULL AND NEW.begin_lon IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.begin_lon::float8, NEW.begin_lat::float8), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update location
CREATE TRIGGER update_hail_storms_location
  BEFORE INSERT OR UPDATE ON hail_storms
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

-- Function to get hail storms by date range
CREATE OR REPLACE FUNCTION get_hail_by_date_range(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  min_magnitude DECIMAL DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_id INTEGER,
  begin_date_time TIMESTAMP WITH TIME ZONE,
  magnitude DECIMAL,
  cz_name VARCHAR,
  location GEOGRAPHY
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.event_id,
    hs.begin_date_time,
    hs.magnitude,
    hs.cz_name,
    hs.location
  FROM hail_storms hs
  WHERE hs.begin_date_time BETWEEN start_date AND end_date
    AND hs.magnitude >= min_magnitude
  ORDER BY hs.begin_date_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_storms', COUNT(*),
    'storms_this_year', COUNT(*) FILTER (WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)),
    'avg_hail_size', ROUND(AVG(magnitude)::numeric, 2),
    'max_hail_size', MAX(magnitude),
    'affected_counties', COUNT(DISTINCT cz_name),
    'total_leads', (SELECT COUNT(*) FROM leads),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active')
  ) INTO result
  FROM hail_storms;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================================================

-- Insert sample hail storm data (Wisconsin 2024)
INSERT INTO hail_storms (
  event_id, year, month_name, begin_date_time, begin_year, begin_month, begin_day,
  magnitude, cz_name, begin_lat, begin_lon, state, state_fips
) VALUES
  (1001, 2024, 'June', '2024-06-15 14:30:00', 2024, 6, 15, 2.5, 'Dane', 43.0748, -89.3844, 'WISCONSIN', 55),
  (1002, 2024, 'June', '2024-06-15 15:45:00', 2024, 6, 15, 1.75, 'Dane', 43.0894, -89.4301, 'WISCONSIN', 55),
  (1003, 2024, 'July', '2024-07-22 16:20:00', 2024, 7, 22, 3.0, 'Milwaukee', 43.0389, -87.9065, 'WISCONSIN', 55),
  (1004, 2024, 'May', '2024-05-28 13:15:00', 2024, 5, 28, 1.25, 'Waukesha', 42.9764, -88.2392, 'WISCONSIN', 55),
  (1005, 2024, 'August', '2024-08-03 17:00:00', 2024, 8, 3, 4.25, 'Rock', 42.6859, -89.0188, 'WISCONSIN', 55)
ON CONFLICT (event_id) DO NOTHING;

-- Insert sample leads
INSERT INTO leads (
  first_name, last_name, email, phone, address, city, state, zip_code, county,
  status, priority, associated_storm_id, hail_size, storm_date
) VALUES
  ('John', 'Smith', 'john.smith@example.com', '608-555-0101', '123 Main St', 'Madison', 'WI', '53703', 'Dane',
   'new', 'high', (SELECT id FROM hail_storms WHERE event_id = 1001), 2.5, '2024-06-15'),
  ('Sarah', 'Johnson', 'sarah.j@example.com', '414-555-0202', '456 Oak Ave', 'Milwaukee', 'WI', '53201', 'Milwaukee',
   'contacted', 'medium', (SELECT id FROM hail_storms WHERE event_id = 1003), 3.0, '2024-07-22'),
  ('Michael', 'Williams', 'mwilliams@example.com', '262-555-0303', '789 Elm Rd', 'Waukesha', 'WI', '53186', 'Waukesha',
   'qualified', 'high', (SELECT id FROM hail_storms WHERE event_id = 1004), 1.25, '2024-05-28')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant select on public tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant insert/update/delete on CRM tables
GRANT INSERT, UPDATE, DELETE ON leads, campaigns, activities, skiptrace_history TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ============================================================================
-- COMPLETED
-- ============================================================================
