-- Wisconsin Hail Tracker Database Schema
-- PostgreSQL Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'sales_rep', 'viewer'))
);

-- Hail events table
CREATE TABLE IF NOT EXISTS hail_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    county VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    hail_size DECIMAL(3, 2) NOT NULL,
    wind_speed INTEGER,
    severity VARCHAR(50) NOT NULL,
    damages_reported BOOLEAN DEFAULT false,
    injuries INTEGER DEFAULT 0,
    fatalities INTEGER DEFAULT 0,
    property_damage_estimate DECIMAL(12, 2),
    crop_damage_estimate DECIMAL(12, 2),
    noaa_event_id VARCHAR(100) UNIQUE,
    source VARCHAR(50) DEFAULT 'NOAA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'severe', 'extreme'))
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    property_address TEXT NOT NULL,
    property_city VARCHAR(100),
    property_county VARCHAR(100),
    property_state VARCHAR(2) DEFAULT 'WI',
    property_zip VARCHAR(10),
    property_lat DECIMAL(10, 8),
    property_lng DECIMAL(11, 8),
    property_value DECIMAL(12, 2),
    property_type VARCHAR(50),
    hail_event_id UUID REFERENCES hail_events(id) ON DELETE SET NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'new',
    score INTEGER DEFAULT 0,
    tags TEXT[],
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMP,
    next_follow_up_at TIMESTAMP,
    is_skipped_traced BOOLEAN DEFAULT false,
    is_synced_to_ghl BOOLEAN DEFAULT false,
    ghl_contact_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_stage CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'))
);

-- Lead notes table
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    template TEXT,
    subject VARCHAR(500),
    scheduled_for TIMESTAMP,
    launched_at TIMESTAMP,
    completed_at TIMESTAMP,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_type CHECK (type IN ('email', 'sms', 'direct_mail', 'ringless_voicemail')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused', 'cancelled'))
);

-- Campaign leads (many-to-many)
CREATE TABLE IF NOT EXISTS campaign_leads (
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    replied_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    PRIMARY KEY (campaign_id, lead_id)
);

-- Skip trace results table
CREATE TABLE IF NOT EXISTS skiptrace_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    phones JSONB,
    emails JSONB,
    property_owner VARCHAR(255),
    ownership_type VARCHAR(50),
    residence_duration VARCHAR(50),
    confidence_score INTEGER,
    cost DECIMAL(6, 2),
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_skiptrace_per_lead UNIQUE (lead_id, created_at)
);

-- GoHighLevel sync logs table
CREATE TABLE IF NOT EXISTS ghl_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    ghl_contact_id VARCHAR(255),
    error_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    synced_by UUID REFERENCES users(id) ON DELETE SET NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'delete', 'sync')),
    CONSTRAINT valid_direction CHECK (direction IN ('push', 'pull')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'pending'))
);

-- API keys table (for external integrations)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_hail_events_date ON hail_events(event_date);
CREATE INDEX idx_hail_events_county ON hail_events(county);
CREATE INDEX idx_hail_events_severity ON hail_events(severity);
CREATE INDEX idx_hail_events_location ON hail_events(lat, lng);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_hail_event ON leads(hail_event_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_county ON leads(property_county);
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead ON campaign_leads(lead_id);
CREATE INDEX idx_skiptrace_lead_id ON skiptrace_results(lead_id);
CREATE INDEX idx_ghl_sync_lead_id ON ghl_sync_logs(lead_id);
CREATE INDEX idx_ghl_sync_status ON ghl_sync_logs(status);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hail_events_updated_at BEFORE UPDATE ON hail_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
