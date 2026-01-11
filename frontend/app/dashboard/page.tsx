'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { 
  LayoutDashboard, Users, Zap, Mail, CloudLightning, 
  TrendingUp, ArrowRight, Activity, DollarSign, Target,
  RefreshCw, Calendar, BarChart3
} from 'lucide-react'

const PIPELINE_STAGES = ['New', 'Contacted', 'Inspection Scheduled', 'Contract Signed', 'Lost']

const stageColors: Record<string, string> = {
  'New': 'border-primary bg-primary-muted',
  'Contacted': 'border-purple-500 bg-purple-500/10',
  'Inspection Scheduled': 'border-warning bg-warning-muted',
  'Contract Signed': 'border-success bg-success-muted',
  'Lost': 'border-destructive bg-destructive-muted',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    Promise.all([
      fetch(`${apiUrl}/api/stats/dashboard`).then(r => r.json()).catch(() => ({ data: null })),
      fetch(`${apiUrl}/api/leads?limit=10`).then(r => r.json()).catch(() => ({ data: [] }))
    ]).then(([statsData, leadsData]) => {
      setStats(statsData.data)
      setLeads(leadsData.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      'New': 'badge-stage-new',
      'Contacted': 'badge-stage-contacted',
      'Inspection Scheduled': 'badge-stage-inspection',
      'Contract Signed': 'badge-stage-contract',
      'Lost': 'badge-stage-lost',
    }
    return classes[status] || 'badge-secondary'
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <h1 className="font-display text-lg font-bold text-foreground">Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="btn btn-ghost btn-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-foreground-muted">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card stat-card-glow animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary-muted text-primary">
                      <Users className="w-4 h-4" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <div className="data-value mb-1">
                    {stats?.overview?.totalLeads || leads.length || 0}
                  </div>
                  <div className="data-label">Total Leads</div>
                </div>

                <div className="stat-card stat-card-glow animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-accent-muted text-accent">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="data-value mb-1">
                    {stats?.overview?.activeCampaigns || 0}
                  </div>
                  <div className="data-label">Active Campaigns</div>
                </div>

                <div className="stat-card stat-card-glow animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-success-muted text-success">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="data-value mb-1">
                    {stats?.overview?.conversionRate || 0}
                    <span className="text-base text-foreground-muted ml-0.5">%</span>
                  </div>
                  <div className="data-label">Conversion Rate</div>
                </div>

                <div className="stat-card stat-card-glow animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-warning-muted text-warning">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="data-value mb-1">
                    ${((stats?.overview?.pipelineValue || 0) / 1000000).toFixed(1)}
                    <span className="text-base text-foreground-muted ml-0.5">M</span>
                  </div>
                  <div className="data-label">Pipeline Value</div>
                </div>
              </div>

              {/* Pipeline Stages */}
              <div className="card">
                <div className="card-header">
                  <h2 className="font-display font-semibold text-foreground">Pipeline Overview</h2>
                  <Link href="/leads" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {PIPELINE_STAGES.map((stage, index) => {
                      const count = leads.filter(l => l.status === stage).length
                      return (
                        <Link 
                          key={stage} 
                          href={`/leads?status=${encodeURIComponent(stage)}`}
                          className={`
                            p-4 rounded-lg border-l-4 
                            ${stageColors[stage] || 'border-border bg-muted'}
                            hover:scale-[1.02] transition-all duration-200
                            animate-fade-in-up
                          `}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="text-2xl font-bold font-mono text-foreground">{count}</div>
                          <div className="text-xs text-foreground-muted mt-1 truncate">{stage}</div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Leads */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-display font-semibold text-foreground">Recent Leads</h3>
                    <Link href="/leads" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="card-body space-y-3">
                    {leads.length === 0 ? (
                      <div className="empty-state">
                        <Users className="empty-state-icon" />
                        <div className="empty-state-title">No leads yet</div>
                        <div className="empty-state-description">
                          Convert storm events to leads from the Storm Command page.
                        </div>
                      </div>
                    ) : (
                      leads.slice(0, 5).map((lead, index) => (
                        <Link 
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all animate-fade-in-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-foreground">{lead.name || 'Property Owner'}</div>
                              <div className="text-xs text-foreground-muted truncate max-w-[200px]">
                                {lead.property_address || 'No address'}
                              </div>
                            </div>
                            <span className={`badge ${getBadgeClass(lead.status)}`}>
                              {lead.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-foreground-muted">
                            <span>Score: <span className="font-medium font-mono text-foreground">{lead.score || 0}</span></span>
                            <span>Hail: <span className="font-medium font-mono text-foreground">{lead.hail_size || 0}"</span></span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Hail Activity */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                      <CloudLightning className="w-5 h-5 text-warning" />
                      Hail Activity
                    </h3>
                  </div>
                  <div className="card-body space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-foreground-muted">Total Reports</span>
                      <span className="font-bold font-mono text-primary">{stats?.hailActivity?.totalReports || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-foreground-muted">Critical Events</span>
                      <span className="font-bold font-mono text-destructive">{stats?.hailActivity?.criticalEvents || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-foreground-muted">Affected Counties</span>
                      <span className="font-bold font-mono text-foreground">{stats?.hailActivity?.affectedCounties || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-foreground-muted">Avg Hail Size</span>
                      <span className="font-bold font-mono text-foreground">{stats?.hailActivity?.avgHailSize || 0}"</span>
                    </div>

                    {/* Severity Breakdown */}
                    {stats?.hailActivity?.severityBreakdown && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3">Severity Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(stats.hailActivity.severityBreakdown).map(([severity, count]: [string, any]) => (
                            <div key={severity} className="flex items-center gap-3">
                              <span className="text-xs capitalize w-16 text-foreground-muted">{severity}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    severity === 'critical' ? 'bg-destructive' :
                                    severity === 'high' ? 'bg-warning' :
                                    severity === 'medium' ? 'bg-primary' : 'bg-success'
                                  }`}
                                  style={{ width: `${Math.min(100, (count / (stats.hailActivity.totalReports || 1)) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-medium w-8 text-right text-foreground">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {stats?.recentActivity && stats.recentActivity.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Recent Activity
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="timeline">
                      {stats.recentActivity.map((activity: any, idx: number) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-item-time">{activity.time}</div>
                          <div className="timeline-item-content">{activity.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AppLayout>
  )
}
