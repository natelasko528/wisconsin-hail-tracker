import express from 'express';

const router = express.Router();

const CAMPAIGNS_DB = [
  {
    id: 1,
    name: 'June Hail Storm - Madison Area',
    type: 'email',
    status: 'active',
    leadsCount: 45,
    stats: { sent: 45, opened: 28, clicked: 12, bounced: 2, delivered: 43 },
    template: { subject: 'Hail Damage Assessment', body: 'Dear {{name}}, we detected significant hail activity...' },
    createdAt: '2024-06-17T08:00:00Z'
  },
  {
    id: 2,
    name: 'Green Bay Follow-up SMS',
    type: 'sms',
    status: 'scheduled',
    leadsCount: 32,
    stats: { sent: 0, delivered: 0, failed: 0 },
    template: { message: 'Hi {{name}}, regarding the recent hail damage...' },
    createdAt: '2024-07-24T10:00:00Z',
    scheduledFor: '2024-07-25T09:00:00Z'
  }
];

// GET /api/campaigns
router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...CAMPAIGNS_DB];
  if (type) filtered = filtered.filter(c => c.type === type);
  if (status) filtered = filtered.filter(c => c.status === status);
  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/campaigns
router.post('/', (req, res) => {
  const { name, type, leads, template, scheduledFor } = req.body;
  if (!name || !type || !leads || !template) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newCampaign = {
    id: CAMPAIGNS_DB.length + 1,
    name,
    type,
    status: scheduledFor ? 'scheduled' : 'draft',
    leadsCount: Array.isArray(leads) ? leads.length : 0,
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    template,
    createdAt: new Date().toISOString(),
    scheduledFor: scheduledFor || null
  };
  
  CAMPAIGNS_DB.push(newCampaign);
  res.status(201).json({ success: true, data: newCampaign });
});

// POST /api/campaigns/:id/launch
router.post('/:id/launch', (req, res) => {
  const campaign = CAMPAIGNS_DB.find(c => c.id === parseInt(req.params.id));
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  campaign.status = 'active';
  campaign.launchedAt = new Date().toISOString();
  res.json({ success: true, message: 'Campaign launched', data: campaign });
});

export default router;
