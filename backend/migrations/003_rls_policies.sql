-- Wisconsin Hail Tracker CRM - Row Level Security Policies
-- Enable RLS on all tables for secure access

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE hail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE skip_trace_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (Hail Events are public)
-- ============================================
CREATE POLICY "Hail events are publicly readable"
  ON hail_events FOR SELECT
  USING (true);

-- ============================================
-- AUTHENTICATED USER POLICIES
-- ============================================

-- Leads: Full access for authenticated users (in production, add role checks)
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Lead Notes
CREATE POLICY "Authenticated users can manage lead notes"
  ON lead_notes FOR ALL
  TO authenticated
  USING (true);

-- Campaigns
CREATE POLICY "Authenticated users can manage campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (true);

-- Campaign Leads
CREATE POLICY "Authenticated users can manage campaign leads"
  ON campaign_leads FOR ALL
  TO authenticated
  USING (true);

-- Skip Trace Results
CREATE POLICY "Authenticated users can manage skip trace results"
  ON skip_trace_results FOR ALL
  TO authenticated
  USING (true);

-- GHL Sync Log
CREATE POLICY "Authenticated users can manage GHL sync logs"
  ON ghl_sync_log FOR ALL
  TO authenticated
  USING (true);

-- Activity Log
CREATE POLICY "Authenticated users can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- ANONYMOUS/SERVICE ROLE POLICIES
-- For API access without user authentication
-- ============================================

-- Allow anon role to read all tables (for development/API)
CREATE POLICY "Anon can read leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update leads"
  ON leads FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon can delete leads"
  ON leads FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can read lead notes"
  ON lead_notes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert lead notes"
  ON lead_notes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can manage campaigns"
  ON campaigns FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Anon can manage campaign leads"
  ON campaign_leads FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Anon can manage skip trace results"
  ON skip_trace_results FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Anon can manage GHL sync logs"
  ON ghl_sync_log FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Anon can view activity log"
  ON activity_log FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert activity log"
  ON activity_log FOR INSERT
  TO anon
  WITH CHECK (true);
