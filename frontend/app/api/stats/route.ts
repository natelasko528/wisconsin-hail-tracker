import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      // Fallback to manual calculation if RPC doesn't exist
      const { count: totalStorms } = await supabase
        .from('hail_storms')
        .select('*', { count: 'exact', head: true });
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      const { count: activeCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      const { data: storms } = await supabase
        .from('hail_storms')
        .select('magnitude')
        .gt('magnitude', 0);

      const avgHailSize =
        storms && storms.length > 0
          ? storms.reduce((s, v) => s + (v.magnitude || 0), 0) / storms.length
          : 0;
      const maxHailSize =
        storms && storms.length > 0
          ? Math.max(...storms.map((s) => s.magnitude || 0))
          : 0;

      return NextResponse.json({
        success: true,
        data: {
          total_storms: totalStorms || 0,
          total_leads: totalLeads || 0,
          active_campaigns: activeCampaigns || 0,
          avg_hail_size: avgHailSize.toFixed(2),
          max_hail_size: maxHailSize,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
