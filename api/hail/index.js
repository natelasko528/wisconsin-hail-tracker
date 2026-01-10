import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate, minMagnitude, maxMagnitude, county, year, limit } = req.query;

    let query = supabase
      .from('hail_storms')
      .select('*')
      .order('begin_date', { ascending: false })
      .limit(parseInt(limit) || 100);

    if (startDate) query = query.gte('begin_date', startDate);
    if (endDate) query = query.lte('begin_date', endDate);
    if (minMagnitude) query = query.gte('magnitude', parseFloat(minMagnitude));
    if (maxMagnitude) query = query.lte('magnitude', parseFloat(maxMagnitude));
    if (county) query = query.ilike('cz_name', '%' + county + '%');
    if (year) query = query.eq('year', parseInt(year));

    const { data, error, status } = await query;

    if (error) return res.status(status).json({ error: error.message });

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
