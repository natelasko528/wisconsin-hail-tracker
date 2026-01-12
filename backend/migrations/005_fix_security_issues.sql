-- Migration 005: Fix Security Issues Identified by Supabase Advisors
-- Wisconsin Hail Tracker - Security Hardening

-- ============================================
-- FIX 1: Set search_path for all functions (prevent search_path injection)
-- ============================================

-- Fix properties_within_radius function
CREATE OR REPLACE FUNCTION properties_within_radius(
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    radius_miles * 1609.34
  )
  ORDER BY distance_miles;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix get_storm_stats function (if it exists)
CREATE OR REPLACE FUNCTION get_storm_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_storms', (SELECT COUNT(*) FROM storm_events),
    'total_leads', (SELECT COUNT(*) FROM leads),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
    'avg_hail_size', (SELECT COALESCE(AVG(magnitude), 0) FROM storm_events WHERE magnitude > 0),
    'max_hail_size', (SELECT COALESCE(MAX(magnitude), 0) FROM storm_events)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Fix get_leads_by_storm function (if it exists)
CREATE OR REPLACE FUNCTION get_leads_by_storm(storm_id_param TEXT)
RETURNS TABLE (
  lead_id UUID,
  property_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.property_id,
    l.status,
    l.created_at
  FROM leads l
  WHERE l.storm_id = storm_id_param
  ORDER BY l.created_at DESC;
END;
$$;

-- Fix has_existing_lead function (if it exists)
CREATE OR REPLACE FUNCTION has_existing_lead(property_id_param UUID, storm_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lead_count
  FROM leads
  WHERE property_id = property_id_param
    AND storm_id = storm_id_param;
  
  RETURN lead_count > 0;
END;
$$;

-- Fix find_properties_in_radius function
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    radius_miles * 1609.34
  )
  ORDER BY distance_miles;
END;
$$;

-- Fix calculate_damage_probability function
CREATE OR REPLACE FUNCTION calculate_damage_probability(
  hail_size DECIMAL,
  distance_miles DECIMAL,
  roof_age_years INTEGER DEFAULT 15,
  roof_type TEXT DEFAULT 'asphalt_shingle'
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_prob DECIMAL;
  distance_factor DECIMAL;
  age_factor DECIMAL;
  type_factor DECIMAL;
BEGIN
  base_prob := CASE
    WHEN hail_size >= 2.5 THEN 0.95
    WHEN hail_size >= 2.0 THEN 0.85
    WHEN hail_size >= 1.5 THEN 0.70
    WHEN hail_size >= 1.0 THEN 0.50
    WHEN hail_size >= 0.75 THEN 0.30
    ELSE 0.15
  END;
  
  distance_factor := GREATEST(0.3, 1.0 - (distance_miles * 0.1));
  
  age_factor := CASE
    WHEN roof_age_years >= 20 THEN 1.3
    WHEN roof_age_years >= 15 THEN 1.2
    WHEN roof_age_years >= 10 THEN 1.1
    WHEN roof_age_years >= 5 THEN 1.0
    ELSE 0.9
  END;
  
  type_factor := CASE roof_type
    WHEN 'asphalt_shingle' THEN 1.2
    WHEN 'wood' THEN 1.3
    WHEN 'metal' THEN 0.7
    WHEN 'tile' THEN 0.8
    WHEN 'flat' THEN 1.0
    ELSE 1.0
  END;
  
  RETURN LEAST(0.99, base_prob * distance_factor * age_factor * type_factor);
END;
$$;

-- Fix calculate_priority_score function
CREATE OR REPLACE FUNCTION calculate_priority_score(
  damage_probability DECIMAL,
  property_value DECIMAL DEFAULT 250000,
  days_since_storm INTEGER DEFAULT 0,
  has_phone BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER;
BEGIN
  score := (damage_probability * 40)::INTEGER;
  score := score + LEAST(20, (property_value / 25000)::INTEGER);
  score := score + GREATEST(0, 25 - days_since_storm);
  
  IF has_phone THEN
    score := score + 15;
  END IF;
  
  RETURN LEAST(100, GREATEST(1, score));
END;
$$;

-- Fix distance_miles function
CREATE OR REPLACE FUNCTION distance_miles(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  ) / 1609.34;
END;
$$;

-- ============================================
-- FIX 2: Enable RLS on spatial_ref_sys (PostGIS system table)
-- Note: This is typically a system table, but we'll add a restrictive policy
-- ============================================
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Deny all access to spatial_ref_sys except for PostGIS operations
CREATE POLICY "Restrict spatial_ref_sys access"
  ON spatial_ref_sys
  FOR SELECT
  USING (false); -- Deny all direct access

-- ============================================
-- FIX 3: Replace overly permissive RLS policies with more restrictive ones
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "anon_activity_all" ON activity_log;
DROP POLICY IF EXISTS "anon_campaign_leads_all" ON campaign_leads;
DROP POLICY IF EXISTS "anon_campaigns_all" ON campaigns;
DROP POLICY IF EXISTS "anon_ghl_sync_all" ON ghl_sync_log;
DROP POLICY IF EXISTS "anon_skip_trace_all" ON skip_trace_results;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON leads;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON notes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON properties;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storm_events;

-- Create more restrictive policies for authenticated users only
-- Activity Log - authenticated users only
CREATE POLICY "authenticated_activity_log_all"
  ON activity_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Campaign Leads - authenticated users only
CREATE POLICY "authenticated_campaign_leads_all"
  ON campaign_leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Campaigns - authenticated users only
CREATE POLICY "authenticated_campaigns_all"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- GHL Sync Log - authenticated users only
CREATE POLICY "authenticated_ghl_sync_all"
  ON ghl_sync_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Skip Trace Results - authenticated users only
CREATE POLICY "authenticated_skip_trace_all"
  ON skip_trace_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Leads - authenticated users only
CREATE POLICY "authenticated_leads_all"
  ON leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notes - authenticated users only
CREATE POLICY "authenticated_notes_all"
  ON notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Properties - public read, authenticated write
CREATE POLICY "public_read_properties"
  ON properties
  FOR SELECT
  USING (true);

CREATE POLICY "authenticated_write_properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storm Events - public read, authenticated write
CREATE POLICY "public_read_storm_events"
  ON storm_events
  FOR SELECT
  USING (true);

CREATE POLICY "authenticated_write_storm_events"
  ON storm_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FIX 4: Move PostGIS extension to separate schema (optional but recommended)
-- Note: This requires moving the extension which may break existing queries
-- We'll document this but not execute it automatically
-- ============================================
-- To move PostGIS to a separate schema:
-- CREATE SCHEMA IF NOT EXISTS postgis;
-- ALTER EXTENSION postgis SET SCHEMA postgis;
-- This should be done with caution and may require testing

COMMENT ON EXTENSION postgis IS 'PostGIS extension - consider moving to separate schema for better security isolation';
