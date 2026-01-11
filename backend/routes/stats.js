import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// GET /api/stats/dashboard - Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      // Fetch all data in parallel - use correct table names
      const [
        leadsResult,
        stormEventsResult,
        campaignsResult,
        skipTracesResult,
        activitiesResult
      ] = await Promise.all([
        supabase.from('leads').select('status, hail_size'),
        supabase.from('storm_events').select('magnitude, county'),
        supabase.from('campaigns').select('status, stats, leads_count'),
        supabase.from('skip_trace_results').select('status, confidence_score'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10)
      ]);
      
      const leads = leadsResult.data || [];
      const stormEvents = stormEventsResult.data || [];
      const campaigns = campaignsResult.data || [];
      const skipTraces = skipTracesResult.data || [];
      const activities = activitiesResult.data || [];
      
      // Calculate lead stats
      const totalLeads = leads.length;
      const closedWon = leads.filter(l => l.status === 'Contract Signed').length;
      const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;
      
      // Calculate hail/storm stats
      const totalHailReports = stormEvents.length;
      const criticalEvents = stormEvents.filter(h => parseFloat(h.magnitude) >= 2.0).length;
      const avgHailSize = totalHailReports > 0
        ? parseFloat((stormEvents.reduce((sum, h) => sum + (parseFloat(h.magnitude) || 0), 0) / totalHailReports).toFixed(2))
        : 0;
      const affectedCounties = new Set(stormEvents.map(h => h.county).filter(Boolean)).size;
      
      // Severity breakdown based on hail size
      const severityBreakdown = {
        critical: stormEvents.filter(h => parseFloat(h.magnitude) >= 2.5).length,
        high: stormEvents.filter(h => parseFloat(h.magnitude) >= 1.75 && parseFloat(h.magnitude) < 2.5).length,
        medium: stormEvents.filter(h => parseFloat(h.magnitude) >= 1.0 && parseFloat(h.magnitude) < 1.75).length,
        low: stormEvents.filter(h => parseFloat(h.magnitude) < 1.0).length
      };
      
      // Calculate skip trace stats
      const totalProcessed = skipTraces.filter(s => s.status === 'completed').length;
      const pendingSkipTraces = skipTraces.filter(s => s.status === 'pending' || s.status === 'processing').length;
      const completedWithScore = skipTraces.filter(s => s.confidence_score != null);
      const avgConfidence = completedWithScore.length > 0
        ? Math.round(completedWithScore.reduce((sum, s) => sum + s.confidence_score, 0) / completedWithScore.length)
        : 0;
      
      // Calculate campaign stats
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
      const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
      const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
      
      // Format recent activity
      const recentActivity = activities.map(a => ({
        type: a.action,
        message: a.description || `${a.action} on ${a.entity_type}`,
        time: formatTimeAgo(new Date(a.created_at)),
        metadata: a.metadata
      }));
      
      res.json({
        success: true,
        data: {
          overview: {
            totalLeads,
            activeCampaigns,
            conversionRate,
            pipelineValue: 0 // No property_value in leads table
          },
          hailActivity: {
            totalReports: totalHailReports,
            criticalEvents,
            affectedCounties,
            avgHailSize,
            severityBreakdown
          },
          skiptracing: {
            totalProcessed,
            successRate: avgConfidence,
            pending: pendingSkipTraces
          },
          campaigns: {
            active: activeCampaigns,
            scheduled: scheduledCampaigns,
            totalSent,
            avgOpenRate
          },
          recentActivity
        }
      });
    } else {
      // Fallback static data
      res.json({
        success: true,
        data: {
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
            avgHailSize: 2.03,
            severityBreakdown: {
              critical: 1,
              high: 3,
              medium: 4,
              low: 2
            }
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
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/leads
router.get('/leads', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('status, hail_size, created_at, assigned_to_id');
      
      if (error) throw error;
      
      const stages = ['New', 'Contacted', 'Inspection Scheduled', 'Contract Signed', 'Lost'];
      const stageBreakdown = stages.reduce((acc, stage) => {
        acc[stage] = leads.filter(l => l.status === stage).length;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          total: leads.length,
          stageBreakdown,
          pipelineValue: 0
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          total: 156,
          stageBreakdown: {
            New: 45,
            Contacted: 38,
            'Inspection Scheduled': 32,
            'Contract Signed': 18,
            Lost: 3
          },
          pipelineValue: 4250000
        }
      });
    }
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    if (isSupabaseConfigured()) {
      const { data, error, count } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (error) throw error;
      
      res.json({
        success: true,
        count: count || data.length,
        data: (data || []).map(a => ({
          id: a.id,
          type: a.action,
          entityType: a.entity_type,
          entityId: a.entity_id,
          message: a.description,
          metadata: a.metadata,
          createdAt: a.created_at,
          timeAgo: formatTimeAgo(new Date(a.created_at))
        }))
      });
    } else {
      res.json({
        success: true,
        count: 5,
        data: [
          { id: '1', type: 'lead_created', message: 'New lead added', timeAgo: '2 hours ago' },
          { id: '2', type: 'campaign_launched', message: 'Campaign started', timeAgo: '4 hours ago' }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default router;
