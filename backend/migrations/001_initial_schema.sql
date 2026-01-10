-- Wisconsin Hail Tracker CRM - Initial Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HAIL EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hail_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date TIMESTAMPTZ NOT NULL,
  city VARCHAR(100) NOT NULL,
  county VARCHAR(100) NOT NULL,
  state VARCHAR(2) DEFAULT 'WI',
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  hail_size DECIMAL(4, 2) NOT NULL, -- inches
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  wind_speed INTEGER, -- mph
  source VARCHAR(50) DEFAULT 'NOAA',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX idx_hail_events_date ON hail_events(event_date DESC);
CREATE INDEX idx_hail_events_county ON hail_events(county);
CREATE INDEX idx_hail_events_severity ON hail_events(severity);
CREATE INDEX idx_hail_events_location ON hail_events(latitude, longitude);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  property_address TEXT NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  hail_event_id UUID REFERENCES hail_events(id) ON DELETE SET NULL,
  hail_size DECIMAL(4, 2),
  property_value DECIMAL(12, 2),
  last_contacted_at TIMESTAMPTZ,
  assigned_to VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lead queries
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_hail_event ON leads(hail_event_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ============================================
-- LEAD NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'direct_mail', 'ringless_voicemail')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  leads_count INTEGER DEFAULT 0,
  template JSONB NOT NULL DEFAULT '{}',
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "failed": 0}',
  scheduled_for TIMESTAMPTZ,
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);

-- ============================================
-- CAMPAIGN LEADS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

CREATE INDEX idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead ON campaign_leads(lead_id);

-- ============================================
-- SKIP TRACE RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skip_trace_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  property_address TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  phones JSONB DEFAULT '[]',
  emails JSONB DEFAULT '[]',
  owner_info JSONB DEFAULT '{}',
  property_info JSONB DEFAULT '{}',
  confidence_score INTEGER,
  source VARCHAR(50) DEFAULT 'TLOxp',
  batch_id VARCHAR(100),
  searched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skip_trace_lead ON skip_trace_results(lead_id);
CREATE INDEX idx_skip_trace_batch ON skip_trace_results(batch_id);
CREATE INDEX idx_skip_trace_status ON skip_trace_results(status);

-- ============================================
-- GHL SYNC LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ghl_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ghl_contact_id VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'success',
  location_id VARCHAR(100),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghl_sync_lead ON ghl_sync_log(lead_id);
CREATE INDEX idx_ghl_sync_ghl_contact ON ghl_sync_log(ghl_contact_id);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  user_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_hail_events_updated_at
  BEFORE UPDATE ON hail_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
