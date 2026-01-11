import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface HailStorm {
  id: string;
  event_id: string;
  begin_date: string;
  begin_time?: string;
  end_date?: string;
  end_time?: string;
  episode_id?: string;
  episode_narrative?: string;
  event_narrative?: string;
  state: string;
  state_fips: number;
  year?: number;
  month_name?: string;
  event_type: string;
  cz_type?: string;
  cz_fips?: string;
  cz_name?: string;
  begin_lat?: number;
  begin_lon?: number;
  end_lat?: number;
  end_lon?: number;
  magnitude?: number;
  magnitude_type?: string;
  damage_property?: number;
  damage_crops?: number;
  deaths_direct?: number;
  deaths_indirect?: number;
  injuries_direct?: number;
  injuries_indirect?: number;
  source?: string;
  location?: string;
  category?: string;
  outlook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  property_address?: string;
  city?: string;
  state: string;
  zip_code?: string;
  county?: string;
  affected_by_storm?: string;
  storm_date?: string;
  hail_size?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost' | 'archived';
  status: 'open' | 'closed';
  value?: number;
  probability?: number;
  source?: string;
  campaign_id?: string;
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'direct_mail';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_counties?: string[];
  min_hail_size?: number;
  date_range_start?: string;
  date_range_end?: string;
  subject?: string;
  body?: string;
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  converted_count?: number;
  budget?: number;
  spent?: number;
  scheduled_for?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: 'call' | 'email' | 'sms' | 'note' | 'status_change';
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
}

// Database API functions
export const db = {
  // Hail Storms
  async getHailStorms(options?: {
    startDate?: string;
    endDate?: string;
    minMagnitude?: number;
    county?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('hail_storms')
      .select('*')
      .order('begin_date', { ascending: false });
    
    if (options?.startDate) {
      query = query.gte('begin_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('begin_date', options.endDate);
    }
    if (options?.minMagnitude) {
      query = query.gte('magnitude', options.minMagnitude);
    }
    if (options?.county) {
      query = query.eq('cz_name', options.county);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as HailStorm[];
  },
  
  async getHailStormById(id: string) {
    const { data, error } = await supabase
      .from('hail_storms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as HailStorm;
  },
  
  async getDashboardStats() {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats');
    
    if (error) throw error;
    return data;
  },
  
  // Leads
  async getLeads(stage?: string) {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (stage) {
      query = query.eq('stage', stage);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Lead[];
  },
  
  async createLead(lead: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  },
  
  async updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  },
  
  async deleteLead(id: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Campaigns
  async getCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Campaign[];
  },
  
  async createCampaign(campaign: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
    
    if (error) throw error;
    return data as Campaign;
  },
  
  async updateCampaign(id: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Campaign;
  },
  
  // Activities
  async getActivities(leadId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Activity[];
  },
  
  async createActivity(activity: Partial<Activity>) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  },
};

export default supabase;
