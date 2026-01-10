import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { status, type } = req.query;
      let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase.from('campaigns').insert({ ...req.body, created_at: new Date().toISOString() }).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase.from('campaigns').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
