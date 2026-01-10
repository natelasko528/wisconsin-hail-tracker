/**
 * Hail Storms API Endpoint
 * GET /api/hail
 * 
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - minMagnitude: number (optional, default 0.75)
 * - county: string (optional)
 * - limit: number (optional, default 100)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      startDate,
      endDate,
      minMagnitude = 0.75,
      county,
      limit = 100
    } = req.query;

    let query = supabase
      .from('hail_storms')
      .select('*')
      .gte('magnitude', minMagnitude)
      .order('begin_date_time', { ascending: false })
      .limit(Math.min(parseInt(limit), 1000));

    if (startDate) {
      query = query.gte('begin_date_time', startDate);
    }

    if (endDate) {
      query = query.lte('begin_date_time', endDate);
    }

    if (county) {
      query = query.ilike('cz_name', `%${county}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
