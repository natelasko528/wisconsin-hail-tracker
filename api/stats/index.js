import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      const { count: totalStorms } = await supabase.from('hail_storms').select('*', { count: 'exact', head: true });
      const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { count: activeCampaigns } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { data: storms } = await supabase.from('hail_storms').select('magnitude').gt('magnitude', 0);

      const avgHailSize = storms && storms.length > 0 ? storms.reduce(function(s, v) { return s + (v.magnitude || 0); }, 0) / storms.length : 0;
      const maxHailSize = storms && storms.length > 0 ? Math.max.apply(Math, storms.map(function(s) { return s.magnitude || 0; })) : 0;

      return res.status(200).json({
        success: true,
        data: {
          total_storms: totalStorms || 0,
          total_leads: totalLeads || 0,
          active_campaigns: activeCampaigns || 0,
          avg_hail_size: avgHailSize.toFixed(2),
          max_hail_size: maxHailSize
        }
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
