import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { status, county, stage, limit } = req.query;
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(parseInt(limit) || 100);

      if (status) query = query.eq('status', status);
      if (stage) query = query.eq('stage', stage);
      if (county) query = query.ilike('county', '%' + county + '%');

      const { data, error } = await query;
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, count: data.length, data });
    }

    if (req.method === 'POST') {
      if (!req.body.property_address || !req.body.county) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const { data, error } = await supabase.from('leads').insert({ ...req.body, created_at: new Date().toISOString() }).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { data, error } = await supabase.from('leads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
