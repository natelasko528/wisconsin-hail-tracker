-- ============================================
-- Migration 004: Properties & Property Intelligence Schema
-- Wisconsin Hail CRM - Property-Based Lead Generation
-- ============================================

-- Enable PostGIS for geographic calculations
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- PROPERTIES Table - Real Geocoded Addresses
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Address Components (properly formatted)
  street_address TEXT NOT NULL,           -- "1234 Main St"
  city TEXT NOT NULL,                     -- "Medford"
  state TEXT DEFAULT 'WI',                -- "WI"
  zip_code TEXT,                          -- "54451"
  county TEXT,                            -- "Taylor"
  
  -- Computed full address
  full_address TEXT GENERATED ALWAYS AS (
    street_address || E'\n' || city || ', ' || state || ' ' || COALESCE(zip_code, '')
  ) STORED,
  
  -- Searchable single-line address
  address_line TEXT GENERATED ALWAYS AS (
    street_address || ', ' || city || ', ' || state || ' ' || COALESCE(zip_code, '')
  ) STORED,
  
  -- Geographic coordinates
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  geom GEOMETRY(Point, 4326),             -- PostGIS geometry for spatial queries
  
  -- Owner Information (populated by skip trace)
  owner_name TEXT,
  owner_first_name TEXT,
  owner_last_name TEXT,
  owner_mailing_address TEXT,
  owner_mailing_city TEXT,
  owner_mailing_state TEXT,
  owner_mailing_zip TEXT,
  
  -- Property Details
  property_type TEXT DEFAULT 'residential', -- residential, commercial, industrial
  property_class TEXT,                    -- single_family, multi_family, condo, townhouse
  year_built INTEGER,
  square_footage INTEGER,
  lot_size_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  stories INTEGER,
  
  -- Roof Information (critical for hail damage)
  roof_type TEXT,                         -- asphalt_shingle, metal, tile, wood, flat
  roof_age_years INTEGER,
  roof_condition TEXT,                    -- excellent, good, fair, poor, unknown
  last_roof_inspection DATE,
  
  -- Valuation
  assessed_value DECIMAL(12,2),
  market_value DECIMAL(12,2),
  last_sale_price DECIMAL(12,2),
  last_sale_date DATE,
  
  -- External IDs
  osm_id TEXT,                            -- OpenStreetMap ID
  parcel_id TEXT,                         -- County parcel ID
  assessor_id TEXT,                       -- County assessor ID
  
  -- AI Analysis
  damage_susceptibility_score DECIMAL(3,2), -- 0-1 based on roof age, type, etc.
  
  -- Metadata
  data_source TEXT DEFAULT 'osm',         -- osm, county, manual, zillow
  geocode_accuracy TEXT,                  -- rooftop, interpolated, approximate
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create geometry column from lat/lng
CREATE OR REPLACE FUNCTION update_property_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON properties
FOR EACH ROW EXECUTE FUNCTION update_property_geom();

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(street_address);
CREATE INDEX IF NOT EXISTS idx_properties_coords ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_geom ON properties USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_properties_osm ON properties(osm_id);
CREATE INDEX IF NOT EXISTS idx_properties_full_text ON properties USING GIN(to_tsvector('english', 
  COALESCE(street_address, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(zip_code, '')
));

-- ============================================
-- STORM_PROPERTY_IMPACTS Table - Links storms to affected properties
-- ============================================
CREATE TABLE IF NOT EXISTS storm_property_impacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Foreign Keys
  storm_event_id TEXT NOT NULL,           -- References storm_events.event_id
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Impact Analysis
  distance_miles DECIMAL(6,3) NOT NULL,   -- Distance from storm center
  bearing_degrees DECIMAL(5,2),           -- Direction from storm
  
  -- Hail Impact
  hail_size_at_location DECIMAL(4,2),     -- Interpolated hail size at property
  estimated_impact_time TIMESTAMPTZ,      -- When storm passed over property
  
  -- AI Damage Assessment
  damage_probability DECIMAL(3,2) NOT NULL DEFAULT 0, -- 0-1 probability of damage
  damage_severity_estimate TEXT,          -- none, minor, moderate, severe, catastrophic
  estimated_repair_cost DECIMAL(10,2),
  
  -- Lead Scoring
  priority_score INTEGER DEFAULT 50,       -- 1-100, AI calculated
  priority_factors JSONB,                  -- JSON explaining score factors
  
  -- Status
  inspection_status TEXT DEFAULT 'pending', -- pending, scheduled, completed, declined
  inspection_date DATE,
  actual_damage_found TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates
  UNIQUE(storm_event_id, property_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_storm_impacts_storm ON storm_property_impacts(storm_event_id);
CREATE INDEX IF NOT EXISTS idx_storm_impacts_property ON storm_property_impacts(property_id);
CREATE INDEX IF NOT EXISTS idx_storm_impacts_distance ON storm_property_impacts(distance_miles);
CREATE INDEX IF NOT EXISTS idx_storm_impacts_damage_prob ON storm_property_impacts(damage_probability DESC);
CREATE INDEX IF NOT EXISTS idx_storm_impacts_priority ON storm_property_impacts(priority_score DESC);

-- ============================================
-- Update LEADS Table to reference properties
-- ============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS storm_impact_id UUID REFERENCES storm_property_impacts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS damage_probability DECIMAL(3,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_insights JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index on property_id
CREATE INDEX IF NOT EXISTS idx_leads_property ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority_score DESC);

-- ============================================
-- COMMUNICATION_LOG Table - Track all outreach
-- ============================================
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Communication Details
  type TEXT NOT NULL,                     -- call, email, sms, direct_mail, visit
  direction TEXT NOT NULL,                -- outbound, inbound
  status TEXT DEFAULT 'completed',        -- pending, completed, failed, scheduled
  
  -- Content
  subject TEXT,
  body TEXT,
  template_id TEXT,
  
  -- Call specific
  phone_number TEXT,
  call_duration_seconds INTEGER,
  call_outcome TEXT,                      -- connected, voicemail, no_answer, busy, wrong_number
  
  -- Email specific
  email_address TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT FALSE,
  
  -- SMS specific
  sms_delivered BOOLEAN,
  sms_response TEXT,
  
  -- AI Generated
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_script_used TEXT,
  
  -- Timestamps
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_log_lead ON communication_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_type ON communication_log(type);
CREATE INDEX IF NOT EXISTS idx_comm_log_created ON communication_log(created_at DESC);

-- ============================================
-- AI_CHAT_HISTORY Table - Chatbot conversations
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  session_id TEXT NOT NULL,
  user_id TEXT,
  
  role TEXT NOT NULL,                     -- user, assistant, system
  content TEXT NOT NULL,
  
  -- Context
  context_type TEXT,                      -- lead, storm, general
  context_id TEXT,
  
  -- Metadata
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created ON ai_chat_history(created_at DESC);

-- ============================================
-- AI_GENERATED_CONTENT Table - Scripts, emails, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  lead_id UUID REFERENCES leads(id),
  
  content_type TEXT NOT NULL,             -- sales_script, email, sms, damage_report
  content TEXT NOT NULL,
  
  -- Generation context
  prompt TEXT,
  model TEXT,
  temperature DECIMAL(2,1),
  
  -- Quality
  rating INTEGER,                         -- 1-5 user rating
  used BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_content_lead ON ai_generated_content(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);

-- ============================================
-- Helper Functions
-- ============================================

-- Calculate distance between two points in miles
CREATE OR REPLACE FUNCTION distance_miles(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  ) / 1609.34; -- Convert meters to miles
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find properties within radius of a point
CREATE OR REPLACE FUNCTION find_properties_in_radius(
  center_lat DECIMAL,
  center_lon DECIMAL,
  radius_miles DECIMAL DEFAULT 5
)
RETURNS TABLE (
  property_id UUID,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  full_address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as property_id,
    p.street_address,
    p.city,
    p.state,
    p.zip_code,
    p.full_address,
    p.latitude,
    p.longitude,
    distance_miles(center_lat, center_lon, p.latitude, p.longitude) as distance_miles
  FROM properties p
  WHERE ST_DWithin(
    p.geom::geography,
    ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
    radius_miles * 1609.34  -- Convert miles to meters
  )
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;

-- Calculate damage probability based on factors
CREATE OR REPLACE FUNCTION calculate_damage_probability(
  hail_size DECIMAL,
  distance_miles DECIMAL,
  roof_age_years INTEGER DEFAULT 15,
  roof_type TEXT DEFAULT 'asphalt_shingle'
)
RETURNS DECIMAL AS $$
DECLARE
  base_prob DECIMAL;
  distance_factor DECIMAL;
  age_factor DECIMAL;
  type_factor DECIMAL;
BEGIN
  -- Base probability from hail size
  base_prob := CASE
    WHEN hail_size >= 2.5 THEN 0.95
    WHEN hail_size >= 2.0 THEN 0.85
    WHEN hail_size >= 1.5 THEN 0.70
    WHEN hail_size >= 1.0 THEN 0.50
    WHEN hail_size >= 0.75 THEN 0.30
    ELSE 0.15
  END;
  
  -- Distance decay (probability decreases with distance)
  distance_factor := GREATEST(0.3, 1.0 - (distance_miles * 0.1));
  
  -- Roof age factor (older roofs more vulnerable)
  age_factor := CASE
    WHEN roof_age_years >= 20 THEN 1.3
    WHEN roof_age_years >= 15 THEN 1.2
    WHEN roof_age_years >= 10 THEN 1.1
    WHEN roof_age_years >= 5 THEN 1.0
    ELSE 0.9
  END;
  
  -- Roof type factor
  type_factor := CASE roof_type
    WHEN 'asphalt_shingle' THEN 1.2
    WHEN 'wood' THEN 1.3
    WHEN 'metal' THEN 0.7
    WHEN 'tile' THEN 0.8
    WHEN 'flat' THEN 1.0
    ELSE 1.0
  END;
  
  -- Calculate final probability (capped at 0.99)
  RETURN LEAST(0.99, base_prob * distance_factor * age_factor * type_factor);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate lead priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
  damage_probability DECIMAL,
  property_value DECIMAL DEFAULT 250000,
  days_since_storm INTEGER DEFAULT 0,
  has_phone BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  -- Base score from damage probability (0-40 points)
  score := (damage_probability * 40)::INTEGER;
  
  -- Property value factor (0-20 points)
  score := score + LEAST(20, (property_value / 25000)::INTEGER);
  
  -- Recency factor (0-25 points, more recent = higher)
  score := score + GREATEST(0, 25 - days_since_storm);
  
  -- Contact info bonus (0-15 points)
  IF has_phone THEN
    score := score + 15;
  END IF;
  
  RETURN LEAST(100, GREATEST(1, score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE storm_property_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Public read access for properties
CREATE POLICY "Allow public read properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write properties" ON properties FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated access for other tables
CREATE POLICY "Full access storm_property_impacts" ON storm_property_impacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access communication_log" ON communication_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access ai_chat_history" ON ai_chat_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access ai_generated_content" ON ai_generated_content FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_properties_updated_at 
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storm_property_impacts_updated_at 
BEFORE UPDATE ON storm_property_impacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Grant Permissions
-- ============================================
GRANT ALL ON properties TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT ON properties TO anon;

GRANT ALL ON storm_property_impacts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storm_property_impacts TO authenticated;

GRANT ALL ON communication_log TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON communication_log TO authenticated;

GRANT ALL ON ai_chat_history TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_chat_history TO authenticated;

GRANT ALL ON ai_generated_content TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_generated_content TO authenticated;
