import express from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// GET /api/stats/dashboard - Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      // Fetch all data in parallel
      const [
        { data: leads, error: leadsError },
        { data: hailEvents, error: hailError },
        { data: campaigns, error: campaignsError },
        { data: skipTraces, error: skipError },
        { data: activities, error: activityError }
      ] = await Promise.all([
        supabase.from('leads').select('stage, score, property_value'),
        supabase.from('hail_events').select('hail_size, severity, county'),
        supabase.from('campaigns').select('status, stats, leads_count'),
        supabase.from('skip_trace_results').select('status, confidence_score'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10)
      ]);
      
      if (leadsError || hailError || campaignsError || skipError) {
        throw new Error('Error fetching dashboard data');
      }
      
      // Calculate lead stats
      const totalLeads = leads?.length || 0;
      const pipelineValue = leads?.reduce((sum, l) => sum + (parseFloat(l.property_value) || 0), 0) || 0;
      const avgScore = totalLeads > 0 
        ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads)
        : 0;
      const closedWon = leads?.filter(l => l.stage === 'closed_won').length || 0;
      const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;
      
      // Calculate hail stats
      const totalHailReports = hailEvents?.length || 0;
      const criticalEvents = hailEvents?.filter(h => h.severity === 'critical').length || 0;
      const avgHailSize = totalHailReports > 0
        ? parseFloat((hailEvents.reduce((sum, h) => sum + parseFloat(h.hail_size), 0) / totalHailReports).toFixed(2))
        : 0;
      const affectedCounties = new Set(hailEvents?.map(h => h.county) || []).size;
      
      // Calculate skip trace stats
      const totalProcessed = skipTraces?.filter(s => s.status === 'completed').length || 0;
      const pendingSkipTraces = skipTraces?.filter(s => s.status === 'pending' || s.status === 'processing').length || 0;
      const avgConfidence = totalProcessed > 0
        ? Math.round(skipTraces.filter(s => s.confidence_score).reduce((sum, s) => sum + s.confidence_score, 0) / totalProcessed)
        : 0;
      
      // Calculate campaign stats
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0;
      const totalSent = campaigns?.reduce((sum, c) => sum + (c.stats?.sent || 0), 0) || 0;
      const totalOpened = campaigns?.reduce((sum, c) => sum + (c.stats?.opened || 0), 0) || 0;
      const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
      
      // Format recent activity
      const recentActivity = (activities || []).map(a => ({
        type: a.action,
        message: a.description,
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
            pipelineValue,
            averageScore: avgScore
          },
          hailActivity: {
            totalReports: totalHailReports,
            criticalEvents,
            affectedCounties,
            avgHailSize
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
        .select('stage, score, property_value, created_at, assigned_to');
      
      if (error) throw error;
      
      const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const stageBreakdown = stages.reduce((acc, stage) => {
        acc[stage] = leads.filter(l => l.stage === stage).length;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          total: leads.length,
          stageBreakdown,
          pipelineValue: leads.reduce((sum, l) => sum + (parseFloat(l.property_value) || 0), 0),
          avgScore: leads.length > 0 
            ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
            : 0
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          total: 156,
          stageBreakdown: {
            new: 45,
            contacted: 38,
            qualified: 32,
            proposal: 18,
            negotiation: 12,
            closed_won: 8,
            closed_lost: 3
          },
          pipelineValue: 4250000,
          avgScore: 74
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
        data: data.map(a => ({
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
