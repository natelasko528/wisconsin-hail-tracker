/**
 * Database Health Check API
 * GET /api/health
 */

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test database connection
    const { data, error } = await supabase
      .from('hail_storms')
      .select('count')
      .limit(1);

    const { count: stormCount } = await supabase
      .from('hail_storms')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      database: error ? 'disconnected' : 'connected',
      stormCount: stormCount || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      database: 'error',
      error: error.message
    });
  }
}
