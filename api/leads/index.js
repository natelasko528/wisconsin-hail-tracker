/**
 * Leads Management API
 * GET, POST, PUT, DELETE /api/leads
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getLeads(req, res);
      case 'POST':
        return await createLead(req, res);
      case 'PUT':
        return await updateLead(req, res);
      case 'DELETE':
        return await deleteLead(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leads API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeads(req, res) {
  const { status, limit = 50 } = req.query;

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(parseInt(limit), 100));

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}

async function createLead(req, res) {
  const lead = req.body;

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      ...lead,
      status: lead.status || 'new',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ success: true, data });
}

async function updateLead(req, res) {
  const { id } = req.query;
  const updates = req.body;

  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}

async function deleteLead(req, res) {
  const { id } = req.query;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
