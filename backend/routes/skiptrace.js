import express from 'express';

const router = express.Router();
const SKIPTRACE_DB = new Map();

// POST /api/skiptrace
router.post('/', async (req, res) => {
  const { leadId, propertyAddress, name } = req.body;
  if (!leadId && !propertyAddress) {
    return res.status(400).json({ error: 'leadId or propertyAddress required' });
  }
  
  const result = {
    id: Date.now(),
    status: 'completed',
    data: {
      phones: [
        { number: '(555) 123-4567', type: 'mobile', verified: true },
        { number: '(555) 987-6543', type: 'home', verified: false }
      ],
      emails: [
        { address: 'homeowner@email.com', type: 'personal', verified: true }
      ],
      owner: {
        name: name || 'John Smith',
        currentAddress: propertyAddress || 'Unknown',
        ownershipType: 'confirmed',
        lengthOfResidence: '5-10 years'
      },
      property: {
        assessedValue: 350000,
        lastSaleDate: '2019-05-15',
        squareFootage: 2150,
        yearBuilt: 1995
      },
      metadata: {
        source: 'TLOxp',
        searchedAt: new Date().toISOString(),
        confidenceScore: 92
      }
    }
  };
  
  SKIPTRACE_DB.set(result.id, result);
  res.json({ success: true, data: result });
});

// POST /api/skiptrace/batch
router.post('/batch', async (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'leadIds array required' });
  }
  
  const batchId = `batch-${Date.now()}`;
  res.json({
    success: true,
    batchId,
    total: leadIds.length,
    queued: leadIds.length,
    estimatedTime: Math.ceil(leadIds.length * 0.5),
    data: leadIds.map((id, index) => ({
      leadId: id,
      status: 'queued',
      position: index + 1,
      estimatedCompletion: new Date(Date.now() + (index + 1) * 30000).toISOString()
    }))
  });
});

// GET /api/skiptrace/batch/:id
router.get('/batch/:id', (req, res) => {
  const progress = Math.floor(Math.random() * 100);
  res.json({
    success: true,
    batchId: req.params.id,
    status: progress < 100 ? 'processing' : 'completed',
    progress,
    completed: Math.floor(Math.random() * 50),
    failed: 0,
    remaining: Math.floor(Math.random() * 50)
  });
});

export default router;
