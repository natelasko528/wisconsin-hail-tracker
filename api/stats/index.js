/**
 * Dashboard Statistics API
 * GET /api/stats
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Total storms
    const { count: totalStorms } = await supabase
      .from('hail_storms')
      .select('*', { count: 'exact', head: true });

    // This month
    const { count: thisMonth } = await supabase
      .from('hail_storms')
      .select('*', { count: 'exact', head: true })
      .gte('begin_date_time', startOfMonth);

    // This year
    const { count: thisYear } = await supabase
      .from('hail_storms')
      .select('*', { count: 'exact', head: true })
      .gte('begin_date_time', startOfYear);

    // Recent storms
    const { data: recentStorms } = await supabase
      .from('hail_storms')
      .select('*')
      .gte('magnitude', 1.0)
      .order('begin_date_time', { ascending: false })
      .limit(5);

    // Top counties by storm count
    const { data: topCounties } = await supabase
      .from('hail_storms')
      .select('cz_name')
      .gte('begin_date_time', startOfYear);

    const countyCounts = {};
    topCounties?.forEach(storm => {
      const county = storm.cz_name || 'Unknown';
      countyCounts[county] = (countyCounts[county] || 0) + 1;
    });

    const sortedCounties = Object.entries(countyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([county, count]) => ({ county, count }));

    return res.status(200).json({
      success: true,
      data: {
        totalStorms: totalStorms || 0,
        thisMonth: thisMonth || 0,
        thisYear: thisYear || 0,
        recentStorms: recentStorms || [],
        topCounties: sortedCounties
      }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
