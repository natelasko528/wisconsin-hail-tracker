import { createClient } from '@supabase/supabase-js';

// Type definitions for our database
export interface HailStorm {
  id: string;
  event_id: number;
  episode_id?: number;
  event_type: string;
  state: string;
  state_fips: number;
  year: number;
  month_name?: string;
  begin_date_time?: Date;
  begin_year?: number;
  begin_month?: number;
  begin_day?: number;
  begin_time?: string;
  end_date_time?: Date;
  begin_lat?: number;
  begin_lon?: number;
  end_lat?: number;
  end_lon?: number;
  location?: string;
  magnitude?: number;
  magnitude_type?: string;
  cz_name?: string;
  cz_fips?: number;
  cz_type?: string;
  injuries_direct?: number;
  injuries_indirect?: number;
  deaths_direct?: number;
  deaths_indirect?: number;
  damage_property?: number;
  damage_crops?: number;
  source?: string;
  notes?: string;
  event_narrative?: string;
  episode_narrative?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state: string;
  zip_code?: string;
  county?: string;
  property_type?: string;
  roof_age?: number;
  roof_material?: string;
  square_footage?: number;
  associated_storm_id?: string;
  hail_size?: number;
  storm_date?: Date;
  status: string;
  source?: string;
  priority: string;
  ghl_contact_id?: string;
  ghl_pipeline_id?: string;
  ghl_stage_id?: string;
  skiptraced: boolean;
  skiptrace_date?: Date;
  skiptrace_provider?: string;
  notes?: string;
  last_contacted?: Date;
  estimated_value?: number;
  actual_value?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status: string;
  target_counties?: string[];
  min_hail_size?: number;
  date_range_start?: Date;
  date_range_end?: Date;
  total_leads: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  converted: number;
  ghl_campaign_id?: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: string;
  subject?: string;
  description?: string;
  outcome?: string;
  next_action_date?: Date;
  created_by?: string;
  created_at: Date;
}

// Supabase client singleton
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// HAIL STORMS API
// ============================================================================

export async function getHailStorms(filters?: {
  startDate?: Date;
  endDate?: Date;
  minMagnitude?: number;
  maxMagnitude?: number;
  county?: string;
  year?: number;
  limit?: number;
}) {
  let query = supabase
    .from('hail_storms')
    .select('*')
    .order('begin_date_time', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('begin_date_time', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte('begin_date_time', filters.endDate.toISOString());
  }
  if (filters?.minMagnitude) {
    query = query.gte('magnitude', filters.minMagnitude);
  }
  if (filters?.maxMagnitude) {
    query = query.lte('magnitude', filters.maxMagnitude);
  }
  if (filters?.county) {
    query = query.ilike('cz_name', `%${filters.county}%`);
  }
  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hail storms:', error);
    throw error;
  }

  return data as HailStorm[];
}

export async function getHailStormById(id: string) {
  const { data, error } = await supabase
    .from('hail_storms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching hail storm:', error);
    throw error;
  }

  return data as HailStorm;
}

export async function getHailStormsByBoundingBox(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    minMagnitude?: number;
  }
) {
  let query = supabase
    .from('hail_storms')
    .select('*')
    .gte('begin_lat', minLat)
    .lte('begin_lat', maxLat)
    .gte('begin_lon', minLon)
    .lte('begin_lon', maxLon)
    .order('begin_date_time', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('begin_date_time', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte('begin_date_time', filters.endDate.toISOString());
  }
  if (filters?.minMagnitude) {
    query = query.gte('magnitude', filters.minMagnitude);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hail storms by bbox:', error);
    throw error;
  }

  return data as HailStorm[];
}

// ============================================================================
// DASHBOARD STATS API
// ============================================================================

export async function getDashboardStats() {
  const { data, error } = await supabase
    .rpc('get_dashboard_stats');

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }

  return data;
}

export async function getHailStatsByDateRange(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('hail_storms')
    .select('magnitude, begin_date_time, cz_name')
    .gte('begin_date_time', startDate.toISOString())
    .lte('begin_date_time', endDate.toISOString());

  if (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// LEADS API
// ============================================================================

export async function getLeads(filters?: {
  status?: string;
  county?: string;
  priority?: string;
  limit?: number;
}) {
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.county) {
    query = query.ilike('county', `%${filters.county}%`);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return data as Lead[];
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select(`*, hail_storms (*)`)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }

  return data;
}

export async function createLead(lead: Partial<Lead>) {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  return data as Lead;
}

export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }

  return true;
}

// ============================================================================
// CAMPAIGNS API
// ============================================================================

export async function getCampaigns(filters?: {
  status?: string;
  type?: string;
}) {
  let query = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }

  return data as Campaign[];
}

export async function createCampaign(campaign: Partial<Campaign>) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaign,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return data as Campaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }

  return data as Campaign;
}

// ============================================================================
// ACTIVITIES API
// ============================================================================

export async function getActivities(leadId?: string) {
  let query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }

  return data as Activity[];
}

export async function createActivity(activity: Partial<Activity>) {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...activity,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }

  return data as Activity;
}
