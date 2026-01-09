import express from 'express';

const router = express.Router();

// GET /api/stats/dashboard - Dashboard statistics
router.get('/dashboard', (req, res) => {
  const stats = {
    overview: {
      totalLeads: 156,
      activeCampaigns: 8,
      conversionRate: 24,
      pipelineValue: 4250000
    },
    hailActivity: {
      totalReports: 10,
      criticalEvents: 1,
      affectedCounties: 8,
      avgHailSize: 2.03
    },
    skiptracing: {
      totalProcessed: 89,
      successRate: 94,
      pending: 12
    },
    campaigns: {
      active: 3,
      scheduled: 2,
      totalSent: 1250,
      avgOpenRate: 28
    },
    recentActivity: [
      { type: 'lead_created', message: 'New lead added from Madison hail event', time: '2 hours ago' },
      { type: 'campaign_launched', message: 'Green Bay SMS campaign started', time: '4 hours ago' },
      { type: 'skiptrace_completed', message: 'Batch skiptrace completed: 45 leads', time: '6 hours ago' }
    ]
  };
  
  res.json({ success: true, data: stats });
});

export default router;
