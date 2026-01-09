import express from 'express';

const router = express.Router();

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

let LEADS_DB = [
  {
    id: 1,
    name: 'John Smith',
    propertyAddress: '123 Main St, Madison, WI 53703',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    stage: 'new',
    score: 85,
    hailEventId: 1,
    hailSize: 2.5,
    propertyValue: 350000,
    lastContacted: null,
    notes: [],
    tags: ['high-priority', 'verified-owner'],
    createdAt: '2024-06-16T10:00:00Z',
    assignedTo: null
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    propertyAddress: '456 Oak Ave, Green Bay, WI 54301',
    email: 'sarah.j@email.com',
    phone: '(555) 987-6543',
    stage: 'contacted',
    score: 72,
    hailEventId: 2,
    hailSize: 1.75,
    propertyValue: 275000,
    lastContacted: '2024-07-23T14:00:00Z',
    notes: [{ text: 'Left voicemail', date: '2024-07-23T14:00:00Z', author: 'System' }],
    tags: ['follow-up'],
    createdAt: '2024-07-23T09:00:00Z',
    assignedTo: 'rep-1'
  },
  {
    id: 3,
    name: 'Robert Davis',
    propertyAddress: '789 Elm Dr, Reedsburg, WI 53959',
    email: 'rdavis@email.com',
    phone: '(555) 456-7890',
    stage: 'qualified',
    score: 91,
    hailEventId: 3,
    hailSize: 3.0,
    propertyValue: 425000,
    lastContacted: '2024-08-04T10:30:00Z',
    notes: [{ text: 'Confirmed roof damage', date: '2024-08-04T10:30:00Z', author: 'Sales Rep' }],
    tags: ['high-value', 'confirmed-damage'],
    createdAt: '2024-08-04T08:00:00Z',
    assignedTo: 'rep-2'
  }
];

// GET /api/leads
router.get('/', (req, res) => {
  const { stage, minScore, tag, search, assignedTo } = req.query;
  let filtered = [...LEADS_DB];
  
  if (stage) filtered = filtered.filter(l => l.stage === stage);
  if (minScore) filtered = filtered.filter(l => l.score >= parseInt(minScore));
  if (tag) filtered = filtered.filter(l => l.tags.includes(tag));
  if (assignedTo) filtered = filtered.filter(l => l.assignedTo === assignedTo);
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(l => 
      l.name.toLowerCase().includes(searchLower) ||
      l.propertyAddress.toLowerCase().includes(searchLower) ||
      l.email.toLowerCase().includes(searchLower)
    );
  }
  filtered.sort((a, b) => b.score - a.score);
  
  res.json({ success: true, count: filtered.length, stages: PIPELINE_STAGES, data: filtered });
});

// GET /api/leads/stats
router.get('/stats', (req, res) => {
  const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = LEADS_DB.filter(l => l.stage === stage).length;
    return acc;
  }, {});
  const totalValue = LEADS_DB.reduce((sum, l) => sum + (l.propertyValue || 0), 0);
  const avgScore = LEADS_DB.reduce((sum, l) => sum + l.score, 0) / LEADS_DB.length;
  
  res.json({
    success: true,
    data: {
      totalLeads: LEADS_DB.length,
      pipelineValue: totalValue,
      averageScore: Math.round(avgScore),
      stageBreakdown: stageCounts,
      conversionRate: Math.round((stageCounts.closed_won / LEADS_DB.length) * 100) || 0
    }
  });
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  const lead = LEADS_DB.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true, data: lead });
});

// POST /api/leads
router.post('/', (req, res) => {
  const { name, propertyAddress, email, phone, hailEventId, propertyValue } = req.body;
  if (!name || !propertyAddress) {
    return res.status(400).json({ error: 'Name and property address are required' });
  }
  
  const newLead = {
    id: LEADS_DB.length + 1,
    name,
    propertyAddress,
    email: email || null,
    phone: phone || null,
    stage: 'new',
    score: Math.round(Math.random() * 40 + 60),
    hailEventId: hailEventId || null,
    hailSize: 0,
    propertyValue: propertyValue || 0,
    lastContacted: null,
    notes: [],
    tags: [],
    createdAt: new Date().toISOString(),
    assignedTo: null
  };
  LEADS_DB.push(newLead);
  res.status(201).json({ success: true, data: newLead });
});

// PATCH /api/leads/:id
router.patch('/:id', (req, res) => {
  const leadIndex = LEADS_DB.findIndex(l => l.id === parseInt(req.params.id));
  if (leadIndex === -1) return res.status(404).json({ error: 'Lead not found' });
  LEADS_DB[leadIndex] = { ...LEADS_DB[leadIndex], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: LEADS_DB[leadIndex] });
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const leadIndex = LEADS_DB.findIndex(l => l.id === parseInt(req.params.id));
  if (leadIndex === -1) return res.status(404).json({ error: 'Lead not found' });
  LEADS_DB.splice(leadIndex, 1);
  res.json({ success: true, message: 'Lead deleted' });
});

// POST /api/leads/:id/notes
router.post('/:id/notes', (req, res) => {
  const lead = LEADS_DB.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const { text, author } = req.body;
  const note = { id: lead.notes.length + 1, text, author: author || 'System', date: new Date().toISOString() };
  lead.notes.push(note);
  res.json({ success: true, data: note });
});

export default router;
