import express from 'express';

const router = express.Router();

// GHL mock data
const GHL_CONTACTS = new Map();
let GHL_SYNC_LOGS = [];

// POST /api/ghl/sync/contact - Sync contact to GHL
router.post('/sync/contact', async (req, res) => {
  const { leadId, contact } = req.body;
  
  // Simulate GHL API call
  const ghlContactId = `ghl-${Date.now()}`;
  const syncedContact = {
    id: ghlContactId,
    ...contact,
    ghlContactId,
    syncedAt: new Date().toISOString(),
    locationId: process.env.GHL_LOCATION_ID || 'default'
  };
  
  GHL_CONTACTS.set(ghlContactId, syncedContact);
  GHL_SYNC_LOGS.push({
    action: 'sync_contact',
    leadId,
    ghlContactId,
    timestamp: new Date().toISOString(),
    status: 'success'
  });
  
  res.json({
    success: true,
    message: 'Contact synced to GoHighLevel',
    data: syncedContact
  });
});

// POST /api/ghl/sync/batch - Batch sync leads to GHL
router.post('/sync/batch', async (req, res) => {
  const { leadIds } = req.body;
  
  const results = leadIds.map(id => ({
    leadId: id,
    status: 'synced',
    ghlContactId: `ghl-${Date.now()}-${id}`,
    timestamp: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    synced: results.length,
    failed: 0,
    data: results
  });
});

// GET /api/ghl/sync/logs - Get sync logs
router.get('/sync/logs', (req, res) => {
  res.json({ success: true, count: GHL_SYNC_LOGS.length, data: GHL_SYNC_LOGS });
});

// POST /api/ghl/webhook - Handle GHL webhooks
router.post('/webhook', (req, res) => {
  const { event, contact } = req.body;
  
  GHL_SYNC_LOGS.push({
    source: 'ghl_webhook',
    event,
    contactId: contact?.id,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Webhook received' });
});

export default router;
